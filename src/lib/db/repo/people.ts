/**
 * Saved people ("My family"): the account holder and family members whose details are kept for future readings.
 * Each person is a client profile (encrypted input, scoped to the owner), so their readings and reports stay together.
 */
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { ClientInputBase, FAMILY_RELATIONS, type FamilyRelation, type StoredInput } from '@/lib/numerology/schemas';
import { decryptJson } from '@/lib/security/crypto';
import { getDb, type Db } from '../client';
import { clientProfiles } from '../schema';
import { createProfile, getProfile, updateProfile } from './profiles';

/** How many people one customer account may keep (self + family). */
export const FAMILY_LIMIT = 20;

export const PersonSchema = ClientInputBase.pick({
  fullName: true, commonName: true, hindiName: true, gender: true, dob: true, timeOfBirth: true, placeOfBirth: true,
  maritalStatus: true, profession: true, city: true, state: true, mobile: true, email: true, signedName: true, partner: true,
}).extend({ relation: z.enum(FAMILY_RELATIONS) });
export type PersonInput = z.infer<typeof PersonSchema>;

export interface Person extends PersonInput { id: string; updatedAt: string }

const toPerson = (id: string, updatedAt: Date, i: StoredInput): Person => ({
  id, updatedAt: updatedAt.toISOString(), relation: (i.relation ?? 'self') as FamilyRelation,
  fullName: i.fullName, commonName: i.commonName, hindiName: i.hindiName, gender: i.gender, dob: i.dob, timeOfBirth: i.timeOfBirth,
  placeOfBirth: i.placeOfBirth, maritalStatus: i.maritalStatus, profession: i.profession, city: i.city, state: i.state,
  mobile: i.mobile, email: i.email, signedName: i.signedName, partner: i.partner,
});

const ORDER: Record<FamilyRelation, number> = Object.fromEntries(FAMILY_RELATIONS.map((r, i) => [r, i])) as Record<FamilyRelation, number>;

/** Everyone saved on the account, "self" first, then by relation and name. */
export async function listPeople(ownerId: string, db: Db = getDb()): Promise<Person[]> {
  const rows = await db.select().from(clientProfiles).where(eq(clientProfiles.ownerId, ownerId)).orderBy(asc(clientProfiles.createdAt)).limit(200);
  const out: Person[] = [];
  for (const r of rows) {
    try { out.push(toPerson(r.id, r.updatedAt, decryptJson<StoredInput>(r.inputEnc))); } catch { /* unreadable row (old key) – skip */ }
  }
  return out.sort((a, b) => ORDER[a.relation] - ORDER[b.relation] || a.fullName.localeCompare(b.fullName));
}

export async function getPerson(ownerId: string, id: string, db: Db = getDb()): Promise<Person> {
  const p = await getProfile(ownerId, id, db);
  return toPerson(p.id, p.updatedAt, p.input);
}

export class FamilyLimitError extends Error { constructor() { super('FAMILY_LIMIT'); } }

/** Creates or updates a saved person. Fields the form does not send (concerns, language…) are kept on update. */
export async function savePerson(ownerId: string, input: PersonInput, id?: string, db: Db = getDb()): Promise<Person> {
  const clean = PersonSchema.parse(input);
  if (id) {
    const cur = await getProfile(ownerId, id, db);
    const merged: StoredInput = { ...cur.input, ...clean };
    const p = await updateProfile(ownerId, id, merged, db);
    return toPerson(p.id, p.updatedAt, p.input);
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(clientProfiles).where(eq(clientProfiles.ownerId, ownerId));
  if (n >= FAMILY_LIMIT) throw new FamilyLimitError();
  const p = await createProfile(ownerId, { ...clean, aadhaarConsent: false, concerns: [], language: 'en' }, db);
  return toPerson(p.id, p.updatedAt, p.input);
}

/**
 * Finds the saved person that matches booking details (same name + date of birth), so a repeat booking
 * updates that person instead of creating a duplicate.
 */
export function findSamePerson(people: Person[], fullName: string, dob: string): Person | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  return people.find((p) => norm(p.fullName) === norm(fullName) && p.dob === dob);
}
