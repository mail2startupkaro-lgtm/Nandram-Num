/**
 * Automatic report delivery (28 Nov 2026): not approved within 3 hours → the system delivers the report to the
 * client's report area in English + Hindi, then sends one SMS and one email. Applies to every purchased service.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { canAutoGenerate, SERVICE_REPORT_TITLES, SERVICE_TURNAROUND_MIN } from '@/lib/service-delivery';
import { noticeDone, readyEmail, readySmsText, sendReportReadyNotice, smsNumber, EMAIL_ATTACH_MAX_BYTES } from '@/lib/notify/report-ready';
import { DEFAULT_SERVICES } from '@/lib/billing/services';

describe('which reports the system can write by itself', () => {
  it('covers every service in the catalogue', () => {
    for (const s of DEFAULT_SERVICES) expect(SERVICE_REPORT_TITLES[s.code], s.code).toBeTruthy();
  });
  it('needs the details each report depends on', () => {
    const p = { clientName: 'Ravi Sharma', dob: '1990-08-14', gender: 'male' };
    expect(canAutoGenerate('SVC_PERSONAL_REPORT', p)).toBe(true);
    expect(canAutoGenerate('SVC_PERSONAL_REPORT', { clientName: 'Ravi' })).toBe(false);
    expect(canAutoGenerate('SVC_DESTINY_MATRIX', p)).toBe(true);
    expect(canAutoGenerate('SVC_BIRTH_CHART', { ...p, dob: '14-08-1990' })).toBe(true);
    expect(canAutoGenerate('SVC_MOBILE_NUMBER', p)).toBe(false);
    expect(canAutoGenerate('SVC_MOBILE_NUMBER', { ...p, mobile: '98123 45678' })).toBe(true);
    expect(canAutoGenerate('SVC_MOBILE_NUMBER', { ...p, questions: 'compare 9812345678 and 9988776655' })).toBe(true);
    expect(canAutoGenerate('SVC_BABY_NAME', { dob: '2026-10-01', gender: 'female' })).toBe(true);
    expect(canAutoGenerate('SVC_BUSINESS_NAME', p)).toBe(false);
    expect(canAutoGenerate('SVC_BUSINESS_NAME', { ...p, currentName: 'Shree Ganesh Traders' })).toBe(true);
    expect(canAutoGenerate('SVC_BUSINESS_COMPLETE', { ...p, businessName: 'Aarav Foods, Aarav Kitchen' })).toBe(true);
    expect(canAutoGenerate('SVC_BUSINESS_COMPAT', p)).toBe(true);
    expect(canAutoGenerate('SVC_SIGNATURE', p)).toBe(false);
    expect(canAutoGenerate('SVC_SIGNATURE', p, { hasSignatureImage: true })).toBe(true);
    expect(canAutoGenerate('SVC_UNKNOWN', p)).toBe(false);
  });
});

describe('report-ready notification', () => {
  const pdf = (n: number) => ({ filename: 'x.pdf', content: new Uint8Array(n) });
  const base = { clientName: 'Ravi Kumar Sharma', title: SERVICE_REPORT_TITLES.SVC_PERSONAL_REPORT, lang: 'en' as const, reportsUrl: 'https://www.mynumerologist.com/dashboard' };
  it('SMS is one plain-English message with the report-area link', () => {
    const t = readySmsText(base);
    expect(t).toMatch(/^Namaste Ravi, your Complete Life Report is ready in English & Hindi/);
    expect(t).toContain('https://www.mynumerologist.com/dashboard');
    expect(/^[\x20-\x7E]+$/.test(t)).toBe(true);
    expect(t.length).toBeLessThanOrEqual(160);
    expect(readySmsText({ ...base, clientName: 'रवि' })).toMatch(/^Namaste, your/);
    for (const title of Object.values(SERVICE_REPORT_TITLES)) expect(readySmsText({ ...base, clientName: 'Bhagyashree', title }).length, title.en).toBeLessThanOrEqual(160);
  });
  it('texts Indian mobiles only', () => {
    expect(smsNumber('+91 98123 45678')).toBe('9812345678');
    expect(smsNumber('09812345678')).toBe('9812345678');
    expect(smsNumber('+1 415 555 0134')).toBeNull();
    expect(smsNumber('+44 7911 123456')).toBeNull();
    expect(smsNumber('')).toBeNull();
  });
  it('email is bilingual (client language first) and attaches both PDFs when small', () => {
    const m = readyEmail({ ...base, lang: 'hi', pdfs: { en: pdf(10), hi: pdf(10) } });
    expect(m.subject).toContain('संपूर्ण जीवन रिपोर्ट');
    expect(m.html.indexOf('नमस्ते')).toBeLessThan(m.html.indexOf('Dear'));
    expect(m.attach).toHaveLength(2);
    expect(m.html).toContain('https://www.mynumerologist.com/dashboard');
    expect(readyEmail({ ...base, pdfs: { en: pdf(EMAIL_ATTACH_MAX_BYTES), hi: pdf(10) } }).attach).toHaveLength(0);
    expect(readyEmail({ ...base, clientName: '<b>x</b>', pdfs: {} }).html).not.toContain('<b>x</b>');
  });
  it('sends each channel once; skips channels with nowhere to send', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => { calls.push(String(url)); return new Response(JSON.stringify({ return: true, request_id: 'r1' }), { status: 200 }); }) as unknown as typeof fetch;
    process.env.FAST2SMS_API_KEY = 'test-key';
    const log = await sendReportReadyNotice({ ...base, phone: '9812345678', email: 'ravi@example.com', pdfs: { en: pdf(5) } }, null, { fetchImpl });
    delete process.env.FAST2SMS_API_KEY;
    expect(log.sms).toMatchObject({ ok: true, to: '9812345678' });
    expect(log.email).toMatchObject({ ok: true, to: 'ravi@example.com' }); // no email provider in tests → simulated
    expect(calls.filter((c) => c.includes('fast2sms'))).toHaveLength(1);
    expect(noticeDone(log)).toBe(true);
    const again = await sendReportReadyNotice({ ...base, phone: '9812345678', email: 'ravi@example.com', pdfs: {} }, log, { fetchImpl });
    expect(calls.filter((c) => c.includes('fast2sms'))).toHaveLength(1);
    expect(again.sms).toEqual(log.sms);
    const none = await sendReportReadyNotice({ ...base, phone: '+1 415 555 0134', email: '', pdfs: {} });
    expect(none.sms?.skipped).toBeTruthy(); expect(none.email?.skipped).toBe('no email address');
    expect(noticeDone(none)).toBe(true);
    expect(noticeDone({ sms: { ok: false, error: 'x', at: '' }, email: { ok: true, at: '' } })).toBe(false);
  });
});

/* ---------- database: the whole flow with a fake report writer and notifier ---------- */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { upsertVerifiedUser } from '@/lib/auth/otp';
import { createCheckout, fulfilPayment } from '@/lib/billing/checkout';
import { getService, getServiceOrderForDelivery, getServiceOrderReport, listServiceOrders, saveService, saveServiceOrderReport, updateServiceOrder, resetServiceOrderDelivery, DELIVERY_MAX_ATTEMPTS } from '@/lib/billing/services';
import { deliverServiceOrder, runDueDeliveries } from '@/lib/server/service-delivery-run';
import type { generateServiceReport } from '@/lib/server/service-report';
import type { NotifyLog } from '@/lib/billing/services';

const DB_URL = process.env.TEST_DATABASE_URL;
describe.skipIf(!DB_URL)('database: automatic delivery after 3 hours', () => {
  let pool: Pool; let db: Db;
  const made: string[] = []; const notices: { name: string; langs: string[]; email?: string | null; phone?: string | null }[] = [];
  let failNext = 0;
  const generate = (async (o, lang) => {
    if (failNext > 0) { failNext--; throw new Error('PDF engine down'); }
    made.push(`${o.serviceCode}:${lang}`);
    return { pdf: new TextEncoder().encode(`%PDF-1.7 ${o.serviceCode} ${lang}`), fileName: `r-${lang}.pdf`, pageCount: 3 };
  }) as typeof generateServiceReport;
  const notify = async (n: Parameters<typeof import('@/lib/notify/report-ready').sendReportReadyNotice>[0]): Promise<NotifyLog> => {
    notices.push({ name: n.clientName, langs: Object.keys(n.pdfs), email: n.email, phone: n.phone });
    const at = new Date().toISOString();
    return { sms: { ok: true, to: String(n.phone), at }, email: { ok: true, to: String(n.email), at } };
  };
  const later = (min: number) => () => new Date(Date.now() + min * 60_000);

  let seq = 10;
  async function paidOrder(code: string, intake: Record<string, string>, email: string) {
    const u = await upsertVerifiedUser({ email, phone: `+9198123000${seq++}` }, 'Client', db);
    const svc = (await getService(code, db))!;
    await saveService({ ...svc, mrpPaise: svc.mrpPaise ?? null, usdCents: null, usdMrpCents: null, priceConfirmed: true }, db);
    const o = await createCheckout(u, { planCode: code, billingState: 'Rajasthan', intake }, {}, db);
    await fulfilPayment(o.orderId, `pay_${Math.random().toString(36).slice(2)}`, db);
    const [row] = await listServiceOrders({ userId: u.id }, db);
    return row;
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL }); db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  afterAll(async () => { await pool?.end(); });

  it('nothing happens before 3 hours; after 3 hours both languages are delivered and the client is notified once', async () => {
    const row = await paidOrder('SVC_DESTINY_MATRIX', { clientName: 'Meera Joshi', dob: '1992-03-09', gender: 'female' }, 'meera@example.com');
    expect(await runDueDeliveries({ db, generate, notify })).toEqual([]);
    const out = await runDueDeliveries({ db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 1) });
    expect(out).toEqual([expect.objectContaining({ id: row.id, result: 'delivered', by: 'auto', generated: ['en', 'hi'] })]);
    const o = (await getServiceOrderForDelivery(row.id, db))!;
    expect(o.status).toBe('delivered'); expect(o.deliveredBy).toBe('auto'); expect(o.notifiedAt).toBeTruthy();
    expect(o.hasReportEn && o.hasReportHi).toBe(true); expect(o.deliveryLockAt).toBeNull();
    expect(new TextDecoder().decode((await getServiceOrderReport(row.id, db, 'hi'))!.pdf)).toContain('SVC_DESTINY_MATRIX hi');
    expect(notices.at(-1)).toMatchObject({ name: 'Meera Joshi', langs: ['en', 'hi'], email: 'meera@example.com', phone: '+919812300010' });
    const n = notices.length;
    expect(await runDueDeliveries({ db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 20) })).toEqual([]);
    expect(notices.length).toBe(n);
  });

  it('admin approval within 3 hours delivers at once and keeps an uploaded language', async () => {
    const row = await paidOrder('SVC_LOSHU', { clientName: 'Anil Verma', dob: '1985-11-23', gender: 'male' }, 'anil@example.com');
    await saveServiceOrderReport(row.id, new TextEncoder().encode('%PDF-1.7 uploaded english'), 'anil-en.pdf', { lang: 'en' }, db);
    const before = made.length;
    const r = await deliverServiceOrder(row.id, { by: 'admin', db, generate, notify });
    expect(r).toMatchObject({ result: 'delivered', by: 'admin', generated: ['hi'] });
    expect(made.slice(before)).toEqual(['SVC_LOSHU:hi']);
    expect(new TextDecoder().decode((await getServiceOrderReport(row.id, db, 'en'))!.pdf)).toBe('%PDF-1.7 uploaded english');
    expect((await getServiceOrderForDelivery(row.id, db))!.deliveredBy).toBe('admin');
  });

  it('hold stops the automatic delivery; a failing writer is retried, then the error is kept for the admin', async () => {
    const held = await paidOrder('SVC_BIRTH_CHART', { clientName: 'Kavya Rao', dob: '2001-01-30', gender: 'female' }, 'kavya@example.com');
    await updateServiceOrder({ id: held.id, onHold: true }, db);
    expect((await runDueDeliveries({ db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 5) })).map((x) => x.id)).not.toContain(held.id);

    const bad = await paidOrder('SVC_COUPLE', { clientName: 'Rohit Jain', dob: '1990-02-02', gender: 'male', partnerName: 'Sneha Jain', partnerDob: '1992-06-06' }, 'rohit@example.com');
    failNext = 1; // the English report fails on the 1st run
    const r1 = await deliverServiceOrder(bad.id, { by: 'auto', db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 1) });
    expect(r1).toMatchObject({ result: 'failed' });
    let o = (await getServiceOrderForDelivery(bad.id, db))!;
    expect(o.status).toBe('paid'); expect(o.deliveryAttempts).toBe(1); expect(o.deliveryError).toMatch(/PDF engine down/); expect(o.hasReportHi).toBe(true);
    const r2 = await deliverServiceOrder(bad.id, { by: 'auto', db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 11) });
    expect(r2).toMatchObject({ result: 'delivered', generated: ['en'] });
    o = (await getServiceOrderForDelivery(bad.id, db))!;
    expect(o.status).toBe('delivered'); expect(o.deliveryError).toBeNull();
  });

  it('a booking without the needed details is not delivered automatically and stops after the retry limit', async () => {
    const row = await paidOrder('SVC_SIGNATURE', { clientName: 'Sunil Gupta', dob: '1979-07-07', gender: 'male' }, 'sunil@example.com'); // no signature photo
    for (let i = 0; i < DELIVERY_MAX_ATTEMPTS; i++) await runDueDeliveries({ db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 1 + i * 15) });
    const o = (await getServiceOrderForDelivery(row.id, db))!;
    expect(o.status).toBe('paid'); expect(o.deliveryAttempts).toBe(DELIVERY_MAX_ATTEMPTS); expect(o.deliveryError).toMatch(/DETAILS_INCOMPLETE/);
    expect((await runDueDeliveries({ db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 200) })).map((x) => x.id)).not.toContain(row.id);
    // The admin uploads the PDF → approval → delivered with what exists.
    await saveServiceOrderReport(row.id, new TextEncoder().encode('%PDF-1.7 signature'), 'sig.pdf', { lang: 'en', markDelivered: true, deliveredBy: 'admin' }, db);
    await resetServiceOrderDelivery(row.id, {}, db);
    const r = await deliverServiceOrder(row.id, { by: 'admin', db, generate, notify });
    expect(r).toMatchObject({ result: 'delivered', by: 'admin', generated: [] });
    expect((await getServiceOrderForDelivery(row.id, db))!.notifiedAt).toBeTruthy();
  });

  it('two workers never deliver or notify the same order twice', async () => {
    const row = await paidOrder('SVC_PERSONAL_YEAR', { clientName: 'Pooja Singh', dob: '1995-12-12', gender: 'female' }, 'pooja@example.com');
    const n = notices.length;
    const [a, b] = await Promise.all([
      deliverServiceOrder(row.id, { by: 'auto', db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 1) }),
      deliverServiceOrder(row.id, { by: 'auto', db, generate, notify, now: later(SERVICE_TURNAROUND_MIN + 1) }),
    ]);
    expect([a.result, b.result].sort()).toEqual(['delivered', 'skipped']);
    expect(notices.length).toBe(n + 1);
  });
});
