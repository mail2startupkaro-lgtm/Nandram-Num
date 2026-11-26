/**
 * Shared report extras used by EVERY report (server PDFs and browser-printed admin reports):
 *   1. "Report Reading Guide" – printed right after the contents list.
 *   2. "About your numerologist + all services" CTA – printed at the end of the report.
 * All markup uses its own `rg-` / `xs-` classes and self-contained CSS, so it drops into any report template.
 */
import QRCode from 'qrcode';
import { DEFAULT_SERVICES } from '@/lib/billing/services';
import { esc, monogram } from '@/lib/pdf/svg';
import { DEFAULT_BRANDING, type Branding, type PdfTheme } from '@/lib/pdf/themes';
import { humaniseDeep } from '@/lib/signature/humanise';

export type Lang = 'en' | 'hi';
export type GuideKind = 'personal' | 'mobile' | 'signature' | 'baby' | 'business' | 'compat' | 'destiny' | 'psychomatrix' | 'celebrity' | 'name';

export interface ExtrasContact { whatsapp?: string; telegram?: string; website?: string; bio?: string }
export const EXTRAS_CONTACT: ExtrasContact = {
  whatsapp: process.env.EXPERT_WHATSAPP ?? '+91 88199 99374',
  telegram: process.env.EXPERT_TELEGRAM ?? '@MYNUMEROLOGIST8',
  website: process.env.BRAND_WEBSITE || (process.env.APP_URL || 'https://www.mynumerologist.com').replace(/\/$/, ''),
  bio: process.env.EXPERT_BIO,
};

// ───────────────────────── Reading guide ─────────────────────────
const KEY: Record<GuideKind, Record<Lang, string>> = {
  personal: {
    en: 'Moolank (your birth day), Bhagyank (your full date of birth), your name number and your Personal Year are the base of every chapter. Note them from "Your Numbers at a Glance" and you will follow the rest easily.',
    hi: 'मूलांक (जन्म का दिन), भाग्यांक (पूरी जन्म तिथि), नामांक और व्यक्तिगत वर्ष – यही हर अध्याय का आधार हैं। इन्हें "आपके अंक एक नज़र में" से नोट कर लें, बाक़ी रिपोर्ट आसानी से समझ आएगी।',
  },
  mobile: {
    en: 'Your mobile number total, its single digit, the digit pairs inside it and how they sit with your Moolank and Bhagyank decide most of the score. Start with the score card, then read the pairs.',
    hi: 'मोबाइल नंबर का कुल योग, उसका एक अंक, नंबर के अंदर की अंक-जोड़ियाँ और उनका आपके मूलांक व भाग्यांक से मेल – यही स्कोर तय करते हैं। पहले स्कोर कार्ड देखें, फिर जोड़ियाँ पढ़ें।',
  },
  signature: {
    en: 'Two things are read together: how you write (strokes, slant, underline, first letter) and the number of the name you sign. Section 5 tells you what to correct first; section 6 shows the new way to sign.',
    hi: 'दो बातें साथ में पढ़ी गई हैं: आप कैसे लिखते हैं (स्ट्रोक, झुकाव, अंडरलाइन, पहला अक्षर) और जिस नाम से आप हस्ताक्षर करते हैं उसका अंक। खंड 5 बताता है पहले क्या सुधारें; खंड 6 नया हस्ताक्षर दिखाता है।',
  },
  baby: {
    en: 'Every name is checked against the child\'s Moolank and Bhagyank and given a score out of 100. The higher the score, the better the name suits the date of birth. The top three names are compared side by side.',
    hi: 'हर नाम को बच्चे के मूलांक और भाग्यांक से मिलाकर 100 में से स्कोर दिया गया है। स्कोर जितना ऊँचा, नाम जन्म तिथि के उतना अनुकूल। शीर्ष तीन नामों की तुलना साथ-साथ दी गई है।',
  },
  business: {
    en: 'The owner\'s numbers (Moolank, Bhagyank, name number) come first; every business name, partner and launch date is then checked against them. Read the CEO section first, then the name analysis.',
    hi: 'पहले मालिक के अंक (मूलांक, भाग्यांक, नामांक) आते हैं; फिर हर व्यवसाय नाम, साझेदार और लॉन्च तिथि उन्हीं से मिलाई गई है। पहले CEO खंड पढ़ें, फिर नाम विश्लेषण।',
  },
  compat: {
    en: 'Each business is given a score out of 100 for your numbers: 75+ very favourable · 62–74 favourable · 48–61 average · below 48 not recommended. Start with the top recommendations.',
    hi: 'हर व्यवसाय को आपके अंकों के लिए 100 में से स्कोर मिला है: 75+ अत्यंत अनुकूल · 62–74 अनुकूल · 48–61 सामान्य · 48 से कम अनुशंसित नहीं। शीर्ष सुझावों से शुरू करें।',
  },
  destiny: {
    en: 'Every position of the matrix holds an energy from 1 to 22, worked out from your date of birth. Read the chart first, then each zone. In the life timeline your current age period is highlighted.',
    hi: 'मैट्रिक्स की हर स्थिति में 1 से 22 तक की एक ऊर्जा है, जो आपकी जन्म तिथि से निकाली गई है। पहले चार्ट देखें, फिर हर क्षेत्र। जीवन-रेखा में आपकी वर्तमान आयु-अवधि हाइलाइट है।',
  },
  psychomatrix: {
    en: 'The 3×3 square shows how many times each digit 1–9 appears in your date of birth and working numbers. More copies of a digit mean that quality is stronger; an empty cell is a quality to develop.',
    hi: '3×3 वर्ग दिखाता है कि आपकी जन्म तिथि और कार्य-अंकों में 1–9 का हर अंक कितनी बार आया है। किसी अंक की जितनी अधिक प्रतियाँ, वह गुण उतना मज़बूत; ख़ाली खाना वह गुण है जिसे विकसित करना है।',
  },
  celebrity: {
    en: 'The Mulank, Bhagyank and name number are worked out from publicly known birth details, then read against the person\'s life and career. Use it to learn how numbers show up in a real life.',
    hi: 'मूलांक, भाग्यांक और नामांक सार्वजनिक रूप से ज्ञात जन्म विवरण से निकाले गए हैं और फिर व्यक्ति के जीवन और करियर से मिलाए गए हैं। इससे समझें कि अंक वास्तविक जीवन में कैसे दिखते हैं।',
  },
  name: {
    en: 'Your name is added up with Chaldean letter values (main system) and Pythagorean values (second opinion). The spelling marked best suits your date of birth most closely.',
    hi: 'आपके नाम को कैल्डियन अक्षर-मान (मुख्य पद्धति) और पाइथागोरियन मान (दूसरी राय) से जोड़ा गया है। जिस वर्तनी को सर्वश्रेष्ठ चिह्नित किया गया है, वह आपकी जन्म तिथि से सबसे अधिक मेल खाती है।',
  },
};

const G = {
  en: {
    title: 'Report Reading Guide', intro: 'Take two minutes with this page before you start. It will help you understand every section of your report.',
    steps: (key: string) => [
      ['Start with the summary', 'The first pages give the main result in short. Read them first, then go to the sections that matter most to you – you do not have to read in order.'],
      ['Know your key numbers', key],
      ['Reading a number like 32/5', '32 is the compound number (the full total) and 3 + 2 = 5 is the single number. Both are read: the single number shows the basic nature, the compound shows how it works out.'],
      ['Colour key', 'Green means it supports you, amber means mixed – use with care, and red means it needs attention. Ticks (✓) mark the good months, dates and options.'],
      ['Using the remedies', 'Start with one or two remedies, follow them regularly for 21 to 40 days, then add more only if you need them. Small, steady practice works better than many remedies at once.'],
      ['Dates and years', 'Your Personal Year runs from one birthday to the next. Good dates and years are favourable windows, not guarantees – plan important steps around them and keep doing your part.'],
      ['Have a question?', 'If any line is not clear, message me on Telegram with your name and report title. I will explain it.'],
    ],
    green: 'Supports you', amber: 'Mixed – use with care', red: 'Needs attention',
  },
  hi: {
    title: 'रिपोर्ट पढ़ने की मार्गदर्शिका', intro: 'शुरू करने से पहले इस पेज को दो मिनट दें। इससे आप अपनी रिपोर्ट का हर खंड आसानी से समझ पाएँगे।',
    steps: (key: string) => [
      ['सारांश से शुरू करें', 'पहले पेजों में मुख्य परिणाम संक्षेप में है। पहले उन्हें पढ़ें, फिर उन खंडों पर जाएँ जो आपके लिए सबसे ज़रूरी हैं – क्रम से पढ़ना ज़रूरी नहीं।'],
      ['अपने मुख्य अंक जानें', key],
      ['32/5 जैसा अंक कैसे पढ़ें', '32 संयुक्त अंक (पूरा योग) है और 3 + 2 = 5 एकल अंक है। दोनों पढ़े जाते हैं: एकल अंक मूल स्वभाव बताता है, संयुक्त अंक बताता है कि वह कैसे फल देता है।'],
      ['रंगों का अर्थ', 'हरा = आपका साथ देता है, नारंगी = मिला-जुला, सावधानी से, लाल = ध्यान देने की ज़रूरत। सही का निशान (✓) अच्छे महीने, तिथियाँ और विकल्प दिखाता है।'],
      ['उपाय कैसे करें', 'एक-दो उपायों से शुरू करें, 21 से 40 दिन नियमित करें, ज़रूरत हो तभी और जोड़ें। एक साथ कई उपायों से बेहतर है थोड़ा पर नियमित अभ्यास।'],
      ['तिथियाँ और वर्ष', 'आपका व्यक्तिगत वर्ष एक जन्मदिन से अगले जन्मदिन तक चलता है। शुभ तिथियाँ और वर्ष अनुकूल समय हैं, गारंटी नहीं – ज़रूरी काम इनके आसपास योजना से करें और अपना प्रयास जारी रखें।'],
      ['कोई प्रश्न है?', 'अगर कोई बात स्पष्ट न हो तो अपने नाम और रिपोर्ट के शीर्षक के साथ मुझे टेलीग्राम पर संदेश भेजें। मैं समझा दूँगा।'],
    ],
    green: 'आपका साथ देता है', amber: 'मिला-जुला – सावधानी से', red: 'ध्यान देने की ज़रूरत',
  },
};

export function guideCss(t: PdfTheme): string {
  return `
  .rg{margin:6mm 0 2mm;border:1px solid ${t.accent}88;border-radius:3.5mm;padding:4mm 5mm 3mm;background:${t.paper};break-inside:avoid;page-break-inside:avoid;font-family:inherit}
  .rg-h{display:flex;align-items:center;gap:3mm;margin:0 0 1mm}
  .rg-h .rg-ic{width:8mm;height:8mm;border-radius:50%;background:${t.primary};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11pt;flex:none;font-family:Georgia,serif}
  .rg-h h2,.rg-h h3{margin:0;font-family:'Playfair Display','Noto Sans Devanagari',Georgia,serif;font-size:15pt;color:${t.primary};border:0;padding:0}
  .rg-in{font-size:8.8pt;color:${t.muted};margin:0 0 2.5mm;text-align:left}
  .rg-st{display:grid;grid-template-columns:1fr 1fr;gap:2mm 5mm;margin:0;padding:0;list-style:none}
  .rg-st li{display:grid;grid-template-columns:6mm 1fr;gap:2mm;align-items:start;break-inside:avoid;margin:0}
  .rg-st li .n{width:6mm;height:6mm;border-radius:50%;border:1px solid ${t.accent};color:${t.primary};font-weight:700;font-size:8pt;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;background:${t.soft}}
  .rg-st li b{display:block;font-size:9pt;color:${t.primary};line-height:1.3}
  .rg-st li span{display:block;font-size:8pt;line-height:1.42;color:${t.ink};text-align:left}
  .rg-st li.wide{grid-column:1 / -1}
  .rg-key{display:flex;flex-wrap:wrap;gap:4mm;margin-top:2.5mm;padding-top:2mm;border-top:.6px dashed ${t.accent}88;font-size:8pt}
  .rg-key i{display:inline-block;width:3.4mm;height:3.4mm;border-radius:1mm;margin-right:1.2mm;vertical-align:-.6mm}
  `;
}

/** The Report Reading Guide panel. Place it right after the contents list. */
export function readingGuideHtml(lang: Lang, kind: GuideKind, t: PdfTheme): string {
  const g = G[lang];
  const steps = g.steps(KEY[kind][lang]);
  return `<div class="rg"><div class="rg-h"><span class="rg-ic">i</span><h3>${esc(g.title)}</h3></div>
    <p class="rg-in">${esc(g.intro)}</p>
    <ol class="rg-st">${steps.map(([h, p], i) => `<li${i === 1 ? ' class="wide"' : ''}><span class="n">${i + 1}</span><div><b>${esc(h)}</b><span>${esc(p)}</span></div></li>`).join('')}</ol>
    <div class="rg-key"><span><i style="background:${t.good}"></i>${esc(g.green)}</span><span><i style="background:${t.warn}"></i>${esc(g.amber)}</span><span><i style="background:${t.bad}"></i>${esc(g.red)}</span></div></div>`;
}

// ───────────────────────── All services + profile CTA ─────────────────────────
const C = {
  en: {
    about: 'About your numerologist', services: 'All my services', servicesD: (n: string) => `Every service is prepared and checked personally by ${n}. Choose the one that fits what you want to know next.`,
    rec: 'Recommended for you', ctaH: 'Book your next reading', ctaD: 'Message me on Telegram, or scan a code to chat or see every service with prices.',
    whatsapp: 'WhatsApp', telegram: 'Telegram', website: 'Website', scanTg: 'Scan to chat on Telegram', scanWeb: 'Scan to see all services',
    bioDefault: (name: string) => `${name} has practised numerology for more than 15 years, working with the Vedic, Chaldean and Lo Shu systems. He reads names, dates of birth, mobile numbers and signatures for individuals, families and business owners, and every report is checked by him before it is sent. He also holds regular live sessions on YouTube where viewers can have their mobile numbers read.`,
    bioOther: (name: string) => `This report was prepared and checked by ${name}.`,
  },
  hi: {
    about: 'आपके अंक ज्योतिषी', services: 'मेरी सभी सेवाएँ', servicesD: (n: string) => `हर सेवा ${n} द्वारा स्वयं तैयार और जाँची जाती है। आगे जो जानना चाहते हैं, उसके अनुसार सेवा चुनें।`,
    rec: 'आपके लिए सुझाई गई', ctaH: 'अपनी अगली रीडिंग बुक करें', ctaD: 'मुझे टेलीग्राम पर संदेश भेजें, या बात करने अथवा सभी सेवाएँ कीमत सहित देखने के लिए कोड स्कैन करें।',
    whatsapp: 'व्हाट्सऐप', telegram: 'टेलीग्राम', website: 'वेबसाइट', scanTg: 'टेलीग्राम पर बात करने के लिए स्कैन करें', scanWeb: 'सभी सेवाएँ देखने के लिए स्कैन करें',
    bioDefault: (name: string) => `${name} 15 वर्षों से अधिक समय से अंक ज्योतिष का अभ्यास कर रहे हैं और वैदिक, कैल्डियन तथा लो शू पद्धतियों से काम करते हैं। वे व्यक्तियों, परिवारों और व्यापारियों के लिए नाम, जन्म तिथि, मोबाइल नंबर और हस्ताक्षर का विश्लेषण करते हैं, और हर रिपोर्ट भेजने से पहले स्वयं जाँचते हैं। वे यूट्यूब पर नियमित लाइव सत्र भी करते हैं, जहाँ दर्शक अपने मोबाइल नंबर की जाँच करवा सकते हैं।`,
    bioOther: (name: string) => `यह रिपोर्ट ${name} द्वारा तैयार और जाँची गई है।`,
  },
};

export function servicesCss(t: PdfTheme): string {
  return `
  .xs{break-before:auto;font-family:inherit}
  .xs-h{font-family:'Playfair Display','Noto Sans Devanagari',Georgia,serif;font-size:14pt;color:${t.primary};margin:5mm 0 1mm;break-after:avoid;border:0;padding:0}
  .xs-d{font-size:8.8pt;color:${t.muted};margin:0 0 2mm;text-align:left}
  .xs-prof{display:grid;grid-template-columns:30mm 1fr;gap:5mm;align-items:center;break-inside:avoid;padding:3.5mm 5mm;border:1px solid ${t.accent}66;border-radius:4mm;background:linear-gradient(135deg,${t.soft},${t.paper})}
  .xs-prof img,.xs-prof svg{width:30mm;height:30mm;border-radius:50%;object-fit:cover;border:1.5px solid ${t.accent}}
  .xs-prof h3{font-family:'Playfair Display','Noto Sans Devanagari',Georgia,serif;font-size:16pt;color:${t.primary};margin:0;border:0;padding:0}
  .xs-prof .ti{font-size:8.4pt;color:${t.muted}}
  .xs-prof p{font-size:8.9pt;line-height:1.52;margin:1.5mm 0 0;text-align:left}
  .xs-grid{display:grid;grid-template-columns:1fr 1fr;gap:2.4mm;margin-top:1mm}
  .xs-grid .s{position:relative;border:.7px solid ${t.accent}77;border-radius:2.5mm;padding:2.4mm 3.2mm;background:${t.paper};break-inside:avoid;page-break-inside:avoid}
  .xs-grid .s.rec{border:1.2px solid ${t.accent};background:${t.soft}}
  .xs-grid .s h4{margin:0 0 .6mm;font-size:9.4pt;color:${t.primary};line-height:1.3;font-family:inherit}
  .xs-grid .s p{margin:0;font-size:7.8pt;line-height:1.42;text-align:left;color:${t.ink}}
  .xs-grid .s .tag{display:inline-block;margin-bottom:.8mm;padding:.2mm 2mm;border-radius:2mm;background:${t.accent};color:#fff;font-size:6.6pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
  .xs-grid .s .why{margin-top:.8mm;font-size:7.6pt;color:${t.accent};font-weight:600}
  .xs-grid .s .dl{margin-top:.6mm;font-size:7.2pt;color:${t.muted}}
  .xs-cta{display:grid;grid-template-columns:1fr 28mm 28mm;gap:5mm;align-items:center;margin-top:4mm;padding:4mm 5mm;border-radius:3mm;background:${t.primary};color:#fff;break-inside:avoid;page-break-inside:avoid}
  .xs-cta h4{margin:0 0 1mm;font-size:12pt;color:#fff;font-family:'Playfair Display','Noto Sans Devanagari',Georgia,serif}
  .xs-cta .lead{font-size:8.4pt;opacity:.92;margin-bottom:1.5mm;line-height:1.45}
  .xs-cta .ln{font-size:9pt;margin:.6mm 0}.xs-cta .ln b{display:inline-block;min-width:20mm;font-size:7.2pt;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
  .xs-cta .qr{background:#fff;border-radius:2mm;padding:1.5mm;line-height:0}.xs-cta .qr svg{width:100%;height:auto}
  .xs-cta .cap{font-size:6.4pt;text-align:center;margin-top:1mm;line-height:1.25;color:#fff}
  :lang(hi) .xs-grid .s .tag,:lang(hi) .xs-cta .ln b{letter-spacing:0;text-transform:none}
  `;
}

export interface ServicesCtaInput {
  lang: Lang;
  theme: PdfTheme;
  branding?: Branding;
  contact?: ExtrasContact;
  /** Service codes shown first with a "Recommended for you" badge. */
  recommend?: readonly string[];
  /** Optional line per service code explaining why it may help this client. */
  why?: (code: string) => string;
  qrTelegram?: string;
  qrWebsite?: string;
  /** Skip the profile card (when the report already prints one just above). */
  noProfile?: boolean;
  /** Skip the Telegram / website / QR box (when the report already prints one). */
  noContactBox?: boolean;
  preparedBy?: string;
}

/** Every service, the recommended ones first (then by the catalogue order). */
export function orderedServices(recommend: readonly string[] = []) {
  const rank = (c: string) => { const i = recommend.indexOf(c); return i < 0 ? 1000 : i; };
  return DEFAULT_SERVICES.filter((s) => s.active !== false).slice().sort((a, b) => rank(a.code) - rank(b.code) || (a.sort ?? 99) - (b.sort ?? 99));
}

/** About the numerologist + all services + contact box. Place it at the end of the report. */
export function servicesCtaHtml(o: ServicesCtaInput): string {
  const lang = o.lang, l = C[lang], t = o.theme;
  const b: Branding = { ...DEFAULT_BRANDING, ...(o.branding ?? {}) } as Branding;
  const contact = { ...EXTRAS_CONTACT, ...(o.contact ?? {}) };
  const expert = o.preparedBy || b.expertName;
  const isHouse = (b.expertName || '').trim().toLowerCase() === (DEFAULT_BRANDING.expertName || '').trim().toLowerCase();
  const bio = contact.bio?.trim() || (isHouse ? l.bioDefault(b.expertName) : l.bioOther(b.expertName));
  const photo = b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" alt="">` : monogram(b.expertName, t, 120);
  const rec = new Set(o.recommend ?? []);
  const site = (contact.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cards = orderedServices(o.recommend).map((s) => {
    const txt = humaniseDeep(lang === 'hi' ? s.hi : s.en);
    const w = rec.has(s.code) ? (o.why?.(s.code) ?? '') : '';
    return `<div class="s${rec.has(s.code) ? ' rec' : ''}">${rec.has(s.code) ? `<span class="tag">${esc(l.rec)}</span>` : ''}<h4>${esc(txt.name)}</h4><p>${esc(txt.short)}</p>${w ? `<div class="why">${esc(w)}</div>` : ''}<div class="dl">${esc(txt.delivery)}</div></div>`;
  }).join('');
  const prof = o.noProfile ? '' : `<h3 class="xs-h">${esc(l.about)}</h3><div class="xs-prof">${photo}<div><h3>${esc(b.expertName)}</h3><div class="ti">${esc(b.expertTitle ?? '')}</div><p>${esc(bio)}</p></div></div>`;
  const box = o.noContactBox ? '' : `<div class="xs-cta"><div><h4>${esc(l.ctaH)}</h4><div class="lead">${esc(l.ctaD)}</div>
      ${contact.telegram ? `<div class="ln"><b>${esc(l.telegram)}</b>${esc(contact.telegram)}</div>` : ''}
      ${site ? `<div class="ln"><b>${esc(l.website)}</b>${esc(site)}</div>` : ''}</div>
    ${o.qrTelegram ? `<div><div class="qr">${o.qrTelegram}</div><div class="cap">${esc(l.scanTg)}</div></div>` : '<div></div>'}
    ${o.qrWebsite ? `<div><div class="qr">${o.qrWebsite}</div><div class="cap">${esc(l.scanWeb)}</div></div>` : '<div></div>'}</div>`;
  return `<div class="xs">${prof}<h3 class="xs-h">${esc(l.services)}</h3><p class="xs-d">${esc(l.servicesD(expert))}</p><div class="xs-grid">${cards}</div>${box}</div>`;
}

const tgLink = (handle: string) => `https://t.me/${handle.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')}`;
const qr = (text: string) => QRCode.toString(text, { type: 'svg', margin: 0, width: 150, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });

/** Telegram chat + website/services QR codes (SVG markup). */
export async function contactQrs(contact: ExtrasContact = EXTRAS_CONTACT): Promise<{ qrTelegram: string; qrWebsite: string }> {
  const c = { ...EXTRAS_CONTACT, ...contact };
  const url = `${(c.website || 'https://www.mynumerologist.com').replace(/\/$/, '')}/services`;
  const [qrTelegram, qrWebsite] = await Promise.all([c.telegram ? qr(tgLink(c.telegram)) : Promise.resolve(''), qr(/^https?:\/\//.test(url) ? url : `https://${url}`)]);
  return { qrTelegram, qrWebsite };
}

/** Recommended services per report kind (shown first with a badge). */
export const RECOMMEND: Record<GuideKind, string[]> = {
  personal: ['SVC_PERSONAL_REPORT', 'SVC_LOSHU', 'SVC_NAME_CORRECTION', 'SVC_PERSONAL_YEAR'],
  mobile: ['SVC_MOBILE_NUMBER', 'SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_PERSONAL_YEAR', 'SVC_SIGNATURE', 'SVC_COUPLE'],
  signature: ['SVC_NAME_CORRECTION', 'SVC_PERSONAL_REPORT', 'SVC_MOBILE_NUMBER', 'SVC_PERSONAL_YEAR', 'SVC_COUPLE', 'SVC_BUSINESS_NAME'],
  baby: ['SVC_BABY_NAME', 'SVC_PERSONAL_REPORT', 'SVC_LOSHU', 'SVC_NAME_CORRECTION', 'SVC_COUPLE', 'SVC_MOBILE_NUMBER'],
  business: ['SVC_BUSINESS_COMPLETE', 'SVC_BUSINESS_NAME', 'SVC_BUSINESS_COMPAT', 'SVC_MOBILE_NUMBER'],
  compat: ['SVC_BUSINESS_COMPLETE', 'SVC_BUSINESS_NAME', 'SVC_BUSINESS_COMPAT', 'SVC_PERSONAL_REPORT'],
  destiny: ['SVC_DESTINY_MATRIX', 'SVC_BIRTH_CHART', 'SVC_PERSONAL_REPORT', 'SVC_PERSONAL_YEAR'],
  psychomatrix: ['SVC_BIRTH_CHART', 'SVC_DESTINY_MATRIX', 'SVC_LOSHU', 'SVC_PERSONAL_REPORT'],
  celebrity: ['SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_DESTINY_MATRIX'],
  name: ['SVC_NAME_CORRECTION', 'SVC_SIGNATURE', 'SVC_PERSONAL_REPORT', 'SVC_BABY_NAME'],
};

/** Everything a browser-printed report needs: CSS + guide + services CTA (with QR codes). */
export async function printExtras(lang: Lang, kind: GuideKind, theme: PdfTheme, preparedBy?: string) {
  const qrs = await contactQrs();
  return {
    css: guideCss(theme) + servicesCss(theme),
    guide: readingGuideHtml(lang, kind, theme),
    cta: servicesCtaHtml({ lang, theme, recommend: RECOMMEND[kind], preparedBy, ...qrs }),
  };
}
