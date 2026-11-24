/**
 * AI Email Marketing Script Writer (Gemini + Offline Fallback)
 * Generates bespoke, high-converting email marketing campaigns and scripts
 * tailored to a specific client's numerology profile (Name, Moolank, Bhagyank, DOB, Situation).
 */

import { geminiConfig } from '@/lib/celebrity/agent';

export interface ClientProfileInput {
  name: string;
  dob?: string;
  moolank?: number | string;
  bhagyank?: number | string;
  profession?: string;
  lifeSituation?: string;
  email?: string;
  phone?: string;
}

export interface EmailCampaignOptions {
  profile: ClientProfileInput;
  targetService: string;
  goal: 'lead_outreach' | 'ebook_nurture' | 'reading_followup' | 'discount_offer' | 're_engagement' | 'crisis_remedy';
  tone: 'warm_spiritual' | 'astrological_expert' | 'urgent_offer' | 'friendly_consultant';
  language: 'en' | 'hi' | 'hinglish';
  specialOffer?: string;
  consultUrl?: string;
  whatsappNumber?: string;
}

export interface GeneratedEmailScript {
  subjectLines: string[];
  preheader: string;
  astrologicalHook: string;
  htmlBody: string;
  plainText: string;
  whatsappFollowup: string;
  model: string;
  isAiGenerated: boolean;
}

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

/**
 * Standard luxury responsive email wrapper for myNumerologist branding
 */
function wrapHtmlContent(opts: {
  innerHtml: string;
  preheader: string;
  ctaText: string;
  ctaUrl: string;
  waUrl: string;
  isHindi: boolean;
}): string {
  const { innerHtml, preheader, ctaText, ctaUrl, waUrl, isHindi } = opts;
  const footerNotice = isHindi
    ? 'यह व्यक्तिगत संदेश myNumerologist.com द्वारा आपके अंकों के विश्लेषण के आधार पर भेजा गया है। आचार्य नंदराम (15+ वर्ष अनुभव)।'
    : 'This personalized consultation email was prepared for you by myNumerologist.com. Acharya Nandram (15+ years experience).';

  const waBtnText = isHindi ? '💬 व्हाट्सएप पर आचार्य जी से पूछें' : '💬 Ask Acharya Ji on WhatsApp';

  return `<!DOCTYPE html>
<html lang="${isHindi ? 'hi' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>myNumerologist Consultation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 25px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #131b2e; border: 1px solid #d4af3740; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Gold Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #d4af37 0%, #f3e5ab 50%, #d4af37 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 26px 30px 16px 30px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.15);">
              <span style="font-size: 26px;">✨</span>
              <h1 style="margin: 6px 0 2px 0; font-size: 22px; font-weight: 700; color: #f5eedc; font-family: Georgia, serif;">
                my<span style="color: #d4af37;">Numerologist</span>
              </h1>
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #d4af37;">
                ${isHindi ? 'आचार्य नंदराम • व्यक्तिगत अंक ज्योतिष परामर्श' : 'Acharya Nandram • Vedic & Chaldean Numerology'}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 30px 32px 24px 32px; font-size: 15px; line-height: 1.65; color: #cbd5e1;">
              ${innerHtml}

              <!-- Action Buttons -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 32px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #0b0f19; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(212,175,55,0.35); text-align: center;">
                      ${ctaText} →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <a href="${waUrl}" style="display: inline-block; color: #4ade80; font-size: 13px; font-weight: 600; text-decoration: none; padding: 6px 12px; border: 1px solid rgba(74,222,128,0.3); border-radius: 8px;">
                      ${waBtnText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: rgba(11,15,25,0.6); border-top: 1px solid rgba(212,175,55,0.15);">
              <strong style="color: #f5eedc; font-size: 14px; font-family: Georgia, serif;">Acharya Nandram</strong><br>
              <span style="font-size: 13px; color: #94a3b8;">${isHindi ? 'वरिष्ठ अंक ज्योतिषी एवं जीवन मार्गदर्शक (15+ वर्ष अनुभव)' : 'Lead Numerologist & Astrological Guide (15+ Years)'}</span><br>
              <span style="font-size: 12px; color: #d4af37;">📞 +91 8819999374 &nbsp;|&nbsp; 🌐 mynumerologist.com</span>
            </td>
          </tr>

          <!-- Disclaimer / Legal -->
          <tr>
            <td style="padding: 18px 30px; text-align: center; background-color: #0b0f19; font-size: 11px; color: #64748b;">
              <p style="margin: 0;">${footerNotice}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates an offline structured marketing email if Gemini is unavailable
 */
function generateOfflineScript(opts: EmailCampaignOptions): GeneratedEmailScript {
  const p = opts.profile;
  const isHi = opts.language === 'hi';
  const name = p.name || 'Friend';
  const moolank = p.moolank ? String(p.moolank) : 'your birth date';
  const bhagyank = p.bhagyank ? String(p.bhagyank) : 'destiny number';
  const target = opts.targetService || 'Personal Numerology Report';
  const offer = opts.specialOffer || '₹500 OFF with code LUCKY500';
  const ctaUrl = opts.consultUrl || 'https://www.mynumerologist.com/services';
  const waUrl = `https://wa.me/${opts.whatsappNumber || '918819999374'}?text=${encodeURIComponent(
    `Hello Acharya Ji, I received your email regarding ${target} for ${name}`
  )}`;

  if (isHi) {
    const innerHtml = `
      <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">${name}</strong> जी,</p>
      <p>आशा है आप सपरिवार सकुशल होंगे। अंक ज्योतिष के अनुसार आपकी जन्मतिथि से जुड़ा <strong>मूलांक ${moolank}</strong> और <strong>भाग्यांक ${bhagyank}</strong> आपके जीवन की दिशा तय करता है।</p>
      ${p.lifeSituation ? `<p style="color: #f3e5ab; background: rgba(212,175,55,0.1); padding: 10px 14px; border-radius: 6px;">जैसा कि आपने बताया कि आप <strong>${p.lifeSituation}</strong> को लेकर समाधान चाहते हैं — यह सीधे तौर पर आपके अंकों के आपसी सामंजस्य से जुड़ा है।</p>` : ''}
      <p>जब आप <strong>${target}</strong> का व्यक्तिगत परामर्श लेते हैं, तो हम केवल ऊपरी बातें नहीं करते बल्कि समस्या की जड़ तक जाते हैं:</p>
      <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">आपके लिए मुख्य लाभ:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
          <li>मूलांक ${moolank} और भाग्यांक ${bhagyank} के बीच ग्रहों की मित्रता व शत्रुता का निवारण।</li>
          <li>करियर व आर्थिक स्थिति में स्थिरता लाने के लिए व्यावहारिक व अचूक उपाय।</li>
          <li>आचार्य नंदराम जी द्वारा आपके 3 व्यक्तिगत प्रश्नों का स्पष्ट मार्गदर्शन।</li>
        </ul>
      </div>
      <p style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; background: #d4af3725; border: 1px dashed #d4af37; color: #f3e5ab; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px;">
          🎁 विशेष सुविधा: ${offer}
        </span>
      </p>
    `;

    return {
      subjectLines: [
        `✨ ${name} जी, आपके मूलांक ${moolank} और भाग्यांक ${bhagyank} का यह महत्वपूर्ण संदेश...`,
        `${name} जी, क्या आप अपनी वर्तमान स्थिति का सटीक ज्योतिषीय समाधान चाहते हैं?`,
        `आचार्य नंदराम जी का विशेष परामर्श आमंत्रण (${target})`,
      ],
      preheader: `आचार्य नंदराम जी द्वारा ${name} जी के लिए विशेष रूप से तैयार किया गया संदेश।`,
      astrologicalHook: `मूलांक ${moolank} व भाग्यांक ${bhagyank} का आपसी तालमेल और वर्तमान दशा का निवारण।`,
      htmlBody: wrapHtmlContent({
        innerHtml,
        preheader: `आचार्य नंदराम जी का संदेश`,
        ctaText: `परामर्श व रिपोर्ट बुक करें`,
        ctaUrl,
        waUrl,
        isHindi: true,
      }),
      plainText: `नमस्ते ${name} जी,\n\nआपके मूलांक ${moolank} और भाग्यांक ${bhagyank} के आधार पर आचार्य नंदराम जी ने आपके लिए ${target} की सिफारिश की है।\n\nविशेष छूट: ${offer}\n\nपरामर्श बुक करें: ${ctaUrl}\nव्हाट्सएप पर संपर्क: ${waUrl}`,
      whatsappFollowup: `नमस्ते ${name} जी, मैंने आपके ईमेल पर ${target} का विशेष विश्लेषण भेजा है। क्या आपने उसे देखा? यदि कोई प्रश्न हो तो यहाँ पूछ सकते हैं। - आचार्य नंदराम`,
      model: 'offline-structured-template',
      isAiGenerated: false,
    };
  }

  const innerHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">${name}</strong>,</p>
    <p>In Vedic and Chaldean numerology, your <strong>Moolank ${moolank}</strong> and <strong>Bhagyank ${bhagyank}</strong> govern your life's underlying energetic flow.</p>
    ${p.lifeSituation ? `<p style="color: #f3e5ab; background: rgba(212,175,55,0.1); padding: 10px 14px; border-radius: 6px;">Regarding your recent focus on <em>${p.lifeSituation}</em> — this is directly influenced by the planetary cycles currently activating your birth chart.</p>` : ''}
    <p>To help you remove friction and align with your maximum potential, Acharya Nandram recommends a tailored <strong>${target}</strong>:</p>
    <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">What your personalized session covers:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
        <li>Harmony and friction points between your Moolank ${moolank} and Bhagyank ${bhagyank}.</li>
        <li>Pinpointed remedies for financial expansion and peace of mind.</li>
        <li>Personalized answers to your specific life questions directly by Acharya Nandram.</li>
      </ul>
    </div>
    <p style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background: #d4af3725; border: 1px dashed #d4af37; color: #f3e5ab; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px;">
        🎁 Special Offer: ${offer}
      </span>
    </p>
  `;

  return {
    subjectLines: [
      `✨ ${name}, your numbers reveal an important timing window...`,
      `How to unlock momentum for your goals: Personalized ${target}`,
      `${name}, here is what Acharya Nandram noticed in your chart`,
    ],
    preheader: `A personalized numerology roadmap prepared for ${name} by Acharya Nandram.`,
    astrologicalHook: `Alignment of Moolank ${moolank} and Bhagyank ${bhagyank} with current life transitions.`,
    htmlBody: wrapHtmlContent({
      innerHtml,
      preheader: `Roadmap for ${name}`,
      ctaText: `Book Your ${target} Now`,
      ctaUrl,
      waUrl,
      isHindi: false,
    }),
    plainText: `Dear ${name},\n\nBased on your Moolank ${moolank} and Bhagyank ${bhagyank}, Acharya Nandram has prepared a customized consultation plan for ${target}.\n\nSpecial Offer: ${offer}\n\nBook your consultation: ${ctaUrl}\nWhatsApp Acharya Ji: ${waUrl}`,
    whatsappFollowup: `Hi ${name}, I sent you a personalized numerology recommendation regarding ${target} to your email. Did you get a chance to review it? Let me know if you have any questions! - Acharya Nandram`,
    model: 'offline-structured-template',
    isAiGenerated: false,
  };
}

/**
 * Calls Gemini with automatic candidate failover and exponential retry
 */
export async function generateAiEmailScript(
  opts: EmailCampaignOptions,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<GeneratedEmailScript> {
  const cfg = geminiConfig(env);
  if (!cfg.apiKey) {
    return generateOfflineScript(opts);
  }

  const p = opts.profile;
  const isHi = opts.language === 'hi';
  const ctaUrl = opts.consultUrl || 'https://www.mynumerologist.com/services';
  const waNumber = opts.whatsappNumber || '918819999374';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hello Acharya Ji, I received your email regarding ${opts.targetService} for ${p.name}`
  )}`;

  const systemPrompt = `You are the Lead Copywriter & Senior Astrologer for Acharya Nandram (myNumerologist.com), a renowned Vedic & Chaldean Numerologist with 15+ years of experience in India.
Your mission is to write an authentic, respectful, deeply personalized, and high-converting marketing email to a prospective client based on their specific profile.

Strict Guidelines:
1. Tone: ${opts.tone} (e.g. warm, spiritual, authoritative, non-spammy, empathetic).
2. Language: ${opts.language === 'hi' ? 'Pure natural Hindi (Devanagari script)' : opts.language === 'hinglish' ? 'Conversational Hinglish' : 'Elegant, clear English'}.
3. Acknowledge the client's specific numbers (Moolank: ${p.moolank || 'calculated from DOB'}, Bhagyank: ${p.bhagyank || 'destiny number'}) and connect them directly to their life situation or target service.
4. Highlight 3-4 compelling benefits of the service "${opts.targetService}".
5. Never invent fatalistic or scary predictions. Keep it empowering, solution-oriented, and centered on Vedic/Chaldean remedies.
6. Provide a JSON response with exact keys.`;

  const userPrompt = `Generate a customized email marketing campaign for this client:

CLIENT PROFILE:
- Full Name: ${p.name}
- Date of Birth: ${p.dob || 'Not provided'}
- Moolank (Root Number): ${p.moolank || 'Unknown'}
- Bhagyank (Destiny Number): ${p.bhagyank || 'Unknown'}
- Profession: ${p.profession || 'Professional / Business'}
- Current Life Situation / Challenge: ${p.lifeSituation || 'Looking for growth and clarity'}

CAMPAIGN GOAL:
- Target Service: ${opts.targetService}
- Goal: ${opts.goal}
- Special Offer: ${opts.specialOffer || '₹500 OFF with code LUCKY500'}

Reply with ONLY a valid JSON object matching this schema:
{
  "subjectLines": ["Subject Line 1", "Subject Line 2", "Subject Line 3"],
  "preheader": "Short 60-90 character teaser text",
  "astrologicalHook": "1-2 sentences explaining why this service fits their specific numbers",
  "innerHtml": "<p>Greeting and opening paragraphs with <strong>tags</strong>...</p><div style='...'>3-4 benefit bullets</div><p>closing paragraph and offer</p>",
  "plainText": "Clean formatted text version",
  "whatsappFollowup": "Short 2-3 line WhatsApp follow-up message to send 24 hours later"
}`;

  const models = [cfg.model, ...CANDIDATE_MODELS.filter((m) => m !== cfg.model)];
  let modelIdx = 0;
  const maxAttempts = Math.min(4, models.length);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentModel = models[modelIdx];
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);

    try {
      const url = `${cfg.baseUrl}/v1beta/models/${encodeURIComponent(currentModel)}:generateContent?key=${cfg.apiKey}`;
      const res = await fetchImpl(url, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 5000,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 429 || status === 503 || status === 500 || status === 404) {
          if (modelIdx + 1 < models.length) modelIdx++;
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`Gemini HTTP ${status}`);
      }

      const json = await res.json();
      const rawText = (json.candidates?.[0]?.content?.parts ?? []).map((x: { text?: string }) => x.text ?? '').join('').trim();
      
      const cleaned = rawText.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      const htmlBody = wrapHtmlContent({
        innerHtml: parsed.innerHtml || `<p>Dear ${p.name},</p><p>Acharya Nandram has reviewed your chart.</p>`,
        preheader: parsed.preheader || `Consultation for ${p.name}`,
        ctaText: isHi ? `परामर्श व रिपोर्ट बुक करें` : `Book ${opts.targetService}`,
        ctaUrl,
        waUrl,
        isHindi: isHi,
      });

      return {
        subjectLines: Array.isArray(parsed.subjectLines) && parsed.subjectLines.length ? parsed.subjectLines : [`Special Numerology Guidance for ${p.name}`],
        preheader: parsed.preheader || `Guidance from Acharya Nandram`,
        astrologicalHook: parsed.astrologicalHook || `Customized astrological alignment for ${p.name}`,
        htmlBody,
        plainText: parsed.plainText || `Dear ${p.name},\n\nBook your consultation at ${ctaUrl}`,
        whatsappFollowup: parsed.whatsappFollowup || `Hello ${p.name}, I sent you an email regarding ${opts.targetService}. - Acharya Nandram`,
        model: currentModel,
        isAiGenerated: true,
      };
    } catch (err) {
      if (modelIdx + 1 < models.length) {
        modelIdx++;
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }

  // Fallback if all attempts fail
  return generateOfflineScript(opts);
}
