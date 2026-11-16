import { revalidatePath, revalidateTag } from 'next/cache';
import { TESTIMONIALS_TAG } from '@/lib/testimonials-server';
import { z } from 'zod';
import { getSetting, setSetting } from '@/lib/admin/settings';
import { GSTIN_RE } from '@/lib/billing/gst';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { SERVICE_PAGES } from '@/lib/service-pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({
  seller: await getSetting('seller'),
  themes: await getSetting('themes'),
  prompts: await getSetting('prompts'),
  analytics: await getSetting('analytics'),
  offer: await getSetting('offer'),
  testimonials: await getSetting('testimonials'),
}));

const THEME_IDS = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'] as const;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();
const SVC = ['general', 'SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_LOSHU', 'SVC_MOBILE_NUMBER', 'SVC_BABY_NAME', 'SVC_COUPLE', 'SVC_BUSINESS_NAME', 'SVC_PERSONAL_YEAR', 'SVC_BUSINESS_COMPAT'] as const;
const TestimonialItem = z.object({
  id: z.string().regex(/^[a-z0-9]{1,30}$/), name: z.string().trim().min(2).max(60), gender: z.enum(['male', 'female']), location: z.string().trim().max(60),
  service: z.enum(SVC), quoteEn: z.string().trim().min(10).max(600), quoteHi: z.string().trim().max(600), rating: z.number().int().min(1).max(5).nullable(),
  consent: z.boolean(), active: z.boolean(),
});
const Body = z.discriminatedUnion('key', [
  z.object({ key: z.literal('testimonials'), value: z.object({ enabled: z.boolean(), items: z.array(TestimonialItem).max(100) }) }),
  z.object({ key: z.literal('seller'), value: z.object({ legalName: z.string().max(160), gstin: z.string().refine((g) => g === '' || GSTIN_RE.test(g), 'Invalid GSTIN'), address: z.string().max(300), state: z.string().max(60), stateCode: z.string().regex(/^\d{2}$/), sac: z.string().regex(/^\d{6}$/), email: z.string().max(200), phone: z.string().max(30), invoicePrefix: z.string().regex(/^[A-Z0-9-]{1,10}$/) }) }),
  z.object({ key: z.literal('themes'), value: z.object({ defaultTheme: z.enum(THEME_IDS), enabled: z.array(z.enum(THEME_IDS)).min(1), overrides: z.record(z.enum(THEME_IDS), z.object({ primary: hex, accent: hex, border: hex })) }) }),
  z.object({ key: z.literal('prompts'), value: z.object({ extraStyleRules: z.string().max(4000), sectionBriefs: z.record(z.string().max(30), z.string().max(1000)) }) }),
  z.object({
    key: z.literal('analytics'),
    value: z.object({
      measurementId: z.string().max(50),
      gtmId: z.string().max(50),
      enabled: z.boolean(),
      trackPageViews: z.boolean(),
      trackReadings: z.boolean(),
      trackCheckouts: z.boolean(),
      trackPdfDownloads: z.boolean(),
      trackServices: z.boolean(),
    }),
  }),
  z.object({
    key: z.literal('offer'),
    value: z.object({
      enabled: z.boolean(),
      endsAt: z.string().max(40).refine((v) => v === '' || !Number.isNaN(new Date(v).getTime()), 'Invalid date'),
      labelEn: z.string().trim().max(60),
      labelHi: z.string().trim().max(60),
    }),
  }),
]);

export const PUT = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req));
  if (b.key === 'themes' && !b.value.enabled.includes(b.value.defaultTheme)) return json({ error: 'VALIDATION', issues: [{ path: 'defaultTheme', message: 'The default theme must be enabled.' }] }, 422);
  if (b.key === 'offer' && b.value.enabled && !(new Date(b.value.endsAt).getTime() > Date.now())) return json({ error: 'VALIDATION', issues: [{ path: 'endsAt', message: 'Set an end date in the future to switch the offer on.' }] }, 422);
  await setSetting(b.key, b.value as never);
  if (b.key === 'testimonials') { revalidateTag(TESTIMONIALS_TAG); revalidatePath('/', 'layout'); }
  if (b.key === 'offer') { revalidatePath('/services'); for (const p of SERVICE_PAGES) revalidatePath(`/${p.slug}`); }
  return json({ ok: true });
});
