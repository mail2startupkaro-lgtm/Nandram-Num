import { z } from 'zod';
import { getSetting, setSetting } from '@/lib/admin/settings';
import { GSTIN_RE } from '@/lib/billing/gst';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => json({
  seller: await getSetting('seller'),
  themes: await getSetting('themes'),
  prompts: await getSetting('prompts'),
  analytics: await getSetting('analytics'),
}));

const THEME_IDS = ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'] as const;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();
const Body = z.discriminatedUnion('key', [
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
]);

export const PUT = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req));
  if (b.key === 'themes' && !b.value.enabled.includes(b.value.defaultTheme)) return json({ error: 'VALIDATION', issues: [{ path: 'defaultTheme', message: 'The default theme must be enabled.' }] }, 422);
  await setSetting(b.key, b.value as never);
  return json({ ok: true });
});
