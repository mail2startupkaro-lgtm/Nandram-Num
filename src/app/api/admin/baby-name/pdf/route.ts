import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { pdfResponse, readJson, slug } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { analyseBabyName } from '@/lib/baby-name/analysis';
import { renderBabyNamePdf } from '@/lib/baby-name/report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  dob: z.string().trim().min(8).max(10),
  gender: z.enum(['boy', 'girl', 'any', '']).optional(),
  surname: z.string().trim().max(60).optional(),
  timeOfBirth: z.string().trim().max(20).optional(),
  placeOfBirth: z.string().trim().max(80).optional(),
  fatherName: z.string().trim().max(120).optional(),
  motherName: z.string().trim().max(120).optional(),
  letters: z.string().trim().max(80).optional(),
  candidates: z.array(z.string().trim().max(40)).max(12).optional(),
  suggest: z.boolean().default(true),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  language: z.enum(['en', 'hi']).default('en'),
  theme: z.enum(['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white']).optional(),
  preparedBy: z.string().trim().max(80).default('Acharya Nandram'),
  familyName: z.string().trim().max(60).optional(),
  expertNote: z.string().trim().max(1200).optional(),
});

/** Admin → Baby name analysis → "Download PDF". Re-runs the engine on the server; nothing is stored. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`babyname:${user.id}`, 40, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req, 50_000));
  const result = analyseBabyName(b);
  const { pdf } = await renderBabyNamePdf(result, { lang: b.language, preparedBy: b.preparedBy, familyName: b.familyName || undefined, expertNote: b.expertNote || undefined, theme: b.theme });
  return pdfResponse(pdf, `baby-name-report-${slug(b.surname || result.top[0].first)}.pdf`);
});
