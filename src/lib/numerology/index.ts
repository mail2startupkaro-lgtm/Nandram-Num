/**
 * Numerology calculation engine – public API.
 * Deterministic: same input + same asOf date ⇒ byte-identical JSON.
 */
import { DateParts, parseDate, todayIST } from './core/date';
import { analyseAadhaar } from './modules/aadhaar';
import { analyseCouple } from './modules/couple';
import { analyseDob } from './modules/dob';
import { analyseMobile } from './modules/mobile';
import { analyseName } from './modules/name';
import { buildRemedies } from './modules/remedies';
import { ClientInput, ClientInputSchema } from './schemas';

export const ENGINE_VERSION = '1.0.0';
export const RESULT_SCHEMA_VERSION = 1;

export * from './core/reduce';
export * from './core/date';
export * from './data/relations';
export * from './modules/dob';
export * from './modules/name';
export * from './modules/mobile';
export * from './modules/aadhaar';
export * from './modules/couple';
export * from './modules/remedies';
export * from './schemas';

export type ReportModule = 'dob' | 'name' | 'mobile' | 'aadhaar' | 'couple' | 'complete';

/** 4.6 – one structured object per module; this is the only input the narrative writer receives. */
export function generateNumerology(rawInput: unknown, opts: { asOf?: string | DateParts; modules?: ReportModule[] } = {}) {
  const input: ClientInput = ClientInputSchema.parse(rawInput);
  const asOf = opts.asOf ? parseDate(opts.asOf) : todayIST();
  const want = new Set<ReportModule>(opts.modules ?? ['complete']);
  const all = want.has('complete');

  const dob = analyseDob({ dob: input.dob, gender: input.gender }, { asOf, kuaBasis: input.kuaBasis });
  const m = dob.moolank.value, b = dob.bhagyank.value;
  const ctx = { moolank: m, bhagyank: b, missingNumbers: dob.loShu.missing };

  const name = all || want.has('name') ? analyseName({ fullName: input.fullName, commonName: input.commonName }, m, b) : undefined;
  const mobile = (all || want.has('mobile')) && input.mobile ? analyseMobile(input.mobile, ctx) : undefined;
  const aadhaar = (all || want.has('aadhaar')) && input.aadhaar
    ? analyseAadhaar(input.aadhaar, { ...ctx, gridCounts: dob.loShu.counts }, { consent: input.aadhaarConsent })
    : undefined;
  const couple = (all || want.has('couple')) && input.partner
    ? analyseCouple({ name: input.commonName || input.fullName, gender: input.gender, dob: input.dob }, input.partner, { asOf })
    : undefined;
  const remedies = buildRemedies(dob, { name, mobile });

  const { aadhaar: _omit, ...safeInput } = input; // full Aadhaar never leaves the engine
  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    asOf: dob.personalCycles.asOf,
    modules: [...want],
    client: { ...safeInput, aadhaarMasked: aadhaar?.masked ?? null },
    results: { dob, name: name ?? null, mobile: mobile ?? null, aadhaar: aadhaar ?? null, couple: couple ?? null, remedies },
  };
}
export type NumerologyResult = ReturnType<typeof generateNumerology>;
