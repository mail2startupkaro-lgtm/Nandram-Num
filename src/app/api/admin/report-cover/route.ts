import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { buildCover } from '@/lib/report/cover-server';

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
  return json(await buildCover(b));
});
