/**
 * Fully automatic delivery of purchased-service reports (owner's rule, 28 Nov 2026):
 *
 *   • When the numerologist approves an order (Admin → Services → "Approve & deliver", or uploads the finished PDF),
 *     the report is delivered at once.
 *   • If nobody approves it within 3 hours of payment (and the order is not on hold), the system writes the report
 *     itself and delivers it.
 *   • Every delivered report is in the client's report area in English AND Hindi (a missing language is written by
 *     the system), and the client gets a "report ready" text message (SMS) and email – once.
 *
 * Runs from: the cron endpoint /api/cron/deliver-reports (Vercel cron / GitHub Actions / any scheduler), a timer in a
 * locally running server (src/instrumentation.ts), and in the background whenever a client or the admin opens their
 * orders – so a report is never stuck because one trigger did not fire. A lock per order keeps workers apart.
 */
import { getDb, type Db } from '@/lib/db/client';
import {
  claimServiceOrder, DELIVERY_MAX_ATTEMPTS, getServiceOrderForDelivery, getServiceOrderReport, listDueServiceOrderIds, recordServiceOrderNotification,
  releaseServiceOrder, saveServiceOrderReport, type DeliveryOrder, type NotifyLog,
} from '@/lib/billing/services';
import { SERVICE_TURNAROUND_MIN } from '@/lib/service-delivery';
import { canAutoGenerate, generateServiceReport, REPORT_LANGS, reportTitle, type ReportLang } from '@/lib/server/service-report';
import { noticeDone, sendReportReadyNotice } from '@/lib/notify/report-ready';
import { reportSiteError } from '@/lib/server/site-errors';
import { appSettings } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export type DeliveryOutcome =
  | { id: string; result: 'delivered'; by: 'admin' | 'auto'; generated: ReportLang[]; notify: NotifyLog | null }
  | { id: string; result: 'notified'; notify: NotifyLog }
  | { id: string; result: 'skipped'; reason: 'busy' | 'not_found' | 'not_paid' | 'cancelled' | 'not_due' | 'on_hold' | 'already_done' }
  | { id: string; result: 'failed'; error: string };

type Deps = { generate?: typeof generateServiceReport; notify?: typeof sendReportReadyNotice; now?: () => Date };

const dueAt = (o: DeliveryOrder) => (o.paidAt ? new Date(new Date(o.paidAt).getTime() + SERVICE_TURNAROUND_MIN * 60_000) : null);
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/**
 * Delivers one order: writes the missing language versions, marks it delivered and sends the notification.
 * `by: 'admin'` = the numerologist approved it now; `by: 'auto'` = the 3-hour automatic delivery (only when due).
 */
export async function deliverServiceOrder(id: string, opts: { by: 'admin' | 'auto'; db?: Db } & Deps): Promise<DeliveryOutcome> {
  const db = opts.db ?? getDb();
  const now = opts.now?.() ?? new Date();
  const generate = opts.generate ?? generateServiceReport;
  if (!(await claimServiceOrder(id, db, now))) return { id, result: 'skipped', reason: 'busy' };
  let o: DeliveryOrder | null = null;
  try {
    o = await getServiceOrderForDelivery(id, db);
    if (!o) return { id, result: 'skipped', reason: 'not_found' };
    if (o.status === 'cancelled') { await releaseServiceOrder(id, {}, db); return { id, result: 'skipped', reason: 'cancelled' }; }
    if (o.paymentStatus !== 'paid' || o.status === 'awaiting_payment') { await releaseServiceOrder(id, {}, db); return { id, result: 'skipped', reason: 'not_paid' }; }

    // Already delivered: only the notification may still be due.
    if (o.status === 'delivered' && opts.by === 'auto') {
      if (o.notifiedAt) { await releaseServiceOrder(id, {}, db); return { id, result: 'skipped', reason: 'already_done' }; }
      const notify = await notifyClient(o, db, opts.notify);
      return notify ? { id, result: 'notified', notify } : { id, result: 'skipped', reason: 'already_done' };
    }
    if (opts.by === 'auto') {
      if (o.onHold) { await releaseServiceOrder(id, {}, db); return { id, result: 'skipped', reason: 'on_hold' }; }
      const due = dueAt(o);
      if (!due || now < due) { await releaseServiceOrder(id, {}, db); return { id, result: 'skipped', reason: 'not_due' }; }
    }

    // Write each language that is not stored yet (an uploaded PDF is never replaced).
    const have: Record<ReportLang, boolean> = { en: o.hasReportEn, hi: o.hasReportHi };
    const generated: ReportLang[] = []; const errors: string[] = [];
    const possible = canAutoGenerate(o.serviceCode, o.details, { hasSignatureImage: !!o.signatureImage });
    if (possible) {
      for (const lang of REPORT_LANGS) {
        if (have[lang]) continue;
        try {
          const r = await generate({ serviceCode: o.serviceCode, details: o.details, signatureImage: o.signatureImage }, lang, { email: o.user.email });
          await saveServiceOrderReport(id, r.pdf, r.fileName, { lang }, db);
          have[lang] = true; generated.push(lang);
        } catch (e) { errors.push(`${lang.toUpperCase()}: ${errText(e)}`); console.error(`[delivery] ${id} ${lang} report failed:`, e); }
      }
    } else if (!have.en && !have.hi) {
      errors.push('DETAILS_INCOMPLETE – the booking does not have enough details (name / date of birth / photo) for an automatic report');
    }

    const any = have.en || have.hi;
    const lastTry = o.deliveryAttempts + 1 >= DELIVERY_MAX_ATTEMPTS;
    // The automatic delivery waits for both languages (and retries); the admin's approval – or the last retry – delivers what exists.
    if (!any || (opts.by === 'auto' && errors.length && !lastTry)) {
      const error = errors.join(' · ') || 'No report could be written';
      await releaseServiceOrder(id, { error }, db);
      reportSiteError({ source: 'delivery', level: lastTry ? 'error' : 'warning', route: 'automatic report delivery', message: `${o.serviceCode}: ${error}`, meta: { orderId: id, attempt: o.deliveryAttempts + 1 } });
      return { id, result: 'failed', error };
    }
    // Keep the lock until the client is notified, so two workers never send the SMS twice.
    await releaseServiceOrder(id, { delivered: { by: opts.by }, keepLock: true }, db);
    if (errors.length) await releaseServiceOrder(id, { error: `Delivered without: ${errors.join(' · ')}`, keepLock: true }, db).catch(() => undefined);
    const fresh = (await getServiceOrderForDelivery(id, db)) ?? o;
    const notify = fresh.notifiedAt ? null : await notifyClient(fresh, db, opts.notify);
    if (fresh.notifiedAt) await releaseServiceOrder(id, {}, db);
    return { id, result: 'delivered', by: opts.by, generated, notify };
  } catch (e) {
    const error = errText(e);
    console.error(`[delivery] ${id} failed:`, e);
    reportSiteError({ source: 'delivery', route: 'automatic report delivery', message: `${o?.serviceCode ?? 'order'}: ${error}`, stack: e instanceof Error ? e.stack : null, meta: { orderId: id } });
    await releaseServiceOrder(id, { error }, db).catch(() => undefined);
    return { id, result: 'failed', error };
  }
}

/** Sends the "report ready" SMS + email for a delivered order (channels that already went out are not repeated). */
async function notifyClient(o: DeliveryOrder, db: Db, notify = sendReportReadyNotice): Promise<NotifyLog | null> {
  try {
    const [en, hi] = await Promise.all([getServiceOrderReport(o.id, db, 'en'), getServiceOrderReport(o.id, db, 'hi')]);
    const d = o.details as Record<string, string | undefined>;
    const log = await notify({
      clientName: d.clientName || d.currentName || o.user.name || '',
      title: { en: reportTitle(o.serviceCode, 'en'), hi: reportTitle(o.serviceCode, 'hi') },
      lang: d.language === 'hi' ? 'hi' : 'en',
      // The account's own contacts first (the booking's "mobile" can be a number being analysed).
      email: o.user.email || d.email, phone: o.user.phone || d.mobile,
      pdfs: { ...(en ? { en: { filename: en.fileName, content: en.pdf } } : {}), ...(hi ? { hi: { filename: hi.fileName, content: hi.pdf } } : {}) },
    }, o.notify);
    const done = noticeDone(log);
    await recordServiceOrderNotification(o.id, log, done, db);
    if (!done) reportSiteError({ source: 'notify', level: 'warning', route: 'report-ready SMS / email', message: [log.sms && !log.sms.ok && !log.sms.skipped ? `SMS failed: ${log.sms.error ?? ''}` : '', log.email && !log.email.ok && !log.email.skipped ? `Email failed: ${log.email.error ?? ''}` : ''].filter(Boolean).join(' · ') || 'Notification failed', meta: { orderId: o.id } });
    if (!done) await releaseServiceOrder(o.id, { error: `Notification: ${[log.sms?.ok ? '' : `SMS ${log.sms?.error ?? ''}`, log.email?.ok ? '' : `email ${log.email?.error ?? ''}`].filter(Boolean).join(' · ')}` }, db);
    else await releaseServiceOrder(o.id, {}, db);
    return log;
  } catch (e) {
    await releaseServiceOrder(o.id, { error: `Notification: ${errText(e)}` }, db).catch(() => undefined);
    return null;
  }
}

/** Delivers every order that is due (oldest first) within the time budget. One sweep at a time per server. */
let running: Promise<DeliveryOutcome[]> | null = null;
export async function runDueDeliveries(opts: { db?: Db; limit?: number; budgetMs?: number; userId?: string } & Deps = {}): Promise<DeliveryOutcome[]> {
  if (running && !opts.userId) return running;
  const job = (async () => {
    const db = opts.db ?? getDb();
    const t0 = Date.now(), budget = opts.budgetMs ?? 240_000;
    const ids = await listDueServiceOrderIds({ now: opts.now?.(), turnaroundMin: SERVICE_TURNAROUND_MIN, limit: opts.limit ?? 20, userId: opts.userId }, db);
    const out: DeliveryOutcome[] = [];
    for (const id of ids) {
      if (Date.now() - t0 > budget) break;
      out.push(await deliverServiceOrder(id, { ...opts, by: 'auto', db }));
    }
    if (out.length) console.info(`[delivery] sweep: ${out.map((x) => `${x.id.slice(0, 8)}=${x.result}`).join(', ')}`);
    // Last run, shown in Admin → Website Health (is the automation alive?).
    const value = { at: new Date().toISOString(), checked: out.length, delivered: out.filter((x) => x.result === 'delivered').length, failed: out.filter((x) => x.result === 'failed').length, trigger: opts.userId ? 'client page' : 'sweep' };
    await db.insert(appSettings).values({ key: 'delivery_last_run', value }).onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: sql`now()` } }).catch(() => undefined);
    return out;
  })();
  if (!opts.userId) running = job.finally(() => { running = null; });
  return job;
}

/** Throttled background trigger (page loads): at most once a minute per key and server. */
const lastKick = new Map<string, number>();
export function shouldKick(key: string, everyMs = 60_000, now = Date.now()): boolean {
  if (now - (lastKick.get(key) ?? 0) < everyMs) return false;
  lastKick.set(key, now);
  if (lastKick.size > 5000) for (const [k, t] of lastKick) if (now - t > everyMs) lastKick.delete(k);
  return true;
}
