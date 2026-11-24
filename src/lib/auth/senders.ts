/**
 * OTP delivery.
 * Email: Hostinger Mail API (HOSTINGER_MAIL_API_TOKEN) or Resend (RESEND_API_KEY).
 * SMS: Fast2SMS (FAST2SMS_API_KEY) or MSG91 (MSG91_AUTH_KEY).
 */
import { sendFast2Sms } from '@/lib/sms/fast2sms';

export interface Delivery { channel: 'email' | 'sms'; to: string; code: string; brand: string }
export type Sender = (d: Delivery) => Promise<void>;

export const consoleSender: Sender = async (d) => {
  console.info(`[OTP] ${d.channel} ${d.to.replace(/(.{2}).+(.{2})/, '$1***$2')}: ${d.code}`);
};

export function hostingerEmailSender(fetchImpl: typeof fetch = fetch): Sender {
  return async (d) => {
    const token = (process.env.HOSTINGER_MAIL_API_TOKEN || process.env.HOSTINGER_API_TOKEN || '').trim();
    const mailboxId = process.env.HOSTINGER_MAILBOX_ID || 'AC8be210e784dd3c039d751614bf29';
    const brand = String(d.brand ?? 'myNumerologist').replace(/[\r\n\x00-\x1f\x7f]+/g, ' ').trim();
    const res = await fetchImpl(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxId}/send`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        to: [d.to],
        subject: `${d.code} is your ${brand} login code`,
        text: `Your login code is ${d.code}. It is valid for 10 minutes. If you did not request it, you can ignore this email.`,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Hostinger email error ${res.status}: ${err}`);
    }
  };
}

export function emailSender(fetchImpl: typeof fetch = fetch): Sender {
  return async (d) => {
    const brand = String(d.brand ?? 'Numerology').replace(/[\r\n\x00-\x1f\x7f]+/g, ' ').trim();
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${brand} <no-reply@example.com>`,
        to: [d.to],
        subject: `${d.code} is your ${brand} login code`,
        text: `Your login code is ${d.code}. It is valid for 10 minutes. If you did not request it, you can ignore this email.`,
      }),
    });
    if (!res.ok) throw new Error(`Email provider error ${res.status}`);
  };
}

export function fast2SmsSender(fetchImpl: typeof fetch = fetch): Sender {
  return async (d) => {
    const brand = String(d.brand ?? 'myNumerologist').replace(/[\r\n\x00-\x1f\x7f]+/g, ' ').trim();
    const result = await sendFast2Sms({
      numbers: d.to,
      message: `${d.code} is your login OTP for ${brand}. Valid for 10 minutes. Do not share it with anyone.`,
      fetchImpl,
    });
    if (!result.ok) {
      throw new Error(`Fast2SMS error: ${result.message}`);
    }
  };
}

export function smsSender(fetchImpl: typeof fetch = fetch): Sender {
  return async (d) => {
    const res = await fetchImpl('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: String(process.env.MSG91_AUTH_KEY), 'content-type': 'application/json' },
      body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, recipients: [{ mobiles: d.to.replace('+', ''), OTP: d.code }] }),
    });
    if (!res.ok) throw new Error(`SMS provider error ${res.status}`);
  };
}

export function defaultSender(channel: 'email' | 'sms'): Sender {
  if (channel === 'email' && (process.env.HOSTINGER_MAIL_API_TOKEN || process.env.HOSTINGER_API_TOKEN)) {
    return hostingerEmailSender();
  }
  if (channel === 'email' && process.env.RESEND_API_KEY) return emailSender();
  if (channel === 'sms' && process.env.FAST2SMS_API_KEY) return fast2SmsSender();
  if (channel === 'sms' && process.env.MSG91_AUTH_KEY) return smsSender();
  // Never fall back to printing codes on a live site: the code would have nowhere safe to go.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`OTP delivery provider not configured for ${channel}`);
  }
  return consoleSender;
}
