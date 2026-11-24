import { z } from 'zod';
import { json, readJson, withUser } from '@/lib/server/http';
import { sendMarketingEmail } from '@/lib/server/marketing-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(3).max(250),
  html: z.string().min(10),
  text: z.string().min(10),
  templateId: z.string().optional(),
  leadId: z.string().optional(),
});

/**
 * POST /api/admin/email-marketing/send
 * Sends a marketing / service-lead generation email to a lead or test address.
 */
export const POST = withUser(async (req, user) => {
  if (user.role !== 'super_admin') {
    return json({ error: 'FORBIDDEN' }, 403);
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(req));
  } catch (err) {
    return json({ error: 'INVALID_INPUT', details: err instanceof Error ? err.message : 'Invalid request format' }, 400);
  }

  const result = await sendMarketingEmail({
    to: body.to,
    subject: body.subject,
    html: body.html,
    text: body.text,
    templateId: body.templateId,
    leadId: body.leadId,
    adminId: user.id,
  });

  if (!result.ok) {
    return json({ error: 'SEND_FAILED', message: result.error || 'Failed to dispatch email' }, 502);
  }

  return json({
    ok: true,
    sentTo: result.sentTo,
    provider: result.provider,
    id: result.id,
    message: `Email successfully dispatched via ${result.provider} to ${result.sentTo}`,
  });
});
