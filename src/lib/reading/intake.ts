/**
 * "Get your reading" order flow: maps between a saved person (self / family member) and the booking details
 * each reading type asks for. Pure functions – shared by the browser flow and the tests.
 */
import type { ServiceIntakeField } from '@/lib/db/schema';
import type { FamilyRelation } from '@/lib/numerology/schemas';

/** Minimal saved-person shape (matches /api/people). */
export interface PersonLite {
  id?: string; relation: FamilyRelation; fullName: string; gender: 'male' | 'female' | 'other'; dob: string;
  timeOfBirth?: string; placeOfBirth?: string; country?: string; state?: string; mobile?: string; email?: string; signedName?: string;
  partner?: { name: string; gender: 'male' | 'female' | 'other'; dob: string; mobile?: string };
}

export const REQUIRED_INTAKE: ServiceIntakeField[] = ['clientName', 'dob', 'gender', 'currentName', 'partnerName', 'partnerDob', 'businessName'];

/** Services whose "currentName" box is not a person's name (so it is not filled from / saved to the person). */
const CURRENT_NAME_IS_NOT_PERSON = ['SVC_BUSINESS_NAME'];

/** Date in a saved person may be DD-MM-YYYY (older entries) – the date input needs YYYY-MM-DD. */
export function toIsoDate(s?: string): string {
  if (!s) return '';
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

/** Pre-fills the booking form from a saved person (and, for couple readings, their partner). */
export function personToIntake(code: string, fields: ServiceIntakeField[], p: PersonLite | null, partner?: PersonLite | null): Record<string, string> {
  const d: Record<string, string> = {};
  if (!p) return d;
  const has = (k: ServiceIntakeField) => fields.includes(k);
  if (has('clientName')) d.clientName = p.fullName;
  if (has('dob')) d.dob = toIsoDate(p.dob);
  if (has('gender')) d.gender = p.gender === 'other' ? 'male' : p.gender;
  if (has('tob') && p.timeOfBirth) d.tob = p.timeOfBirth;
  if (has('pob') && p.placeOfBirth) d.pob = p.placeOfBirth;
  if (p.country) d.country = p.country;
  if (has('mobile') && p.mobile) d.mobile = p.mobile;
  if (has('currentName') && !CURRENT_NAME_IS_NOT_PERSON.includes(code)) d.currentName = code === 'SVC_SIGNATURE' ? (p.signedName || p.fullName) : p.fullName;
  const pt = partner ? { name: partner.fullName, dob: partner.dob } : p.partner ? { name: p.partner.name, dob: p.partner.dob } : null;
  if (pt && has('partnerName')) d.partnerName = pt.name;
  if (pt && has('partnerDob')) d.partnerDob = toIsoDate(pt.dob);
  return d;
}

/**
 * The person to save from the booking details. Returns null when the details have no name and no date of birth.
 * `nameHint` is used when the reading has no name box (e.g. a baby not named yet).
 */
export function intakeToPerson(code: string, d: Record<string, string>, relation: FamilyRelation, base: Partial<PersonLite> = {}, nameHint?: string): PersonLite | null {
  const name = (d.clientName || (!CURRENT_NAME_IS_NOT_PERSON.includes(code) && code !== 'SVC_SIGNATURE' ? d.currentName : '') || nameHint || base.fullName || '').trim();
  const dob = (d.dob || toIsoDate(base.dob)).trim();
  if (!name || !/[A-Za-z]/.test(name) || !dob) return null;
  const g = (d.gender || base.gender || 'male') as PersonLite['gender'];
  const out: PersonLite = { ...base, relation, fullName: name, gender: g, dob };
  if (d.tob) out.timeOfBirth = d.tob;
  if (d.pob) out.placeOfBirth = d.pob;
  if (d.country) out.country = d.country;
  if (d.mobile) out.mobile = d.mobile; // the number to analyse is usually the person's own
  if (code === 'SVC_SIGNATURE' && d.currentName) out.signedName = d.currentName;
  if (d.partnerName && d.partnerDob && /[A-Za-z]/.test(d.partnerName)) out.partner = { name: d.partnerName.trim(), gender: g === 'male' ? 'female' : 'male', dob: d.partnerDob, ...(base.partner?.mobile ? { mobile: base.partner.mobile } : {}) };
  return out;
}

/** Required boxes still empty for this reading type. */
export function missingIntake(fields: ServiceIntakeField[], d: Record<string, string>): ServiceIntakeField[] {
  return fields.filter((k) => REQUIRED_INTAKE.includes(k) && !(d[k] ?? '').trim());
}

/** Only the boxes this reading type asks for, trimmed, empty ones dropped (what checkout receives). */
export function cleanIntake(fields: ServiceIntakeField[], d: Record<string, string>): Record<string, string> {
  const res = Object.fromEntries(fields.map((k) => [k, (d[k] ?? '').trim()]).filter(([, v]) => v));
  if (d.country && d.country.trim()) res.country = d.country.trim();
  return res;
}
