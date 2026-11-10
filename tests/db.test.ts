/**
 * Database + portability tests. Needs a Postgres: TEST_DATABASE_URL=postgres://user@localhost:5433/numerology_test
 * (skipped when not set).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/client';
import { ensureUser } from '@/lib/auth/current-user';
import { createProfile, deleteProfile, duplicateProfile, getProfile, listProfiles, NotFoundError, updateProfile } from '@/lib/db/repo/profiles';
import { createReport, getReport, listReports, regenerateReport, updateReport } from '@/lib/db/repo/reports';
import { createShareLink, resolveShareLink, revokeShareLink } from '@/lib/db/repo/shares';
import { exportBundle, exportProfile, importProfiles, parseImportCsv, parseImportJson, profilesToCsv } from '@/lib/portable';
import { decrypt, encrypt, hashPassword, verifyPassword } from '@/lib/security/crypto';
import { generateNumerology, verhoeffCheckDigit } from '@/lib/numerology';
import { generateNarrative } from '@/lib/narrative/service';

const URL = process.env.TEST_DATABASE_URL;
const aadhaar = '23456789012' + verhoeffCheckDigit('23456789012');
const asOf = '2026-11-03';
const input = {
  fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', hindiName: 'राहुल शर्मा', gender: 'male' as const, dob: '28-08-1990', profession: 'Software engineer',
  maritalStatus: 'engaged' as const, concerns: ['career' as const, 'marriage' as const], mobile: '9876543210', aadhaar, aadhaarConsent: true, language: 'en' as const,
  partner: { name: 'Priya Verma', gender: 'female' as const, dob: '15-05-1992' },
};

describe('crypto', () => {
  it('encrypts with AES-GCM and detects tampering', () => {
    const c = encrypt('Rahul Sharma');
    expect(c).not.toContain('Rahul');
    expect(decrypt(c)).toBe('Rahul Sharma');
    const parts = c.split('.'); parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith('A') ? 'BB' : 'AA');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });
  it('supports key rotation', () => {
    const old = Buffer.alloc(32, 7).toString('base64'), next = Buffer.alloc(32, 9).toString('base64');
    process.env.ENCRYPTION_KEY = old; const c = encrypt('secret');
    process.env.ENCRYPTION_KEY = next; process.env.ENCRYPTION_KEY_PREVIOUS = old;
    expect(decrypt(c)).toBe('secret');
    delete process.env.ENCRYPTION_KEY; delete process.env.ENCRYPTION_KEY_PREVIOUS;
  });
  it('hashes share passwords', () => {
    const h = hashPassword('shubh123');
    expect(verifyPassword('shubh123', h)).toBe(true);
    expect(verifyPassword('wrong', h)).toBe(false);
  });
});

describe.skipIf(!URL)('database (Postgres)', () => {
  let pool: Pool; let db: Db; let owner: string; let other: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = drizzle(pool, { schema });
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await migrate(db, { migrationsFolder: 'drizzle' });
    owner = (await ensureUser('expert@test.local', 'expert', db)).id;
    other = (await ensureUser('someone@test.local', 'expert', db)).id;
  });
  afterAll(async () => { await pool?.end(); });

  it('never stores the Aadhaar number; personal data is encrypted', async () => {
    const p = await createProfile(owner, input, db);
    const result = generateNumerology(input, { asOf });
    await createReport(owner, p.id, { result }, db);
    const dump = JSON.stringify((await db.execute(sql`select * from client_profiles, reports`)).rows);
    expect(dump).not.toContain(aadhaar);
    expect(dump).not.toContain('Kumar');           // full name only inside ciphertext
    expect(dump).not.toContain('9876543210');
    expect(dump).toContain(aadhaar.slice(-4));      // last 4 digits are kept
    expect((await getProfile(owner, p.id, db)).input).not.toHaveProperty('aadhaar');
  });

  it('refuses to store a result that contains a full 12-digit number', async () => {
    const p = await createProfile(owner, { ...input, aadhaar: undefined }, db);
    const result = generateNumerology(input, { asOf });
    const leaky = { ...result, client: { ...result.client, note: aadhaar } } as never;
    await expect(createReport(owner, p.id, { result: leaky }, db)).rejects.toThrow('REFUSING_TO_STORE');
  });

  it('versions reports, updates narrative, regenerates and lists', async () => {
    const p = await createProfile(owner, input, db);
    const r1 = await createReport(owner, p.id, { result: generateNumerology(input, { asOf }) }, db);
    const r2 = await regenerateReport(owner, p.id, { asOf, narrative: (r) => generateNarrative(r) }, db);
    expect([r1.version, r2.version]).toEqual([1, 2]);
    expect(r2.status).toBe('final');
    const full = await getReport(owner, r2.id, db);
    expect(full.result.results.aadhaar).toBeNull(); // Aadhaar not re-supplied → module skipped
    expect(full.narrative?.sections.length).toBeGreaterThan(10);
    const edited = { ...full.narrative!, status: 'awaiting_review' as const, sections: full.narrative!.sections.map((s, i) => (i === 0 ? { ...s, text: 'Edited intro.', source: 'expert' as const } : s)) };
    const u = await updateReport(owner, r2.id, { narrative: edited }, db);
    expect(u.status).toBe('awaiting_review');
    expect(u.narrative?.sections[0].text).toBe('Edited intro.');
    const list = await listReports(owner, p.id, db);
    expect(list.map((x) => x.version)).toEqual([2, 1]);
    expect(list[0].summary.moolank).toBe(1);
  });

  it('search, update, duplicate and delete (with cascade)', async () => {
    const p = await createProfile(owner, { ...input, commonName: 'Anita Desai', aadhaar: undefined }, db);
    await createReport(owner, p.id, { result: generateNumerology({ ...input, commonName: 'Anita Desai', aadhaar: undefined }, { asOf }) }, db);
    expect((await listProfiles(owner, { q: 'anita' }, db)).items.map((x) => x.id)).toContain(p.id);
    await updateProfile(owner, p.id, { ...input, commonName: 'Anita D.', aadhaar: undefined }, db);
    expect((await getProfile(owner, p.id, db)).displayName).toBe('Anita D.');
    const copy = await duplicateProfile(owner, p.id, db);
    expect(copy.displayName).toBe('Anita D. (copy)');
    expect((await listReports(owner, copy.id, db)).length).toBe(1);
    await deleteProfile(owner, p.id, db);
    await expect(getProfile(owner, p.id, db)).rejects.toBeInstanceOf(NotFoundError);
    expect((await db.execute(sql`select count(*)::int as n from reports where profile_id = ${p.id}`)).rows[0]).toEqual({ n: 0 });
  });

  it('isolates owners', async () => {
    const p = await createProfile(owner, { ...input, aadhaar: undefined }, db);
    await expect(getProfile(other, p.id, db)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createReport(other, p.id, { result: generateNumerology(input, { asOf }) }, db)).rejects.toBeInstanceOf(NotFoundError);
    expect((await listProfiles(other, {}, db)).total).toBe(0);
  });

  it('share links: expiry, password, revoke; token never stored', async () => {
    const p = await createProfile(owner, { ...input, aadhaar: undefined }, db);
    const r = await createReport(owner, p.id, { result: generateNumerology(input, { asOf }) }, db);
    const open = await createShareLink(owner, r.id, { days: 7 }, db);
    expect((await resolveShareLink(open.token, undefined, { countView: true }, db)).status).toBe('ok');
    expect(JSON.stringify((await db.execute(sql`select * from share_links`)).rows)).not.toContain(open.token);
    const locked = await createShareLink(owner, r.id, { days: 1, password: 'shubh123' }, db);
    expect((await resolveShareLink(locked.token, undefined, {}, db)).status).toBe('password_required');
    expect((await resolveShareLink(locked.token, 'nope', {}, db)).status).toBe('wrong_password');
    expect((await resolveShareLink(locked.token, 'shubh123', {}, db)).status).toBe('ok');
    await db.execute(sql`update share_links set expires_at = now() - interval '1 minute' where id = ${locked.id}`);
    expect((await resolveShareLink(locked.token, 'shubh123', {}, db)).status).toBe('expired');
    await revokeShareLink(owner, open.id, db);
    expect((await resolveShareLink(open.token, undefined, {}, db)).status).toBe('revoked');
    expect((await resolveShareLink('made-up-token', undefined, {}, db)).status).toBe('not_found');
    await expect(createShareLink(other, r.id, {}, db)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('JSON export → import round-trip restores the profile exactly', async () => {
    const p = await createProfile(owner, input, db);
    const result = generateNumerology(input, { asOf });
    const narrative = await generateNarrative(result);
    await createReport(owner, p.id, { result, narrative, theme: 'cosmic-blue' }, db);
    await createReport(owner, p.id, { result: generateNumerology(input, { asOf, modules: ['name'] }), theme: 'minimal-white' }, db);
    const exported = await exportProfile(owner, p.id, {}, db);
    expect(JSON.stringify(exported)).not.toContain(aadhaar);
    expect(exported.profile.aadhaarMasked).toBe(`XXXX-XXXX-${aadhaar.slice(-4)}`);

    const parsed = parseImportJson(JSON.stringify(exported));
    expect(parsed.issues).toEqual([]);
    const outcome = await importProfiles(owner, parsed, {}, db);
    expect(outcome.issues).toEqual([]);
    expect(outcome.warnings).toEqual([]);
    const again = await exportProfile(owner, outcome.created[0].profileId, {}, db);
    const strip = (x: typeof exported) => ({ ...x.profile, reports: x.profile.reports.map(({ createdAt: _c, ...r }) => r) });
    expect(strip(again)).toEqual(strip(exported));
  });

  it('bundle export + CSV round-trip', async () => {
    const bundle = await exportBundle(owner, 'all', {}, db);
    expect(bundle.profiles.length).toBeGreaterThan(3);
    const csv = profilesToCsv(bundle.profiles);
    const back = parseImportCsv(csv);
    expect(back.issues).toEqual([]);
    expect(back.profiles.map((p) => p.input.fullName)).toEqual(bundle.profiles.map((p) => p.input.fullName));
    expect(back.profiles[0].input.partner?.name).toBe(bundle.profiles[0].input.partner?.name);
  });

  it('imports older formats and reports clear errors', async () => {
    // v1 = the results-page export from Phases 2–4
    const v1 = { ...generateNumerology(input, { asOf }), narrative: await generateNarrative(generateNumerology(input, { asOf })) };
    const p1 = parseImportJson(JSON.stringify(v1));
    expect(p1.sourceVersion).toBe('1');
    expect(p1.issues).toEqual([]);
    expect(p1.profiles[0].reports[0].narrative?.sections.length).toBe(18);

    expect(parseImportJson('{"schemaVersion": 9, "kind": "numerology.bundle"}').issues[0].message).toMatch(/newer version/);
    expect(parseImportJson('not json').issues[0].message).toMatch(/not valid JSON/);

    const csv = 'fullName,gender,dob,concerns\nAsha Rao,female,12-03-1988,career;money\nX,male,31-02-1990,\nRavi,robot,01-01-1990,\nMeena,female,01-01-1990,astrology';
    const c = parseImportCsv(csv);
    expect(c.profiles.map((p) => p.input.fullName)).toEqual(['Asha Rao']);
    expect(c.issues.map((i) => i.where)).toEqual(expect.arrayContaining(['row 3.fullName', 'row 3.dob', 'row 4.gender', 'row 5.concerns']));

    // tampered numbers are recalculated
    const tampered = JSON.parse(JSON.stringify(v1));
    tampered.results.dob.moolank.value = 9;
    const out = await importProfiles(owner, parseImportJson(JSON.stringify(tampered)), {}, db);
    expect(out.warnings[0].message).toMatch(/recalculated/);
    const rep = (await listReports(owner, out.created[0].profileId, db))[0];
    expect(rep.summary.moolank).toBe(1);
  });

  it('stores contact messages encrypted and lists them for the admin', async () => {
    const { createContactMessage, listContactMessages, updateContactMessage, deleteContactMessage } = await import('@/lib/contact');
    const row = await createContactMessage({ name: 'Sunita Devi', phone: '98765 12345', email: 'sunita@example.com', topic: 'service', subject: 'consultation', message: 'Please call me. Aadhaar 2345 6789 0123', language: 'hi' }, {}, db);
    const dump = JSON.stringify((await db.execute(sql`select * from contact_messages`)).rows);
    expect(dump).not.toContain('Sunita'); expect(dump).not.toContain('9876512345'); expect(dump).not.toContain('sunita@');
    expect(dump).toContain('"phone_last4":"2345"'); // last 4 of the phone kept for display
    const list = await listContactMessages({ status: 'new' }, db);
    const m = list.messages.find((x) => x.id === row.id)!;
    expect(m).toMatchObject({ name: 'Sunita Devi', phone: '+919876512345', email: 'sunita@example.com', topic: 'service', service: 'consultation', status: 'new', language: 'hi' });
    expect(m.message).toContain('XXXX-XXXX-0123'); expect(m.message).not.toContain('2345 6789');
    expect(list.counts.new).toBeGreaterThanOrEqual(1);
    expect(await updateContactMessage({ id: row.id, status: 'resolved', adminNote: 'Called back' }, db)).toBe(true);
    const after = (await listContactMessages({ status: 'resolved' }, db)).messages.find((x) => x.id === row.id)!;
    expect(after.adminNote).toBe('Called back');
    expect(await deleteContactMessage(row.id, db)).toBe(true);
    expect(await updateContactMessage({ id: row.id, status: 'new' }, db)).toBe(false);
  });
});
