/**
 * Service-wise Email Marketing Templates for Lead Generation
 * Curated for Acharya Nandram (myNumerologist.com).
 * Includes high-open-rate subject lines, responsive gold/maroon HTML email bodies,
 * plain text versions, bilingual support (English + Hindi), and merge tags.
 */

export interface EmailTemplate {
  id: string;
  serviceCode: string;
  serviceSlug: string;
  serviceName: { en: string; hi: string };
  category: 'Personal' | 'Business' | 'Relationship' | 'Name & Identity' | 'Lead Nurture';
  targetAudience: { en: string; hi: string };
  suggestedDiscount?: string;
  variables: string[];
  en: {
    subjectLines: string[];
    preheader: string;
    htmlBody: string;
    plainText: string;
  };
  hi: {
    subjectLines: string[];
    preheader: string;
    htmlBody: string;
    plainText: string;
  };
}

export const EMAIL_VARIABLES = [
  { key: 'name', label: 'Client Full Name', sample: 'Rahul Sharma' },
  { key: 'moolank', label: 'Moolank (Root Number)', sample: '7' },
  { key: 'bhagyank', label: 'Bhagyank (Destiny Number)', sample: '1' },
  { key: 'dob', label: 'Date of Birth', sample: '16 Oct 1992' },
  { key: 'phone', label: 'Mobile Number', sample: '+91 98765 43210' },
  { key: 'discountCode', label: 'Offer Promo Code', sample: 'LUCKY500' },
  { key: 'consultUrl', label: 'Booking URL', sample: 'https://www.mynumerologist.com/services' },
  { key: 'whatsappUrl', label: 'WhatsApp Chat URL', sample: 'https://wa.me/918819999374' },
];

/**
 * Standard luxury responsive email wrapper for myNumerologist branding
 */
function wrapHtml(content: string, preheader: string, ctaText: string, ctaUrl: string, waUrl: string, isHindi: boolean): string {
  const footerNotice = isHindi
    ? 'यह ईमेल आपको myNumerologist.com पर आपकी रुचि के आधार पर भेजा गया है। आचार्य नंदराम - 15+ वर्षों का वैदिक व कैल्डियन अंक ज्योतिष अनुभव।'
    : 'You received this email because of your inquiry or consultation request at myNumerologist.com. Acharya Nandram — 15+ years of Vedic & Chaldean Numerology expertise.';

  const waBtnText = isHindi ? '💬 व्हाट्सएप पर आचार्य जी से बात करें' : '💬 Chat with Acharya Ji on WhatsApp';

  return `<!DOCTYPE html>
<html lang="${isHindi ? 'hi' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>myNumerologist</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
  <!-- Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 25px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #131b2e; border: 1px solid #d4af3740; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Top Gold Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #d4af37 0%, #f3e5ab 50%, #d4af37 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td style="padding: 28px 30px 18px 30px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.15);">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; line-height: 26px;">✨</span>
                    <h1 style="margin: 6px 0 2px 0; font-size: 22px; font-weight: 700; color: #f5eedc; letter-spacing: 0.5px; font-family: Georgia, serif;">
                      my<span style="color: #d4af37;">Numerologist</span>
                    </h1>
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #d4af37;">
                      ${isHindi ? 'आचार्य नंदराम • प्रामाणिक अंक ज्योतिष मार्गदर्शन' : 'Acharya Nandram • Vedic & Chaldean Numerology'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Body Content -->
          <tr>
            <td style="padding: 30px 32px 24px 32px; font-size: 15px; line-height: 1.65; color: #cbd5e1;">
              ${content}

              <!-- CTA Button Section -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 32px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #0b0f19; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(212,175,55,0.35); text-align: center; letter-spacing: 0.3px;">
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

          <!-- Acharya Nandram Trust Signature -->
          <tr>
            <td style="padding: 18px 32px; background-color: rgba(11,15,25,0.6); border-top: 1px solid rgba(212,175,55,0.15);">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                    <strong style="color: #f5eedc; font-size: 14px; font-family: Georgia, serif;">Acharya Nandram</strong><br>
                    <span>${isHindi ? 'वरिष्ठ अंक ज्योतिषी एवं वास्तु सलाहकार (15+ वर्ष अनुभव)' : 'Lead Numerologist & Life Guide (15+ Years Experience)'}</span><br>
                    <span style="font-size: 12px; color: #d4af37;">📞 +91 8819999374 &nbsp;|&nbsp; 🌐 mynumerologist.com</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #0b0f19; font-size: 11px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">${footerNotice}</p>
              <p style="margin: 0;">
                <a href="https://www.mynumerologist.com/services" style="color: #d4af37; text-decoration: none;">Services</a> &nbsp;•&nbsp; 
                <a href="https://www.mynumerologist.com/ebook" style="color: #d4af37; text-decoration: none;">Free E-Book</a> &nbsp;•&nbsp; 
                <a href="https://www.mynumerologist.com/contact" style="color: #d4af37; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // 1. Personal Numerology Report (Hero Service)
  {
    id: 'personal-numerology-report',
    serviceCode: 'SVC_PERSONAL_REPORT',
    serviceSlug: 'personal-numerology-report',
    serviceName: { en: 'Personal Numerology Report', hi: 'व्यक्तिगत अंक ज्योतिष रिपोर्ट' },
    category: 'Personal',
    targetAudience: {
      en: 'Leads seeking clarity on career, relationships, financial blockages, and full destiny blueprint.',
      hi: 'वे लोग जो करियर, रिश्ते, आर्थिक रुकावटें और सम्पूर्ण भाग्य का विश्लेषण चाहते हैं।'
    },
    suggestedDiscount: '₹500 OFF with code LUCKY500',
    variables: ['name', 'moolank', 'bhagyank', 'dob', 'discountCode', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '✨ {{name}}, your numbers reveal a hidden pattern in your life...',
        '🔮 Moolank {{moolank}} & Bhagyank {{bhagyank}} – What the planets hold for you',
        'Why are your hard efforts getting delayed? Here is your numerology answer'
      ],
      preheader: 'Acharya Nandram analyzed your birth pattern. Discover your complete personal life blueprint.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>Have you ever felt like you give 100% of your effort, but results arrive late, get stuck, or face sudden obstacles?</p>
        <p>In Vedic & Chaldean numerology, your <strong>Date of Birth ({{dob}})</strong> is not a coincidence. It governs your <strong>Moolank {{moolank}}</strong> (Core Nature) and <strong>Bhagyank {{bhagyank}}</strong> (Destiny Path).</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">What your Comprehensive Personal Report reveals:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>Core Energy:</strong> Harmony or conflict between your Moolank and Bhagyank.</li>
            <li><strong>Lo Shu Grid Analysis:</strong> Missing numbers causing specific voids in wealth or peace.</li>
            <li><strong>Career & Wealth Blueprint:</strong> Best business streams, job growth windows, and money yog.</li>
            <li><strong>Relationship & Marriage:</strong> Compatibility numbers and emotional balance.</li>
            <li><strong>Personal Year Forecast:</strong> Upcoming 12-month month-by-month timing for big decisions.</li>
            <li><strong>Simple, Practical Remedies:</strong> Colors, crystals, donation days, and easy lifestyle remedies.</li>
          </ul>
        </div>

        <p>Each report is individually reviewed and personally prepared by <strong>Acharya Nandram</strong>, addressing up to 3 of your direct questions.</p>
        
        <div style="text-align: center; margin: 24px 0 10px 0;">
          <span style="display: inline-block; background: #d4af3725; border: 1px dashed #d4af37; color: #f3e5ab; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px;">
            🎁 Special Privilege: Use Code <strong style="color: #fff;">{{discountCode}}</strong> for ₹500 Instant Discount
          </span>
        </div>
      `, 'Acharya Nandram analyzed your birth pattern. Discover your complete personal life blueprint.', 'Book Your Personal Report Now', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

Have you ever felt like you give 100% of your effort, but results arrive late, get stuck, or face sudden obstacles?

In Vedic & Chaldean numerology, your Date of Birth ({{dob}}) governs your Moolank {{moolank}} and Bhagyank {{bhagyank}}.

What your Comprehensive Personal Report reveals:
- Harmony or conflict between your Moolank and Bhagyank
- Missing numbers in your Lo Shu Grid causing money or peace voids
- Career & Wealth Blueprint: Best business/job growth windows
- Relationship & Marriage Compatibility
- Upcoming 12-Month Personal Year Forecast
- Simple, practical remedies (colors, days, crystals)

Each report is personally prepared by Acharya Nandram and answers up to 3 of your specific questions.

Special Offer: Use code {{discountCode}} for ₹500 OFF.
Book your report: {{consultUrl}}
WhatsApp Acharya Ji: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '✨ {{name}} जी, आपकी जन्मतिथि में छुपा है आपकी सफलता का सटीक रहस्य...',
        '🔮 मूलांक {{moolank}} और भाग्यांक {{bhagyank}}: क्या आपके ग्रह आपके साथ हैं?',
        'कड़ी मेहनत के बाद भी रुकावटें क्यों? जानिए आचार्य नंदराम जी से'
      ],
      preheader: 'आचार्य नंदराम जी ने आपकी जन्मतिथि का विश्लेषण किया। जानिए अपनी सम्पूर्ण व्यक्तिगत रिपोर्ट।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>क्या आपको कभी ऐसा महसूस होता है कि आप 100% मेहनत करते हैं, फिर भी सफलता ऐन मौके पर अटक जाती है या काम में अनचाही देरी होती है?</p>
        <p>अंक ज्योतिष के अनुसार आपकी <strong>जन्मतिथि ({{dob}})</strong> कोई सामान्य तारीख नहीं है। इससे बनता है आपका <strong>मूलांक {{moolank}}</strong> (स्वभाव) और <strong>भाग्यांक {{bhagyank}}</strong> (भाग्य चक्र)।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">आपकी सम्पूर्ण व्यक्तिगत रिपोर्ट में क्या शामिल है:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>मूलांक व भाग्यांक का तालमेल:</strong> क्या आपके दोनों ग्रह मित्र हैं या शत्रु?</li>
            <li><strong>लो शू ग्रिड विश्लेषण:</strong> ग्रिड के मिसिंग नंबर जो धन और मानसिक शांति में कमी लाते हैं।</li>
            <li><strong>करियर व धन लाभ:</strong> कौन सा व्यापार या नौकरी आपके भाग्य के अनुकूल है।</li>
            <li><strong>दांपत्य व संबंध:</strong> विवाह, प्रेम और पारिवारिक रिश्तों का समाधान।</li>
            <li><strong>व्यक्तिगत वर्ष (Personal Year):</strong> आने वाले 12 महीनों का महीना-वार सटीक मार्गदर्शन।</li>
            <li><strong>सटीक व आसान उपाय:</strong> शुभ रंग, शुभ दिन, रत्न/क्रिस्टल व रोजमर्रा के सरल उपाय।</li>
          </ul>
        </div>

        <p>यह रिपोर्ट किसी कंप्यूटर से ऑटो-जनरेटेड नहीं होती; इसे <strong>आचार्य नंदराम जी</strong> स्वयं पढ़कर तैयार करते हैं और आपके 3 व्यक्तिगत प्रश्नों का उत्तर देते हैं।</p>
        
        <div style="text-align: center; margin: 24px 0 10px 0;">
          <span style="display: inline-block; background: #d4af3725; border: 1px dashed #d4af37; color: #f3e5ab; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px;">
            🎁 विशेष आशीर्वाद छूट: कूपन कोड <strong style="color: #fff;">{{discountCode}}</strong> से तुरंत ₹500 की छूट पाएं
          </span>
        </div>
      `, 'आचार्य नंदराम जी ने आपकी जन्मतिथि का विश्लेषण किया। जानिए अपनी सम्पूर्ण व्यक्तिगत रिपोर्ट।', 'अपनी व्यक्तिगत रिपोर्ट अभी बुक करें', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

क्या आपको कभी ऐसा महसूस होता है कि आप 100% मेहनत करते हैं, फिर भी सफलता ऐन मौके पर अटक जाती है?

आपकी जन्मतिथि ({{dob}}) से आपका मूलांक {{moolank}} और भाग्यांक {{bhagyank}} निर्धारित होता है।

आपकी सम्पूर्ण रिपोर्ट में क्या मिलेगा:
- मूलांक और भाग्यांक का आपसी तालमेल
- लो शू ग्रिड में मिसिंग नंबरों का समाधान
- करियर, व्यापार और धन लाभ के अनुकूल समय
- विवाह और पारिवारिक संबंधों का विश्लेषण
- आगामी 12 महीनों का व्यक्तिगत वर्ष भविष्यफल
- बिना किसी महंगे अनुष्ठान के सरल व प्रभावशाली उपाय

आचार्य नंदराम जी द्वारा व्यक्तिगत रूप से तैयार की गई रिपोर्ट और 3 प्रश्नों के उत्तर।

विशेष छूट: कूपन कोड {{discountCode}} से ₹500 की छूट प्राप्त करें।
रिपोर्ट बुक करें: {{consultUrl}}
व्हाट्सएप परामर्श: {{whatsappUrl}}`
    }
  },

  // 2. Name Numerology & Name Correction
  {
    id: 'name-numerology-correction',
    serviceCode: 'SVC_NAME_CORRECTION',
    serviceSlug: 'name-numerology',
    serviceName: { en: 'Name Numerology & Correction', hi: 'नाम अंक ज्योतिष व नाम सुधार' },
    category: 'Name & Identity',
    targetAudience: {
      en: 'Individuals whose current name spelling vibrates on anti-numbers or brings career/relationship struggles.',
      hi: 'वे लोग जिनके नाम की स्पेलिंग जन्मतिथि से टकराती है और करियर या जीवन में रुकावटें पैदा करती है।'
    },
    suggestedDiscount: 'Free Spelling Check + ₹300 OFF on Name Correction',
    variables: ['name', 'moolank', 'bhagyank', 'discountCode', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '⚠️ {{name}}, is your name spelling fighting against your luck?',
        'How 1 small letter change in {{name}} can unlock wealth & recognition',
        'Does your Chaldean Name Number match your Date of Birth?'
      ],
      preheader: 'Your name is spoken hundreds of times. Make sure its vibration attracts success, not friction.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>Every time someone speaks or writes your name, a specific vibrational frequency activates around you.</p>
        <p>In Chaldean Numerology, if your <strong>Name Number (Namaank)</strong> clashes with your <strong>Moolank {{moolank}}</strong> or <strong>Bhagyank {{bhagyank}}</strong>, it creates continuous energetic friction — leading to unrecognized talent, delayed promotions, and unexpected financial drain.</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">The Power of Professional Name Correction:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>No Legal Complications:</strong> You don't need to change passports or official gazettes. Simply use the corrected spelling on visiting cards, email signatures, and social media.</li>
            <li><strong>3 Lucky Spelling Options:</strong> Acharya Nandram calculates balanced Chaldean compound numbers (such as 14, 19, 23, 24, 32, or 37) that sound natural and elegant.</li>
            <li><strong>Signature Guidance:</strong> Matching slant angle and starting/ending strokes.</li>
          </ul>
        </div>

        <p>Successful actors, business tycoons, and leaders have aligned their name vibrations for exponential growth. Why leave yours to chance?</p>
      `, 'Your name is spoken hundreds of times. Make sure its vibration attracts success, not friction.', 'Get Your Name Correction Guidance', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

Every time your name is spoken, a specific numerical frequency vibrates around you.

If your Chaldean Name Number clashes with your Moolank {{moolank}} or Bhagyank {{bhagyank}}, it causes constant unseen friction.

With Acharya Nandram's Name Correction:
- 3 Lucky spelling options on powerful Chaldean compound numbers
- No legal hassles: Use it on signatures, email, social profiles
- Signature stroke & angle alignment

Align your name with your destiny: {{consultUrl}}
WhatsApp Acharya Ji: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '⚠️ {{name}} जी, क्या आपके नाम की स्पेलिंग आपके भाग्य से टकरा रही है?',
        'नाम में केवल 1 अक्षर का सही बदलाव बदल सकता है आपकी किस्मत...',
        'क्या आपका नामांक आपके मूलांक {{moolank}} और भाग्यांक का मित्र है?'
      ],
      preheader: 'आपका नाम दिन में सैकड़ों बार लिया जाता है। जानिए क्या यह सफलता ला रहा है या रुकावट।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>जब भी कोई आपका नाम लेता है या लिखता है, ब्रह्मांड में एक विशिष्ट ऊर्जा कंपन (vibration) उत्पन्न होती है।</p>
        <p>कैल्डियन अंक ज्योतिष के अनुसार, यदि आपका <strong>नामांक</strong> आपके <strong>मूलांक {{moolank}}</strong> या <strong>भाग्यांक {{bhagyank}}</strong> का शत्रु अंक बन जाए, तो व्यक्ति को कड़ी मेहनत के बावजूद उसका पूरा श्रेय नहीं मिलता और धन का ठहराव नहीं हो पाता।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">आचार्य नंदराम जी द्वारा नाम सुधार (Name Correction) के लाभ:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>कोई क़ानूनी झंझट नहीं:</strong> सरकारी दस्तावेज़ या पासपोर्ट बदलने की ज़रूरत नहीं है। केवल हस्ताक्षर, ईमेल, सोशल मीडिया व विज़िटिंग कार्ड में उपयोग करना होता है।</li>
            <li><strong>3 शुभ स्पेलिंग विकल्प:</strong> आपके लिए 14, 19, 23, 24, 32, 37 जैसे सबसे शुभ कैल्डियन संयुक्त अंकों पर आधारित 3 स्वाभाविक स्पेलिंग।</li>
            <li><strong>हस्ताक्षर (Signature) मार्गदर्शन:</strong> सही कोण, कलम का प्रवाह और अंडरलाइन का सही नियम।</li>
          </ul>
        </div>

        <p>कई फ़िल्मी सितारे, राजनेता और उद्योगपति अपने नाम की स्पेलिंग संतुलित करके ही शिखर पर पहुंचे हैं।</p>
      `, 'आपका नाम दिन में सैकड़ों बार लिया जाता है। जानिए क्या यह सफलता ला रहा है या रुकावट।', 'अपना नाम सुधार मार्गदर्शन प्राप्त करें', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

कैल्डियन अंक ज्योतिष के अनुसार, यदि आपके नाम का अंक (नामांक) आपके मूलांक {{moolank}} या भाग्यांक से टकराता है, तो मेहनत का पूरा फल नहीं मिलता।

आचार्य नंदराम जी से नाम सुधार के लाभ:
- 3 अत्यंत शुभ कैल्डियन स्पेलिंग विकल्प
- बिना किसी क़ानूनी परेशानी के रोज़मर्रा और सिग्नेचर में प्रयोग
- हस्ताक्षर का सही कोण और दिशा

अपने नाम को भाग्यशाली बनाएं: {{consultUrl}}
व्हाट्सएप पर बात करें: {{whatsappUrl}}`
    }
  },

  // 3. Mobile Number Numerology
  {
    id: 'mobile-number-numerology',
    serviceCode: 'SVC_MOBILE_NUMEROLOGY',
    serviceSlug: 'mobile-number-numerology',
    serviceName: { en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंक ज्योतिष' },
    category: 'Name & Identity',
    targetAudience: {
      en: 'Business owners, consultants, and professionals whose phones ring with financial transactions daily.',
      hi: 'व्यापारी, सेल्स व कामकाजी लोग जिनका फ़ोन दिन भर पैसों और सौदों के लिए बजता है।'
    },
    suggestedDiscount: 'Free Mobile Total Check',
    variables: ['name', 'phone', 'moolank', 'bhagyank', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '📱 {{name}}, is your mobile number attracting money or draining it?',
        'Dangerous digit combinations inside your phone number (Check Now)',
        'Why business deals slip away on call: The secret of Mobile Numerology'
      ],
      preheader: 'Your smartphone is with you 24 hours. Its frequency influences every incoming call and transaction.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>Your mobile phone is the closest electronic device to your aura — staying in your pocket and next to your ear all day.</p>
        <p>Did you know that certain number pairs inside a 10-digit number (like 4-8, 2-8, 3-6, or repeated zero endings) can attract delayed payments, frequent misunderstandings, and unnecessary arguments?</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">What a Lucky Mobile Audit reveals:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>Total Compound Score:</strong> Does the total of your 10 digits vibrate on a wealth number (like 1, 5, or 6)?</li>
            <li><strong>Internal Digit Pairs:</strong> Detection of conflict-generating numbers and anti-pairs.</li>
            <li><strong>Custom Recommendations:</strong> Exact criteria for purchasing a new lucky SIM or corporate line matching your Moolank {{moolank}} and Bhagyank {{bhagyank}}.</li>
          </ul>
        </div>

        <p>Before you make your next important client call, audit your phone number frequency.</p>
      `, 'Your smartphone is with you 24 hours. Its frequency influences every incoming call and transaction.', 'Audit Your Mobile Number Now', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

Your mobile phone is with you 24/7. 

In Mobile Numerology, certain digit combinations attract wealth and smooth deals, while negative combinations (4-8, 2-8, 3-6, trailing zeros) cause cancelled orders and delayed payments.

Audit includes:
- Total compound score alignment with your Moolank {{moolank}}
- Analysis of all internal 2-digit pairs
- Guidelines for selecting a lucky VIP SIM

Audit your mobile number: {{consultUrl}}
WhatsApp Acharya Ji: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '📱 {{name}} जी, क्या आपका मोबाइल नंबर धन खींच रहा है या नुकसान करा रहा है?',
        'मोबाइल नंबर के अंदर छुपे खतरनाक अंक जोड़े (तुरंत चेक करें)',
        'फ़ोन पर बनी-बनाई डील क्यों कट जाती है? जानिए मोबाइल अंक ज्योतिष से'
      ],
      preheader: 'आपका मोबाइल 24 घंटे आपके पास रहता है। जानिए इसका नंबर आपके लिए शुभ है या नहीं।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>हमारा मोबाइल फ़ोन दिन-रात हमारे सबसे क़रीब रहता है — हर कॉल, हर बैंक SMS और हर व्यापारिक बातचीत इसी से होती है।</p>
        <p>अंक ज्योतिष में 10 अंकों के मोबाइल नंबर का कुल योग और उसके आंतरिक जोड़े (जैसे 4-8, 2-8, 3-6 या अंत में बार-बार 0 आना) सीधे तौर पर आपके व्यापार और धन के प्रवाह को प्रभावित करते हैं।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">मोबाइल नंबर विश्लेषण में क्या देखा जाता है:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>कुल योग (Compound Total):</strong> क्या आपके 10 अंकों का योग 1, 5 या 6 जैसे धनदायक अंकों पर आ रहा है?</li>
            <li><strong>आंतरिक अंकों के योग:</strong> क्या इसमें कोई शत्रु अंक युति तो नहीं है जो सौदों को ऐन वक्त पर रोक देती है?</li>
            <li><strong>भाग्यशाली नया नंबर चुनने की गाइड:</strong> आपके मूलांक {{moolank}} और भाग्यांक {{bhagyank}} के अनुसार लकी सिम का सुझाव।</li>
          </ul>
        </div>

        <p>अपने व्यवसाय और करियर में तेजी लाने के लिए अपने मोबाइल नंबर का विस्तृत विश्लेषण कराएं।</p>
      `, 'आपका मोबाइल 24 घंटे आपके पास रहता है। जानिए इसका नंबर आपके लिए शुभ है या नहीं।', 'अपने मोबाइल नंबर की जांच करवाएं', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

मोबाइल नंबर का कुल जोड़ और उसके भीतर के अंक सीधे धन और व्यावसायिक सफलता से जुड़े होते हैं।

मोबाइल अंक ज्योतिष विश्लेषण:
- 10 अंकों का कुल योग
- अंदरूनी अंक जोड़ों में शत्रु ग्रहों की पहचान
- व्यापार बढ़ाने वाले नए लकी नंबर का सुझाव

जांच करवाएं: {{consultUrl}}
व्हाट्सएप: {{whatsappUrl}}`
    }
  },

  // 4. Business & Brand Name Numerology
  {
    id: 'business-name-numerology',
    serviceCode: 'SVC_BUSINESS_NAME',
    serviceSlug: 'business-name-numerology',
    serviceName: { en: 'Business & Brand Name Numerology', hi: 'व्यवसाय व ब्रांड नाम अंक ज्योतिष' },
    category: 'Business',
    targetAudience: {
      en: 'Founders, shop owners, startups, and companies launching new products or facing stagnation.',
      hi: 'व्यापारी, स्टार्टअप संस्थापक व दुकानदार जो बिक्री में उछाल और ब्रांड की प्रसिद्धि चाहते हैं।'
    },
    suggestedDiscount: '₹1000 OFF on Company Name Consultation',
    variables: ['name', 'discountCode', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '🏢 Is your business name vibrating on a commercial success number?',
        'Why 80% of startups fail due to incompatible brand numerology',
        'Turn your company name into a cash magnet with Chaldean Business Numerology'
      ],
      preheader: 'A business name carries commercial karma. Align it with market demand and founder destiny.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear Entrepreneur,</p>
        <p>Why do some brands take off effortlessly with massive word-of-mouth, while other businesses with superior products struggle to break even?</p>
        <p>The secret lies in <strong>Commercial Brand Vibration</strong>. A brand name must not only sound catchy; its Chaldean compound number must resonate with its specific industry and the owner's birth chart.</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">Acharya Nandram's Business Numerology Audit:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>Brand Name Harmony:</strong> Ensuring the compound number attracts high customer loyalty and strong cash flow.</li>
            <li><strong>Founder-Brand Synergy:</strong> Alignment between the company name and key partners' destiny numbers.</li>
            <li><strong>Logo Colors & Shapes:</strong> Harmonizing design elements with the ruling planetary energies of your trade.</li>
            <li><strong>Bank Account & Invoice Dates:</strong> Selecting auspicious digits for maximum retention.</li>
          </ul>
        </div>

        <p>Whether you are naming a new venture or revitalizing an existing enterprise, build your business on solid numerical foundations.</p>
      `, 'A business name carries commercial karma. Align it with market demand and founder destiny.', 'Consult on Business Numerology', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear Entrepreneur,

Why do some brands scale effortlessly while others struggle?

A business name carries commercial karma. In Chaldean Numerology, your company name must vibrate on a number that attracts cash flow, trust, and growth.

Audit includes:
- Brand name compound calculation
- Synergy with founder's birth chart
- Industry-specific lucky number alignment
- Lucky logo colors & launch timing

Consult Acharya Ji for your business: {{consultUrl}}
WhatsApp: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '🏢 क्या आपकी दुकान या कंपनी का नाम व्यापार में बरकत ला रहा है?',
        'व्यवसाय में मेहनत बहुत, लेकिन बचत नहीं? जानिए कंपनी नाम अंक ज्योतिष',
        'अपने ब्रांड नाम को बनाएं धनदायक: आचार्य नंदराम जी से परामर्श'
      ],
      preheader: 'व्यापार का नाम सिर्फ पहचान नहीं, धन आगमन की चाबी है। जानिए इसका अंक ज्योतिष।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते प्रिय उद्यमी,</p>
        <p>आपने अक्सर देखा होगा कि कुछ दुकानें या कंपनियां खुलते ही तेज़ी से चल निकलती हैं, जबकि कुछ बेहतरीन सेवा देने के बाद भी ग्राहकों की कमी से जूझती हैं।</p>
        <p>अंक ज्योतिष के अनुसार किसी भी व्यापार का नाम उसके क्षेत्र (Industry) और मालिक के भाग्यांक के अनुकूल होना बेहद आवश्यक है।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">बिजनेस अंक ज्योतिष में क्या मिलता है:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>कंपनी/दुकान के नाम की शुभता:</strong> क्या नाम 15, 19, 23, 24, 32, 33 या 37 जैसे शक्तिशाली व्यापारिक अंकों पर है?</li>
            <li><strong>पार्टनर्स की अनुकूलता:</strong> क्या सभी साझीदारों की जन्मतिथियां आपस में मेल खाती हैं?</li>
            <li><strong>लोगो व रंगों का चयन:</strong> व्यापार के क्षेत्र अनुसार शुभ रंग और विज़िटिंग कार्ड का सही डिज़ाइन।</li>
            <li><strong>उद्घाटन व बड़े सौदों की शुभ तिथि:</strong> नया काम शुरू करने का सबसे शुभ समय।</li>
          </ul>
        </div>

        <p>अपने व्यवसाय को नई ऊंचाइयों पर ले जाने के लिए आज ही विशेषज्ञ मार्गदर्शन लें।</p>
      `, 'व्यापार का नाम सिर्फ पहचान नहीं, धन आगमन की चाबी है। जानिए इसका अंक ज्योतिष।', 'बिजनेस अंक ज्योतिष परामर्श लें', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते,

बिजनेस में मेहनत बहुत लेकिन मुनाफा कम?
कंपनी या दुकान के नाम का अंक ज्योतिषीय विश्लेषण कराएं।

शामिल है:
- कंपनी के नाम का कैल्डियन अंक विश्लेषण
- मालिक और ब्रांड का तालमेल
- लोगो के शुभ रंग
- नए सौदों के लिए शुभ तिथियां

परामर्श बुक करें: {{consultUrl}}
व्हाट्सएप: {{whatsappUrl}}`
    }
  },

  // 5. Signature Analysis & Correction
  {
    id: 'signature-analysis',
    serviceCode: 'SVC_SIGNATURE',
    serviceSlug: 'signature-analysis',
    serviceName: { en: 'Signature Analysis & Correction', hi: 'हस्ताक्षर विश्लेषण व सुधार' },
    category: 'Name & Identity',
    targetAudience: {
      en: 'Professionals and leaders whose signatures leak wealth or exhibit self-sabotaging strokes.',
      hi: 'वे लोग जिनके सिग्नेचर में नीचे की ओर झुकाव या कट है, जो आर्थिक रुकावट का संकेत है।'
    },
    suggestedDiscount: 'Special Signature Audit at ₹799',
    variables: ['name', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '✍️ {{name}}, is your signature blocking your financial flow?',
        'Look at your signature: Does it end with an upward or downward stroke?',
        'The subconscious wealth seal: Scientific Signature Correction'
      ],
      preheader: 'Your signature is your public energetic seal. A single wrong stroke can cause financial drain.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>Did you know that your signature represents your <strong>subconscious self-image</strong> and how money and recognition enter your life?</p>
        <p>In graphology and signature numerology, common mistakes like:</p>
        <ul style="color: #fca5a5; font-size: 14px; line-height: 1.6;">
          <li>❌ A downward declining baseline (signals depression and financial slip)</li>
          <li>❌ Crossing through letters or enclosing your name in a tight circle (self-sabotage & isolation)</li>
          <li>❌ An incomplete or dropping final stroke (leaving earned money on the table)</li>
        </ul>

        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">Acharya Nandram's Signature Optimization:</h4>
          <p style="margin: 0; font-size: 13.5px; line-height: 1.6; color: #cbd5e1;">
            Receive an exact blueprint of an <strong>ascending 15° to 30° signature</strong>, empowering initial capital letters, auspicious underlining, and placement of dots that anchor wealth.
          </p>
        </div>

        <p>Transform your daily pen stroke into an energetic magnet for growth.</p>
      `, 'Your signature is your public energetic seal. A single wrong stroke can cause financial drain.', 'Correct Your Signature Today', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

Your signature is your public energetic seal. 

Common flaws like downward slants, crossing through your name, or dropping final strokes sub-consciously drain money and momentum.

Acharya Nandram's Signature Analysis gives you:
- Complete audit of your current signature
- Corrected ascending slant (15-30 degrees)
- Auspicious underline & dot placement
- Practice sheet for quick mastery

Fix your signature: {{consultUrl}}
WhatsApp: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '✍️ {{name}} जी, क्या आपका सिग्नेचर धन को रोक रहा है?',
        'अपने हस्ताक्षर को देखें: क्या यह ऊपर की ओर चढ़ता है या नीचे गिरता है?',
        'वैज्ञानिक हस्ताक्षर सुधार (Signature Analysis) से बदलें अपनी आर्थिक स्थिति'
      ],
      preheader: 'आपका हस्ताक्षर आपके अवचेतन मन का आईना है। जानिए क्या यह सफलता का संकेत है।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>हस्ताक्षर विज्ञान (Graphology) के अनुसार, आपका सिग्नेचर केवल कागज़ पर स्याही नहीं है, बल्कि यह आपके <strong>अवचेतन मन और आर्थिक ऊर्जा का मुहर</strong> है।</p>
        <p>हस्ताक्षर में की जाने वाली सामान्य गलतियां जो भाग्य को रोकती हैं:</p>
        <ul style="color: #fca5a5; font-size: 14px; line-height: 1.6;">
          <li>❌ हस्ताक्षर का अंत नीचे की ओर झुकना (धन हानि व निराशा का सूचक)</li>
          <li>❌ अपने ही नाम पर कलम से कट लगाना या नाम को गोल घेरे में बंद करना</li>
          <li>❌ पहला अक्षर छोटा या अस्पष्ट होना (आत्मविश्वास में कमी)</li>
        </ul>

        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">आचार्य नंदराम जी द्वारा हस्ताक्षर सुधार में क्या मिलेगा:</h4>
          <p style="margin: 0; font-size: 13.5px; line-height: 1.6; color: #cbd5e1;">
            15° से 30° के शुभ <strong>उर्ध्वगामी (Ascending) कोण</strong> पर आधारित सुधारा हुआ हस्ताक्षर, मजबूत प्रथम अक्षर, धन रोकने वाली अंडरलाइन और बिंदुओं की सही जगह।
          </p>
        </div>

        <p>अपनी कलम की दिशा बदलकर अपनी किस्मत की दिशा बदलें।</p>
      `, 'आपका हस्ताक्षर आपके अवचेतन मन का आईना है। जानिए क्या यह सफलता का संकेत है।', 'हस्ताक्षर विश्लेषण व सुधार करवाएं', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

हस्ताक्षर में की गई छोटी सी गलती भी आर्थिक और मानसिक रुकावटें ला सकती है।

आचार्य नंदराम जी द्वारा हस्ताक्षर सुधार:
- वर्तमान हस्ताक्षर का सटीक विश्लेषण
- 15-30 डिग्री के शुभ कोण पर नया डिज़ाइन
- धन और सम्मान बढ़ाने वाली अंडरलाइन का सही नियम

हस्ताक्षर सुधारें: {{consultUrl}}
व्हाट्सएप: {{whatsappUrl}}`
    }
  },

  // 6. Couple & Marriage Compatibility
  {
    id: 'couple-compatibility-report',
    serviceCode: 'SVC_COUPLE_COMPATIBILITY',
    serviceSlug: 'couple-compatibility-report',
    serviceName: { en: 'Couple & Match Compatibility', hi: 'दांपत्य व विवाह अनुकूलता रिपोर्ट' },
    category: 'Relationship',
    targetAudience: {
      en: 'Couples planning marriage, newlyweds, or partners facing recurring misunderstandings.',
      hi: 'विवाह की तैयारी कर रहे जोड़े या दांपत्य जीवन में आपसी समझ व सामंजस्य चाहने वाले लोग।'
    },
    suggestedDiscount: '₹500 OFF on Complete Couple Kundali Report',
    variables: ['name', 'discountCode', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '❤️ {{name}}, what does Numerology reveal about your relationship harmony?',
        'Before you tie the knot: Check your 3-Level Numerology Compatibility',
        'Turn misunderstandings into deep bond: Complete Couple Reading'
      ],
      preheader: 'Explore the psychological and destiny compatibility of both birth charts.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>Every long-lasting relationship is built on emotional rhythm and spiritual understanding.</p>
        <p>When two people unite, their Moolanks (mental nature) and Bhagyanks (destiny flow) interact. If certain numbers clash, it shows up as recurring communication breakdowns, mismatched financial priorities, or sudden family tension.</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">In the Couple Numerology Consultation:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>Mind & Soul Synergy:</strong> How your emotional temperaments match.</li>
            <li><strong>Joint Wealth Grid:</strong> Combining both Lo Shu grids to see if one partner's numbers fulfill the other's missing elements.</li>
            <li><strong>Remedies for Harmony:</strong> Bed position, auspicious colors for your home, and remedies for peace.</li>
          </ul>
        </div>

        <p>Strengthen your bond with clarity, empathy, and cosmic balance.</p>
      `, 'Explore the psychological and destiny compatibility of both birth charts.', 'Get Couple Compatibility Report', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

Explore the cosmic harmony between you and your partner.

Numerology Compatibility reveals:
- Mental & Emotional chemistry between both Moolanks
- Combined Lo Shu Grid: How your numbers complete each other
- Simple lifestyle remedies for peace and prosperity

Check compatibility: {{consultUrl}}
WhatsApp Acharya Ji: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '❤️ {{name}} जी, आपके दांपत्य जीवन के बारे में क्या कहता है अंक ज्योतिष?',
        'विवाह से पूर्व या दांपत्य में मधुरता के लिए: दोनों जन्मतिथियों का मिलान',
        'आपसी मतभेदों को प्रेम में बदलें: संपूर्ण दांपत्य अनुकूलता रिपोर्ट'
      ],
      preheader: 'जानिए दोनों जन्मतिथियों के मूलांक व भाग्यांक का अनोखा मिलान और शांति के उपाय।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>एक सुखद और शांतिपूर्ण वैवाहिक जीवन आपसी समझ और ऊर्जा के तालमेल पर टिका होता है।</p>
        <p>जब दो लोग साथ आते हैं, तो उनके मूलांक (मन का स्वभाव) और भाग्यांक (जीवन की दिशा) आपस में मिलते हैं। यदि इनमें प्राकृतिक टकराव हो, तो छोटी-छोटी बातों पर तनाव या विचार न मिलना आम हो जाता है।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">दांपत्य अनुकूलता रिपोर्ट में क्या जानेंगे:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li><strong>मानसिक व आत्मिक तालमेल:</strong> दोनों की सोच और स्वभाव का सटीक विश्लेषण।</li>
            <li><strong>संयुक्त भाग्य ग्रिड (Joint Grid):</strong> कैसे एक साथी के नंबर दूसरे साथी के खाली नंबरों को पूरा करते हैं।</li>
            <li><strong>दांपत्य सुख के सरल उपाय:</strong> शयनकक्ष के वास्तु नियम, शुभ रंग और घर में शांति बनाए रखने के उपाय।</li>
          </ul>
        </div>

        <p>अपने रिश्ते को विश्वास और प्रेम की मजबूत नींव दें।</p>
      `, 'जानिए दोनों जन्मतिथियों के मूलांक व भाग्यांक का अनोखा मिलान और शांति के उपाय।', 'दांपत्य अनुकूलता रिपोर्ट बुक करें', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

दांपत्य जीवन में मधुरता और आपसी समझ के लिए अंक ज्योतिष मिलान:
- दोनों साथियों के मूलांक व भाग्यांक का मिलान
- संयुक्त ग्रिड द्वारा धन व समृद्धि योग
- दांपत्य सुख व शांति के सरल उपाय

रिपोर्ट बुक करें: {{consultUrl}}
व्हाट्सएप: {{whatsappUrl}}`
    }
  },

  // 7. E-Book Downloader Nurture (Lead Conversion Hero)
  {
    id: 'ebook-lead-nurture',
    serviceCode: 'SVC_PERSONAL_REPORT',
    serviceSlug: 'personal-numerology-report',
    serviceName: { en: 'E-Book Lead Nurture Funnel', hi: 'ई-बुक लीड नर्चर व कंसल्टेशन ऑफर' },
    category: 'Lead Nurture',
    targetAudience: {
      en: 'Leads who downloaded the free numerology e-book and need expert reading of their personal numbers.',
      hi: 'वे लोग जिन्होंने मुफ़्त ई-बुक डाउनलोड की है और अब अपने व्यक्तिगत जीवन का समाधान चाहते हैं।'
    },
    suggestedDiscount: '₹500 VIP Welcome Discount',
    variables: ['name', 'moolank', 'bhagyank', 'discountCode', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '📖 {{name}}, have you calculated your core numbers from the E-Book?',
        'From theory to transformation: Let Acharya Nandram read your chart',
        'Special reader privilege for {{name}} (Claim ₹500 voucher inside)'
      ],
      preheader: 'You have the book. Now take the next step and get your personalized reading.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>Thank you for downloading our signature guide, <em>"Numerology Made Easy"</em>!</p>
        <p>Reading about numbers is enlightening, but seeing how they interact in <strong>your specific life</strong> — your career shifts, your relationship dynamics, and your upcoming personal year — is where true clarity happens.</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">Why Upgrade to a 1-on-1 Personal Report:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li>A book teaches the alphabet; a personal report reads your complete life story.</li>
            <li>Get direct answers to your 3 most pressing questions from <strong>Acharya Nandram</strong>.</li>
            <li>Customized remedies tailored to your home and current circumstances.</li>
          </ul>
        </div>

        <p style="text-align: center;">
          <span style="display: inline-block; background: #d4af3725; border: 1px dashed #d4af37; color: #f3e5ab; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px;">
            🎁 E-Book Reader Gift: Use Promo Code <strong style="color: #fff;">{{discountCode}}</strong>
          </span>
        </p>
      `, 'You have the book. Now take the next step and get your personalized reading.', 'Claim Your VIP Reading Now', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

Thank you for downloading our free Numerology E-Book!

Now take the next step: Get your personalized numerology report crafted directly by Acharya Nandram.

- Complete reading of your Moolank, Bhagyank, and Lo Shu grid
- Direct answers to your 3 specific life questions
- Tailored remedies for quick results

As an e-book reader, use code {{discountCode}} for ₹500 OFF.
Book now: {{consultUrl}}
WhatsApp: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '📖 {{name}} जी, क्या आपने ई-बुक से अपने मूलांक व भाग्यांक की गणना की?',
        'किताब से आगे: अपने जीवन के 3 मुख्य प्रश्नों का सीधा उत्तर पाएं',
        'ई-बुक पाठकों के लिए विशेष छूट वाउचर (₹500 की छूट)'
      ],
      preheader: 'किताब पढ़ना पहला कदम था। अब जानिए अपनी जन्मतिथि का व्यक्तिगत और गहरा विश्लेषण।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>हमारी विशेष ई-बुक <em>"अंक ज्योतिष सीखें और समझें"</em> डाउनलोड करने के लिए आपका धन्यवाद!</p>
        <p>अंकों के मूल सिद्धांत जानना ज्ञानवर्धक है, लेकिन यह समझना कि वे <strong>आपके अपने जीवन</strong>, करियर के अवसरों, और आने वाले 12 महीनों में क्या फल देंगे — यही असली समाधान है।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">व्यक्तिगत रिपोर्ट क्यों आवश्यक है:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li>किताब सामान्य नियम बताती है; व्यक्तिगत रिपोर्ट आपकी जन्मतिथि का सटीक आईना दिखाती है।</li>
            <li><strong>आचार्य नंदराम जी</strong> से अपने 3 सबसे महत्वपूर्ण प्रश्नों के सीधे उत्तर प्राप्त करें।</li>
            <li>दैनिक जीवन में आसानी से अपनाए जा सकने वाले सटीक उपाय।</li>
          </ul>
        </div>

        <p style="text-align: center;">
          <span style="display: inline-block; background: #d4af3725; border: 1px dashed #d4af37; color: #f3e5ab; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px;">
            🎁 ई-बुक पाठक विशेष उपहार: कूपन कोड <strong style="color: #fff;">{{discountCode}}</strong> से ₹500 की छूट
          </span>
        </p>
      `, 'किताब पढ़ना पहला कदम था। अब जानिए अपनी जन्मतिथि का व्यक्तिगत और गहरा विश्लेषण।', 'अपनी वीआईपी रिपोर्ट अभी प्राप्त करें', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

ई-बुक डाउनलोड करने के लिए धन्यवाद!
किताब से आगे बढ़ें और आचार्य नंदराम जी से अपनी व्यक्तिगत रिपोर्ट तैयार करवाएं।

- अपने 3 मुख्य प्रश्नों के सीधे उत्तर
- आगामी 1 वर्ष का सटीक मार्गदर्शन
- सरल व प्रामाणिक उपाय

ई-बुक पाठकों के लिए कूपन कोड {{discountCode}} से ₹500 की छूट।
बुक करें: {{consultUrl}}
व्हाट्सएप: {{whatsappUrl}}`
    }
  },

  // 8. Free Reading Funnel Follow-up
  {
    id: 'free-reading-followup',
    serviceCode: 'SVC_PERSONAL_REPORT',
    serviceSlug: 'personal-numerology-report',
    serviceName: { en: 'Free Mini-Reading Follow-up', hi: 'मुफ़्त मिनी-रीडिंग फ़ॉलो-अप' },
    category: 'Lead Nurture',
    targetAudience: {
      en: 'Leads who used the online calculator or mini-reading form and left contact details.',
      hi: 'वे लोग जिन्होंने वेबसाइट पर फ्री कैलकुलेटर या मिनी-रीडिंग चेक की है।'
    },
    suggestedDiscount: '₹500 OFF with code LUCKY500',
    variables: ['name', 'moolank', 'bhagyank', 'discountCode', 'consultUrl', 'whatsappUrl'],
    en: {
      subjectLines: [
        '🔮 {{name}}, your Moolank {{moolank}} & Bhagyank {{bhagyank}} have an important message',
        'Did you see your numbers? Here is what they actually mean for your future',
        'Acharya Nandram noticed something in your Date of Birth...'
      ],
      preheader: 'You checked your basic numbers on our site. Now unlock the deeper story behind them.',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">Dear <strong style="color: #f5eedc;">{{name}}</strong>,</p>
        <p>A few days ago, you checked your core numbers on myNumerologist.com and discovered your <strong>Moolank {{moolank}}</strong> and <strong>Bhagyank {{bhagyank}}</strong>.</p>
        <p>That was just 5% of the iceberg.</p>
        <p>A free calculator only shows single numbers, but life is lived in the <em>interaction</em> between your numbers, your name spelling, and the current planetary cycles.</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">Unlock Your Full 15-Page Blueprint:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li>Exact timings for career promotions and wealth investments.</li>
            <li>Specific missing numbers in your Lo Shu grid and their remedies.</li>
            <li>Personal guidance from Acharya Nandram on your specific challenges.</li>
          </ul>
        </div>

        <p>Don't leave your path to guesswork when cosmic wisdom is within reach.</p>
      `, 'You checked your basic numbers on our site. Now unlock the deeper story behind them.', 'Unlock Your Full Report Now', '{{consultUrl}}', '{{whatsappUrl}}', false),
      plainText: `Dear {{name}},

You recently discovered your Moolank {{moolank}} and Bhagyank {{bhagyank}} on myNumerologist.com.

That was just 5% of what your birth chart reveals.

Get your Complete 15-Page Personal Report by Acharya Nandram:
- Career promotion and financial timing
- Lo Shu missing number remedies
- Answers to your personal questions

Use promo code {{discountCode}} for ₹500 OFF.
Book here: {{consultUrl}}
WhatsApp: {{whatsappUrl}}`
    },
    hi: {
      subjectLines: [
        '🔮 {{name}} जी, आपके मूलांक {{moolank}} और भाग्यांक {{bhagyank}} का यह रहस्य जानिए',
        'क्या आपने अपने अंक देखे? जानिए आपके आने वाले समय का सच',
        'आचार्य नंदराम जी का विशेष संदेश: आपकी जन्मतिथि के बारे में'
      ],
      preheader: 'आपने वेबसाइट पर अपने अंक देखे थे। अब जानिए उनके पीछे की पूरी कहानी।',
      htmlBody: wrapHtml(`
        <p style="margin-top: 0;">नमस्ते <strong style="color: #f5eedc;">{{name}}</strong> जी,</p>
        <p>हाल ही में आपने myNumerologist.com पर अपने अंक देखे और जाना कि आपका <strong>मूलांक {{moolank}}</strong> और <strong>भाग्यांक {{bhagyank}}</strong> है।</p>
        <p>लेकिन यह तो सिर्फ 5% जानकारी थी।</p>
        <p>मुफ़्त कैलकुलेटर केवल एक-दो अंक बताता है, जबकि असली भाग्य तब चमकता है जब आप यह समझें कि आपके दोनों अंक, आपका नाम और आपका चालू वर्ष आपस में मिलकर क्या प्रभाव दे रहे हैं।</p>
        
        <div style="background: rgba(212,175,55,0.08); border-left: 3px solid #d4af37; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 6px 0; color: #f3e5ab; font-size: 15px;">आपकी सम्पूर्ण रिपोर्ट में क्या खुलेगा:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.7;">
            <li>करियर, पदोन्नति और निवेश के लिए सबसे अनुकूल समय।</li>
            <li>लो शू ग्रिड के खाली अंकों के सरल व सटीक उपाय।</li>
            <li>आचार्य नंदराम जी द्वारा आपके व्यक्तिगत प्रश्नों का मार्गदर्शन।</li>
          </ul>
        </div>

        <p>जब ग्रहों की दिशा जानकर सफलता पाना संभव है, तो अंधेरे में तीर क्यों चलाना?</p>
      `, 'आपने वेबसाइट पर अपने अंक देखे थे। अब जानिए उनके पीछे की पूरी कहानी।', 'अपनी सम्पूर्ण रिपोर्ट अनलॉक करें', '{{consultUrl}}', '{{whatsappUrl}}', true),
      plainText: `नमस्ते {{name}} जी,

हाल ही में आपने वेबसाइट पर अपना मूलांक {{moolank}} और भाग्यांक {{bhagyank}} चेक किया था।

यह केवल 5% जानकारी थी।
अपनी संपूर्ण 15-पेज की व्यक्तिगत रिपोर्ट अनलॉक करें:
- करियर और आर्थिक लाभ का सटीक समय
- मिसिंग नंबरों के आसान उपाय
- आचार्य नंदराम जी से व्यक्तिगत उत्तर

कोड {{discountCode}} से पाएं ₹500 की विशेष छूट।
बुक करें: {{consultUrl}}
व्हाट्सएप: {{whatsappUrl}}`
    }
  }
];

/**
 * Replaces all {{key}} variables in text with provided data
 */
export function populateTemplate(
  text: string,
  data: Record<string, string | number | undefined | null>
): string {
  let out = text;
  for (const [key, val] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    out = out.replace(regex, String(val ?? ''));
  }
  return out;
}
