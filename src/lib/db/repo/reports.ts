/** Reports: versioned per (profile, module). Results and narrative are stored encrypted. */
import { and, desc, eq, max, sql } from 'drizzle-orm';
import { generateNumerology, type NumerologyResult, type ReportModule } from '@/lib/numerology';
import type { StoredInput } from '@/lib/numerology/schemas';
import type { Narrative } from '@/lib/narrative/service';
import { decryptJson, encryptJson, sha256Hex } from '@/lib/security/crypto';
import { getDb, type Db } from '../client';
import { clientProfiles, reports, type ReportRow, type ReportSummary } from '../schema';
import { getProfile, NotFoundError } from './profiles';

export type StoredModule = ReportRow['module'];

export function moduleOf(result: NumerologyResult): StoredModule {
  const m = result.modules ?? ['complete'];
  return (m.includes('complete') || m.length !== 1 ? 'complete' : m[0]) as StoredModule;
}

export function summarise(result: NumerologyResult, narrative?: Narrative | null): ReportSummary {
  const r = result.results;
  return {
    moolank: r.dob.moolank.value, bhagyank: r.dob.bhagyank.value, kua: r.dob.kua.value,
    nameNumber: r.name?.chaldean.nameNumber.single ?? null, personalYear: r.dob.personalCycles.current.personalYear,
    nameScore: r.name?.compatibilityScore ?? null, mobileScore: r.mobile?.score ?? null, coupleScore: r.couple?.overall ?? null,
    sections: narrative?.sections.length ?? 0,
  };
}

const stable = (v: unknown): string => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
export const resultHash = (r: NumerologyResult) => sha256Hex(stable({ client: r.client, asOf: r.asOf, engineVersion: r.engineVersion, modules: r.modules }));

/** Guard: nothing that looks like a full Aadhaar may be persisted. */
function assertNoAadhaar(...values: unknown[]) {
  for (const v of values) if (v && /\b[2-9]\d{11}\b/.test(JSON.stringify(v))) throw new Error('REFUSING_TO_STORE_12_DIGIT_NUMBER');
}

async function assertProfileOwner(db: Db, ownerId: string, profileId: string) {
  const [p] = await db.select({ id: clientProfiles.id }).from(clientProfiles).where(and(eq(clientProfiles.id, profileId), eq(clientProfiles.ownerId, ownerId))).limit(1);
  if (!p) throw new NotFoundError('PROFILE_NOT_FOUND');
}

export interface SaveReportInput {
  result: NumerologyResult;
  narrative?: Narrative | null;
  theme?: string;
  language?: string;
  status?: ReportRow['status'];
  /** Keep a specific version number (used by import); defaults to latest + 1. */
  version?: number;
}

export async function createReport(ownerId: string, profileId: string, data: SaveReportInput, db: Db = getDb()) {
  await assertProfileOwner(db, ownerId, profileId);
  assertNoAadhaar(data.result, data.narrative);
  const module = moduleOf(data.result);
  return db.transaction(async (tx) => {
    // lock the profile row so concurrent saves get distinct version numbers
    await tx.execute(sql`select id from client_profiles where id = ${profileId} for update`);
    const [{ v }] = await tx.select({ v: max(reports.version) }).from(reports).where(and(eq(reports.profileId, profileId), eq(reports.module, module)));
    const [row] = await tx.insert(reports).values({
      profileId, module, version: data.version ?? (v ?? 0) + 1,
      status: data.status ?? (data.narrative ? (data.narrative.status === 'awaiting_review' ? 'awaiting_review' : 'final') : 'draft'),
      inputHash: resultHash(data.result), engineVersion: data.result.engineVersion, asOf: data.result.asOf,
      resultEnc: encryptJson(data.result), narrativeEnc: data.narrative ? encryptJson(data.narrative) : null,
      theme: data.theme ?? 'royal-gold-maroon', language: data.language ?? data.narrative?.language ?? data.result.client.language ?? 'en',
      summary: summarise(data.result, data.narrative),
    }).returning();
    await tx.update(clientProfiles).set({ updatedAt: new Date() }).where(eq(clientProfiles.id, profileId));
    const { resultEnc: _r, narrativeEnc: _n, ...meta } = row;
    return meta;
  });
}

export async function listReports(ownerId: string, profileId: string, db: Db = getDb()) {
  await assertProfileOwner(db, ownerId, profileId);
  return db.select({
    id: reports.id, module: reports.module, version: reports.version, status: reports.status, theme: reports.theme, language: reports.language,
    asOf: reports.asOf, engineVersion: reports.engineVersion, summary: reports.summary, createdAt: reports.createdAt, updatedAt: reports.updatedAt,
  }).from(reports).where(eq(reports.profileId, profileId)).orderBy(desc(reports.createdAt), desc(reports.version));
}

export async function getReport(ownerId: string, reportId: string, db: Db = getDb()) {
  const [row] = await db.select({ r: reports }).from(reports).innerJoin(clientProfiles, eq(clientProfiles.id, reports.profileId))
    .where(and(eq(reports.id, reportId), eq(clientProfiles.ownerId, ownerId))).limit(1);
  if (!row) throw new NotFoundError('REPORT_NOT_FOUND');
  return hydrate(row.r);
}

export function hydrate(r: ReportRow) {
  const { resultEnc, narrativeEnc, ...meta } = r;
  return { ...meta, result: decryptJson<NumerologyResult>(resultEnc), narrative: narrativeEnc ? decryptJson<Narrative>(narrativeEnc) : null };
}

export async function updateReport(ownerId: string, reportId: string, patch: { narrative?: Narrative | null; status?: ReportRow['status']; theme?: string; language?: string }, db: Db = getDb()) {
  const current = await getReport(ownerId, reportId, db);
  assertNoAadhaar(patch.narrative);
  const narrative = patch.narrative === undefined ? current.narrative : patch.narrative;
  const status = patch.status ?? (patch.narrative ? (patch.narrative.status === 'final' ? 'final' : 'awaiting_review') : current.status);
  await db.update(reports).set({
    narrativeEnc: narrative ? encryptJson(narrative) : null, status, theme: patch.theme ?? current.theme, language: patch.language ?? current.language,
    summary: summarise(current.result, narrative), updatedAt: new Date(),
  }).where(eq(reports.id, reportId));
  return getReport(ownerId, reportId, db);
}

export async function deleteReport(ownerId: string, reportId: string, db: Db = getDb()) {
  await getReport(ownerId, reportId, db);
  await db.delete(reports).where(eq(reports.id, reportId));
}

/**
 * Regenerate: recalculates from the stored profile input (today's date unless asOf given).
 * Aadhaar is not stored, so the Aadhaar module is only included if the number is supplied again in memory.
 */
export async function regenerateReport(ownerId: string, profileId: string, opts: { modules?: ReportModule[]; asOf?: string; aadhaar?: string; narrative?: (r: NumerologyResult) => Promise<Narrative | null>; theme?: string } = {}, db: Db = getDb()) {
  const profile = await getProfile(ownerId, profileId, db);
  const input = { ...(profile.input as StoredInput), ...(opts.aadhaar ? { aadhaar: opts.aadhaar, aadhaarConsent: true } : {}) };
  const result = generateNumerology(input, { asOf: opts.asOf, modules: opts.modules });
  const narrative = opts.narrative ? await opts.narrative(result) : null;
  return createReport(ownerId, profileId, { result, narrative, theme: opts.theme }, db);
}
