/**
 * Marketing Email Delivery Server Service.
 * Sends service-wise promotional and lead-generation emails using Hostinger Mail API
 * or Resend API. Also records the activity in CRM marketing leads when applicable.
 */

import { logActivity } from '@/lib/crm';

export interface SendMarketingEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  leadId?: string;
  adminId?: string;
  templateId?: string;
  fetchImpl?: typeof fetch;
}

export interface SendMarketingEmailResult {
  ok: boolean;
  sentTo: string;
  id?: string;
  provider: 'hostinger' | 'resend' | 'console';
  error?: string;
}

export async function sendMarketingEmail(opts: SendMarketingEmailOptions): Promise<SendMarketingEmailResult> {
  const to = opts.to.trim();
  if (!to || !to.includes('@')) {
    return { ok: false, sentTo: to, provider: 'console', error: 'Invalid recipient email address' };
  }

  const fetchImpl = opts.fetchImpl || fetch;
  const hostingerToken = process.env.HOSTINGER_MAIL_API_TOKEN || process.env.HOSTINGER_API_TOKEN || process.env.HOSTINGER_TOKEN;

  // 1. Try Hostinger Mail API
  if (hostingerToken) {
    try {
      let mailboxId = process.env.HOSTINGER_MAILBOX_ID;
      if (!mailboxId) {
        const meRes = await fetchImpl('https://api.mail.hostinger.com/api/v1/me', {
          headers: {
            authorization: `Bearer ${hostingerToken.trim()}`,
            accept: 'application/json',
          },
        });
        if (meRes.ok) {
          const meData = (await meRes.json().catch(() => ({}))) as { data?: { mailboxes?: Array<{ resourceId?: string; address?: string }> } };
          const senderTarget = (process.env.EMAIL_FROM || 'info@mynumerologist.com').toLowerCase();
          const match = meData.data?.mailboxes?.find((m) => m.address && senderTarget.includes(m.address.toLowerCase()));
          mailboxId = match?.resourceId || meData.data?.mailboxes?.[0]?.resourceId;
        }
      }

      if (mailboxId) {
        const sendRes = await fetchImpl(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxId}/send`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${hostingerToken.trim()}`,
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            to: [to],
            subject: opts.subject,
            html: opts.html,
            text: opts.text,
          }),
        });

        if (sendRes.ok) {
          const json = (await sendRes.json().catch(() => ({}))) as { id?: string; data?: { id?: string } };
          const msgId = json.id || json.data?.id || 'hostinger-sent';
          
          if (opts.leadId) {
            try {
              await logActivity(opts.leadId, 'email', `Sent email: "${opts.subject}"`, opts.adminId || null, {
                templateId: opts.templateId,
                provider: 'hostinger',
                to,
              });
            } catch (err) {
              console.warn('[Marketing Email] Failed to log CRM activity:', err);
            }
          }

          return { ok: true, sentTo: to, id: msgId, provider: 'hostinger' };
        } else {
          const errText = await sendRes.text().catch(() => '');
          console.error(`[Marketing Email] Hostinger error (${sendRes.status}): ${errText}`);
        }
      }
    } catch (e) {
      console.error('[Marketing Email] Hostinger request threw exception:', e);
    }
  }

  // 2. Try Resend API fallback
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.EMAIL_FROM || 'Acharya Nandram <info@mynumerologist.com>';
      const resendRes = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        }),
      });

      if (resendRes.ok) {
        const json = (await resendRes.json().catch(() => ({}))) as { id?: string };
        if (opts.leadId) {
          try {
            await logActivity(opts.leadId, 'email', `Sent email: "${opts.subject}"`, opts.adminId || null, {
              templateId: opts.templateId,
              provider: 'resend',
              to,
            });
          } catch (err) {
            console.warn('[Marketing Email] Failed to log CRM activity:', err);
          }
        }
        return { ok: true, sentTo: to, id: json.id, provider: 'resend' };
      }
    } catch (e) {
      console.error('[Marketing Email] Resend threw exception:', e);
    }
  }

  // 3. Dev / Sandbox Simulation fallback
  console.info(`[Marketing Email DEV Simulation] Sent "${opts.subject}" to ${to}`);
  if (opts.leadId) {
    try {
      await logActivity(opts.leadId, 'email', `[Simulated] Sent email: "${opts.subject}"`, opts.adminId || null, {
        templateId: opts.templateId,
        provider: 'console',
        to,
      });
    } catch {
      // ignore
    }
  }

  return { ok: true, sentTo: to, id: 'simulated-dev', provider: 'console' };
}
