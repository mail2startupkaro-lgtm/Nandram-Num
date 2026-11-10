/**
 * Section 10 – JSON / CSV import & export.
 *   Current format: schemaVersion 2
 *     { schemaVersion: 2, kind: 'numerology.profile', exportedAt, engineVersion, profile }
 *     { schemaVersion: 2, kind: 'numerology.bundle',  exportedAt, engineVersion, profiles: [...] }
 *   Older formats accepted on import:
 *     v1  – single reading exported by the results page before Phase 5 ({ schemaVersion: 1, client, results, narrative? })
 *     raw – a bare Input Sheet object ({ fullName, dob, gender, ... })
 *   Results are recalculated on import (the engine is deterministic) so tampered numbers cannot slip in;
 *   expert-written report text is kept.
 */
import Papa from 'papaparse';
import { z } from 'zod';
import { ENGINE_VERSION, generateNumerology, type NumerologyResult, type ReportModule } from '@/lib/numerology';
import { LIFE_CONCERNS, StoredInputSchema, type StoredInput } from '@/lib/numerology/schemas';
import type { Narrative } from '@/lib/narrative/service';
import { getDb, type Db } from '@/lib/db/client';
import { createProfile, getProfile, listProfiles } from '@/lib/db/repo/profiles';
import { createReport, getReport, listReports } from '@/lib/db/repo/reports';
import { clientProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const EXPORT_SCHEMA_VERSION = 2;

// ---------- schemas ----------
const NarrativeSchema = z.object({
  schemaVersion: z.number(), language: z.enum(['en', 'hi', 'hinglish']), status: z.enum(['awaiting_review', 'final']),
  sections: z.array(z.object({ id: z.string(), title: z.string(), text: z.string().max(20000) }).passthrough()).max(40),
}).passthrough();

const ResultSchema = z.object({
  schemaVersion: z.number(), engineVersion: z.string(), asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  modules: z.array(z.string()).optional(), client: z.object({}).passthrough(), results: z.object({ dob: z.object({}).passthrough() }).passthrough(),
}).passthrough();

const ExportReportSchema = z.object({
  module: z.enum(['dob', 'name', 'mobile', 'aadhaar', 'couple', 'complete']),
  version: z.number().int().positive(),
  status: z.enum(['draft', 'awaiting_review', 'final']).default('draft'),
  theme: z.string().default('royal-gold-maroon'),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  createdAt: z.string().optional(),
  result: ResultSchema,
  narrative: NarrativeSchema.nullable().default(null),
});

const ExportProfileSchema = z.object({
  input: StoredInputSchema,
  aadhaarMasked: z.string().regex(/^XXXX-XXXX-\d{4}$/).nullable().default(null),
  reports: z.array(ExportReportSchema).default([]),
});

export const ProfileFileSchema = z.object({ schemaVersion: z.literal(2), kind: z.literal('numerology.profile'), exportedAt: z.string(), engineVersion: z.string(), profile: ExportProfileSchema });
export const BundleFileSchema = z.object({ schemaVersion: z.literal(2), kind: z.literal('numerology.bundle'), exportedAt: z.string(), engineVersion: z.string(), profiles: z.array(ExportProfileSchema).max(5000) });

export type ExportProfile = z.infer<typeof ExportProfileSchema>;
export type ExportReport = z.infer<typeof ExportReportSchema>;

// ---------- export ----------
async function exportProfileData(ownerId: string, profileId: string, opts: { allVersions?: boolean }, db: Db): Promise<ExportProfile> {
  const p = await getProfile(ownerId, profileId, db);
  const metas = await listReports(ownerId, profileId, db);
  const chosen = opts.allVersions ? metas : [...new Map([...metas].sort((a, b) => a.version - b.version).map((m) => [m.module, m])).values()];
  const reps: ExportReport[] = [];
  for (const m of [...chosen].sort((a, b) => a.module.localeCompare(b.module) || a.version - b.version)) {
    const r = await getReport(ownerId, m.id, db);
    reps.push({ module: r.module, version: r.version, status: r.status, theme: r.theme, language: r.language as ExportReport['language'], createdAt: r.createdAt.toISOString(), result: r.result as never, narrative: (r.narrative as never) ?? null });
  }
  return { input: p.input, aadhaarMasked: p.aadhaarLast4 ? `XXXX-XXXX-${p.aadhaarLast4}` : null, reports: reps };
}

export async function exportProfile(ownerId: string, profileId: string, opts: { allVersions?: boolean } = {}, db: Db = getDb()) {
  return { schemaVersion: EXPORT_SCHEMA_VERSION, kind: 'numerology.profile' as const, exportedAt: new Date().toISOString(), engineVersion: ENGINE_VERSION, profile: await exportProfileData(ownerId, profileId, opts, db) };
}

export async function exportBundle(ownerId: string, profileIds: string[] | 'all', opts: { allVersions?: boolean } = {}, db: Db = getDb()) {
  const ids = profileIds === 'all'
    ? (await db.select({ id: clientProfiles.id }).from(clientProfiles).where(eq(clientProfiles.ownerId, ownerId))).map((p) => p.id)
    : profileIds;
  const profiles: ExportProfile[] = [];
  for (const id of ids) profiles.push(await exportProfileData(ownerId, id, opts, db));
  return { schemaVersion: EXPORT_SCHEMA_VERSION, kind: 'numerology.bundle' as const, exportedAt: new Date().toISOString(), engineVersion: ENGINE_VERSION, profiles };
}

// ---------- CSV ----------
export const CSV_COLUMNS = ['fullName', 'commonName', 'hindiName', 'gender', 'dob', 'timeOfBirth', 'placeOfBirth', 'maritalStatus', 'profession', 'education', 'city', 'state', 'mobile', 'concerns', 'language', 'partnerName', 'partnerGender', 'partnerDob', 'partnerMobile'] as const;

export function profilesToCsv(profiles: { input: StoredInput }[]): string {
  const rows = profiles.map(({ input: i }) => ({
    fullName: i.fullName, commonName: i.commonName ?? '', hindiName: i.hindiName ?? '', gender: i.gender, dob: i.dob, timeOfBirth: i.timeOfBirth ?? '',
    placeOfBirth: i.placeOfBirth ?? '', maritalStatus: i.maritalStatus ?? '', profession: i.profession ?? '', education: i.education ?? '', city: i.city ?? '', state: i.state ?? '',
    mobile: i.mobile ?? '', concerns: (i.concerns ?? []).join(';'), language: i.language ?? 'en',
    partnerName: i.partner?.name ?? '', partnerGender: i.partner?.gender ?? '', partnerDob: i.partner?.dob ?? '', partnerMobile: i.partner?.mobile ?? '',
  }));
  // Leading apostrophe stops spreadsheet apps from interpreting cells as formulas (CSV injection).
  const safe = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, /^[=+\-@]/.test(String(v)) ? `'${v}` : v])));
  return '﻿' + Papa.unparse(safe, { columns: [...CSV_COLUMNS] });
}

// ---------- parsing / migration ----------
export interface ImportIssue { where: string; message: string }
export interface ParsedImport { profiles: ExportProfile[]; issues: ImportIssue[]; sourceVersion: string }

const fmt = (prefix: string, e: z.ZodError): ImportIssue[] => e.issues.slice(0, 20).map((i) => ({ where: [prefix, ...i.path].filter((x) => x !== '').join('.'), message: i.message }));

function fromV1(d: Record<string, unknown>): unknown {
  const { narrative, ...result } = d as { narrative?: unknown; client: Record<string, unknown>; modules?: string[] };
  const mods = result.modules ?? ['complete'];
  const module = mods.includes('complete') || mods.length !== 1 ? 'complete' : mods[0];
  return {
    input: result.client,
    aadhaarMasked: (result.client as { aadhaarMasked?: string | null }).aadhaarMasked ?? null,
    reports: [{ module, version: 1, status: (narrative as { status?: string } | undefined)?.status ?? 'draft', language: (narrative as { language?: string } | undefined)?.language ?? (result.client as { language?: string }).language ?? 'en', result, narrative: narrative ?? null }],
  };
}

export function parseImportJson(text: string): ParsedImport {
  let data: unknown;
  try { data = JSON.parse(text.replace(/^﻿/, '')); } catch { return { profiles: [], issues: [{ where: 'file', message: 'This is not valid JSON.' }], sourceVersion: 'unknown' }; }
  const d = data as Record<string, unknown>;
  const v = typeof d?.schemaVersion === 'number' ? d.schemaVersion : undefined;

  if (v !== undefined && v > EXPORT_SCHEMA_VERSION) return { profiles: [], issues: [{ where: 'schemaVersion', message: `This file was created by a newer version of the app (schema ${v}). Please update the app first.` }], sourceVersion: String(v) };

  if (v === 2 && d.kind === 'numerology.bundle') {
    // validate profile-by-profile so one bad record doesn't block the rest
    const list = Array.isArray(d.profiles) ? d.profiles : [];
    const profiles: ExportProfile[] = [];
    const issues: ImportIssue[] = Array.isArray(d.profiles) ? [] : [{ where: 'profiles', message: 'Expected a list of profiles.' }];
    list.forEach((p, i) => { const r = ExportProfileSchema.safeParse(p); if (r.success) profiles.push(r.data); else issues.push(...fmt(`profiles[${i}]`, r.error)); });
    return { profiles, issues, sourceVersion: '2' };
  }
  if (v === 2 && d.kind === 'numerology.profile') {
    const r = ProfileFileSchema.safeParse(d);
    return r.success ? { profiles: [r.data.profile], issues: [], sourceVersion: '2' } : { profiles: [], issues: fmt('', r.error), sourceVersion: '2' };
  }
  if (v === 1 && d.client && d.results) {
    const r = ExportProfileSchema.safeParse(fromV1(d));
    return r.success ? { profiles: [r.data], issues: [], sourceVersion: '1' } : { profiles: [], issues: fmt('', r.error), sourceVersion: '1' };
  }
  if (v === undefined && d && typeof d === 'object' && 'fullName' in d) {
    const r = StoredInputSchema.safeParse(d);
    return r.success ? { profiles: [{ input: r.data, aadhaarMasked: null, reports: [] }], issues: [], sourceVersion: 'input' } : { profiles: [], issues: fmt('input', r.error), sourceVersion: 'input' };
  }
  return { profiles: [], issues: [{ where: 'file', message: 'Unrecognised file. Export a profile from this app, or use the CSV template.' }], sourceVersion: 'unknown' };
}

export function parseImportCsv(text: string): ParsedImport {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim() });
  const issues: ImportIssue[] = parsed.errors.slice(0, 20).map((e) => ({ where: `row ${(e.row ?? 0) + 2}`, message: e.message }));
  const missingCols = ['fullName', 'gender', 'dob'].filter((c) => !parsed.meta.fields?.includes(c));
  if (missingCols.length) return { profiles: [], issues: [{ where: 'header', message: `Missing column(s): ${missingCols.join(', ')}` }], sourceVersion: 'csv' };
  const profiles: ExportProfile[] = [];
  parsed.data.slice(0, 5000).forEach((row, i) => {
    const clean = (k: string) => { const v = (row[k] ?? '').trim().replace(/^'(?=[=+\-@])/, ''); return v === '' ? undefined : v; };
    const concerns = (clean('concerns') ?? '').split(/[;|]/).map((c) => c.trim()).filter(Boolean);
    const candidate = {
      fullName: clean('fullName'), commonName: clean('commonName'), hindiName: clean('hindiName'), gender: clean('gender')?.toLowerCase(), dob: clean('dob'),
      timeOfBirth: clean('timeOfBirth'), placeOfBirth: clean('placeOfBirth'), maritalStatus: clean('maritalStatus')?.toLowerCase(), profession: clean('profession'),
      education: clean('education'), city: clean('city'), state: clean('state'), mobile: clean('mobile'), concerns, language: clean('language')?.toLowerCase(),
      partner: clean('partnerName') ? { name: clean('partnerName'), gender: clean('partnerGender')?.toLowerCase(), dob: clean('partnerDob'), mobile: clean('partnerMobile') } : undefined,
    };
    const bad = concerns.filter((c) => !(LIFE_CONCERNS as readonly string[]).includes(c));
    if (bad.length) { issues.push({ where: `row ${i + 2}.concerns`, message: `Unknown concern(s): ${bad.join(', ')}. Allowed: ${LIFE_CONCERNS.join(', ')}` }); return; }
    const r = StoredInputSchema.safeParse(candidate);
    if (r.success) profiles.push({ input: r.data, aadhaarMasked: null, reports: [] });
    else issues.push(...fmt(`row ${i + 2}`, r.error));
  });
  return { profiles, issues, sourceVersion: 'csv' };
}

// ---------- import ----------
export interface ImportOutcome {
  created: { profileId: string; name: string; reports: number }[];
  issues: ImportIssue[];
  warnings: ImportIssue[];
}

const stable = (v: unknown): string => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));

/** Recalculate a report's numbers from the profile input; keep Aadhaar-derived parts (cannot be recomputed). */
export function recalculate(input: StoredInput, rep: ExportReport): { result: NumerologyResult; changed: boolean } {
  const original = rep.result as unknown as NumerologyResult;
  const modules = (original.modules ?? [rep.module]) as ReportModule[];
  const fresh = generateNumerology({ ...input }, { asOf: original.asOf, modules });
  const merged: NumerologyResult = {
    ...fresh,
    client: { ...fresh.client, aadhaarMasked: original.client?.aadhaarMasked ?? null },
    results: { ...fresh.results, aadhaar: original.results?.aadhaar ?? null },
  };
  return { result: merged, changed: stable(merged) !== stable(original) };
}

export async function importProfiles(ownerId: string, parsed: ParsedImport, opts: { createReports?: (input: StoredInput) => Promise<{ result: NumerologyResult; narrative: Narrative | null } | null> } = {}, db: Db = getDb()): Promise<ImportOutcome> {
  const out: ImportOutcome = { created: [], issues: [...parsed.issues], warnings: [] };
  for (const [i, p] of parsed.profiles.entries()) {
    try {
      const profile = await createProfile(ownerId, p.input, db);
      if (p.aadhaarMasked) await db.update(clientProfiles).set({ aadhaarLast4: p.aadhaarMasked.slice(-4) }).where(eq(clientProfiles.id, profile.id));
      let count = 0;
      for (const rep of [...p.reports].sort((a, b) => a.module.localeCompare(b.module) || a.version - b.version)) {
        const { result, changed } = recalculate(p.input, rep);
        if (changed) out.warnings.push({ where: `profiles[${i}].reports.${rep.module}.v${rep.version}`, message: rep.result.engineVersion !== ENGINE_VERSION ? `Recalculated with engine ${ENGINE_VERSION} (file used ${rep.result.engineVersion}).` : 'Numbers in the file did not match the inputs and were recalculated.' });
        await createReport(ownerId, profile.id, { result, narrative: rep.narrative as unknown as Narrative | null, theme: rep.theme, language: rep.language, status: rep.status, version: rep.version }, db);
        count++;
      }
      if (!p.reports.length && opts.createReports) {
        const gen = await opts.createReports(p.input);
        if (gen) { await createReport(ownerId, profile.id, gen, db); count++; }
      }
      out.created.push({ profileId: profile.id, name: profile.displayName, reports: count });
    } catch (e) {
      out.issues.push({ where: `profiles[${i}]`, message: e instanceof Error ? e.message : 'Could not import this profile.' });
    }
  }
  return out;
}
