import { describe, expect, it } from 'vitest';
import { autoModules, deliveryState, intakeToClientInput, isAutoService, SERVICE_TURNAROUND_MIN } from '@/lib/service-delivery';
import { ClientInputSchema, generateNumerology } from '@/lib/numerology';
import { buildCoverHtml } from '@/lib/pdf/template';
import { resolveTheme, DEFAULT_BRANDING, type Branding } from '@/lib/pdf/themes';
import { generateNarrative } from '@/lib/narrative/service';

const paidAt = new Date('2026-11-27T10:00:00+05:30');
const at = (min: number) => new Date(paidAt.getTime() + min * 60_000);
const base = { status: 'paid', paidAt, hasFile: false, auto: true };

describe('purchased service delivery status', () => {
  it('moves through the four steps and is ready 3 hours after payment (auto report)', () => {
    expect(deliveryState(base, at(2))).toMatchObject({ state: 'preparing', stage: 1, overdue: false });
    expect(deliveryState(base, at(30))).toMatchObject({ state: 'preparing', stage: 2 });
    expect(deliveryState(base, at(160))).toMatchObject({ state: 'preparing', stage: 3 });
    const r = deliveryState(base, at(SERVICE_TURNAROUND_MIN));
    expect(r).toMatchObject({ state: 'ready', stage: 4, download: true });
    expect(r.state === 'ready' && r.readyAt).toBe(at(180).toISOString());
  });
  it('night orders are not paused – still 3 hours', () => {
    const night = new Date('2026-11-27T23:30:00+05:30');
    expect(deliveryState({ ...base, paidAt: night }, new Date(night.getTime() + 180 * 60_000))).toMatchObject({ state: 'ready' });
  });
  it('hold keeps an auto report back; delivered releases early', () => {
    expect(deliveryState({ ...base, onHold: true }, at(400))).toMatchObject({ state: 'preparing', stage: 3, onHold: true, overdue: true });
    expect(deliveryState({ ...base, status: 'delivered', deliveredAt: at(20) }, at(21))).toMatchObject({ state: 'ready', download: true });
  });
  it('manual services wait for the uploaded PDF', () => {
    const m = { ...base, auto: false };
    expect(deliveryState(m, at(200))).toMatchObject({ state: 'preparing', stage: 3, overdue: true });
    expect(deliveryState({ ...m, hasFile: true }, at(50))).toMatchObject({ state: 'ready', download: true });
    expect(deliveryState({ ...m, status: 'delivered', deliveredAt: at(60) }, at(61))).toMatchObject({ state: 'ready', download: false });
  });
  it('unpaid and cancelled orders', () => {
    expect(deliveryState({ ...base, status: 'awaiting_payment', paidAt: null })).toEqual({ state: 'awaiting_payment' });
    expect(deliveryState({ ...base, status: 'cancelled' })).toEqual({ state: 'cancelled' });
  });
  it('progress never shows 100 % before the report is ready', () => {
    for (let m = 0; m < 180; m += 7) { const s = deliveryState(base, at(m)); expect(s.state === 'preparing' && s.progress).toBeLessThan(100); }
  });
});

describe('booking details → automatic report', () => {
  it('Complete Life Report details become a valid engine input', () => {
    const input = intakeToClientInput('SVC_PERSONAL_REPORT', { clientName: 'Ravi Kumar Sharma', currentName: 'Ravi Sharma', dob: '1990-08-14', gender: 'male', maritalStatus: 'married', partnerName: 'Priya Sharma', partnerDob: '1992-03-05', tob: '06:45', pob: 'Jaipur', mobile: '98765 43210', concerns: 'career,money,bogus', language: 'hi' }, { email: 'ravi@example.com' });
    expect(input).not.toBeNull();
    const parsed = ClientInputSchema.parse(input);
    expect(parsed).toMatchObject({ fullName: 'Ravi Kumar Sharma', commonName: 'Ravi Sharma', language: 'hi', concerns: ['career', 'money'], partner: { name: 'Priya Sharma', gender: 'female' }, email: 'ravi@example.com' });
    const r = generateNumerology(parsed, { modules: autoModules('SVC_PERSONAL_REPORT', parsed) });
    expect(r.results.dob.moolank.value).toBe(5);
  });
  it('name correction uses the current name; missing DOB means no automatic report', () => {
    expect(intakeToClientInput('SVC_NAME_CORRECTION', { currentName: 'Anita Verma', dob: '1985-01-23', gender: 'female' })?.fullName).toBe('Anita Verma');
    expect(intakeToClientInput('SVC_PERSONAL_REPORT', { clientName: 'Anita', gender: 'female' })).toBeNull();
    expect(autoModules('SVC_COUPLE', ClientInputSchema.parse(intakeToClientInput('SVC_COUPLE', { clientName: 'A B', dob: '1985-01-23', gender: 'female' })))).toEqual(['dob']);
    expect(isAutoService('SVC_PERSONAL_REPORT')).toBe(true);
    expect(isAutoService('SVC_SIGNATURE')).toBe(false);
  });
});

describe('Complete Life Report cover', () => {
  it('uses the service-report cover design (wordmark, two-line title, number tiles, numerologist block)', async () => {
    const input = ClientInputSchema.parse(intakeToClientInput('SVC_PERSONAL_REPORT', { clientName: 'Ravi Sharma', dob: '1990-08-14', gender: 'male' }));
    const result = generateNumerology(input, { modules: ['complete'] });
    const narrative = await generateNarrative(result, { language: 'en', provider: null });
    const branding = { ...DEFAULT_BRANDING, brandName: 'myNumerologist.com', expertName: 'Acharya Nandram' } as Branding;
    const html = buildCoverHtml({ result, narrative, theme: resolveTheme(undefined, branding), branding, reportDate: '2026-11-27', reportTitle: 'Complete Life Report' });
    expect(html).toContain('class="wm-core">Numerologist');
    expect(html).toContain('<span class="a">Complete</span><span class="b">Life Report</span>');
    expect(html).toContain('class="sg"');
    expect(html).toContain('Ravi Sharma');
    expect(html).toContain('Acharya Nandram');
    expect(html).toContain('14-08-1990');
  });
});

/* ---------- database: paid service → live status → stored report ---------- */
import { afterAll, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { upsertVerifiedUser } from '@/lib/auth/otp';
import { createCheckout, fulfilPayment } from '@/lib/billing/checkout';
import { getService, getServiceOrderReport, getUserServiceOrder, listServiceOrders, saveService, saveServiceOrderReport, updateServiceOrder } from '@/lib/billing/services';

const DB_URL = process.env.TEST_DATABASE_URL;
describe.skipIf(!DB_URL)('database: purchased service delivery', () => {
  let pool: Pool; let db: Db;
  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL }); db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  afterAll(async () => { await pool?.end(); });

  it('pay → preparing → stored PDF → ready, scoped to the owner, PDF never in lists', async () => {
    const u = await upsertVerifiedUser({ email: 'life@example.com', phone: '+919812300000' }, 'Life', db);
    const svc = (await getService('SVC_PERSONAL_REPORT', db))!;
    await saveService({ ...svc, mrpPaise: svc.mrpPaise ?? null, usdCents: null, usdMrpCents: null, priceConfirmed: true }, db);
    const o = await createCheckout(u, { planCode: 'SVC_PERSONAL_REPORT', billingState: 'Rajasthan', intake: { clientName: 'Ravi Sharma', dob: '1990-08-14', gender: 'male' } }, {}, db);
    await fulfilPayment(o.orderId, 'pay_test_1', db);
    const [row] = await listServiceOrders({ userId: u.id }, db);
    expect(row.status).toBe('paid');
    expect(row.hasReportFile).toBe(false);
    expect(row).not.toHaveProperty('reportPdf');
    const mine = (await getUserServiceOrder(u.id, row.id, db))!;
    expect(mine.paidAt).toBeTruthy();
    const st = deliveryState({ status: mine.status, paidAt: mine.paidAt, deliveredAt: mine.deliveredAt, onHold: mine.onHold, hasFile: mine.hasReportFile, auto: true });
    expect(st).toMatchObject({ state: 'preparing', stage: 1 });
    const other = await upsertVerifiedUser({ email: 'other-life@example.com' }, 'Other', db);
    expect(await getUserServiceOrder(other.id, row.id, db)).toBeNull();

    await expect(saveServiceOrderReport(row.id, new TextEncoder().encode('hello'), 'x.pdf', {}, db)).rejects.toThrow('NOT_A_PDF');
    const pdf = new TextEncoder().encode('%PDF-1.7 test');
    expect(await saveServiceOrderReport(row.id, pdf, 'ravi.pdf', { markDelivered: true }, db)).toBe(true);
    const back = (await getServiceOrderReport(row.id, db))!;
    expect(new TextDecoder().decode(back.pdf)).toBe('%PDF-1.7 test');
    const after = (await getUserServiceOrder(u.id, row.id, db))!;
    expect(after.status).toBe('delivered');
    expect(deliveryState({ status: after.status, paidAt: after.paidAt, deliveredAt: after.deliveredAt, hasFile: after.hasReportFile, auto: true })).toMatchObject({ state: 'ready', download: true });

    await updateServiceOrder({ id: row.id, status: 'paid', onHold: true }, db);
    const held = (await getUserServiceOrder(u.id, row.id, db))!;
    expect(held.onHold).toBe(true);
    expect(held.deliveredAt).toBeNull(); // un-delivering clears the delivered time
  });
});
