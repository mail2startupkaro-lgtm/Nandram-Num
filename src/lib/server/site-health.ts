/**
 * Admin → Website Health: what the website needs to run (requirements), what needs attention now (problems) and
 * the server it runs on. Read-only checks – nothing here changes data.
 */
import { and, eq, gte, inArray, isNotNull, isNull, lt, lte, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { appSettings, payments, serviceOrders } from '@/lib/db/schema';
import { configFromEnv } from '@/lib/narrative/providers/llm';
import { SERVICE_TURNAROUND_MIN } from '@/lib/service-delivery';
import { ensureDeliveryColumns } from '@/lib/billing/services';

/** Number of migrations in drizzle/meta/_journal.json (kept in step by tests/site-health.test.ts). */
export const EXPECTED_MIGRATIONS = 17;

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'info';
export interface Check { id: string; group: string; label: string; status: CheckStatus; detail: string; fix?: string }


/** Settings the website needs, from the environment (no secrets are returned – only whether they are set). */
export function configChecks(env: Record<string, string | undefined> = process.env): Check[] {
  const e = (k: string) => !!env[k]?.trim();
  const prod = () => env.NODE_ENV === 'production';
  const c: Check[] = [];
  const appUrl = env.APP_URL?.trim() ?? '';
  c.push({ id: 'app-url', group: 'Website', label: 'Website address (APP_URL)', status: !appUrl ? 'fail' : /^https:\/\//.test(appUrl) || !prod() ? 'ok' : 'warn',
    detail: appUrl || 'Not set', fix: 'Set APP_URL=https://www.mynumerologist.com – used in emails, SMS links, payment returns and sitemaps.' });
  c.push({ id: 'encryption', group: 'Security', label: 'Encryption key (client details)', status: e('ENCRYPTION_KEY') ? 'ok' : prod() ? 'fail' : 'warn',
    detail: e('ENCRYPTION_KEY') ? `Set${e('ENCRYPTION_KEY_PREVIOUS') ? ' (with a previous key for rotation)' : ''}` : 'Not set', fix: 'Set ENCRYPTION_KEY (32 random bytes, base64). Never change it without moving the old one to ENCRYPTION_KEY_PREVIOUS.' });
  c.push({ id: 'admins', group: 'Security', label: 'Super admin accounts', status: e('SUPER_ADMIN_EMAILS') || e('SUPER_ADMIN_MOBILES') ? 'ok' : 'warn',
    detail: e('SUPER_ADMIN_EMAILS') || e('SUPER_ADMIN_MOBILES') ? 'Configured' : 'Not set', fix: 'Set SUPER_ADMIN_EMAILS (comma-separated).' });
  if (e('AUTH_DEV_BYPASS_EMAIL') || e('AUTH_DEV_SHOW_OTP')) c.push({ id: 'dev-auth', group: 'Security', label: 'Developer login shortcuts', status: prod() ? 'fail' : 'warn', detail: 'AUTH_DEV_BYPASS_EMAIL / AUTH_DEV_SHOW_OTP is set', fix: 'Remove these on the live website.' });
  const cashfree = e('CASHFREE_APP_ID') && e('CASHFREE_SECRET_KEY'), razor = e('RAZORPAY_KEY_ID') && e('RAZORPAY_KEY_SECRET');
  const mock = env.ALLOW_MOCK_PAYMENTS === '1' || env.ALLOW_MOCK_PAYMENTS === 'true';
  c.push({ id: 'payments', group: 'Payments', label: 'Payment gateway', status: mock && prod() ? 'fail' : cashfree || razor ? 'ok' : mock ? 'warn' : 'fail',
    detail: [cashfree ? `Cashfree (${(env.CASHFREE_ENV || 'auto').toLowerCase()})` : '', razor ? 'Razorpay' : '', mock ? 'MOCK payments allowed' : ''].filter(Boolean).join(' · ') || 'No gateway keys',
    fix: 'Set CASHFREE_APP_ID + CASHFREE_SECRET_KEY (or Razorpay keys). Remove ALLOW_MOCK_PAYMENTS on the live site.' });
  if (cashfree && /sandbox|test/i.test(env.CASHFREE_ENV ?? '')) c.push({ id: 'cashfree-env', group: 'Payments', label: 'Cashfree mode', status: prod() ? 'warn' : 'info', detail: 'Sandbox – real payments are not taken', fix: 'Set CASHFREE_ENV=production on the live site.' });
  if (razor) c.push({ id: 'razorpay-webhook', group: 'Payments', label: 'Razorpay webhook secret', status: e('RAZORPAY_WEBHOOK_SECRET') ? 'ok' : 'warn', detail: e('RAZORPAY_WEBHOOK_SECRET') ? 'Set' : 'Not set – payments are confirmed only by the checkout callback', fix: 'Set RAZORPAY_WEBHOOK_SECRET.' });
  c.push({ id: 'invoice', group: 'Payments', label: 'GST invoice details', status: e('SELLER_LEGAL_NAME') && e('SELLER_ADDRESS') ? 'ok' : 'warn',
    detail: [e('SELLER_LEGAL_NAME') ? 'name' : '', e('SELLER_ADDRESS') ? 'address' : '', e('SELLER_GSTIN') ? 'GSTIN' : ''].filter(Boolean).join(', ') || 'Not set', fix: 'Set SELLER_LEGAL_NAME, SELLER_ADDRESS, SELLER_STATE, SELLER_GSTIN (or edit Admin → Invoice settings).' });
  const email = e('HOSTINGER_MAIL_API_TOKEN') || e('HOSTINGER_API_TOKEN') || e('HOSTINGER_TOKEN') ? 'Hostinger Mail' : e('RESEND_API_KEY') ? 'Resend' : '';
  c.push({ id: 'email', group: 'Messages', label: 'Email sending (reports, password reset, notifications)', status: email ? 'ok' : prod() ? 'fail' : 'warn', detail: email ? `${email}${env.EMAIL_FROM ? ` · from ${env.EMAIL_FROM}` : ''}` : 'No provider – emails are only simulated', fix: 'Set HOSTINGER_MAIL_API_TOKEN (or RESEND_API_KEY) and EMAIL_FROM.' });
  c.push({ id: 'sms', group: 'Messages', label: 'SMS (report-ready texts)', status: e('FAST2SMS_API_KEY') ? 'ok' : 'warn', detail: e('FAST2SMS_API_KEY') ? 'Fast2SMS' : 'No key – SMS are only simulated', fix: 'Set FAST2SMS_API_KEY.' });
  const llm = configFromEnv(env as Record<string, string | undefined>);
  c.push({ id: 'ai', group: 'Reports', label: 'AI writer (report text, question answers, signature vision)', status: llm.provider !== 'template' && llm.apiKey ? 'ok' : 'warn',
    detail: llm.provider !== 'template' && llm.apiKey ? `${llm.provider} · ${llm.model || 'default model'}` : 'Not configured – reports use the built-in writer (still complete)', fix: 'Set GEMINI_API_KEY (or ANTHROPIC_API_KEY / OPENAI_API_KEY) and LLM_PROVIDER.' });
  const serverless = !!(env.VERCEL || env.AWS_EXECUTION_ENV);
  c.push({ id: 'pdf', group: 'Reports', label: 'PDF engine (Chromium)', status: serverless || e('PDF_CHROMIUM_PATH') || e('LOCAL_CHROME_PATH') || !prod() ? 'ok' : 'warn',
    detail: e('PDF_CHROMIUM_PATH') ? `Custom path ${env.PDF_CHROMIUM_PATH}` : serverless ? 'Serverless Chromium (downloaded on first use)' : 'Local Chrome / Edge', fix: 'Use "Test PDF engine" below to make sure PDFs can be created.' });
  c.push({ id: 'cron', group: 'Automation', label: 'Automatic report delivery – scheduler key', status: e('CRON_SECRET') ? 'ok' : 'warn', detail: e('CRON_SECRET') ? 'CRON_SECRET set' : 'Not set – the delivery endpoint is open (rate-limited)', fix: 'Set CRON_SECRET in Vercel and in the GitHub Actions secrets.' });
  c.push({ id: 'google', group: 'Website', label: 'Google sign-in', status: e('GOOGLE_CLIENT_ID') && e('GOOGLE_CLIENT_SECRET') ? 'ok' : 'info', detail: e('GOOGLE_CLIENT_ID') ? 'Enabled' : 'Off (email / mobile + password works)' });
  c.push({ id: 'analytics', group: 'Website', label: 'Google Analytics / Tag Manager', status: e('NEXT_PUBLIC_GA_ID') || e('GA_MEASUREMENT_ID') || e('NEXT_PUBLIC_GTM_ID') ? 'ok' : 'info', detail: e('NEXT_PUBLIC_GA_ID') || e('GA_MEASUREMENT_ID') || e('NEXT_PUBLIC_GTM_ID') ? 'Set' : 'Not set' });
  return c;
}

/** Database reachable, how fast, and all migrations applied. */
export async function databaseChecks(db: Db = getDb()): Promise<Check[]> {
  const out: Check[] = [];
  const t0 = Date.now();
  try {
    await db.execute(sql`select 1`);
    const ms = Date.now() - t0;
    out.push({ id: 'db', group: 'Database', label: 'Database connection', status: ms < 800 ? 'ok' : 'warn', detail: `Connected in ${ms} ms`, fix: ms < 800 ? undefined : 'Slow – check the database region / plan.' });
  } catch (e) {
    out.push({ id: 'db', group: 'Database', label: 'Database connection', status: 'fail', detail: e instanceof Error ? e.message.slice(0, 200) : 'Failed', fix: 'Check DATABASE_URL and that the database is running.' });
    return out;
  }
  try {
    const r = (await db.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`)).rows as { n: number }[];
    const n = r[0]?.n ?? 0;
    out.push({ id: 'migrations', group: 'Database', label: 'Database migrations', status: n >= EXPECTED_MIGRATIONS ? 'ok' : 'warn', detail: `${n} of ${EXPECTED_MIGRATIONS} applied`, fix: n >= EXPECTED_MIGRATIONS ? undefined : 'Run `npm run db:migrate` (new features add their tables on first use, but migrations keep the database complete).' });
  } catch {
    out.push({ id: 'migrations', group: 'Database', label: 'Database migrations', status: 'warn', detail: 'Migration table not found', fix: 'Run `npm run db:migrate`.' });
  }
  try {
    const r = (await db.execute(sql`select pg_database_size(current_database())::bigint as b`)).rows as { b: string | number }[];
    const mb = Math.round(Number(r[0]?.b ?? 0) / 1048576);
    out.push({ id: 'db-size', group: 'Database', label: 'Database size', status: mb > 450 ? 'warn' : 'info', detail: `${mb} MB`, fix: mb > 450 ? 'Close to the 500 MB limit of free database plans – stored report PDFs take most space.' : undefined });
  } catch { /* not allowed on some hosts */ }
  return out;
}

export interface Problem { id: string; label: string; status: CheckStatus; count: number; detail: string; items?: { id: string; text: string; at?: string }[]; tab?: string }

/** Things that need attention right now (orders, deliveries, notifications, payments, messages). */
export async function problemChecks(db: Db = getDb(), now = new Date()): Promise<Problem[]> {
  await ensureDeliveryColumns(db);
  const grace = new Date(now.getTime() - (SERVICE_TURNAROUND_MIN + 20) * 60_000);
  const out: Problem[] = [];
  const overdue = await db.select({ id: serviceOrders.id, code: serviceOrders.serviceCode, paidAt: payments.paidAt, err: serviceOrders.deliveryError, onHold: serviceOrders.onHold })
    .from(serviceOrders).innerJoin(payments, eq(payments.id, serviceOrders.paymentId))
    .where(and(inArray(serviceOrders.status, ['paid', 'in_progress']), eq(payments.status, 'paid'), lte(payments.paidAt, grace))).limit(50);
  const late = overdue.filter((o) => !o.onHold);
  out.push({ id: 'overdue', label: 'Paid reports past the 3-hour mark, not delivered', status: late.length ? 'fail' : 'ok', count: late.length, tab: 'services',
    detail: late.length ? 'The automatic delivery could not finish these – open Service orders to approve, upload or retry.' : 'Every paid report was delivered on time.',
    items: late.slice(0, 10).map((o) => ({ id: o.id, text: `${o.code}${o.err ? ` – ${o.err.slice(0, 140)}` : ''}`, at: o.paidAt?.toISOString() })) });
  const held = overdue.filter((o) => o.onHold);
  if (held.length) out.push({ id: 'held', label: 'Reports on hold past 3 hours', status: 'warn', count: held.length, tab: 'services', detail: 'You put these on hold – the client is still waiting.', items: held.slice(0, 10).map((o) => ({ id: o.id, text: o.code, at: o.paidAt?.toISOString() })) });
  const unNotified = await db.select({ id: serviceOrders.id, code: serviceOrders.serviceCode, at: serviceOrders.deliveredAt, err: serviceOrders.deliveryError }).from(serviceOrders)
    .where(and(eq(serviceOrders.status, 'delivered'), isNull(serviceOrders.notifiedAt), isNotNull(serviceOrders.deliveredAt), lt(serviceOrders.deliveredAt, new Date(now.getTime() - 20 * 60_000)), gte(serviceOrders.deliveredAt, new Date(now.getTime() - 7 * 86_400_000)))).limit(50);
  out.push({ id: 'notify', label: 'Delivered reports whose SMS / email did not go out', status: unNotified.length ? 'warn' : 'ok', count: unNotified.length, tab: 'services',
    detail: unNotified.length ? 'Use "Send SMS + email again" on the order, and check the email / SMS settings below.' : 'All clients were notified.',
    items: unNotified.slice(0, 10).map((o) => ({ id: o.id, text: `${o.code}${o.err ? ` – ${o.err.slice(0, 140)}` : ''}`, at: o.at?.toISOString() })) });
  const failedPay = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(and(eq(payments.status, 'failed'), gte(payments.createdAt, new Date(now.getTime() - 86_400_000))));
  const pendingPay = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(and(eq(payments.status, 'created'), lt(payments.createdAt, new Date(now.getTime() - 30 * 60_000)), gte(payments.createdAt, new Date(now.getTime() - 86_400_000))));
  const f = failedPay[0]?.n ?? 0, pnd = pendingPay[0]?.n ?? 0;
  out.push({ id: 'payments', label: 'Payments in the last 24 hours that failed or were not completed', status: f > 3 ? 'warn' : 'info', count: f + pnd, tab: 'payments',
    detail: `${f} failed · ${pnd} started but not completed (usually customers who closed the payment window)` });
  try {
    const msgs = (await db.execute(sql`select count(*)::int as n from contact_messages where status = 'new'`)).rows as { n: number }[];
    const n = msgs[0]?.n ?? 0;
    out.push({ id: 'messages', label: 'Unanswered contact messages', status: n ? 'info' : 'ok', count: n, tab: 'messages', detail: n ? 'New messages are waiting in Messages.' : 'No new messages.' });
  } catch { /* table may not exist on very old databases */ }
  const [run] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, 'delivery_last_run')).limit(1);
  const last = run?.value as { at?: string; checked?: number; delivered?: number; failed?: number; trigger?: string } | undefined;
  const mins = last?.at ? Math.round((now.getTime() - new Date(last.at).getTime()) / 60_000) : null;
  out.push({ id: 'automation', label: 'Automatic report delivery – last run', status: late.length && (mins === null || mins > 30) ? 'fail' : mins === null ? 'warn' : 'ok', count: 0,
    detail: mins === null ? 'Has not run yet. It runs from the scheduler (cron), when clients open My reports and when you open Service orders.' : `${mins < 1 ? 'Just now' : `${mins} min ago`} (${last?.trigger ?? 'sweep'}) – checked ${last?.checked ?? 0}, delivered ${last?.delivered ?? 0}, failed ${last?.failed ?? 0}` });
  return out;
}

/** The server the website runs on. */
export function runtimeInfo() {
  const m = process.memoryUsage();
  return {
    node: process.version, platform: `${process.platform} ${process.arch}`, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    host: process.env.VERCEL ? `Vercel${process.env.VERCEL_REGION ? ` · ${process.env.VERCEL_REGION}` : ''}` : 'Own server / computer',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE?.slice(0, 120) ?? null,
    uptimeMin: Math.round(process.uptime() / 60), memoryMb: Math.round(m.rss / 1048576), heapMb: Math.round(m.heapUsed / 1048576),
    serverTime: new Date().toISOString(),
  };
}

export const overall = (xs: { status: CheckStatus }[]): CheckStatus => (xs.some((x) => x.status === 'fail') ? 'fail' : xs.some((x) => x.status === 'warn') ? 'warn' : 'ok');
