/**
 * Delivery of purchased services (SVC_… orders) to the client's report area.
 *
 * Plan (owner, 27 Nov 2026; automatic delivery 28 Nov 2026):
 *  - After payment the client sees the order in "My reports" with a live status:
 *      1 Details received → 2 Preparing your report (Acharya Nandram's method) → 3 Final checks → 4 Ready for download
 *  - The numerologist can approve the order (or upload the finished PDF) at any time – it is delivered at once.
 *  - If it is not approved within 3 hours of payment (SERVICE_TURNAROUND_MIN, round the clock) and not on hold, the
 *    system writes the report itself (every service – see lib/server/service-report.ts) and delivers it.
 *  - Every delivered report is downloadable in English and Hindi, and the client gets an SMS + email
 *    (lib/server/service-delivery-run.ts, lib/notify/report-ready.ts).
 * Pure functions here; database access lives in lib/billing/services.ts.
 */
import type { ClientInput } from '@/lib/numerology/schemas';
import { LIFE_CONCERNS } from '@/lib/numerology/schemas';
import type { ReportModule } from '@/lib/numerology';

/** Minutes from payment until the report is ready for download (3 hours, day and night). */
export const SERVICE_TURNAROUND_MIN = 180;
/** Minute at which each of the four steps starts. */
export const SERVICE_STAGE_STARTS = [0, 10, 150, SERVICE_TURNAROUND_MIN] as const;

/** Services the system writes by itself from the booking details: report modules + the title printed on the cover. */
export const AUTO_REPORTS: Record<string, { modules: ReportModule[]; title: { en: string; hi: string }; hiddenChapters?: string[] }> = {
  SVC_PERSONAL_REPORT: { modules: ['complete'], title: { en: 'Complete Life Report', hi: 'संपूर्ण जीवन रिपोर्ट' } },
  SVC_NAME_CORRECTION: { modules: ['dob', 'name'], title: { en: 'Name Correction Report', hi: 'नाम सुधार रिपोर्ट' } },
  SVC_LOSHU: { modules: ['dob'], title: { en: 'Lo Shu Grid Report', hi: 'लो शू ग्रिड रिपोर्ट' } },
  SVC_COUPLE: { modules: ['dob', 'couple'], title: { en: 'Couple Compatibility Report', hi: 'जोड़ी अनुकूलता रिपोर्ट' } },
  SVC_PERSONAL_YEAR: { modules: ['dob'], title: { en: 'Personal Year Report', hi: 'व्यक्तिगत वर्ष रिपोर्ट' } },
};
export const isAutoService = (code: string) => code in AUTO_REPORTS;

export interface DeliveryInput {
  status: string;               // awaiting_payment | paid | in_progress | delivered | cancelled
  paidAt: Date | string | null;
  deliveredAt?: Date | string | null;
  onHold?: boolean;
  hasFile: boolean;             // a finished PDF is stored on the order (uploaded or already generated)
  auto: boolean;                // the system can generate the report
}

export type DeliveryState =
  | { state: 'awaiting_payment' }
  | { state: 'cancelled' }
  | { state: 'preparing'; stage: 1 | 2 | 3; paidAt: string; readyAt: string; progress: number; onHold: boolean; overdue: boolean }
  | { state: 'ready'; stage: 4; paidAt: string; readyAt: string; progress: 100; download: boolean };

const iso = (d: Date | string) => (typeof d === 'string' ? new Date(d) : d).toISOString();

export function deliveryState(o: DeliveryInput, now = new Date()): DeliveryState {
  if (o.status === 'cancelled') return { state: 'cancelled' };
  if (o.status === 'awaiting_payment' || !o.paidAt) return { state: 'awaiting_payment' };
  const paid = new Date(o.paidAt);
  const due = new Date(paid.getTime() + SERVICE_TURNAROUND_MIN * 60_000);
  const delivered = o.status === 'delivered';
  if (delivered || o.hasFile || (o.auto && !o.onHold && now >= due)) {
    const at = delivered && o.deliveredAt ? new Date(o.deliveredAt) : now < due ? now : due;
    return { state: 'ready', stage: 4, paidAt: paid.toISOString(), readyAt: iso(at < due ? at : due), progress: 100, download: o.auto || o.hasFile };
  }
  const mins = Math.max(0, (now.getTime() - paid.getTime()) / 60_000);
  const stage = (mins >= SERVICE_STAGE_STARTS[2] || o.onHold ? 3 : mins >= SERVICE_STAGE_STARTS[1] ? 2 : 1) as 1 | 2 | 3;
  const progress = Math.min(97, Math.max(3, Math.round((mins / SERVICE_TURNAROUND_MIN) * 100)));
  return { state: 'preparing', stage, paidAt: paid.toISOString(), readyAt: due.toISOString(), progress, onHold: !!o.onHold, overdue: now >= due };
}

const MARITAL: Record<string, ClientInput['maritalStatus']> = { single: 'single', unmarried: 'single', married: 'married', engaged: 'engaged', relationship: 'engaged', divorced: 'divorced', widowed: 'widowed' };

/**
 * Booking details → the report engine's client input. Returns null when the order lacks a usable name and
 * date of birth (then the report cannot be written automatically and the client is asked to complete the details).
 */
export function intakeToClientInput(code: string, d: Record<string, string | undefined>, account: { email?: string | null } = {}): ClientInput | null {
  const name = (d.clientName || (code !== 'SVC_BUSINESS_NAME' ? d.currentName : '') || '').trim();
  const dob = (d.dob || '').trim();
  if (!name || !/[A-Za-z]/.test(name) || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const gender = d.gender === 'female' ? 'female' : d.gender === 'other' ? 'other' : 'male';
  const lang = d.language === 'hi' || d.language === 'hinglish' ? d.language : 'en';
  const concerns = (d.concerns ?? '').split(',').map((s) => s.trim()).filter((c): c is (typeof LIFE_CONCERNS)[number] => (LIFE_CONCERNS as readonly string[]).includes(c));
  const email = (d.email || account.email || '').trim();
  const input: ClientInput = {
    fullName: name, gender, dob, language: lang, concerns, aadhaarConsent: false,
    ...(d.currentName && d.clientName && d.currentName.trim() !== d.clientName.trim() && /[A-Za-z]/.test(d.currentName) && code !== 'SVC_BUSINESS_NAME' ? { commonName: d.currentName.trim() } : {}),
    ...(d.tob && /^([01]\d|2[0-3]):[0-5]\d$/.test(d.tob) ? { timeOfBirth: d.tob } : {}),
    ...(d.pob ? { placeOfBirth: d.pob } : {}),
    ...(d.maritalStatus && MARITAL[d.maritalStatus.toLowerCase()] ? { maritalStatus: MARITAL[d.maritalStatus.toLowerCase()] } : {}),
    ...(d.profession ? { profession: d.profession } : {}),
    ...(d.education ? { education: d.education } : {}),
    ...(d.city ? { city: d.city } : {}),
    ...(d.state ? { state: d.state } : {}),
    ...(d.country ? { country: d.country } : {}),
    ...(d.mobile && d.mobile.replace(/\D/g, '').length >= 10 ? { mobile: d.mobile } : {}),
    ...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email } : {}),
  };
  if (d.partnerName && /[A-Za-z]/.test(d.partnerName) && d.partnerDob && /^\d{4}-\d{2}-\d{2}$/.test(d.partnerDob)) {
    input.partner = { name: d.partnerName.trim(), gender: gender === 'female' ? 'male' : 'female', dob: d.partnerDob };
  }
  return input;
}

/** Modules for an auto service, dropping a couple chapter when no partner was given. */
export function autoModules(code: string, input: ClientInput): ReportModule[] {
  const a = AUTO_REPORTS[code];
  if (!a) return ['complete'];
  return a.modules.filter((m) => m !== 'couple' || !!input.partner).length ? a.modules.filter((m) => m !== 'couple' || !!input.partner) : ['dob'];
}

type Details = Record<string, string | undefined>;
const bizNames = (text: string) => text.split(/\n|,|;/).map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s)).slice(0, 5);

/** Report title per service (shown on the cover / file name / notifications). */
export const SERVICE_REPORT_TITLES: Record<string, { en: string; hi: string }> = {
  ...Object.fromEntries(Object.entries(AUTO_REPORTS).map(([k, v]) => [k, v.title])),
  SVC_MOBILE_NUMBER: { en: 'Lucky Mobile Number Report', hi: 'शुभ मोबाइल नंबर रिपोर्ट' },
  SVC_BABY_NAME: { en: 'Baby Name Numerology Report', hi: 'शिशु नाम अंक ज्योतिष रिपोर्ट' },
  SVC_DESTINY_MATRIX: { en: 'Destiny Matrix Analysis', hi: 'डेस्टिनी मैट्रिक्स विश्लेषण' },
  SVC_BIRTH_CHART: { en: 'Pythagorean Birth Chart Analysis', hi: 'पाइथागोरस जन्म चार्ट विश्लेषण' },
  SVC_BUSINESS_NAME: { en: 'Business Name Numerology Report', hi: 'व्यवसाय नाम अंक ज्योतिष रिपोर्ट' },
  SVC_BUSINESS_COMPLETE: { en: 'Complete Business Numerology Report', hi: 'संपूर्ण व्यवसाय अंक ज्योतिष रिपोर्ट' },
  SVC_BUSINESS_COMPAT: { en: 'Business Compatibility Report', hi: 'व्यवसाय अनुकूलता रिपोर्ट' },
  SVC_SIGNATURE: { en: 'Signature Analysis Report', hi: 'हस्ताक्षर विश्लेषण रिपोर्ट' },
};
export const reportTitle = (code: string, lang: 'en' | 'hi') => SERVICE_REPORT_TITLES[code]?.[lang] ?? (lang === 'hi' ? 'अंक ज्योतिष रिपोर्ट' : 'Numerology Report');

/** YYYY-MM-DD from YYYY-MM-DD or DD-MM-YYYY, else ''. */
export const isoDob = (s?: string) => {
  const v = (s ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = /^(\d{2})[-/.](\d{2})[-/.](\d{4})$/.exec(v);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};
const latin = (s?: string) => !!s && /[A-Za-z]/.test(s);
const personName = (d: Details) => (d.clientName || d.currentName || '').trim();

/**
 * Whether the system can write this order's report from the booking details. When false the order waits for the
 * numerologist (and the client is asked to complete the details), so nothing incomplete is ever delivered.
 */
export function canAutoGenerate(code: string, d: Details, opts: { hasSignatureImage?: boolean } = {}): boolean {
  const dob = isoDob(d.dob);
  if (code in AUTO_REPORTS) return !!intakeToClientInput(code, d);
  switch (code) {
    case 'SVC_MOBILE_NUMBER': return latin(personName(d)) && !!dob && mobilesIn(d).length > 0;
    case 'SVC_BABY_NAME': return !!dob;
    case 'SVC_DESTINY_MATRIX': case 'SVC_BIRTH_CHART': return personName(d).length >= 2 && !!dob;
    case 'SVC_BUSINESS_NAME': return latin(d.clientName) && !!dob && bizNames(d.businessName || d.currentName || '').length > 0;
    case 'SVC_BUSINESS_COMPLETE': return latin(d.clientName) && !!dob && bizNames(d.businessName || d.currentName || '').length > 0;
    case 'SVC_BUSINESS_COMPAT': return latin(d.clientName) && !!dob;
    case 'SVC_SIGNATURE': return latin(d.clientName) && !!dob && !!opts.hasSignatureImage;
    default: return false;
  }
}

/** The mobile number in the order plus any other 10-digit numbers written in the questions (first = current number). */
export function mobilesIn(d: Details): string[] {
  const found = [d.mobile ?? '', ...((d.questions ?? '').match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g) ?? [])].map((x) => x.trim()).filter((x) => x.replace(/\D/g, '').length >= 10);
  return [...new Set(found)];
}

