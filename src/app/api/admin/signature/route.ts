import { z } from 'zod';
import { parseDate } from '@/lib/numerology';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { runSignatureAgent, type SigImage, type SigView } from '@/lib/signature/agent';
import { FEATURES, PROFESSIONS } from '@/lib/signature/catalogue';
import type { MeasuredFeatures } from '@/lib/signature/measure';
import { signatureNumbers } from '@/lib/signature/numbers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_IMAGE_B64 = 1_500_000; // the browser downsizes each sample (~1200 px JPEG) before upload
const DataImage = z.string().max(MAX_IMAGE_B64 + 40).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Image must be PNG, JPG or WEBP');
const ViewImage = z.string().max(450_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Image must be PNG, JPG or WEBP');
const Measured = z.record(z.string().max(20), z.object({ option: z.string().max(20), value: z.string().max(200), valueHi: z.string().max(240).optional(), confidence: z.number().min(0).max(1) }));
const Body = z.object({
  fullName: z.string().trim().min(2).max(120).regex(/[A-Za-z]/, 'Name must contain Latin letters'),
  signatureName: z.string().trim().max(120).optional(),
  dob: z.string().trim().min(8).max(10),
  gender: z.enum(['male', 'female', 'other']).optional(),
  professionId: z.enum(PROFESSIONS.map((p) => p.id) as [string, ...string[]]),
  professionText: z.string().trim().max(120).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  goals: z.array(z.string().trim().max(60)).max(10).default([]),
  concerns: z.string().trim().max(1000).optional(),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  hand: z.enum(['right', 'left']).optional(),
  image: DataImage.optional(),
  images: z.array(DataImage).max(3).optional(),
  measured: Measured.optional(),
  /** Close-up views made in the browser (cleaned copy, first letter, ending) – checked by the AI inspector. */
  views: z.array(z.object({ sample: z.number().int().min(0).max(2), kind: z.enum(['clean', 'first', 'end']), image: ViewImage })).max(6).optional(),
  quality: z.array(z.number().int().min(0).max(100)).max(3).optional(),
  consistency: z.number().int().min(0).max(100).nullable().optional(),
  observations: z.record(z.string(), z.string()).default({}),
});

const validOption = (f: string, o: string) => FEATURES.some((x) => x.id === f && x.options.some((y) => y.id === o));
const toImage = (d: string): SigImage | null => { const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(d); return m ? { mediaType: m[1] as SigImage['mediaType'], base64: m[2] } : null; };

/** Admin-only AI signature analysis. Nothing is saved: images go only to the configured AI provider. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`sig:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req, 4_400_000));
  const dob = parseDate(b.dob);
  const observations = Object.fromEntries(Object.entries(b.observations).filter(([f, o]) => validOption(f, o)));
  const measured: MeasuredFeatures = Object.fromEntries(Object.entries(b.measured ?? {}).filter(([f, m]) => validOption(f, m.option)));
  const prof = PROFESSIONS.find((p) => p.id === b.professionId)!;
  const numbers = signatureNumbers({ fullName: b.fullName, signatureName: b.signatureName, dob, professionId: b.professionId, professionText: b.professionText });
  const images = [...(b.images ?? []), ...(b.image ? [b.image] : [])].slice(0, 3).map(toImage).filter((x): x is SigImage => !!x);
  const views: SigView[] = (b.views ?? []).filter((v) => v.sample < images.length).map((v) => ({ sample: v.sample, kind: v.kind, image: toImage(v.image) })).filter((v): v is SigView => !!v.image);
  const result = await runSignatureAgent({
    fullName: b.fullName, signatureName: b.signatureName, dobText: b.dob, gender: b.gender,
    profession: prof.id === 'other' ? b.professionText || 'Other' : `${prof.label}${b.professionText ? ` – ${b.professionText}` : ''}`,
    experienceYears: b.experienceYears, goals: b.goals, concerns: b.concerns, language: b.language, hand: b.hand,
    images, views, quality: b.quality, observations, measured, consistency: b.consistency ?? null,
  }, numbers);
  return json({ numbers, ...result, generatedAt: new Date().toISOString() });
});
