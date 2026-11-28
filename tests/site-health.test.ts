/** Client questions answered in reports + Admin → Website Health (error tracking, problems, requirements). */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { answerClientQuestions, parseQuestions, qaHtml, questionFacts, ruleAnswer, topicOf } from '@/lib/report/client-questions';
import { fingerprintOf, redact } from '@/lib/server/site-errors';
import { configChecks, EXPECTED_MIGRATIONS, overall } from '@/lib/server/site-health';

describe('client questions in every report', () => {
  it('splits the booking text into separate questions', () => {
    expect(parseQuestions('1. When will I get married? 2. Should I change my job this year?\nKya mera business chalega', 'Loan is increasing')).toEqual([
      'When will I get married?', 'Should I change my job this year?', 'Kya mera business chalega', 'Loan is increasing']);
    expect(parseQuestions('', '')).toEqual([]);
    expect(parseQuestions('ok?')).toEqual([]); // too short to be a question
    expect(parseQuestions(Array.from({ length: 10 }, (_, i) => `Question number ${i}?`).join('\n'))).toHaveLength(6);
  });
  it('recognises the topic in English, Hindi and Hinglish', () => {
    expect(topicOf('When will I get married?')).toBe('marriage');
    expect(topicOf('मेरी शादी कब होगी')).toBe('marriage');
    expect(topicOf('Will I get a government job?')).toBe('career');
    expect(topicOf('Kya mera business chalega')).toBe('business');
    expect(topicOf('Karz kab utrega, loan badh raha hai')).toBe('money');
    expect(topicOf('When can I buy a new home?')).toBe('property');
    expect(topicOf('Ghar me kalah rehta hai')).toBe('family');
    expect(topicOf('Visa for Canada')).toBe('travel');
    expect(topicOf('Court case kab khatam hoga')).toBe('legal');
    expect(topicOf('My health is weak')).toBe('health');
  });
  it('answers from the client\'s own numbers with timing, practical steps and remedies', () => {
    const f = questionFacts({ name: 'Ravi Sharma', dob: '1990-08-14', gender: 'male', asOf: { year: 2026, month: 11, day: 28 } });
    expect(f.moolank).toBe(5); expect(f.bhagyank).toBe(5); expect(f.personalYear).toBe(5);
    const a = ruleAnswer('When will I get married?', f, 'en');
    expect(a).toMatch(/Moolank is 5/); expect(a).toMatch(/Personal Year 6/); expect(a).toMatch(/lucky days/);
    const job = ruleAnswer('Should I change my job this year?', f, 'en', { first: false });
    expect(job).toMatch(/this year supports/); expect(job).not.toMatch(/Supporting remedies/);
    const health = ruleAnswer('My health is not good', f, 'en');
    expect(health).toMatch(/doctor/); expect(health).not.toMatch(/guarantee/i);
    const hi = ruleAnswer('मेरी शादी कब होगी', f, 'hi');
    expect(hi).toMatch(/मूलांक 5/); expect(hi).toMatch(/व्यक्तिगत वर्ष 6/); expect(hi).not.toMatch(/\b(Aug|Sep|Monday)\b/);
  });
  it('works without AI, skips bad input and prints safely', async () => {
    const qa = await answerClientQuestions({ questions: 'When will my financial problems end?', challenges: 'Frequent arguments at home', name: 'Sunil', dob: '1979-07-07', lang: 'en' }, { useAi: false });
    expect(qa).toHaveLength(2);
    expect(await answerClientQuestions({ questions: 'Will I get married soon?', dob: 'not a date', lang: 'en' })).toEqual([]);
    const html = qaHtml([{ q: '<script>x</script>?', a: 'Answer' }], 'en');
    expect(html).toContain('Your Questions Answered'); expect(html).not.toContain('<script>');
    expect(qaHtml([], 'en')).toBe('');
  });
  it('falls back to the rules when the AI reply is unusable', async () => {
    const env = { ...process.env };
    process.env.LLM_PROVIDER = 'openai'; process.env.OPENAI_API_KEY = 'test'; process.env.LLM_MODEL = 'test-model';
    const fetchImpl = (async () => new Response(JSON.stringify({ choices: [{ message: { content: 'not json' } }] }), { status: 200 })) as unknown as typeof fetch;
    const qa = await answerClientQuestions({ questions: 'When will I get married?', name: 'Ravi', dob: '1990-08-14', lang: 'en' }, { fetchImpl });
    process.env = env;
    expect(qa[0].a).toMatch(/Moolank is 5/);
  });
});

describe('website errors', () => {
  it('masks personal data and secrets', () => {
    const r = redact('Failed for ravi@example.com phone +91 98123 45678 token=abc123 Authorization: Bearer eyJhbGciOi.xyz');
    expect(r).not.toMatch(/ravi@|98123|abc123|eyJhbGci/);
    expect(r).toContain('[email]'); expect(r).toContain('[number]'); expect(r).toContain('token=[hidden]');
  });
  it('groups the same error even when ids and numbers differ', () => {
    const a = fingerprintOf({ source: 'api', message: 'Order 7f3c2a10-1111-4222-8333-944455556666 failed after 3 tries', route: '/api/service-orders/7f3c2a10-1111-4222-8333-944455556666/pdf' });
    const b = fingerprintOf({ source: 'api', message: 'Order 0a1b2c3d-1111-4222-8333-944455556666 failed after 5 tries', route: '/api/service-orders/0a1b2c3d-1111-4222-8333-944455556666/pdf' });
    expect(a).toBe(b);
    expect(fingerprintOf({ source: 'client', message: 'Order x failed' })).not.toBe(fingerprintOf({ source: 'api', message: 'Order x failed' }));
  });
  it('knows how many migrations exist', () => {
    const j = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')) as { entries: unknown[] };
    expect(j.entries).toHaveLength(EXPECTED_MIGRATIONS);
  });
  it('checks the running requirements without exposing secrets', () => {
    const c = configChecks({ NODE_ENV: 'production', APP_URL: 'https://www.mynumerologist.com', ENCRYPTION_KEY: 'k', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 'SECRET123', FAST2SMS_API_KEY: 'x' });
    const by = (id: string) => c.find((x) => x.id === id)!;
    expect(by('app-url').status).toBe('ok'); expect(by('payments').status).toBe('ok'); expect(by('email').status).toBe('fail'); expect(by('sms').status).toBe('ok');
    expect(JSON.stringify(c)).not.toContain('SECRET123');
    expect(configChecks({ NODE_ENV: 'production', ALLOW_MOCK_PAYMENTS: '1' }).find((x) => x.id === 'payments')!.status).toBe('fail');
    expect(overall([{ status: 'ok' }, { status: 'warn' }])).toBe('warn');
  });
});

/* ---------- database ---------- */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { errorSummary, listSiteErrors, recordSiteError, resolveSiteErrors, deleteResolvedSiteErrors } from '@/lib/server/site-errors';
import { databaseChecks, problemChecks } from '@/lib/server/site-health';
import { upsertVerifiedUser } from '@/lib/auth/otp';
import { createCheckout, fulfilPayment } from '@/lib/billing/checkout';
import { getService, saveService } from '@/lib/billing/services';

const DB_URL = process.env.TEST_DATABASE_URL;
describe.skipIf(!DB_URL)('database: website health', () => {
  let pool: Pool; let db: Db;
  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL }); db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  afterAll(async () => { await pool?.end(); });

  it('records, groups, counts, resolves and re-opens errors', async () => {
    await recordSiteError({ source: 'api', message: 'TypeError: x is undefined for user ravi@example.com', route: '/api/account', method: 'GET', status: 500, stack: 'at a.ts:1' }, db);
    await new Promise((r) => setTimeout(r, 10));
    await recordSiteError({ source: 'client', message: 'Cannot read properties of null', route: '/dashboard' }, db);
    let [row] = await listSiteErrors({ source: 'api' }, db);
    expect(row.count).toBe(1); expect(row.message).toContain('[email]'); expect(row.message).not.toContain('ravi@');
    const s = await errorSummary(db);
    expect(s.openErrors).toBe(2); expect(s.today).toBe(2); expect(s.bySource.find((x) => x.source === 'api')!.today).toBe(1);
    await resolveSiteErrors([row.id], true, db);
    expect(await listSiteErrors({ source: 'api' }, db)).toHaveLength(0);
    expect(await listSiteErrors({ source: 'api', status: 'resolved' }, db)).toHaveLength(1);
    expect(await deleteResolvedSiteErrors(db)).toBe(1);
    await resolveSiteErrors('all', true, db);
    expect((await errorSummary(db)).openErrors).toBe(0);
    // resolved error happens again → re-opened, counter continues (the per-server 10 s throttle is bypassed by waiting)
    [row] = await listSiteErrors({ source: 'client', status: 'all' }, db);
    expect(row.resolvedAt).not.toBeNull();
  });

  it('reports database status, migrations and overdue paid orders', async () => {
    const checks = await databaseChecks(db);
    expect(checks.find((c) => c.id === 'db')!.status).not.toBe('fail');
    expect(checks.find((c) => c.id === 'migrations')!.detail).toBe(`${EXPECTED_MIGRATIONS} of ${EXPECTED_MIGRATIONS} applied`);
    const u = await upsertVerifiedUser({ email: 'late@example.com' }, 'Late', db);
    const svc = (await getService('SVC_LOSHU', db))!;
    await saveService({ ...svc, mrpPaise: svc.mrpPaise ?? null, usdCents: null, usdMrpCents: null, priceConfirmed: true }, db);
    const o = await createCheckout(u, { planCode: 'SVC_LOSHU', billingState: 'Rajasthan', intake: { clientName: 'Late Client', dob: '1990-01-01', gender: 'male' } }, {}, db);
    await fulfilPayment(o.orderId, 'pay_late', db);
    let p = await problemChecks(db);
    expect(p.find((x) => x.id === 'overdue')!.count).toBe(0);
    p = await problemChecks(db, new Date(Date.now() + 5 * 3_600_000));
    expect(p.find((x) => x.id === 'overdue')).toMatchObject({ status: 'fail', count: 1 });
    expect(p.find((x) => x.id === 'automation')!.status).toBe('fail');
  });
});
