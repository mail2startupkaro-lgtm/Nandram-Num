/**
 * OTP delivery. Email: Resend (RESEND_API_KEY, EMAIL_FROM). SMS: MSG91 (MSG91_AUTH_KEY, MSG91_TEMPLATE_ID – a DLT-approved
 * template with an ##OTP## variable). Without keys, codes are written to the server log (development only).
 */
export interface Delivery { channel: 'email' | 'sms'; to: string; code: string; brand: string }
export type Sender = (d: Delivery) => Promise<void>;

export const consoleSender: Sender = async (d) => {
  console.info(`[OTP] ${d.channel} ${d.to.replace(/(.{2}).+(.{2})/, '$1***$2')}: ${d.code}`);
};

export function emailSender(fetchImpl: typeof fetch = fetch): Sender {
  return async (d) => {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${d.brand} <no-reply@example.com>`,
        to: [d.to],
        subject: `${d.code} is your ${d.brand} login code`,
        text: `Your login code is ${d.code}. It is valid for 10 minutes. If you did not request it, you can ignore this email.`,
      }),
    });
    if (!res.ok) throw new Error(`Email provider error ${res.status}`);
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
  if (channel === 'email' && process.env.RESEND_API_KEY) return emailSender();
  if (channel === 'sms' && process.env.MSG91_AUTH_KEY) return smsSender();
  // Never fall back to printing codes on a live site: the code would have nowhere safe to go.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`OTP delivery provider not configured for ${channel} (set ${channel === 'email' ? 'RESEND_API_KEY' : 'MSG91_AUTH_KEY + MSG91_TEMPLATE_ID'})`);
  }
  return consoleSender;
}
