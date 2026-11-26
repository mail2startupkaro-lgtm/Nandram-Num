import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { pdfResponse, readJson, slug } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { analyseMobileAdvanced } from '@/lib/mobile-advanced/analysis';
import { renderMobileAdvancedPdf } from '@/lib/mobile-advanced/report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  fullName: z.string().trim().min(1).max(120),
  dob: z.string().trim().min(8).max(10),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  mobile: z.string().trim().min(10).max(20),
  alternates: z.array(z.string().trim().max(20)).max(6).optional(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  language: z.enum(['en', 'hi']).default('en'),
  theme: z.enum(['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white']).optional(),
  preparedBy: z.string().trim().max(80).default('Acharya Nandram'),
  showFullNumber: z.boolean().default(true),
  expertNote: z.string().trim().max(1200).optional(),
});

/** Admin → Advanced mobile number analysis → "Download PDF". Re-runs the engine on the server; nothing is stored. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`mobadv:${user.id}`, 40, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req, 50_000));
  const result = analyseMobileAdvanced(b);
  const { pdf } = await renderMobileAdvancedPdf(result, { lang: b.language, preparedBy: b.preparedBy, showFullNumber: b.showFullNumber, expertNote: b.expertNote || undefined, theme: b.theme });
  return pdfResponse(pdf, `mobile-number-analysis-${slug(b.fullName)}.pdf`);
});
