/**
 * "Your report is ready" notification for purchased services: one text message (SMS) and one email,
 * sent once when the report reaches the client's report area – whether the numerologist approved it or
 * the system delivered it automatically after 3 hours.
 *
 *   SMS   – Fast2SMS (FAST2SMS_API_KEY), Indian mobile numbers only; short English text with the report-area link.
 *   Email – Hostinger Mail / Resend (see lib/email/report-email.ts), in English and Hindi, with both PDFs attached
 *           when they are small enough, and the link to the report area.
 * Without keys both channels are simulated (logged), so development never sends real messages.
 */
import { escHtml, safeUrl, sanitizeOneLine, sendEmailWithAttachments, type EmailAttachment } from '@/lib/email/report-email';
import { normalizeIndianMobile, sendFast2Sms } from '@/lib/sms/fast2sms';
import { SITE_NAME, SITE_URL } from '@/lib/seo/site';
import type { NotifyChannelResult, NotifyLog } from '@/lib/billing/services';

/** Attach the PDFs only while the email stays comfortably under provider limits (most allow 20–40 MB). */
export const EMAIL_ATTACH_MAX_BYTES = 12 * 1024 * 1024;
const TELEGRAM = process.env.EXPERT_TELEGRAM ?? '@MYNUMEROLOGIST8';

export interface ReadyNotice {
  clientName: string;
  title: { en: string; hi: string };
  /** Language the client chose for the reading: decides which language comes first in the email. */
  lang: 'en' | 'hi';
  email?: string | null;
  phone?: string | null;
  pdfs: { en?: EmailAttachment; hi?: EmailAttachment };
  reportsUrl?: string;
}

export const reportsUrl = () => `${SITE_URL}/dashboard`;
const firstName = (s: string) => sanitizeOneLine(s).split(/\s+/)[0]?.slice(0, 20) ?? '';
const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();

/** Indian mobile for the SMS, or null (numbers with another country code are not texted). */
export function smsNumber(raw?: string | null): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (v.startsWith('+') && !/^\+\s*91/.test(v)) return null;
  const digits = v.replace(/\D/g, '');
  if (digits.length > 12 && !digits.startsWith('91')) return null;
  return normalizeIndianMobile(v);
}

/** One standard SMS (plain English letters – Hindi text costs 2–3 SMS credits). */
export function readySmsText(n: Pick<ReadyNotice, 'clientName' | 'title' | 'reportsUrl'>): string {
  const name = ascii(firstName(n.clientName));
  const url = n.reportsUrl ?? reportsUrl();
  const make = (title: string, brand: boolean) => `Namaste${name ? ` ${name}` : ''}, your ${title} is ready in English & Hindi. Download: ${url}${brand ? ` - ${SITE_NAME}` : ''}`;
  let title = ascii(n.title.en);
  if (make(title, true).length <= 160) return make(title, true);
  if (make(title, false).length <= 160) return make(title, false);
  while (title.length > 12 && make(title, false).length > 160) title = title.slice(0, title.lastIndexOf(' ') > 0 ? title.lastIndexOf(' ') : title.length - 1);
  return make(title, false);
}

export function readyEmail(n: ReadyNotice): { subject: string; html: string; text: string; attach: EmailAttachment[] } {
  const name = sanitizeOneLine(n.clientName || 'Client');
  const url = safeUrl(n.reportsUrl ?? reportsUrl()) ?? reportsUrl();
  const files = [n.pdfs.en, n.pdfs.hi].filter((x): x is EmailAttachment => !!x);
  const total = files.reduce((a, f) => a + f.content.length, 0);
  const attach = total <= EMAIL_ATTACH_MAX_BYTES ? files : [];
  const en = {
    hello: `Dear ${name},`, head: `Your ${n.title.en} is ready`,
    body: 'Your report is now in your report area on our website, in English and in Hindi. Open My Reports and download whichever language you prefer – both PDFs stay there for you.',
    att: attach.length ? 'Both PDF reports (English and Hindi) are also attached to this email.' : 'Download the PDFs from My Reports (the files are too large to attach).',
    btn: 'Open My Reports', help: `Questions about your report? Message us on Telegram ${TELEGRAM}.`, sign: 'Warm regards,',
  };
  const hi = {
    hello: `नमस्ते ${name},`, head: `आपकी ${n.title.hi} तैयार है`,
    body: 'आपकी रिपोर्ट हमारी वेबसाइट पर आपके रिपोर्ट सेक्शन में अंग्रेज़ी और हिंदी दोनों भाषाओं में उपलब्ध है। "मेरी रिपोर्ट" खोलें और अपनी पसंद की भाषा में PDF डाउनलोड करें – दोनों PDF वहाँ सुरक्षित रहेंगी।',
    att: attach.length ? 'दोनों PDF रिपोर्ट (अंग्रेज़ी और हिंदी) इस ईमेल के साथ भी संलग्न हैं।' : 'PDF "मेरी रिपोर्ट" से डाउनलोड करें (फ़ाइलें संलग्न करने के लिए बहुत बड़ी हैं)।',
    btn: 'मेरी रिपोर्ट खोलें', help: `रिपोर्ट से जुड़े प्रश्न? टेलीग्राम ${TELEGRAM} पर संदेश भेजें।`, sign: 'शुभकामनाओं सहित,',
  };
  const order = n.lang === 'hi' ? [hi, en] : [en, hi];
  const subject = n.lang === 'hi' ? `आपकी ${n.title.hi} तैयार है – ${name} | ${SITE_NAME}` : `Your ${n.title.en} is ready – ${name} | ${SITE_NAME}`;
  const block = (t: typeof en) => `
        <p style="margin:0 0 14px;font-size:16px;color:#f5f5f4;font-weight:600">${escHtml(t.hello)}</p>
        <h2 style="margin:0 0 12px;color:#fef3c7;font-size:20px;font-family:Georgia,serif">${escHtml(t.head)}</h2>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#d6d3d1">${escHtml(t.body)}</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#d6d3d1">📎 ${escHtml(t.att)}</p>
        <div style="text-align:center;margin:20px 0 22px"><a href="${url}" style="background:linear-gradient(135deg,#d97706,#b45309);color:#fff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;font-size:15px;display:inline-block">${escHtml(t.btn)} →</a></div>
        <p style="margin:0 0 6px;font-size:13px;color:#a8a29e">${escHtml(t.help)}</p>`;
  const html = `<!DOCTYPE html><html lang="${n.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f5f4">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1c1917;border:1px solid #78350f;border-radius:12px;overflow:hidden">
    <tr><td style="background:linear-gradient(135deg,#451a03,#1c1917);padding:26px 24px;text-align:center;border-bottom:2px solid #d97706">
      <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px">${escHtml(SITE_NAME)}</p></td></tr>
    <tr><td style="padding:28px">${block(order[0])}
        <hr style="border:none;border-top:1px solid #44403c;margin:22px 0">${block(order[1])}
        <p style="margin:22px 0 4px;font-size:14px;color:#a8a29e">${escHtml(order[0].sign)}</p>
        <p style="margin:0;font-size:15px;color:#fef3c7;font-weight:600">Acharya Nandram</p>
        <p style="margin:2px 0 0;font-size:13px;color:#d97706">${escHtml(SITE_NAME)}</p></td></tr>
  </table></body></html>`;
  const text = order.map((t) => `${t.hello}\n\n${t.head}.\n${t.body}\n${t.att}\n\n${t.btn}: ${url}\n${t.help}`).join('\n\n— — —\n\n') + `\n\n${order[0].sign}\nAcharya Nandram\n${SITE_NAME}`;
  return { subject, html, text, attach };
}

const stamp = () => new Date().toISOString();

/** Sends the SMS and the email. Channels already sent successfully (in `previous`) are not sent again. */
export async function sendReportReadyNotice(n: ReadyNotice, previous: NotifyLog | null = null, opts: { fetchImpl?: typeof fetch } = {}): Promise<NotifyLog> {
  const log: NotifyLog = { ...(previous ?? {}) };
  const tasks: Promise<void>[] = [];
  if (!previous?.sms?.ok && !previous?.sms?.skipped) {
    const to = smsNumber(n.phone);
    if (!to) log.sms = { ok: false, skipped: n.phone ? 'not an Indian mobile number' : 'no mobile number', at: stamp() };
    else tasks.push(sendFast2Sms({ numbers: to, message: readySmsText(n), fetchImpl: opts.fetchImpl })
      .then((r): NotifyChannelResult => ({ ok: r.ok, to, ...(r.ok ? {} : { error: r.message ?? 'SMS failed' }), at: stamp() }))
      .catch((e): NotifyChannelResult => ({ ok: false, to, error: e instanceof Error ? e.message : 'SMS failed', at: stamp() }))
      .then((r) => { log.sms = r; }));
  }
  if (!previous?.email?.ok && !previous?.email?.skipped) {
    const to = (n.email ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) log.email = { ok: false, skipped: 'no email address', at: stamp() };
    else {
      const m = readyEmail(n);
      tasks.push(sendEmailWithAttachments({ to, subject: m.subject, html: m.html, text: m.text, brandName: SITE_NAME, attachments: m.attach, fetchImpl: opts.fetchImpl })
        .then((r): NotifyChannelResult => ({ ok: r.ok, to, ...(r.ok ? {} : { error: r.error ?? 'Email failed' }), at: stamp() }))
        .catch((e): NotifyChannelResult => ({ ok: false, to, error: e instanceof Error ? e.message : 'Email failed', at: stamp() }))
        .then((r) => { log.email = r; }));
    }
  }
  await Promise.all(tasks);
  return log;
}

/** All channels are finished: each one was sent, or there was nothing to send it to. */
export const noticeDone = (l: NotifyLog) => [l.sms, l.email].every((c) => !!c && (c.ok || !!c.skipped));
