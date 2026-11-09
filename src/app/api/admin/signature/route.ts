import { z } from 'zod';
import { parseDate } from '@/lib/numerology';
import { withAdmin } from '@/lib/server/admin';
import { json, readJson } from '@/lib/server/http';
import { rateLimit, tooMany } from '@/lib/server/rate-limit';
import { runSignatureAgent } from '@/lib/signature/agent';
import { FEATURES, PROFESSIONS } from '@/lib/signature/catalogue';
import { signatureNumbers } from '@/lib/signature/numbers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_IMAGE_B64 = 4_000_000; // ~3 MB image (the browser downsizes before upload)
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
  image: z.string().max(MAX_IMAGE_B64 + 40).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Image must be PNG, JPG or WEBP').optional(),
  observations: z.record(z.string(), z.string()).default({}),
});

/** Admin-only AI signature analysis. Nothing is saved: the image goes only to the configured AI provider. */
export const POST = withAdmin(async (req, user) => {
  const rl = rateLimit(`sig:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const b = Body.parse(await readJson(req, 6_000_000));
  const dob = parseDate(b.dob);
  const observations = Object.fromEntries(Object.entries(b.observations).filter(([f, o]) => FEATURES.some((x) => x.id === f && x.options.some((y) => y.id === o))));
  const prof = PROFESSIONS.find((p) => p.id === b.professionId)!;
  const numbers = signatureNumbers({ fullName: b.fullName, signatureName: b.signatureName, dob, professionId: b.professionId, professionText: b.professionText });
  const m = b.image ? /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(b.image) : null;
  const result = await runSignatureAgent({
    fullName: b.fullName, signatureName: b.signatureName, dobText: b.dob, gender: b.gender,
    profession: prof.id === 'other' ? b.professionText || 'Other' : `${prof.label}${b.professionText ? ` – ${b.professionText}` : ''}`,
    experienceYears: b.experienceYears, goals: b.goals, concerns: b.concerns, language: b.language, hand: b.hand,
    image: m ? { mediaType: m[1] as 'image/png' | 'image/jpeg' | 'image/webp', base64: m[2] } : undefined, observations,
  }, numbers);
  return json({ numbers, ...result, generatedAt: new Date().toISOString() });
});
