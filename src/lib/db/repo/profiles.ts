/** Client profiles: create / list / read / update / duplicate / delete. Every call is scoped to the owner. */
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { StoredInputSchema, type ClientInput, type StoredInput } from '@/lib/numerology/schemas';
import { decryptJson, encryptJson } from '@/lib/security/crypto';
import { getDb, type Db } from '../client';
import { clientProfiles, reports, type ReportSummary } from '../schema';

export class NotFoundError extends Error { constructor(what = 'NOT_FOUND') { super(what); } }

export interface ProfileListItem {
  id: string;
  displayName: string;
  aadhaarLast4: string | null;
  updatedAt: Date;
  reportCount: number;
  latest: { id: string; module: string; version: number; status: string; summary: ReportSummary; createdAt: Date } | null;
}

/** Strips the Aadhaar number and validates. Returns what is safe to store. */
export function toStoredInput(input: ClientInput | StoredInput): { stored: StoredInput; last4: string | null } {
  const raw = input as ClientInput;
  const digits = raw.aadhaar?.replace(/\D/g, '') ?? '';
  const { aadhaar: _drop, ...rest } = raw;
  return { stored: StoredInputSchema.parse(rest), last4: digits.length === 12 && raw.aadhaarConsent ? digits.slice(-4) : null };
}

const displayNameOf = (i: StoredInput) => (i.commonName?.trim() || i.fullName).trim();

export async function createProfile(ownerId: string, input: ClientInput | StoredInput, db: Db = getDb(), extra: { aadhaarLast4?: string | null } = {}) {
  const { stored, last4: fromInput } = toStoredInput(input);
  const last4 = fromInput ?? (extra.aadhaarLast4 && /^\d{4}$/.test(extra.aadhaarLast4) ? extra.aadhaarLast4 : null);
  const [row] = await db.insert(clientProfiles).values({
    ownerId, displayName: displayNameOf(stored), inputEnc: encryptJson(stored), aadhaarLast4: last4,
    consentAt: stored.aadhaarConsent ? new Date() : null,
  }).returning();
  return { ...row, input: stored };
}

export async function getProfile(ownerId: string, id: string, db: Db = getDb()) {
  const [row] = await db.select().from(clientProfiles).where(and(eq(clientProfiles.id, id), eq(clientProfiles.ownerId, ownerId))).limit(1);
  if (!row) throw new NotFoundError('PROFILE_NOT_FOUND');
  const { inputEnc, ...meta } = row;
  return { ...meta, input: decryptJson<StoredInput>(inputEnc) };
}

export async function updateProfile(ownerId: string, id: string, input: ClientInput | StoredInput, db: Db = getDb()) {
  const { stored, last4 } = toStoredInput(input);
  const [row] = await db.update(clientProfiles)
    .set({ displayName: displayNameOf(stored), inputEnc: encryptJson(stored), ...(last4 ? { aadhaarLast4: last4 } : {}), updatedAt: new Date() })
    .where(and(eq(clientProfiles.id, id), eq(clientProfiles.ownerId, ownerId))).returning({ id: clientProfiles.id });
  if (!row) throw new NotFoundError('PROFILE_NOT_FOUND');
  return getProfile(ownerId, id, db);
}

/** DPDP "right to erasure": hard delete, reports and share links cascade. */
export async function deleteProfile(ownerId: string, id: string, db: Db = getDb()) {
  const res = await db.delete(clientProfiles).where(and(eq(clientProfiles.id, id), eq(clientProfiles.ownerId, ownerId))).returning({ id: clientProfiles.id });
  if (!res.length) throw new NotFoundError('PROFILE_NOT_FOUND');
}

export async function listProfiles(ownerId: string, opts: { q?: string; limit?: number; offset?: number } = {}, db: Db = getDb()): Promise<{ items: ProfileListItem[]; total: number }> {
  const where = and(eq(clientProfiles.ownerId, ownerId), opts.q ? ilike(clientProfiles.displayName, `%${opts.q.replace(/[%_]/g, '')}%`) : undefined);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(clientProfiles).where(where);
  const rows = await db.select({ id: clientProfiles.id, displayName: clientProfiles.displayName, aadhaarLast4: clientProfiles.aadhaarLast4, updatedAt: clientProfiles.updatedAt })
    .from(clientProfiles).where(where).orderBy(desc(clientProfiles.updatedAt)).limit(Math.min(opts.limit ?? 50, 200)).offset(opts.offset ?? 0);
  if (!rows.length) return { items: [], total };

  const reps = await db.select({ id: reports.id, profileId: reports.profileId, module: reports.module, version: reports.version, status: reports.status, summary: reports.summary, createdAt: reports.createdAt })
    .from(reports).where(inArray(reports.profileId, rows.map((r) => r.id))).orderBy(desc(reports.createdAt));
  return {
    total,
    items: rows.map((r) => {
      const mine = reps.filter((x) => x.profileId === r.id);
      return { ...r, reportCount: mine.length, latest: mine[0] ? { id: mine[0].id, module: mine[0].module, version: mine[0].version, status: mine[0].status, summary: mine[0].summary, createdAt: mine[0].createdAt } : null };
    }),
  };
}

/** Copies the profile and the latest version of each of its reports. */
export async function duplicateProfile(ownerId: string, id: string, db: Db = getDb()) {
  return db.transaction(async (tx) => {
    const [src] = await tx.select().from(clientProfiles).where(and(eq(clientProfiles.id, id), eq(clientProfiles.ownerId, ownerId))).limit(1);
    if (!src) throw new NotFoundError('PROFILE_NOT_FOUND');
    const [copy] = await tx.insert(clientProfiles).values({
      ownerId, displayName: `${src.displayName} (copy)`, inputEnc: src.inputEnc, aadhaarLast4: src.aadhaarLast4, consentAt: src.consentAt,
    }).returning();
    const all = await tx.select().from(reports).where(eq(reports.profileId, id)).orderBy(desc(reports.version));
    const seen = new Set<string>(); // ordered by version desc → first row per module is the latest
    for (const r of all) {
      if (seen.has(r.module)) continue;
      seen.add(r.module);
      const { id: _i, profileId: _p, createdAt: _c, updatedAt: _u, ...rest } = r;
      await tx.insert(reports).values({ ...rest, profileId: copy.id, version: 1 });
    }
    return copy;
  });
}
