/**
 * Leads from the services funnel ("free mini-reading" / "unlock the sample report").
 * Stored in marketing_leads (migration 0003) with an explicit WhatsApp consent row in marketing_consents.
 */
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';
import { marketingConsents, marketingLeads } from '@/lib/db/schema';
import { normaliseContactPhone } from '@/lib/contact';
import { bhagyank, moolank, parseDate, todayIST, toIso } from '@/lib/numerology';

export const LEAD_SOURCE = 'services-funnel';
export const CONSENT_TEXT = {
  en: 'I agree that Acharya Nandram / myNumerologist.com may contact me on WhatsApp or phone about my reading and services. I can opt out any time by replying STOP.',
  hi: 'मैं सहमत हूँ कि आचार्य नंदराम / myNumerologist.com मेरी रीडिंग और सेवाओं के बारे में मुझसे WhatsApp या फ़ोन पर संपर्क कर सकते हैं। मैं कभी भी STOP लिखकर मना कर सकता/सकती हूँ।',
};

const utm = z.string().trim().max(100).optional();
const isoDob = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  try { const d = parseDate(s); return d.year >= 1900 && toIso(d) <= toIso(todayIST()); } catch { return false; }
}, 'DOB_INVALID');

export const LeadInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  dob: z.string().trim().optional().or(z.literal('')).refine((s) => {
    if (!s) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    try { const d = parseDate(s); return d.year >= 1900 && toIso(d) <= toIso(todayIST()); } catch { return false; }
  }, 'DOB_INVALID'),
  service: z.string().trim().max(40).regex(/^(SVC_[A-Z0-9_]+)?$/).optional(),
  magnet: z.enum(['mini-reading', 'sample-report', 'free-ebook']).default('mini-reading'),
  language: z.enum(['en', 'hi']).default('en'),
  consent: z.literal(true),
  page: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: utm, utmMedium: utm, utmCampaign: z.string().trim().max(150).optional(), utmTerm: utm, utmContent: utm,
  website: z.string().max(0).optional(), // honeypot
}).superRefine((v, ctx) => {
  if (!normaliseContactPhone(v.phone)) ctx.addIssue({ code: 'custom', path: ['phone'], message: 'PHONE_INVALID' });
  if (v.magnet !== 'free-ebook' && !v.dob) ctx.addIssue({ code: 'custom', path: ['dob'], message: 'DOB_INVALID' });
});
export type LeadInput = z.infer<typeof LeadInput>;

/** The instant result shown to the visitor. */
export function miniReading(dobIso: string) {
  const d = parseDate(dobIso);
  return { moolank: moolank(d.day).value, bhagyank: bhagyank(d).value };
}

export async function createLead(input: LeadInput, meta: { ip?: string | null; userAgent?: string | null; userId?: string | null } = {}, db: Db = getDb()) {
  const phone = normaliseContactPhone(input.phone)!;
  const hasValidDob = Boolean(input.dob && /^\d{4}-\d{2}-\d{2}$/.test(input.dob));
  const r = hasValidDob ? miniReading(input.dob!) : { moolank: null, bhagyank: null };
  const leadMagnet = input.magnet === 'free-ebook' ? 'free-ebook:numerology-made-easy' : input.magnet === 'sample-report' ? `sample-report:${input.service || 'all'}` : 'mini-reading';
  const utmSet = { utmSource: input.utmSource || null, utmMedium: input.utmMedium || null, utmCampaign: input.utmCampaign || null, utmTerm: input.utmTerm || null, utmContent: input.utmContent || null };
  const id = await db.transaction(async (tx) => {
    // One lead per phone (the CRM table has a unique phone index): a returning visitor updates their row.
    const [existing] = await tx.select({ id: marketingLeads.id }).from(marketingLeads).where(eq(marketingLeads.phone, phone)).limit(1);
    let leadId: string;
    if (existing) {
      leadId = existing.id;
      await tx.update(marketingLeads).set({
        fullName: input.name, dob: input.dob || null, language: input.language, moolank: r.moolank, bhagyank: r.bhagyank, leadMagnet,
        ...(input.service ? { primaryConcern: input.service } : {}), ...(input.utmSource ? utmSet : {}), ...(meta.userId ? { userId: meta.userId } : {}), updatedAt: new Date(),
      }).where(eq(marketingLeads.id, leadId));
    } else {
      const [row] = await tx.insert(marketingLeads).values({
        userId: meta.userId ?? null, fullName: input.name, phone, dob: input.dob || null, language: input.language,
        moolank: r.moolank, bhagyank: r.bhagyank, primaryConcern: input.service || null, leadSource: LEAD_SOURCE, leadMagnet, ...utmSet,
        referrerUrl: input.referrer?.slice(0, 500) || null, ipAddress: meta.ip?.slice(0, 64) ?? null, userAgent: meta.userAgent?.slice(0, 400) ?? null,
        metadata: { page: input.page?.slice(0, 200) ?? null },
      }).returning({ id: marketingLeads.id });
      leadId = row.id;
    }
    await tx.insert(marketingConsents).values({ leadId, channel: 'whatsapp', purpose: 'numerology-services', consentText: CONSENT_TEXT[input.language], ipAddress: meta.ip?.slice(0, 64) ?? null, userAgent: meta.userAgent?.slice(0, 400) ?? null });
    return leadId;
  });
  return { id, ...r, downloadUrl: '/ebooks/numerology-made-easy-guide.pdf' };
}

export async function listLeads(opts: { limit?: number } = {}, db: Db = getDb()) {
  return db.select({ id: marketingLeads.id, createdAt: marketingLeads.updatedAt, name: marketingLeads.fullName, phone: marketingLeads.phone, dob: sql<string | null>`${marketingLeads.dob}::text`,
    moolank: marketingLeads.moolank, bhagyank: marketingLeads.bhagyank, service: marketingLeads.primaryConcern, magnet: marketingLeads.leadMagnet, language: marketingLeads.language,
    source: marketingLeads.leadSource, utmSource: marketingLeads.utmSource, utmMedium: marketingLeads.utmMedium, utmCampaign: marketingLeads.utmCampaign, stage: marketingLeads.lifecycleStage })
    .from(marketingLeads).orderBy(desc(marketingLeads.updatedAt)).limit(Math.min(opts.limit ?? 500, 5000));
}

type LeadRow = Awaited<ReturnType<typeof listLeads>>[number];
/** CSV safe for Excel: quoted cells, and formula-looking values are prefixed so they are not executed. */
export function leadsCsv(rows: LeadRow[]) {
  const cell = (v: unknown) => { let s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v); if (/^[=+\-@]/.test(s) && !/^\+\d/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const cols: (keyof LeadRow)[] = ['createdAt', 'name', 'phone', 'dob', 'moolank', 'bhagyank', 'service', 'magnet', 'language', 'source', 'utmSource', 'utmMedium', 'utmCampaign', 'stage'];
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
}
