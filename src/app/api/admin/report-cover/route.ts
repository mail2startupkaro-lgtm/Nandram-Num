import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { coverCss, coverInner } from '@/lib/pdf/cover';
import { fontFaceCss } from '@/lib/pdf/fonts';
import { DEFAULT_BRANDING, resolveTheme, type Branding } from '@/lib/pdf/themes';
import { printExtras } from '@/lib/report/guide-cta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  title: z.string().trim().min(2).max(80), subtitle: z.string().trim().max(120).optional(),
  clientName: z.string().trim().min(1).max(120), preparedBy: z.string().trim().max(80).optional(),
  facts: z.array(z.tuple([z.string().max(40), z.string().max(120)])).max(4).default([]),
  lang: z.enum(['en', 'hi']).default('en'),
  theme: z.enum(['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white']).default('royal-gold-maroon'),
  /** Also return the Report Reading Guide + "About / all services" CTA for this kind of report. */
  extras: z.enum(['personal', 'mobile', 'signature', 'baby', 'business', 'compat', 'destiny', 'psychomatrix', 'celebrity', 'name']).optional(),
});

/**
 * Admin report generators that print in the browser (e.g. Business compatibility) fetch their full-page cover here,
 * so every customised report starts with the same branded cover as the PDF reports.
 */
export const POST = withAdmin(async (req) => {
  const b = Body.parse(await readJson(req, 20_000));
  const branding = DEFAULT_BRANDING as Branding;
  const theme = resolveTheme(b.theme, branding);
  const extras = b.extras ? await printExtras(b.lang, b.extras, theme, b.preparedBy) : undefined;
  return json({ css: `${fontFaceCss()}${coverCss(theme)}`, html: coverInner({ ...b, theme, branding }), extras });
});
