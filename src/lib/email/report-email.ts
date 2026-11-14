/**
 * Report email delivery service.
 * Sends the generated numerology report PDF as an attachment to the client's email ID.
 * Uses Resend API when RESEND_API_KEY is configured. In development without keys,
 * it simulates delivery safely to console without throwing or blocking downloads.
 */

export interface ReportEmailOptions {
  to: string;
  clientName: string;
  reportPdf: Uint8Array | Buffer;
  fileName?: string;
  reportUrl?: string;
  language?: 'en' | 'hi' | 'hinglish';
  brandName?: string;
  expertName?: string;
  fetchImpl?: typeof fetch;
}

export interface ReportEmailResult {
  ok: boolean;
  sentTo: string;
  id?: string;
  dev?: boolean;
  error?: string;
}

function buildHtmlBody(opts: {
  clientName: string;
  brandName: string;
  expertName: string;
  fileName: string;
  reportUrl?: string;
  hi: boolean;
}): string {
  const { clientName, brandName, expertName, fileName, reportUrl, hi } = opts;

  const greeting = hi ? `नमस्ते ${clientName},` : `Dear ${clientName},`;
  const headline = hi ? 'आपकी संपूर्ण अंक ज्योतिष रिपोर्ट तैयार है' : 'Your Complete Numerology Report is Ready';
  const intro = hi
    ? `आपकी व्यक्तिगत अंक ज्योतिष विश्लेषण रिपोर्ट तैयार कर दी गई है। इसमें आपकी जन्म तिथि, मूलांक, भाग्यांक, लो शू ग्रिड, नाम कंपन, भविष्यफल और व्यक्तिगत उपायों का विस्तृत विश्लेषण शामिल है।`
    : `Your personalized numerology report has been prepared. It contains an in-depth analysis of your Date of Birth, Moolank, Bhagyank, Lo Shu Grid, name vibration, personal year forecast, and tailored remedies.`;
  const attachedNote = hi
    ? `आपकी पूरी PDF रिपोर्ट इस ईमेल के साथ संलग्न है, जिसे आप कभी भी डाउनलोड और सुरक्षित रख सकते हैं।`
    : `Your complete PDF report is attached to this email for you to download, save, and read anytime.`;
  const viewOnline = hi ? 'रिपोर्ट ऑनलाइन देखें / डाउनलोड करें' : 'View & Download Report Online';
  const signoff = hi ? 'शुभकामनाओं सहित,' : 'Warm regards,';

  return `<!DOCTYPE html>
<html lang="${hi ? 'hi' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1c1917; border: 1px solid #78350f; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #451a03 0%, #1c1917 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #d97706;">
        <p style="margin: 0 0 8px 0; color: #f59e0b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">${brandName}</p>
        <h1 style="margin: 0; color: #fef3c7; font-size: 24px; font-weight: 700; font-family: Georgia, serif;">${headline}</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #f5f5f4; font-weight: 600;">${greeting}</p>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #d6d3d1;">${intro}</p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #d6d3d1;">${attachedNote}</p>

        <!-- Attachment Box -->
        <div style="background-color: #292524; border: 1px solid #44403c; border-left: 4px solid #d97706; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #fef3c7; font-weight: 600;">📎 ${fileName}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a8a29e;">${hi ? 'पूर्ण PDF रिपोर्ट संलग्न है' : 'Full PDF report attached'}</p>
        </div>

        ${reportUrl ? `
        <!-- Download / View Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${reportUrl}" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);">
            ${viewOnline} →
          </a>
        </div>
        ` : ''}

        <p style="margin: 28px 0 6px 0; font-size: 14px; color: #a8a29e;">${signoff}</p>
        <p style="margin: 0; font-size: 15px; color: #fef3c7; font-weight: 600;">${expertName}</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; color: #d97706;">${brandName}</p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #141210; padding: 20px 24px; text-align: center; border-top: 1px solid #292524;">
        <p style="margin: 0; font-size: 12px; color: #78716c;">
          ${hi ? 'यह एक स्वचालित संदेश है। यदि आपने यह रिपोर्ट नहीं मांगी थी, तो आप इस ईमेल को अनदेखा कर सकते हैं।' : 'This is an automated message. If you did not request this report, you can disregard this email.'}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextBody(opts: {
  clientName: string;
  brandName: string;
  expertName: string;
  fileName: string;
  reportUrl?: string;
  hi: boolean;
}): string {
  const { clientName, brandName, expertName, fileName, reportUrl, hi } = opts;
  if (hi) {
    return `नमस्ते ${clientName},

आपकी व्यक्तिगत अंक ज्योतिष रिपोर्ट तैयार कर दी गई है।
आपकी पूरी PDF रिपोर्ट (${fileName}) इस ईमेल के साथ संलग्न है।

${reportUrl ? `आप अपनी रिपोर्ट ऑनलाइन भी देख सकते हैं:\n${reportUrl}\n\n` : ''}शुभकामनाओं सहित,
${expertName}
${brandName}`;
  }

  return `Dear ${clientName},

Your personalized numerology report is ready.
Your complete PDF report (${fileName}) is attached to this email.

${reportUrl ? `You can also view or download your report online at:\n${reportUrl}\n\n` : ''}Warm regards,
${expertName}
${brandName}`;
}

export async function sendReportEmail(opts: ReportEmailOptions): Promise<ReportEmailResult> {
  const to = opts.to.trim().toLowerCase();
  if (!to || !to.includes('@')) {
    return { ok: false, sentTo: to, error: 'Invalid recipient email' };
  }

  const brandName = opts.brandName || process.env.BRAND_NAME || 'mynumerologist.com';
  const expertName = opts.expertName || process.env.EXPERT_NAME || 'Acharya Nandram';
  const fileName = opts.fileName || `${opts.clientName.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}-numerology-report.pdf`;
  const hi = opts.language === 'hi';

  const subject = hi
    ? `आपकी अंक ज्योतिष रिपोर्ट - ${opts.clientName} | ${brandName}`
    : `Your Numerology Report - ${opts.clientName} | ${brandName}`;

  const html = buildHtmlBody({
    clientName: opts.clientName,
    brandName,
    expertName,
    fileName,
    reportUrl: opts.reportUrl,
    hi,
  });

  const text = buildTextBody({
    clientName: opts.clientName,
    brandName,
    expertName,
    fileName,
    reportUrl: opts.reportUrl,
    hi,
  });

  const base64Pdf = Buffer.from(opts.reportPdf).toString('base64');
  const fetchImpl = opts.fetchImpl || fetch;

  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.EMAIL_FROM || `${brandName} <reports@mynumerologist.com>`;
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
          attachments: [
            {
              filename: fileName,
              content: base64Pdf,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`[Report Email] Resend API error (${res.status}): ${errBody}`);
        return { ok: false, sentTo: to, error: `Email provider error ${res.status}` };
      }

      const json = await res.json().catch(() => ({}));
      console.info(`[Report Email] Report PDF successfully sent to ${to} (id: ${json.id ?? 'unknown'})`);
      return { ok: true, sentTo: to, id: json.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error';
      console.error(`[Report Email] Delivery failed: ${msg}`);
      return { ok: false, sentTo: to, error: msg };
    }
  }

  // Development/testing mode without RESEND_API_KEY
  console.info(`[Report Email] (Dev/Simulation) Attached "${fileName}" (${opts.reportPdf.length} bytes) to ${to}`);
  return { ok: true, sentTo: to, dev: true };
}
