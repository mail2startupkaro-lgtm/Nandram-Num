import { z } from 'zod';
import { json, readJson, withUser } from '@/lib/server/http';
import { generateAiEmailScript, type EmailCampaignOptions } from '@/lib/email/ai-writer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  profile: z.object({
    name: z.string().trim().min(1).max(120),
    dob: z.string().optional(),
    moolank: z.union([z.number(), z.string()]).optional(),
    bhagyank: z.union([z.number(), z.string()]).optional(),
    profession: z.string().max(200).optional(),
    lifeSituation: z.string().max(1000).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  targetService: z.string().min(1).max(200),
  goal: z.enum(['lead_outreach', 'ebook_nurture', 'reading_followup', 'discount_offer', 're_engagement', 'crisis_remedy']),
  tone: z.enum(['warm_spiritual', 'astrological_expert', 'urgent_offer', 'friendly_consultant']),
  language: z.enum(['en', 'hi', 'hinglish']),
  specialOffer: z.string().max(200).optional(),
  consultUrl: z.string().max(500).optional(),
  whatsappNumber: z.string().max(30).optional(),
});

/**
 * POST /api/admin/email-marketing/ai-generate
 * Generates an AI-customized email marketing script based on the client's profile and target service.
 */
export const POST = withUser(async (req, user) => {
  if (user.role !== 'super_admin') {
    return json({ error: 'FORBIDDEN' }, 403);
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(req));
  } catch (err) {
    return json({ error: 'INVALID_INPUT', details: err instanceof Error ? err.message : 'Invalid request payload' }, 400);
  }

  const campaignOpts: EmailCampaignOptions = {
    profile: body.profile,
    targetService: body.targetService,
    goal: body.goal,
    tone: body.tone,
    language: body.language,
    specialOffer: body.specialOffer,
    consultUrl: body.consultUrl,
    whatsappNumber: body.whatsappNumber,
  };

  const script = await generateAiEmailScript(campaignOpts, process.env);

  return json({
    ok: true,
    script,
  });
});
