import { isValidDate, normalizeIndianMobile, parseDate, verhoeffValid, type ClientInput } from '@/lib/numerology';
import type { Dict } from '@/lib/i18n/dictionary';

export interface WizardState {
  fullName: string; commonName: string; hindiName: string;
  gender: '' | 'male' | 'female' | 'other'; kuaBasis: '' | 'male' | 'female';
  dob: string; timeOfBirth: string; placeOfBirth: string;
  maritalStatus: '' | 'single' | 'married' | 'engaged' | 'divorced' | 'widowed';
  profession: string; education: string; city: string; state: string;
  concerns: string[]; language: 'en' | 'hi' | 'hinglish';
  mobile: string; aadhaar: string; aadhaarConsent: boolean;
  addPartner: boolean; partnerName: string; partnerGender: '' | 'male' | 'female' | 'other'; partnerDob: string; partnerMobile: string;
}

export const EMPTY: WizardState = {
  fullName: '', commonName: '', hindiName: '', gender: '', kuaBasis: '', dob: '', timeOfBirth: '', placeOfBirth: '',
  maritalStatus: '', profession: '', education: '', city: '', state: '', concerns: [], language: 'en',
  mobile: '', aadhaar: '', aadhaarConsent: false,
  addPartner: false, partnerName: '', partnerGender: '', partnerDob: '', partnerMobile: '',
};

export const SAMPLE: WizardState = {
  ...EMPTY, fullName: 'Rahul Kumar Sharma', commonName: 'Rahul Sharma', hindiName: 'राहुल शर्मा', gender: 'male', dob: '1990-08-28',
  placeOfBirth: 'Jaipur', maritalStatus: 'engaged', profession: 'Software engineer', education: 'B.Tech', city: 'Jaipur', state: 'Rajasthan',
  concerns: ['career', 'marriage', 'money'], language: 'hinglish', mobile: '9876543210',
  addPartner: true, partnerName: 'Priya Verma', partnerGender: 'female', partnerDob: '1992-05-15',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const validDob = (s: string) => { try { return isValidDate(parseDate(s)) && s <= new Date().toISOString().slice(0, 10); } catch { return false; } };
const validMobile = (s: string) => { try { normalizeIndianMobile(s); return true; } catch { return false; } };
const letters = (s: string) => s.replace(/[^A-Za-z]/g, '').length;

export type Errors = Partial<Record<keyof WizardState, string>>;

export function validateStep(step: number, s: WizardState, t: Dict): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (letters(s.fullName) < 2) e.fullName = t.err.name;
    if (s.commonName && letters(s.commonName) < 2) e.commonName = t.err.name;
    if (!s.gender) e.gender = t.err.required;
    if (!validDob(s.dob)) e.dob = t.err.dob;
  }
  if (step === 2) {
    if (s.mobile && !validMobile(s.mobile)) e.mobile = t.err.mobile;
    const a = s.aadhaar.replace(/\D/g, '');
    if (s.aadhaar && (!/^[2-9]\d{11}$/.test(a) || !verhoeffValid(a))) e.aadhaar = t.err.aadhaar;
    if (s.aadhaar && !s.aadhaarConsent) e.aadhaarConsent = t.err.consent;
  }
  if (step === 3 && s.addPartner) {
    if (letters(s.partnerName) < 2) e.partnerName = t.err.name;
    if (!s.partnerGender) e.partnerGender = t.err.required;
    if (!validDob(s.partnerDob)) e.partnerDob = t.err.dob;
    if (s.partnerMobile && !validMobile(s.partnerMobile)) e.partnerMobile = t.err.mobile;
  }
  return e;
}

const opt = (s: string) => (s.trim() ? s.trim() : undefined);

export function toClientInput(s: WizardState): ClientInput {
  return {
    fullName: s.fullName.trim(), commonName: opt(s.commonName), hindiName: opt(s.hindiName),
    gender: s.gender as ClientInput['gender'], kuaBasis: s.gender === 'other' && s.kuaBasis ? s.kuaBasis : undefined,
    dob: s.dob, timeOfBirth: opt(s.timeOfBirth), placeOfBirth: opt(s.placeOfBirth),
    maritalStatus: s.maritalStatus || undefined, profession: opt(s.profession), education: opt(s.education), city: opt(s.city), state: opt(s.state),
    mobile: opt(s.mobile), aadhaar: opt(s.aadhaar), aadhaarConsent: s.aadhaarConsent,
    concerns: s.concerns as ClientInput['concerns'], language: s.language,
    partner: s.addPartner ? { name: s.partnerName.trim(), gender: s.partnerGender as 'male', dob: s.partnerDob, mobile: opt(s.partnerMobile) } : undefined,
  };
}

/** Restore wizard fields from an exported result's `client` block (Aadhaar is never in exports). */
export function fromClient(c: Partial<ClientInput> & { partner?: ClientInput['partner'] }): WizardState {
  const iso = (d?: string) => { if (!d) return ''; try { const p = parseDate(d); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; } catch { return ''; } };
  return {
    ...EMPTY,
    fullName: c.fullName ?? '', commonName: c.commonName ?? '', hindiName: c.hindiName ?? '', gender: c.gender ?? '', kuaBasis: c.kuaBasis ?? '',
    dob: iso(c.dob), timeOfBirth: c.timeOfBirth ?? '', placeOfBirth: c.placeOfBirth ?? '', maritalStatus: c.maritalStatus ?? '',
    profession: c.profession ?? '', education: c.education ?? '', city: c.city ?? '', state: c.state ?? '',
    concerns: c.concerns ?? [], language: c.language ?? 'en', mobile: c.mobile ?? '',
    addPartner: !!c.partner, partnerName: c.partner?.name ?? '', partnerGender: c.partner?.gender ?? '', partnerDob: iso(c.partner?.dob), partnerMobile: c.partner?.mobile ?? '',
  };
}

/** Draft safe for browser storage – Aadhaar is stripped. */
export const toDraft = (s: WizardState): WizardState => ({ ...s, aadhaar: '', aadhaarConsent: false });
