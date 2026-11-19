import { z } from 'zod';
import { withAdmin } from '@/lib/server/admin';
import { pdfResponse, readJson, slug } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { AnalysisSchema } from '@/lib/signature/agent';
import { renderSignatureReportPdf, type SignatureReportData } from '@/lib/signature/report';
import type { SignatureNumbers } from '@/lib/signature/numbers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DataImage = z.string().max(1_600_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/);
const Body = z.object({
  client: z.object({ fullName: z.string().trim().min(1).max(120), signatureName: z.string().max(120).optional(), dob: z.string().max(10), gender: z.string().max(10).optional(),
    profession: z.string().max(200), goals: z.array(z.string().max(60)).max(10), language: z.enum(['en', 'hi', 'hinglish']) }),
  preparedBy: z.string().trim().max(80).default('Acharya Nandram'),
  theme: z.enum(['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white']).optional(),
  expertNote: z.string().trim().max(1200).optional(),
  generatedAt: z.string().max(40),
  numbers: z.record(z.string(), z.unknown()),
  result: z.object({
    analysis: AnalysisSchema, source: z.enum(['ai', 'rules']),
    scores: z.object({ graphology: z.number().nullable(), nameVibration: z.number(), firstLetter: z.number(), professionFit: z.number(), consistency: z.number().nullable(), engine: z.number(), ai: z.number().nullable(), overall: z.number() }),
    features: z.array(z.object({ id: z.string(), feature: z.string(), option: z.string(), label: z.string(), impact: z.enum(['positive', 'neutral', 'watch']), meaning: z.string(), fix: z.string().optional(), by: z.enum(['expert', 'measured']), confidence: z.number(), value: z.string().optional() })).max(20),
  }),
  annotated: DataImage.optional(),
  samples: z.array(DataImage).max(3).optional(),
});

/** Admin → Signature analysis → "Download PDF". Renders the already-generated analysis; nothing is stored. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`sigpdf:${user.id}`, 30, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req, 4_400_000));
  const data: SignatureReportData = { ...b, numbers: b.numbers as unknown as SignatureNumbers, client: { ...b.client, signatureName: b.client.signatureName } };
  const { pdf } = await renderSignatureReportPdf(data, { theme: b.theme });
  return pdfResponse(pdf, `signature-analysis-${slug(b.client.fullName)}.pdf`);
});
