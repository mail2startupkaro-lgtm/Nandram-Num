/**
 * Expert services sold on /services (delivered personally by Acharya Nandram, unlike the instant PDF plans).
 * Codes start with "SVC_" and are stored in payments.plan_code, so checkout, invoices and finance reports work unchanged.
 * Seeded draft prices are NOT payable until the owner confirms them in Admin → Services (priceConfirmed).
 */
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';
import { appSettings, payments, serviceOrders, services, type Service, type ServiceIntakeField, type ServiceText } from '@/lib/db/schema';
import { decryptJson, encryptJson } from '@/lib/security/crypto';

export const SERVICE_PREFIX = 'SVC_';
export const isServiceCode = (code: string) => code.startsWith(SERVICE_PREFIX);
export const INTAKE_FIELDS: ServiceIntakeField[] = ['clientName', 'dob', 'gender', 'tob', 'pob', 'mobile', 'currentName', 'parents', 'letters', 'partnerName', 'partnerDob', 'questions'];
export const SERVICE_ORDER_STATUSES = ['awaiting_payment', 'paid', 'in_progress', 'delivered', 'cancelled'] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

const t = (name: string, short: string, includes: string[], delivery: string): ServiceText => ({ name, short, includes, delivery });

export const DEFAULT_SERVICES: (typeof services.$inferInsert)[] = [
  {
    code: 'SVC_PERSONAL_REPORT', sort: 1, featured: true, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'tob', 'pob', 'mobile', 'questions'],
    en: t('Personal Numerology Report by Acharya Nandram', 'Your complete chart read personally by Acharya Nandram, with answers to your own questions and remedies that fit your life.',
      ['Moolank, Bhagyank, Kua and Lo Shu grid analysis', 'Name number and mobile number check', 'Current personal year and the next 3 years', 'Answers to up to 3 questions you send', 'Personal remedies: colours, days, mantra, daan', 'PDF in English, Hindi or Hinglish'], 'Delivered as a PDF within 3–5 working days'),
    hi: t('आचार्य नंदराम द्वारा व्यक्तिगत अंक ज्योतिष रिपोर्ट', 'आपका पूरा चार्ट स्वयं आचार्य नंदराम द्वारा पढ़ा जाता है, आपके अपने प्रश्नों के उत्तर और आपके जीवन के अनुकूल उपायों के साथ।',
      ['मूलांक, भाग्यांक, कुआ और लो शू ग्रिड विश्लेषण', 'नामांक और मोबाइल नंबर की जाँच', 'वर्तमान व्यक्तिगत वर्ष और अगले 3 वर्ष', 'आपके भेजे गए अधिकतम 3 प्रश्नों के उत्तर', 'व्यक्तिगत उपाय: रंग, दिन, मंत्र, दान', 'अंग्रेज़ी, हिंदी या हिंग्लिश में PDF'], '3–5 कार्य-दिवसों में PDF के रूप में'),
  },
  {
    code: 'SVC_NAME_CORRECTION', sort: 2, featured: true, pricePaise: 1_100_00, mrpPaise: 2_100_00, intake: ['currentName', 'dob', 'gender', 'mobile', 'questions'],
    en: t('Name Correction (Lucky Name Spelling)', 'A name spelling that matches your Moolank and Bhagyank, chosen so it still looks and sounds natural.',
      ['Analysis of your current name (Chaldean and Pythagorean)', '3 corrected spellings with their numbers', 'Which spelling to use where: signature, documents, social media', 'Signature guidance'], 'Delivered within 2–3 working days'),
    hi: t('नाम सुधार (शुभ नाम-वर्तनी)', 'ऐसी नाम-वर्तनी जो आपके मूलांक और भाग्यांक से मेल खाए और फिर भी स्वाभाविक दिखे और सुनाई दे।',
      ['आपके वर्तमान नाम का विश्लेषण (कैल्डियन और पाइथागोरियन)', 'अंकों सहित 3 सुधारी हुई वर्तनियाँ', 'कौन-सी वर्तनी कहाँ उपयोग करें: हस्ताक्षर, दस्तावेज़, सोशल मीडिया', 'हस्ताक्षर संबंधी मार्गदर्शन'], '2–3 कार्य-दिवसों में'),
  },
  {
    code: 'SVC_MOBILE_NUMBER', sort: 4, featured: false, pricePaise: 501_00, mrpPaise: 1_001_00, intake: ['clientName', 'dob', 'gender', 'mobile', 'questions'],
    en: t('Lucky Mobile Number Selection', 'Find out whether your mobile number supports you, and get the number patterns that suit your date of birth.',
      ['Full analysis of your current number', 'Your best totals and digit pairs', 'Digits and pairs to avoid', 'Help choosing between numbers you shortlist (up to 5)'], 'Delivered within 1–2 working days'),
    hi: t('शुभ मोबाइल नंबर चयन', 'जानें कि आपका मोबाइल नंबर आपका साथ देता है या नहीं, और अपनी जन्म तिथि के अनुकूल नंबर-पैटर्न पाएँ।',
      ['आपके वर्तमान नंबर का पूरा विश्लेषण', 'आपके सर्वोत्तम योग और अंक-जोड़ियाँ', 'बचने योग्य अंक और जोड़ियाँ', 'आपके चुने हुए अधिकतम 5 नंबरों में से चयन में मदद'], '1–2 कार्य-दिवसों में'),
  },
  {
    code: 'SVC_BABY_NAME', sort: 5, featured: false, pricePaise: 1_100_00, mrpPaise: 2_100_00, intake: ['dob', 'gender', 'tob', 'pob', 'parents', 'letters', 'questions'],
    en: t('Baby Name Numerology', 'Meaningful baby names whose numbers suit your child\'s date of birth, in the starting letters you prefer.',
      ['7 shortlisted names with meanings', 'Name number of each and how it matches the date of birth', 'Spelling advice for documents', 'Lucky colours and numbers for the child'], 'Delivered within 2–3 working days'),
    hi: t('शिशु नाम अंक ज्योतिष', 'अर्थपूर्ण शिशु नाम जिनके अंक आपके बच्चे की जन्म तिथि के अनुकूल हों, आपके पसंदीदा आरंभिक अक्षरों में।',
      ['अर्थ सहित 7 चुने हुए नाम', 'हर नाम का नामांक और जन्म तिथि से उसका मेल', 'दस्तावेज़ों के लिए वर्तनी संबंधी सलाह', 'बच्चे के शुभ रंग और अंक'], '2–3 कार्य-दिवसों में'),
  },
  {
    code: 'SVC_LOSHU', sort: 3, featured: false, pricePaise: 1_100_00, mrpPaise: 2_100_00, intake: ['clientName', 'dob', 'gender', 'questions'],
    en: t('Lo Shu Grid Analysis', 'A detailed reading of your Lo Shu grid: what your repeated and missing numbers mean for you, and exactly how to balance them.',
      ['Your grid with Moolank, Bhagyank and Kua placed', 'Meaning of every repeated and missing number', 'Planes, arrows of strength and weakness, Raj Yog', 'Remedies for each missing number: placement, colour, bracelet, habit', 'Lucky directions from your Kua number'], 'Delivered within 2–3 working days'),
    hi: t('लो शू ग्रिड विश्लेषण', 'आपके लो शू ग्रिड की विस्तृत रीडिंग: आपके दोहराए गए और अनुपस्थित अंकों का अर्थ, और उन्हें संतुलित करने का सटीक तरीक़ा।',
      ['मूलांक, भाग्यांक और कुआ सहित आपका ग्रिड', 'हर दोहराए गए और अनुपस्थित अंक का अर्थ', 'प्लेन, शक्ति और कमज़ोरी के तीर, राज योग', 'हर अनुपस्थित अंक के उपाय: स्थान, रंग, ब्रेसलेट, आदत', 'कुआ अंक से शुभ दिशाएँ'], '2–3 कार्य-दिवसों में'),
  },
  {
    code: 'SVC_COUPLE', sort: 6, featured: false, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'partnerName', 'partnerDob', 'questions'],
    en: t('Couple Compatibility Report', 'How your numbers work together – for marriage, engagement or an existing relationship – with practical guidance for harmony.',
      ['Moolank, Bhagyank and name number harmony of both partners', 'Combined Lo Shu grid: what each partner brings', 'Strengths and likely friction areas', 'Favourable marriage dates and years', 'Remedies for a balanced relationship'], 'Delivered within 3–4 working days'),
    hi: t('जोड़ी अनुकूलता रिपोर्ट', 'विवाह, सगाई या मौजूदा रिश्ते के लिए – आप दोनों के अंक साथ कैसे काम करते हैं, सामंजस्य के व्यावहारिक मार्गदर्शन के साथ।',
      ['दोनों साथियों के मूलांक, भाग्यांक और नामांक का सामंजस्य', 'संयुक्त लो शू ग्रिड: हर साथी क्या जोड़ता है', 'ख़ूबियाँ और संभावित टकराव के क्षेत्र', 'विवाह की शुभ तिथियाँ और वर्ष', 'संतुलित रिश्ते के लिए उपाय'], '3–4 कार्य-दिवसों में'),
  },
  {
    code: 'SVC_BUSINESS_NAME', sort: 7, featured: false, pricePaise: 2_100_00, mrpPaise: 4_200_00, intake: ['clientName', 'dob', 'gender', 'currentName', 'questions'],
    en: t('Business Name Numerology', 'A business or brand name whose number supports the owner\'s date of birth – checked before you register, print or launch.',
      ['Analysis of your current or proposed names (up to 5)', 'Best spelling options with their numbers', 'Fit with the owner\'s Moolank and Bhagyank', 'Lucky launch dates and business mobile number totals', 'Brand colour suggestions'], 'Delivered within 3–4 working days'),
    hi: t('व्यवसाय नाम अंक ज्योतिष', 'ऐसा व्यवसाय या ब्रांड नाम जिसका अंक मालिक की जन्म तिथि का साथ दे – पंजीकरण, छपाई या लॉन्च से पहले जाँचा हुआ।',
      ['आपके वर्तमान या प्रस्तावित नामों का विश्लेषण (अधिकतम 5)', 'अंकों सहित सर्वोत्तम वर्तनी विकल्प', 'मालिक के मूलांक और भाग्यांक से मेल', 'लॉन्च की शुभ तिथियाँ और व्यवसायिक मोबाइल नंबर के योग', 'ब्रांड रंग के सुझाव'], '3–4 कार्य-दिवसों में'),
  },
  {
    code: 'SVC_PERSONAL_YEAR', sort: 8, featured: false, pricePaise: 1_500_00, mrpPaise: 3_000_00, intake: ['clientName', 'dob', 'gender', 'mobile', 'questions'],
    en: t('Personal Year Consultancy', 'Plan the year ahead with your personal year, month and day numbers – when to start, when to wait and when to act on big decisions.',
      ['Your personal year theme from birthday to birthday', 'Month-by-month guidance for the next 12 months', 'Best dates for important decisions you name', 'Remedies to support the year', 'Personal answers to your questions on call or WhatsApp'], 'Scheduled within 3 working days'),
    hi: t('व्यक्तिगत वर्ष परामर्श', 'अपने व्यक्तिगत वर्ष, माह और दिन के अंकों से आने वाले वर्ष की योजना बनाएँ – कब शुरुआत करें, कब प्रतीक्षा करें और कब बड़े निर्णय लें।',
      ['जन्मदिन से जन्मदिन तक आपके व्यक्तिगत वर्ष का विषय', 'अगले 12 महीनों के लिए माह-दर-माह मार्गदर्शन', 'आपके बताए महत्वपूर्ण निर्णयों के लिए शुभ तिथियाँ', 'वर्ष को सहारा देने वाले उपाय', 'कॉल या WhatsApp पर आपके प्रश्नों के व्यक्तिगत उत्तर'], '3 कार्य-दिवसों के भीतर समय तय'),
  },
];

/**
 * Seeds default services in versioned batches, so services added in a later release appear once,
 * while a service the owner deleted is never re-created.
 */
const SEED_BATCHES: string[][] = [
  ['SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_MOBILE_NUMBER', 'SVC_BABY_NAME'],
  ['SVC_LOSHU', 'SVC_COUPLE', 'SVC_BUSINESS_NAME', 'SVC_PERSONAL_YEAR'],
];
let seeded = false;
export async function ensureServices(db: Db = getDb()) {
  if (seeded) return;
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, 'servicesSeed')).limit(1);
  let done = typeof row?.value === 'number' ? row.value : 0;
  if (!row) { const [any] = await db.select({ code: services.code }).from(services).limit(1); if (any) done = 1; } // databases seeded before batches existed
  for (let b = done; b < SEED_BATCHES.length; b++) {
    const rows = DEFAULT_SERVICES.filter((x) => SEED_BATCHES[b].includes(x.code));
    if (rows.length) await db.insert(services).values(rows).onConflictDoNothing();
  }
  if (done !== SEED_BATCHES.length) await db.insert(appSettings).values({ key: 'servicesSeed', value: SEED_BATCHES.length }).onConflictDoUpdate({ target: appSettings.key, set: { value: SEED_BATCHES.length, updatedAt: new Date() } });
  seeded = true;
}

export async function listServices(opts: { includeInactive?: boolean } = {}, db: Db = getDb()): Promise<Service[]> {
  await ensureServices(db);
  const all = await db.select().from(services).orderBy(asc(services.sort));
  return opts.includeInactive ? all : all.filter((s) => s.active);
}

export async function getService(code: string, db: Db = getDb()): Promise<Service | undefined> {
  await ensureServices(db);
  return (await db.select().from(services).where(eq(services.code, code)).limit(1))[0];
}

/** Payable only when active and the owner has confirmed the price. */
export const isPayable = (s: Service) => s.active && s.priceConfirmed && s.pricePaise >= 100;

/* ---------- admin editing ---------- */
const Text = z.object({ name: z.string().trim().min(3).max(120), short: z.string().trim().max(400), includes: z.array(z.string().trim().min(1).max(200)).max(12), delivery: z.string().trim().max(120) });
export const ServiceSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^SVC_[A-Z0-9_]{2,26}$/, 'Code must start with SVC_ and use A–Z, 0–9 or _'),
  en: Text, hi: Text,
  pricePaise: z.number().int().min(100).max(10_000_000), mrpPaise: z.number().int().min(100).max(10_000_000).nullable().optional(),
  usdCents: z.number().int().min(100).max(10_000_000).nullable().optional(), usdMrpCents: z.number().int().min(100).max(10_000_000).nullable().optional(),
  priceConfirmed: z.boolean(), intake: z.array(z.enum(INTAKE_FIELDS as [ServiceIntakeField, ...ServiceIntakeField[]])).min(1),
  active: z.boolean(), featured: z.boolean(), sort: z.number().int().min(0).max(999),
});
export async function saveService(input: z.infer<typeof ServiceSchema>, db: Db = getDb()) {
  const usdCents = input.usdCents ?? null;
  const row = { ...input, mrpPaise: input.mrpPaise && input.mrpPaise > input.pricePaise ? input.mrpPaise : null, usdCents, usdMrpCents: usdCents && input.usdMrpCents && input.usdMrpCents > usdCents ? input.usdMrpCents : null, updatedAt: new Date() };
  await db.insert(services).values(row).onConflictDoUpdate({ target: services.code, set: row });
}
export async function deleteService(code: string, db: Db = getDb()) {
  const [used] = await db.select({ id: serviceOrders.id }).from(serviceOrders).where(eq(serviceOrders.serviceCode, code)).limit(1);
  if (used) return 'in_use' as const;
  await db.delete(services).where(eq(services.code, code));
  return 'deleted' as const;
}

/* ---------- client details collected at checkout ---------- */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s) && s >= '1900-01-01' && d.getTime() <= Date.now() + 86_400_000; }, 'Enter a valid date of birth');
const FIELD: Record<ServiceIntakeField, z.ZodTypeAny> = {
  clientName: z.string().trim().min(2).max(120), dob: isoDate, gender: z.enum(['male', 'female', 'other']),
  tob: z.string().trim().max(10).optional(), pob: z.string().trim().max(120).optional(), mobile: z.string().trim().max(20).optional(),
  currentName: z.string().trim().min(2).max(300), partnerName: z.string().trim().min(2).max(120), partnerDob: isoDate, parents: z.string().trim().max(200).optional(), letters: z.string().trim().max(60).optional(),
  questions: z.string().trim().max(2000).optional(),
};
const OPTIONAL: ServiceIntakeField[] = ['tob', 'pob', 'mobile', 'parents', 'letters', 'questions'];
export type IntakeDetails = Partial<Record<ServiceIntakeField, string>>;

/** Validates exactly the fields this service asks for; unknown keys are dropped. Aadhaar-like numbers are masked. */
export function parseIntake(svc: Service, raw: unknown): IntakeDetails {
  const shape = Object.fromEntries(svc.intake.map((k) => [k, OPTIONAL.includes(k) ? FIELD[k].optional() : FIELD[k]]));
  const parsed = z.object(shape).parse(raw ?? {}) as IntakeDetails;
  const mask = (s: string) => s.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, (_m, _a, _b, c) => `XXXX-XXXX-${c}`);
  return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, mask(String(v))]));
}

export async function createServiceOrder(paymentId: string, userId: string, serviceCode: string, details: IntakeDetails, db: Db = getDb()) {
  await db.insert(serviceOrders).values({ paymentId, userId, serviceCode, detailsEnc: encryptJson(details) });
}

/** Called inside fulfilPayment's transaction. */
export async function markServiceOrderPaid(paymentId: string, db: Db) {
  await db.update(serviceOrders).set({ status: 'paid', updatedAt: new Date() }).where(and(eq(serviceOrders.paymentId, paymentId), eq(serviceOrders.status, 'awaiting_payment')));
}

export async function listServiceOrders(filter: { status?: string; userId?: string } = {}, db: Db = getDb()) {
  const rows = await db.select({ o: serviceOrders, p: { amountPaise: payments.amountPaise, currency: payments.currency, status: payments.status, invoiceNumber: payments.invoiceNumber, billingName: payments.billingName, paidAt: payments.paidAt } })
    .from(serviceOrders).innerJoin(payments, eq(payments.id, serviceOrders.paymentId))
    .where(and(filter.userId ? eq(serviceOrders.userId, filter.userId) : undefined,
      filter.status && filter.status !== 'all' ? eq(serviceOrders.status, filter.status) : filter.userId ? undefined : inArray(serviceOrders.status, ['paid', 'in_progress', 'delivered', 'cancelled'])))
    .orderBy(desc(serviceOrders.createdAt)).limit(300);
  return rows.map(({ o: { detailsEnc, ...o }, p }) => ({ ...o, payment: p, details: decryptJson<IntakeDetails>(detailsEnc) }));
}

export const ServiceOrderUpdate = z.object({ id: z.string().min(1), status: z.enum(SERVICE_ORDER_STATUSES).optional(), adminNote: z.string().max(2000).nullable().optional() });
export async function updateServiceOrder(u: z.infer<typeof ServiceOrderUpdate>, db: Db = getDb()) {
  const set: Partial<typeof serviceOrders.$inferInsert> = { updatedAt: new Date() };
  if (u.status) { set.status = u.status; if (u.status === 'delivered') set.deliveredAt = new Date(); }
  if (u.adminNote !== undefined) set.adminNote = u.adminNote?.trim() || null;
  const [r] = await db.update(serviceOrders).set(set).where(eq(serviceOrders.id, u.id)).returning({ id: serviceOrders.id });
  return !!r;
}
