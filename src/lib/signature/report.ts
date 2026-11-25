/**
 * Signature Analysis Report – branded A4 PDF (same Chromium + framed-page pipeline as the main reports).
 *
 * Every section starts on a fresh page:
 *   Cover (full-bleed) · Summary of findings · 1 What your signature shows · 2 The numbers behind your signature
 *   (harmony table, letter-by-letter values, Personal Year timing) · 3 The best way to sign your name ·
 *   4 Personality and life areas · 5 What to correct · 6 Your new signature · 7 21-day practice ·
 *   8 About your numerologist + other services (CTA with WhatsApp / Telegram / website QR codes) and the disclaimer.
 */
import QRCode from 'qrcode';
import { esc, gaugeSvg, monogram, numberMedallion, ringSvg, scoreColour } from '@/lib/pdf/svg';
import { baseCss } from '@/lib/pdf/template';
import { COLOUR_HEX, DEFAULT_BRANDING, resolveTheme, type Branding, type PdfTheme, type ThemeId } from '@/lib/pdf/themes';
import { renderSheetPdf } from '@/lib/pdf/render';
import { coverDocument } from '@/lib/pdf/cover';
import { DEFAULT_SERVICES } from '@/lib/billing/services';
import { compoundMeaningHi, dayHi, optionLabelHi, professionHi } from './hindi';
import { humaniseDeep } from './humanise';
import { tr } from '@/lib/i18n/hi-terms';
import type { AgentResult, SignatureAnalysis } from './agent';
import type { LetterValue, SignatureNumbers } from './numbers';

export interface SignatureReportData {
  client: { fullName: string; signatureName?: string; dob: string; gender?: string; profession: string; goals: string[]; language: 'en' | 'hi' | 'hinglish' };
  preparedBy: string;
  numbers: SignatureNumbers;
  result: Pick<AgentResult, 'analysis' | 'source' | 'scores' | 'features'>;
  generatedAt: string;
  /** data: URLs – the annotated main sample, plus up to 3 raw samples. */
  annotated?: string;
  samples?: string[];
  expertNote?: string;
}

/** Contact details printed on the last page. Override with env vars for white-label use. */
export interface ReportContact { whatsapp?: string; telegram?: string; website?: string; bio?: string }
export const DEFAULT_CONTACT: ReportContact = {
  whatsapp: process.env.EXPERT_WHATSAPP ?? '+91 88199 99374',
  telegram: process.env.EXPERT_TELEGRAM ?? '@MYNUMEROLOGIST8',
  website: process.env.BRAND_WEBSITE || (process.env.APP_URL || 'https://www.mynumerologist.com').replace(/\/$/, ''),
  bio: process.env.EXPERT_BIO,
};
/** QR codes (SVG markup) rendered on the services page. */
export interface ReportExtras { contact?: ReportContact; qrWhatsapp?: string; qrWebsite?: string }

const L = {
  en: {
    title: 'Signature Analysis Report', sub: 'Graphology and Numerology', client: 'Client', dob: 'Date of birth', profession: 'Profession', goals: 'Goals', date: 'Report date', by: 'Prepared by', signedAs: 'Signs as',
    summary: 'Summary of findings', overall: 'Signature score', graph: 'Graphology', nameVib: 'Name vibration', first: 'First letter', prof: 'Profession fit', cons: 'Consistency',
    moolank: 'Moolank', bhagyank: 'Bhagyank', signed: 'Signed name', full: 'Full name', letter: 'First letter',
    dear: (n: string) => `Dear ${n},`, inside: 'In this report',
    s1: 'What your signature shows', s1d: 'I measured each feature from your sample and then checked it by eye. If you gave more than one sample, they were compared with each other.',
    marks: 'Marks on the sample', markList: ['Gold line: direction of the signature', 'Blue box: first letter', 'Red line: a stroke cutting through the name', 'Green line: underline', 'Purple arrow: the last stroke', 'Red circle: a dot or full stop'],
    feature: 'Feature', observed: 'What I see', meaning: 'What it indicates', impact: 'Effect', conf: 'Certainty', supports: 'Helps', neutral: 'Neutral', watch: 'Needs attention',
    high: 'High', medium: 'Medium', low: 'Low', expert: 'Checked by hand', measured: 'Measured', samples: 'Samples received',
    s2: 'The numbers behind your signature', s2d: 'Your signature carries the number of the name you write. Below, that number is compared with your Moolank (birth day) and Bhagyank (full date of birth), using the Chaldean letter values.',
    number: 'Number', value: 'Value', planet: 'Planet', toB: 'With Bhagyank', toM: 'With Moolank', nature: 'Nature', friendly: 'Numbers that suit you', avoid: 'Numbers to keep away from',
    friend: 'Friendly', neutralR: 'Neutral', enemy: 'Not friendly', favourable: 'Favourable', mixed: 'Mixed', unfavourable: 'Unfavourable',
    lettersH: 'Letter by letter', lettersD: 'Chaldean value of each letter you write. The total is the compound number; its digits added give the single number.', total: 'Total',
    lSigned: 'Name you sign now', lFull: 'Full name', lBest: 'Suggested form',
    pyH: 'Timing: your Personal Year', pyNow: (n: number, p: string) => `You are in Personal Year ${n} (${p}).`, pyNext: (n: number, f: string) => `Personal Year ${n} begins on ${f}.`,
    s3: 'The best way to sign your name', s3d: 'Each way of writing your name has its own number. Your current form is listed first. The others are ranked by how well they suit your Moolank, Bhagyank and profession.',
    form: 'Name form', score: 'Score', recommended: 'Suggested', current: 'Current',
    recoYes: (t: string, a: string, b: string, bh: number) => `Sign as “${t}”. Its number ${b} sits better with your Bhagyank ${bh} than the name you sign now (${a}). Keep the spelling exactly as shown.`,
    recoNo: 'The form you sign now is already among the best for your numbers, so there is no need to change the name. Work on the strokes listed in section 5 instead.',
    s4: 'Personality and life areas', s4d: 'What your signature and numbers suggest about how you think, work and deal with people. These are tendencies, not fixed facts.',
    personality: 'Personality', career: 'Career', finance: 'Money matters', relationships: 'Relationships', strengths: 'Strengths', watchouts: 'Things to watch',
    s5: 'What to correct', s5d: 'Start with the first item. The changes are small; most people get used to them within a week or two.', priority: { high: 'Do this first', medium: 'Next', low: 'Optional' },
    s6: 'Your new signature', s6d: 'Follow these steps in order each time you sign.', steps: 'How to sign', do: 'Do', dont: 'Avoid', start: 'When to start', ink: 'Ink colour', practice: 'Practice', dates: 'Good dates to start', luckyCol: 'Your colours',
    s7: '21-day practice', tracker: 'Practice chart', trackerD: 'Practise the new signature every day (traditionally 108 times) and tick the day. Keep using your old signature on existing bank and legal records until you update them through the proper process.',
    practiceTips: ['Use the same pen and ink every day.', 'Sit straight and write on a flat surface.', 'Sign slowly for the first week, then at your normal speed.', 'From day 22, use the new signature on all new documents.'],
    expertNote: 'A note from me', sig: 'Signature',
    s8: 'About your numerologist', services: 'Other ways I can help you', servicesD: 'If you would like to go further, these readings work well alongside your signature correction.',
    contact: 'Book or ask a question', whatsapp: 'WhatsApp', telegram: 'Telegram', website: 'Website', scanWa: 'Scan to chat on WhatsApp', scanWeb: 'Scan to see all services',
    disclaimer: 'Signature analysis gives guidance based on the traditions of graphology and numerology. It is not medical, psychological, legal or financial advice. Results depend on your own effort and circumstances, and no outcome is guaranteed. Change bank and legal signatures only through the proper process.',
    madeLine: (by: string) => `Prepared by ${by} from your signature samples and your date of birth`, none: 'Nothing significant', day: 'Day',
    bioDefault: (name: string) => `${name} has practised numerology for more than 15 years, working with the Vedic, Chaldean and Lo Shu systems. He reads names, dates of birth, mobile numbers and signatures for individuals, families and business owners, and every report is checked by him before it is sent. He also holds regular live sessions on YouTube where viewers can have their mobile numbers read.`,
    bioOther: (name: string) => `This report was prepared and checked by ${name}.`,
    why: { name: (n: SignatureNumbers, rel: string) => `Your full name adds up to ${n.fullName.single}, which is ${rel} to your Bhagyank ${n.bhagyank}.`, mobile: (n: SignatureNumbers) => `Mobile totals that suit you: ${n.friendly.join(', ')}.`, year: (n: SignatureNumbers) => n.personalYear ? `You are in Personal Year ${n.personalYear.number} right now.` : 'Plan the next 12 months month by month.' },
    relWord: { friend: 'friendly', neutral: 'neutral', enemy: 'not friendly' } as Record<string, string>,
  },
  hi: {
    title: 'हस्ताक्षर विश्लेषण रिपोर्ट', sub: 'हस्तलेख विज्ञान और अंक ज्योतिष', client: 'क्लाइंट', dob: 'जन्म तिथि', profession: 'पेशा', goals: 'लक्ष्य', date: 'रिपोर्ट तिथि', by: 'तैयारकर्ता', signedAs: 'हस्ताक्षर में नाम',
    summary: 'मुख्य निष्कर्ष', overall: 'हस्ताक्षर स्कोर', graph: 'हस्तलेख', nameVib: 'नाम कंपन', first: 'पहला अक्षर', prof: 'पेशा अनुकूलता', cons: 'एकरूपता',
    moolank: 'मूलांक', bhagyank: 'भाग्यांक', signed: 'हस्ताक्षर नाम', full: 'पूरा नाम', letter: 'पहला अक्षर',
    dear: (n: string) => `प्रिय ${n},`, inside: 'इस रिपोर्ट में',
    s1: 'आपका हस्ताक्षर क्या दर्शाता है', s1d: 'मैंने आपके नमूने से हर विशेषता को मापा और फिर आँख से जाँचा। एक से अधिक नमूने होने पर उन्हें आपस में मिलाया गया।',
    marks: 'नमूने पर निशान', markList: ['सुनहरी रेखा: हस्ताक्षर की दिशा', 'नीला बॉक्स: पहला अक्षर', 'लाल रेखा: नाम को काटती रेखा', 'हरी रेखा: नीचे की रेखा', 'बैंगनी तीर: आख़िरी स्ट्रोक', 'लाल घेरा: बिंदु या पूर्ण विराम'],
    feature: 'विशेषता', observed: 'क्या दिखा', meaning: 'क्या दर्शाता है', impact: 'प्रभाव', conf: 'निश्चितता', supports: 'सहायक', neutral: 'सामान्य', watch: 'ध्यान दें',
    high: 'उच्च', medium: 'मध्यम', low: 'कम', expert: 'हाथ से जाँचा', measured: 'मापा गया', samples: 'प्राप्त नमूने',
    s2: 'आपके हस्ताक्षर के पीछे के अंक', s2d: 'हस्ताक्षर में आप जो नाम लिखते हैं, उसका अपना अंक होता है। नीचे उस अंक की तुलना आपके मूलांक (जन्म का दिन) और भाग्यांक (पूरी जन्म तिथि) से की गई है, कैल्डियन अक्षर-मानों के अनुसार।',
    number: 'अंक', value: 'मान', planet: 'ग्रह', toB: 'भाग्यांक से', toM: 'मूलांक से', nature: 'प्रकृति', friendly: 'आपके अनुकूल अंक', avoid: 'जिन अंकों से बचें',
    friend: 'मित्र', neutralR: 'सम', enemy: 'शत्रु', favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ',
    lettersH: 'अक्षर-दर-अक्षर', lettersD: 'आप जो अक्षर लिखते हैं, हर एक का कैल्डियन मान। जोड़ संयुक्त अंक है; उसके अंकों को जोड़ने पर मूल अंक मिलता है।', total: 'जोड़',
    lSigned: 'अभी का हस्ताक्षर नाम', lFull: 'पूरा नाम', lBest: 'सुझाया गया रूप',
    pyH: 'समय: आपका व्यक्तिगत वर्ष', pyNow: (n: number, p: string) => `अभी आपका व्यक्तिगत वर्ष ${n} चल रहा है (${p})।`, pyNext: (n: number, f: string) => `व्यक्तिगत वर्ष ${n} ${f} से शुरू होगा।`,
    s3: 'नाम लिखने का सबसे अच्छा तरीका', s3d: 'नाम लिखने के हर तरीके का अपना अंक होता है। आपका अभी का रूप सबसे ऊपर है। बाकी रूप आपके मूलांक, भाग्यांक और पेशे से मेल के क्रम में हैं।',
    form: 'नाम का रूप', score: 'स्कोर', recommended: 'सुझाया गया', current: 'वर्तमान',
    recoYes: (t: string, a: string, b: string, bh: number) => `हस्ताक्षर में “${t}” लिखें। इसका अंक ${b} आपके भाग्यांक ${bh} से, अभी के नाम (${a}) की तुलना में, बेहतर मेल खाता है। वर्तनी ठीक वैसी ही रखें जैसी लिखी है।`,
    recoNo: 'आप अभी जिस रूप में हस्ताक्षर करते हैं, वह आपके अंकों के लिए पहले से अच्छे रूपों में है, इसलिए नाम बदलने की ज़रूरत नहीं। भाग 5 में बताए गए स्ट्रोक पर काम करें।',
    s4: 'व्यक्तित्व और जीवन के क्षेत्र', s4d: 'आपका हस्ताक्षर और आपके अंक आपकी सोच, काम और लोगों से व्यवहार के बारे में क्या बताते हैं। ये झुकाव हैं, पक्की बातें नहीं।',
    personality: 'व्यक्तित्व', career: 'करियर', finance: 'धन', relationships: 'संबंध', strengths: 'ख़ूबियाँ', watchouts: 'ध्यान देने की बातें',
    s5: 'क्या सुधारें', s5d: 'पहले बिंदु से शुरू करें। बदलाव छोटे हैं; ज़्यादातर लोग एक-दो हफ़्ते में इनके आदी हो जाते हैं।', priority: { high: 'पहले यह करें', medium: 'इसके बाद', low: 'वैकल्पिक' },
    s6: 'आपका नया हस्ताक्षर', s6d: 'हर बार हस्ताक्षर करते समय इन चरणों को क्रम से अपनाएँ।', steps: 'कैसे हस्ताक्षर करें', do: 'करें', dont: 'न करें', start: 'कब शुरू करें', ink: 'स्याही का रंग', practice: 'अभ्यास', dates: 'शुरुआत की अच्छी तिथियाँ', luckyCol: 'आपके रंग',
    s7: '21 दिन का अभ्यास', tracker: 'अभ्यास चार्ट', trackerD: 'नए हस्ताक्षर का रोज़ अभ्यास करें (परंपरा के अनुसार 108 बार) और उस दिन पर निशान लगाएँ। पुराने बैंक और कानूनी रिकॉर्ड में पुराना हस्ताक्षर ही रखें, जब तक उन्हें उचित प्रक्रिया से अपडेट न करा लें।',
    practiceTips: ['रोज़ एक ही पेन और स्याही का उपयोग करें।', 'सीधे बैठें और समतल सतह पर लिखें।', 'पहले हफ़्ते धीरे लिखें, फिर सामान्य गति से।', '22वें दिन से सभी नए दस्तावेज़ों पर नया हस्ताक्षर करें।'],
    expertNote: 'मेरी ओर से एक बात', sig: 'हस्ताक्षर',
    s8: 'आपके अंक ज्योतिषी', services: 'मैं और कैसे मदद कर सकता हूँ', servicesD: 'अगर आप और आगे जानना चाहें, तो ये सेवाएँ हस्ताक्षर सुधार के साथ अच्छी तरह काम करती हैं।',
    contact: 'बुक करें या सवाल पूछें', whatsapp: 'व्हाट्सऐप', telegram: 'टेलीग्राम', website: 'वेबसाइट', scanWa: 'व्हाट्सऐप पर बात करने के लिए स्कैन करें', scanWeb: 'सभी सेवाएँ देखने के लिए स्कैन करें',
    disclaimer: 'हस्ताक्षर विश्लेषण हस्तलेख विज्ञान और अंक ज्योतिष की परंपराओं पर आधारित मार्गदर्शन है। यह चिकित्सा, मनोवैज्ञानिक, कानूनी या वित्तीय सलाह नहीं है। परिणाम आपके प्रयास और परिस्थितियों पर निर्भर करते हैं; किसी परिणाम की गारंटी नहीं है। बैंक और कानूनी हस्ताक्षर केवल उचित प्रक्रिया से ही बदलें।',
    madeLine: (by: string) => `${by} द्वारा आपके हस्ताक्षर के नमूनों और जन्म तिथि से तैयार`, none: 'कोई विशेष नहीं', day: 'दिन',
    bioDefault: (name: string) => `${name} 15 वर्षों से अधिक समय से अंक ज्योतिष का अभ्यास कर रहे हैं और वैदिक, कैल्डियन तथा लो शू पद्धतियों से काम करते हैं। वे व्यक्तियों, परिवारों और व्यापारियों के लिए नाम, जन्म तिथि, मोबाइल नंबर और हस्ताक्षर का विश्लेषण करते हैं, और हर रिपोर्ट भेजने से पहले स्वयं जाँचते हैं। वे यूट्यूब पर नियमित लाइव सत्र भी करते हैं, जहाँ दर्शक अपने मोबाइल नंबर की जाँच करवा सकते हैं।`,
    bioOther: (name: string) => `यह रिपोर्ट ${name} द्वारा तैयार और जाँची गई है।`,
    why: { name: (n: SignatureNumbers, rel: string) => `आपके पूरे नाम का अंक ${n.fullName.single} है, जो आपके भाग्यांक ${n.bhagyank} से ${rel} है।`, mobile: (n: SignatureNumbers) => `आपके अनुकूल मोबाइल योग: ${n.friendly.join(', ')}।`, year: (n: SignatureNumbers) => n.personalYear ? `अभी आपका व्यक्तिगत वर्ष ${n.personalYear.number} चल रहा है।` : 'अगले 12 महीनों की माह-दर-माह योजना।' },
    relWord: { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' } as Record<string, string>,
  },
};
type Lab = typeof L.en;

/** What each Personal Year means for starting a new signature (traditional reading, plain words). */
const PY_NOTE: Record<'en' | 'hi', Record<number, string>> = {
  en: {
    1: 'A year of fresh starts. This is one of the best years to adopt a new signature.',
    2: 'A slow, patient year. Practise the new signature quietly and use it once it feels natural.',
    3: 'A year for expression and being seen. A clear, confident signature helps you here.',
    4: 'A year of hard work and foundations. Take the full 21 days of practice seriously.',
    5: 'A year of change and movement. Changing your signature fits the mood of the year well.',
    6: 'A year of duty, family and home. Start the new signature on personal papers first.',
    7: 'A year for reflection. Refine the signature privately before using it on important documents.',
    8: 'A year of money, authority and paperwork. A corrected signature matters most on financial documents.',
    9: 'A year of endings. Let the old signature go; a new start is well timed for your next birthday.',
  },
  hi: {
    1: 'नई शुरुआत का वर्ष। नया हस्ताक्षर अपनाने के लिए यह सबसे अच्छे वर्षों में से है।',
    2: 'धीमा और धैर्य का वर्ष। नए हस्ताक्षर का चुपचाप अभ्यास करें और सहज होने पर उपयोग करें।',
    3: 'अभिव्यक्ति और पहचान का वर्ष। साफ़ और आत्मविश्वासी हस्ताक्षर यहाँ मदद करता है।',
    4: 'मेहनत और नींव का वर्ष। 21 दिन का पूरा अभ्यास गंभीरता से करें।',
    5: 'बदलाव और गति का वर्ष। हस्ताक्षर बदलना इस वर्ष के स्वभाव से मेल खाता है।',
    6: 'ज़िम्मेदारी, परिवार और घर का वर्ष। पहले निजी कागज़ों पर नया हस्ताक्षर शुरू करें।',
    7: 'चिंतन का वर्ष। महत्वपूर्ण दस्तावेज़ों पर उपयोग से पहले हस्ताक्षर को निजी तौर पर निखारें।',
    8: 'धन, अधिकार और कागज़ी काम का वर्ष। वित्तीय दस्तावेज़ों पर सुधरा हुआ हस्ताक्षर सबसे ज़्यादा मायने रखता है।',
    9: 'समापन का वर्ष। पुराने हस्ताक्षर को विदा करें; नई शुरुआत अगले जन्मदिन पर अच्छी रहेगी।',
  },
};

/** Services offered after a signature report, with a line on why each may help this client. */
const CTA_SERVICES = ['SVC_NAME_CORRECTION', 'SVC_PERSONAL_REPORT', 'SVC_MOBILE_NUMBER', 'SVC_PERSONAL_YEAR', 'SVC_COUPLE', 'SVC_BUSINESS_NAME'] as const;

const fmtDate = (iso: string, lang: 'en' | 'hi') => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+05:30` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
};
const dobText = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? `${m[3]}-${m[2]}-${m[1]}` : d; };
const firstName = (full: string) => { const w = full.trim().split(/\s+/)[0] ?? ''; return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : full; };
const num = (x: unknown) => esc(String(x ?? ''));
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^(?=\d{10}$)/, '91')}`;

function css(t: PdfTheme) {
  return `
  @page{size:A4;margin:16mm 15mm 18mm}
  .page{break-before:page;page-break-before:always}
  .kicker{font-size:7.6pt;letter-spacing:.26em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .ttl{font-size:21pt;line-height:1.1;margin:1mm 0 1.5mm}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm 6mm;font-size:8.8pt;margin:2mm 0 4mm;padding:3mm 4mm;border:1px solid ${t.accent}55;border-radius:3mm;background:${t.soft}}
  .meta b{display:block;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:${t.muted};font-weight:600}
  .sigcard{border:1.2px solid ${t.accent};border-radius:4mm;background:#fff;padding:3mm;display:flex;justify-content:center;align-items:center;min-height:30mm;margin-bottom:4mm;position:relative}
  .sigcard img{max-width:100%;max-height:40mm;object-fit:contain}
  .sigcard.big img{max-height:62mm}
  .sigcard .tag{position:absolute;top:-3mm;left:5mm;background:${t.paper};padding:0 2mm;font-size:7.4pt;letter-spacing:.18em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .dash{display:grid;grid-template-columns:48mm 1fr;gap:6mm;align-items:center;break-inside:avoid}
  .verdict h2{font-size:14pt;line-height:1.25;margin-bottom:2mm}
  .bars{display:grid;gap:2mm;margin-top:2mm}
  .bar{display:grid;grid-template-columns:30mm 1fr 10mm;align-items:center;gap:3mm;font-size:8.6pt}
  .bar .tr{height:3mm;border-radius:2mm;background:${t.soft};overflow:hidden}
  .bar .fl{height:100%;border-radius:2mm}
  .bar .v{text-align:right;font-family:'Playfair Display',serif;font-weight:700}
  .nums{display:grid;grid-template-columns:repeat(5,1fr);gap:2mm;margin:4mm 0 2mm;text-align:center;break-inside:avoid}
  .nums .k{font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:${t.muted};margin-top:-1mm}
  .letter{border:1px solid ${t.accent}55;border-radius:3mm;padding:3.5mm 5mm;background:${t.paper};font-size:9.6pt;line-height:1.55;break-inside:avoid;margin-top:3mm}
  .letter .sal{font-family:'Playfair Display',serif;font-style:italic;font-size:11pt;color:${t.primary};margin-bottom:1mm}
  .letter .sgn{text-align:right;font-family:'Playfair Display',serif;font-style:italic;color:${t.primary};margin-top:1.5mm}
  .toc{columns:2;column-gap:8mm;margin:3mm 0 0;padding:0;list-style:none;font-size:9pt}
  .toc li{display:flex;gap:2.5mm;align-items:baseline;margin-bottom:1.4mm;break-inside:avoid}
  .toc li b{font-family:'Playfair Display',serif;color:${t.accent};min-width:5mm}
  .sec-h{display:flex;align-items:center;gap:4mm;margin:0 0 1.5mm;break-after:avoid}
  .sec-h .no{width:11mm;height:11mm;border-radius:50%;border:1.2px solid ${t.accent};background:${t.soft};display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;color:${t.primary};font-size:13pt;flex:none}
  .sec-h h2{font-size:18pt;line-height:1.15}
  .intro{font-size:9.2pt;color:${t.muted};margin:0 0 4mm;max-width:165mm}
  h3.sub{font-size:12.5pt;margin:5mm 0 1.5mm;break-after:avoid}
  table.flow{break-inside:auto} table.flow tr{break-inside:avoid}
  .ftab td{font-size:8.2pt;padding:1.3mm 1.6mm;line-height:1.42;vertical-align:top} .ftab th{padding:1.3mm 1.6mm} .ftab td:first-child{font-weight:600;color:${t.primary};width:27mm}
  .pill{display:inline-block;padding:.5mm 2.2mm;border-radius:3mm;font-size:7.4pt;font-weight:600;white-space:nowrap}
  .pill.positive{background:${t.good}1f;color:${t.good};border:.6px solid ${t.good}66}
  .pill.neutral{background:${t.soft};color:${t.ink};border:.6px solid ${t.border}}
  .pill.watch{background:${t.warn}1f;color:${t.warn};border:.6px solid ${t.warn}66}
  .pill.rec{background:${t.accent};color:#fff} .pill.cur{background:${t.primary};color:#fff}
  .dotc{display:inline-flex;gap:.8mm;vertical-align:middle}.dotc i{width:1.8mm;height:1.8mm;border-radius:50%;background:${t.border};display:inline-block}.dotc i.on{background:${t.accent}}
  .src{font-size:6.8pt;color:${t.muted};display:block}
  .samples{display:flex;gap:3mm;margin:0 0 4mm}.samples img{flex:1;min-width:0;max-height:20mm;object-fit:contain;background:#fff;border:.6px solid ${t.border};border-radius:2mm;padding:1mm}
  .legend{display:grid;grid-template-columns:repeat(3,1fr);gap:1mm 5mm;font-size:7.8pt;color:${t.muted};margin:-1mm 0 4mm}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-bottom:2mm;break-inside:auto}
  .two .box{margin-bottom:2mm}
  .lst{margin:0;padding:0;list-style:none}.lst li{position:relative;padding-left:4.5mm;margin-bottom:1.5mm;font-size:9.2pt;line-height:1.5}
  .lst li:before{content:'';position:absolute;left:.5mm;top:2.1mm;width:1.5mm;height:1.5mm;border-radius:50%;background:${t.accent}}
  .lst.good li:before{content:'✓';background:none;width:auto;height:auto;top:0;color:${t.good};font-weight:700}
  .lst.warn li:before{content:'!';background:none;width:auto;height:auto;top:0;color:${t.warn};font-weight:700}
  .lst.bad li:before{content:'✕';background:none;width:auto;height:auto;top:0;color:${t.bad};font-weight:700}
  .fix{display:grid;grid-template-columns:10mm 1fr;gap:3mm;padding:3mm 4mm;border:1px solid ${t.accent}55;border-left:1.6mm solid ${t.accent};border-radius:2.5mm;margin-bottom:3mm;break-inside:avoid;background:${t.paper}}
  .fix.high{border-left-color:${t.primary}} .fix.low{border-left-color:${t.border}}
  .fix .n{font-family:'Playfair Display',serif;font-size:20pt;font-weight:700;color:${t.accent};line-height:1}
  .fix h4{margin:0 0 1mm;font-size:10.5pt;color:${t.primary};display:flex;gap:2mm;align-items:center;flex-wrap:wrap}
  .fix p{margin:0;font-size:9pt;text-align:left}
  .steps{counter-reset:s;margin:0;padding:0;list-style:none}.steps li{counter-increment:s;display:flex;gap:3mm;margin-bottom:2mm;font-size:9.3pt;align-items:flex-start}
  .steps li:before{content:counter(s);flex:none;width:6.5mm;height:6.5mm;border-radius:50%;background:${t.primary};color:#fff;font-size:8pt;font-weight:700;display:flex;align-items:center;justify-content:center}
  .blue{border:1.2px solid ${t.accent};border-radius:4mm;padding:4mm 5mm;background:linear-gradient(135deg,${t.soft},${t.paper});break-inside:avoid;margin-bottom:4mm}
  .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:3mm}
  .facts .f{border:.6px solid ${t.accent}66;border-radius:2.5mm;padding:2.5mm 3mm;background:${t.paper};font-size:8.6pt}
  .facts .f b{display:block;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:${t.accent};margin-bottom:.8mm}
  .lv{margin:0 0 3.5mm;break-inside:avoid}
  .lv .lab{font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:${t.muted};margin-bottom:1mm}
  .lv-row{display:flex;flex-wrap:wrap;gap:1.2mm;align-items:center}
  .lv-cell{flex:0 0 7.5mm;width:7.5mm;border:.6px solid ${t.accent}77;border-radius:1.5mm;text-align:center;background:${t.paper};overflow:hidden}
  .lv-cell b{display:block;font-family:'Playfair Display',serif;font-size:11pt;color:${t.primary};padding:.6mm 0 .2mm}
  .lv-cell span{display:block;font-size:7.6pt;background:${t.soft};border-top:.6px solid ${t.accent}55;padding:.3mm 0}
  .lv-eq{flex:none;font-size:9pt;margin-left:2mm;white-space:nowrap} .lv-eq b{font-family:'Playfair Display',serif;font-size:12pt;color:${t.primary}}
  .pycard{display:grid;grid-template-columns:22mm 1fr;gap:4mm;align-items:center;border:1px solid ${t.accent}66;border-radius:3mm;padding:3mm 4mm;background:${t.soft};break-inside:avoid}
  .reco{border:1.2px solid ${t.accent};border-radius:3mm;padding:3.5mm 4.5mm;background:${t.paper};font-size:9.6pt;margin:4mm 0 0;break-inside:avoid}
  .grid21{display:grid;grid-template-columns:repeat(7,1fr);gap:2mm;margin-top:2mm}
  .grid21 div{border:.8px solid ${t.accent}88;border-radius:2mm;height:14mm;position:relative;background:${t.paper}}
  .grid21 span{position:absolute;top:1mm;left:1.5mm;font-size:7pt;color:${t.muted}}
  .note{border:1px dashed ${t.accent};border-radius:3mm;padding:3mm 4mm;margin:5mm 0;font-size:9.4pt;break-inside:avoid;white-space:pre-line}
  .close{display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;margin-top:7mm;break-inside:avoid}
  .close .q{font-family:'Playfair Display',serif;font-style:italic;font-size:12pt;color:${t.primary};flex:1}
  .close .sgn{text-align:center;font-size:8.4pt;min-width:55mm}.close .sgn .ln{border-top:.8px solid ${t.ink};margin-top:12mm;padding-top:1mm}
  .prof{display:grid;grid-template-columns:34mm 1fr;gap:6mm;align-items:center;break-inside:avoid}
  .prof img{width:34mm;height:34mm;border-radius:50%;object-fit:cover;border:1.5px solid ${t.accent}}
  .prof h3{font-size:16pt;margin:0}.prof p{font-size:9.3pt;line-height:1.55;margin:1.5mm 0 0}
  .svc{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:2mm}
  .svc .s{border:.7px solid ${t.accent}77;border-radius:2.5mm;padding:2.8mm 3.5mm;background:${t.paper};break-inside:avoid}
  .svc .s h4{margin:0 0 .8mm;font-size:10pt;color:${t.primary}}
  .svc .s p{margin:0;font-size:8.3pt;line-height:1.45}
  .svc .s .why{margin-top:1.2mm;font-size:7.9pt;color:${t.accent};font-weight:600}
  .cta{display:grid;grid-template-columns:1fr 30mm 30mm;gap:5mm;align-items:center;margin-top:5mm;padding:4mm 5mm;border-radius:3mm;background:${t.primary};color:#fff;break-inside:avoid}
  .cta h4{margin:0 0 1.5mm;font-size:12pt;color:#fff}
  .cta .ln{font-size:9.2pt;margin:.7mm 0}.cta .ln b{display:inline-block;min-width:20mm;font-size:7.4pt;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
  .cta .qr{background:#fff;border-radius:2mm;padding:1.5mm;line-height:0}.cta .qr svg{width:100%;height:auto}
  .cta .cap{font-size:6.6pt;text-align:center;margin-top:1mm;line-height:1.25;color:#fff}
  .disc{font-size:7.4pt;color:${t.muted};margin-top:5mm;line-height:1.45;text-align:justify}
  `;
}

const relLabel = (r: string, l: Lab) => (r === 'friend' ? l.friend : r === 'enemy' ? l.enemy : l.neutralR);
const relPill = (r: string, l: Lab) => `<span class="pill ${r === 'friend' ? 'positive' : r === 'enemy' ? 'watch' : 'neutral'}">${esc(relLabel(r, l))}</span>`;
const catPill = (c: string, l: Lab) => `<span class="pill ${c === 'favourable' ? 'positive' : c === 'unfavourable' ? 'watch' : 'neutral'}">${esc(c === 'favourable' ? l.favourable : c === 'unfavourable' ? l.unfavourable : l.mixed)}</span>`;
const impPill = (i: string, l: Lab) => { const k = i === 'positive' || i === 'watch' ? i : 'neutral'; return `<span class="pill ${k}">${esc(k === 'positive' ? l.supports : k === 'watch' ? l.watch : l.neutral)}</span>`; };
const confDots = (c: string | undefined, l: Lab) => { const n = c === 'high' ? 3 : c === 'medium' ? 2 : c === 'low' ? 1 : 0; return n ? `<span class="dotc">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span> <span class="src">${esc(c === 'high' ? l.high : c === 'medium' ? l.medium : l.low)}</span>` : ''; };
const list = (xs: string[] | undefined, cls = '', l?: Lab) => `<ul class="lst ${cls}">${(xs?.length ? xs : [l?.none ?? '']).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
function bar(label: string, v: number | null, t: PdfTheme) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '';
  const x = Math.max(0, Math.min(100, Math.round(v)));
  return `<div class="bar"><span>${esc(label)}</span><div class="tr"><div class="fl" style="width:${Math.max(3, x)}%;background:${scoreColour(x, t)}"></div></div><span class="v">${x}</span></div>`;
}
const secHead = (n: number, title: string) => `<div class="sec-h"><div class="no">${n}</div><h2>${esc(title)}</h2></div>`;
const reduceDigits = (n: number) => { let c = n; while (c > 9 && c !== 11 && c !== 22) c = String(c).split('').reduce((a, b) => a + Number(b), 0); return c; };

function lettersRow(label: string, xs: LetterValue[] | undefined, l: Lab) {
  if (!xs?.length) return '';
  const total = xs.reduce((a, x) => a + (Number(x.v) || 0), 0);
  return `<div class="lv"><div class="lab">${esc(label)}</div><div class="lv-row">${xs.map((x) => `<div class="lv-cell"><b>${esc(x.ch)}</b><span>${num(x.v)}</span></div>`).join('')}
    <div class="lv-eq">${esc(l.total)} <b>${total}</b> → <b>${reduceDigits(total)}</b></div></div></div>`;
}

/** Hindi reason for a suggested start date (simple words). */
function startReasonHi(x: { weekday: string; dayNumber: number; dateNumber: number }, friendly: number[], b: number) {
  const day = friendly.includes(x.dayNumber), date = friendly.includes(x.dateNumber);
  return `${dayHi(x.weekday)}; ${day && date ? `दिन का अंक ${x.dayNumber} और तारीख़ का जोड़ ${x.dateNumber}, दोनों भाग्यांक ${b} के मित्र हैं` : day ? `दिन का अंक ${x.dayNumber} भाग्यांक ${b} का मित्र है` : `तारीख़ का जोड़ ${x.dateNumber} भाग्यांक ${b} का मित्र है`}`;
}

export function buildSignatureReportHtml(d: SignatureReportData, t: PdfTheme, b: Branding, extras: ReportExtras = {}): string {
  const lang: 'en' | 'hi' = d.client.language === 'hi' ? 'hi' : 'en';
  const l = L[lang];
  const contact = { ...DEFAULT_CONTACT, ...(extras.contact ?? {}) };
  const a: SignatureAnalysis = humaniseDeep(d.result.analysis); const n = d.numbers; const s = d.result.scores;
  const mean = (compound: number, en: string) => (lang === 'hi' ? compoundMeaningHi(compound) : en).replace(/\s+[–—]\s+/g, ': ');
  const pl = (x: string) => tr(lang, x);
  const optLabel = (x: string) => (lang === 'hi' ? optionLabelHi(x) : x);
  const main = d.annotated ?? d.samples?.[0];
  const bySource = new Map(d.result.features.map((f) => [f.id, f]));
  const fname = firstName(d.client.fullName);
  const isHouseExpert = (b.expertName || '').trim().toLowerCase() === (DEFAULT_BRANDING.expertName || '').trim().toLowerCase();
  const expert = d.preparedBy || b.expertName;
  const sectionNames = [l.s1, l.s2, l.s3, l.s4, l.s5, l.s6, l.s7, l.s8];

  // ---------- Summary of findings ----------
  const summary = `
  <div class="kicker">${esc(l.sub)}</div><h1 class="ttl">${esc(l.summary)}</h1>
  <div class="meta"><div><b>${esc(l.client)}</b>${esc(d.client.fullName)}</div><div><b>${esc(l.dob)}</b>${esc(dobText(d.client.dob))}</div><div><b>${esc(l.date)}</b>${esc(fmtDate(d.generatedAt, lang))}</div>
    <div><b>${esc(l.profession)}</b>${esc(d.client.profession)}</div><div><b>${esc(l.signedAs)}</b>${esc(d.client.signatureName?.trim() || d.client.fullName)}</div><div><b>${esc(l.goals)}</b>${esc(d.client.goals.join(', ') || '-')}</div></div>
  ${main ? `<div class="sigcard"><span class="tag">${esc(l.sig)}</span><img src="${esc(main)}" alt=""></div>` : ''}
  <div class="dash"><div class="center">${ringSvg(a.overallScore, t, l.overall, 160)}</div>
    <div class="verdict"><h2>${esc(a.headline)}</h2>
      <div class="bars">${bar(l.graph, s.graphology, t)}${bar(l.nameVib, s.nameVibration, t)}${bar(l.first, s.firstLetter, t)}${bar(l.prof, s.professionFit, t)}${bar(l.cons, s.consistency, t)}</div></div></div>
  <div class="nums">
    <div>${numberMedallion(num(n.moolank), t, 64)}<div class="k">${esc(l.moolank)}</div></div>
    <div>${numberMedallion(n.bhagyankMaster ? `${num(n.bhagyankMaster)}/${num(n.bhagyank)}` : num(n.bhagyank), t, 64)}<div class="k">${esc(l.bhagyank)}</div></div>
    <div>${numberMedallion(`${num(n.signName.compound)}/${num(n.signName.single)}`, t, 64)}<div class="k">${esc(l.signed)}</div></div>
    <div>${numberMedallion(`${num(n.fullName.compound)}/${num(n.fullName.single)}`, t, 64)}<div class="k">${esc(l.full)}</div></div>
    <div>${numberMedallion(`${esc(n.firstLetter.letter)}=${num(n.firstLetter.value)}`, t, 64)}<div class="k">${esc(l.letter)}</div></div>
  </div>
  <div class="letter"><div class="sal">${esc(l.dear(fname))}</div>${esc(a.summary)}<div class="sgn">${esc(expert)}</div></div>
  <div class="kicker" style="margin-top:5mm">${esc(l.inside)}</div>
  <ol class="toc">${sectionNames.map((x, i) => `<li><b>${i + 1}</b><span>${esc(x)}</span></li>`).join('')}</ol>`;

  // ---------- 1. What your signature shows ----------
  const s1 = `<section class="page">${secHead(1, l.s1)}<p class="intro">${esc(l.s1d)}</p>
    ${main ? `<div class="sigcard big"><span class="tag">${esc(l.sig)}</span><img src="${esc(main)}" alt=""></div>` : ''}
    ${d.annotated ? `<div class="kicker" style="margin-bottom:1mm">${esc(l.marks)}</div><div class="legend">${l.markList.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    ${d.samples && d.samples.length > 1 ? `<div class="small muted" style="margin-bottom:1mm">${esc(l.samples)}: ${d.samples.length}</div><div class="samples">${d.samples.map((x) => `<img src="${esc(x)}" alt="">`).join('')}</div>` : ''}
    <table class="ftab flow"><thead><tr><th>${esc(l.feature)}</th><th>${esc(l.observed)}</th><th>${esc(l.meaning)}</th><th>${esc(l.impact)}</th><th>${esc(l.conf)}</th></tr></thead><tbody>
    ${a.observations.map((o) => { const src = o.featureId ? bySource.get(o.featureId) : undefined; return `<tr><td>${esc(o.feature)}</td><td>${esc(o.observed)}</td><td>${esc(o.meaning)}</td><td>${impPill(o.impact, l)}</td><td>${confDots(o.confidence, l)}${src ? `<span class="src">${esc(src.by === 'expert' ? l.expert : l.measured)}</span>` : ''}</td></tr>`; }).join('')}
    </tbody></table></section>`;

  // ---------- 2. The numbers behind your signature ----------
  const rows: [string, string, string, string, string, string][] = [
    [l.moolank, num(n.moolank), esc(pl(n.moolankPlanet.name)), '-', '-', ''],
    [l.bhagyank, n.bhagyankMaster ? `${num(n.bhagyankMaster)}/${num(n.bhagyank)}` : num(n.bhagyank), esc(pl(n.planet.name)), '-', '-', ''],
    [l.full, `${num(n.fullName.compound)}/${num(n.fullName.single)}`, '', relPill(n.nameToBhagyank, l), relPill(n.nameToMoolank, l), `${catPill(n.fullName.category, l)} <span class="small">${esc(mean(n.fullName.compound, n.fullName.meaning))}</span>`],
    [l.signed, `${num(n.signName.compound)}/${num(n.signName.single)}`, '', relPill(n.signToBhagyank, l), relPill(n.signToMoolank, l), `${catPill(n.signName.category, l)} <span class="small">${esc(mean(n.signName.compound, n.signName.meaning))}</span>`],
    [`${l.letter} (${n.firstLetter.letter})`, num(n.firstLetter.value), esc(pl(n.firstLetter.planet)), relPill(n.firstLetter.toBhagyank, l), relPill(n.firstLetter.toMoolank, l), ''],
  ];
  const py = n.personalYear;
  const s2 = `<section class="page">${secHead(2, l.s2)}<p class="intro">${esc(l.s2d)}</p>
    <table><thead><tr><th>${esc(l.number)}</th><th>${esc(l.value)}</th><th>${esc(l.planet)}</th><th>${esc(l.toB)}</th><th>${esc(l.toM)}</th><th>${esc(l.nature)}</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td style="font-family:'Playfair Display',serif;font-weight:700;font-size:11pt;color:${t.primary}">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}
    </tbody></table>
    <div class="two" style="margin-top:4mm"><div class="panel"><b class="small">${esc(l.friendly)}</b><div class="chips" style="margin-top:1.5mm">${n.friendly.map((x) => `<span class="chip good">${num(x)}</span>`).join('')}</div></div>
      <div class="panel"><b class="small">${esc(l.avoid)}</b><div class="chips" style="margin-top:1.5mm">${(n.avoid.length ? n.avoid : ['-']).map((x) => `<span class="chip bad">${num(x)}</span>`).join('')}</div></div></div>
    ${n.letters ? `<h3 class="sub">${esc(l.lettersH)}</h3><p class="intro" style="margin-bottom:2.5mm">${esc(l.lettersD)}</p>
      ${lettersRow(`${l.lSigned}: ${n.signName.text}`, n.letters.signed, l)}${n.letters.full.length !== n.letters.signed.length || n.fullName.text !== n.signName.text ? lettersRow(`${l.lFull}: ${n.fullName.text}`, n.letters.full, l) : ''}${n.bestOption && n.letters.best ? lettersRow(`${l.lBest}: ${n.bestOption.text}`, n.letters.best, l) : ''}` : ''}
    ${py ? `<h3 class="sub">${esc(l.pyH)}</h3><div class="pycard"><div class="center">${numberMedallion(num(py.number), t, 62)}</div><div style="font-size:9.3pt"><b>${esc(l.pyNow(py.number, py.period))}</b> ${esc(PY_NOTE[lang][py.number] ?? '')}<div class="small muted" style="margin-top:1mm">${esc(l.pyNext(py.nextNumber, py.nextFrom))}</div></div></div>` : ''}
    </section>`;

  // ---------- 3. The best way to sign your name ----------
  const best = n.bestOption;
  const s3 = `<section class="page">${secHead(3, l.s3)}<p class="intro">${esc(l.s3d)}</p>
    <table class="flow"><thead><tr><th>${esc(l.form)}</th><th>${esc(l.number)}</th><th>${esc(l.toB)}</th><th>${esc(l.toM)}</th><th>${esc(l.nature)}</th><th>${esc(l.score)}</th></tr></thead><tbody>
    ${n.nameOptions.map((o) => `<tr${best?.text === o.text ? ` style="background:${t.accent}1a"` : ''}><td><b>${esc(o.text)}</b> ${o.current ? `<span class="pill cur">${esc(l.current)}</span>` : ''}${best?.text === o.text ? ` <span class="pill rec">${esc(l.recommended)}</span>` : ''}<span class="src">${esc(optLabel(o.label))}</span></td>
      <td>${num(o.compound)}/${num(o.single)}</td><td>${relPill(o.toBhagyank, l)}</td><td>${relPill(o.toMoolank, l)}</td><td>${catPill(o.category, l)}<span class="src">${esc(mean(o.compound, o.meaning))}</span></td><td><b style="color:${scoreColour(Number(o.score) || 0, t)}">${num(o.score)}</b></td></tr>`).join('')}
    </tbody></table>
    <div class="reco">${best ? esc(l.recoYes(best.text, `${n.signName.compound}/${n.signName.single}`, `${best.compound}/${best.single}`, n.bhagyank)) : esc(l.recoNo)}</div></section>`;

  // ---------- 4. Personality and life areas ----------
  const s4 = `<section class="page">${secHead(4, l.s4)}<p class="intro">${esc(l.s4d)}</p>
    <div class="box advice"><div class="bt">${esc(l.personality)}</div>${list(a.personality, '', l)}</div>
    <div class="two"><div class="box remedy"><div class="bt">${esc(l.career)}: ${esc(lang === 'hi' ? professionHi(n.profession.label) : n.profession.label)}</div><p>${esc(a.career.fit)}</p><p style="margin-top:2mm">${esc(a.career.advice)}</p></div>
      <div>${a.finance ? `<div class="box advice"><div class="bt">${esc(l.finance)}</div><p>${esc(a.finance)}</p></div>` : ''}${a.relationships ? `<div class="box advice"><div class="bt">${esc(l.relationships)}</div><p>${esc(a.relationships)}</p></div>` : ''}
      ${!a.finance && !a.relationships ? `<div style="display:flex;justify-content:center">${gaugeSvg(n.profession.fitScore, t, l.prof, 210)}</div>` : ''}</div></div>
    <div class="two"><div class="box strength"><div class="bt">${esc(l.strengths)}</div>${list(a.strengths, 'good', l)}</div><div class="box watch"><div class="bt">${esc(l.watchouts)}</div>${list(a.watchouts, 'warn', l)}</div></div></section>`;

  // ---------- 5. What to correct ----------
  const pri = (p?: string) => (p === 'high' || p === 'low' ? p : 'medium') as 'high' | 'medium' | 'low';
  const fixes = [...a.corrections].sort((x, y) => ['high', 'medium', 'low'].indexOf(pri(x.priority)) - ['high', 'medium', 'low'].indexOf(pri(y.priority)));
  const s5 = `<section class="page">${secHead(5, l.s5)}<p class="intro">${esc(l.s5d)}</p>
    ${fixes.map((c, i) => `<div class="fix ${pri(c.priority)}"><div class="n">${i + 1}</div><div><h4>${esc(c.title)} <span class="pill ${pri(c.priority) === 'high' ? 'watch' : 'neutral'}">${esc(l.priority[pri(c.priority)])}</span></h4><p>${esc(c.detail)}</p></div></div>`).join('')}</section>`;

  // ---------- 6. Your new signature ----------
  const sw = (c: string) => { const h = COLOUR_HEX[c.toLowerCase()] ?? '#ccc'; return `<span class="sw"><i style="background:${h}"></i>${esc(tr(lang, c))}</span>`; };
  const ideal = a.idealSignature;
  const s6 = `<section class="page">${secHead(6, l.s6)}<p class="intro">${esc(l.s6d)}</p>
    <div class="blue"><b class="serif" style="font-size:11pt">${esc(l.steps)}</b><ol class="steps" style="margin-top:2mm">${ideal.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
    ${ideal.do?.length || ideal.dont?.length ? `<div class="two"><div class="box strength"><div class="bt">${esc(l.do)}</div>${list(ideal.do, 'good', l)}</div><div class="box watch"><div class="bt">${esc(l.dont)}</div>${list(ideal.dont, 'bad', l)}</div></div>` : ''}
    <div class="facts"><div class="f"><b>${esc(l.start)}</b>${esc(ideal.startDay)}</div><div class="f"><b>${esc(l.ink)}</b>${esc(ideal.inkColour)}<div style="margin-top:1.5mm">${n.planet.colours.slice(0, 3).map(sw).join('')}</div></div><div class="f"><b>${esc(l.practice)}</b>${esc(ideal.practice)}</div></div>
    ${n.startDates.length ? `<h3 class="sub">${esc(l.dates)}</h3><table><tbody>${n.startDates.map((x) => `<tr><td style="width:45mm"><b>${esc(fmtDate(x.iso, lang))}</b></td><td>${esc(lang === 'hi' ? startReasonHi(x, n.friendly, n.bhagyank) : x.reason)}</td></tr>`).join('')}</tbody></table>` : ''}
    </section>`;

  // ---------- 7. 21-day practice ----------
  const s7 = `<section class="page">${secHead(7, l.s7)}<p class="intro">${esc(l.trackerD)}</p>
    <div class="grid21">${Array.from({ length: 21 }, (_, i) => `<div><span>${esc(l.day)} ${i + 1}</span></div>`).join('')}</div>
    <h3 class="sub">${esc(l.practice)}</h3>${list(l.practiceTips)}
    ${d.expertNote ? `<div class="note"><b>${esc(l.expertNote)}:</b> ${esc(d.expertNote)}</div>` : ''}
    <div class="close"><div class="q">“${esc(a.closing)}”</div><div class="sgn">${b.signatureDataUrl ? `<img src="${esc(b.signatureDataUrl)}" style="max-height:14mm;display:block;margin:0 auto -10mm">` : ''}<div class="ln">${esc(expert)}<br><span class="muted">${esc(b.brandName)}</span></div></div></div>
    </section>`;

  // ---------- 8. About your numerologist + other services ----------
  const photo = b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" alt="">` : monogram(b.expertName, t, 120);
  const bio = contact.bio?.trim() || (isHouseExpert ? l.bioDefault(b.expertName) : l.bioOther(b.expertName));
  const why = (code: string) => code === 'SVC_NAME_CORRECTION' ? l.why.name(n, l.relWord[n.nameToBhagyank] ?? n.nameToBhagyank) : code === 'SVC_MOBILE_NUMBER' ? l.why.mobile(n) : code === 'SVC_PERSONAL_YEAR' ? l.why.year(n) : '';
  const svcs = CTA_SERVICES.map((code) => DEFAULT_SERVICES.find((x) => x.code === code)).filter((x): x is (typeof DEFAULT_SERVICES)[number] => !!x);
  const site = (contact.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const s8 = `<section class="page">${secHead(8, l.s8)}
    <div class="prof">${photo}<div><h3>${esc(b.expertName)}</h3><div class="small muted">${esc(b.expertTitle ?? '')}</div><p>${esc(bio)}</p></div></div>
    <h3 class="sub" style="margin-top:6mm">${esc(l.services)}</h3><p class="intro" style="margin-bottom:1mm">${esc(l.servicesD)}</p>
    <div class="svc">${svcs.map((x) => { const txt = humaniseDeep(lang === 'hi' ? x.hi : x.en); const w = why(x.code); return `<div class="s"><h4>${esc(txt.name)}</h4><p>${esc(txt.short)}</p>${w ? `<div class="why">${esc(w)}</div>` : ''}</div>`; }).join('')}</div>
    <div class="cta"><div><h4>${esc(l.contact)}</h4>
        ${contact.whatsapp ? `<div class="ln"><b>${esc(l.whatsapp)}</b>${esc(contact.whatsapp)}</div>` : ''}
        ${contact.telegram ? `<div class="ln"><b>${esc(l.telegram)}</b>${esc(contact.telegram)}</div>` : ''}
        ${site ? `<div class="ln"><b>${esc(l.website)}</b>${esc(site)}</div>` : ''}</div>
      ${extras.qrWhatsapp ? `<div><div class="qr">${extras.qrWhatsapp}</div><div class="cap">${esc(l.scanWa)}</div></div>` : '<div></div>'}
      ${extras.qrWebsite ? `<div><div class="qr">${extras.qrWebsite}</div><div class="cap">${esc(l.scanWeb)}</div></div>` : '<div></div>'}
    </div>
    <p class="disc">${esc(l.disclaimer)}</p>
    <p class="small muted center" style="margin-top:2mm">${esc(l.madeLine(expert))}</p></section>`;

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}${css(t)}</style></head><body>${summary}${s1}${s2}${s3}${s4}${s5}${s6}${s7}${s8}</body></html>`;
}

/** Full-page cover: report name, client, date of birth, report date, the client's signature and the expert. */
export function buildSignatureCoverHtml(d: SignatureReportData, t: PdfTheme, b: Branding): string {
  const lang: 'en' | 'hi' = d.client.language === 'hi' ? 'hi' : 'en';
  const l = L[lang];
  return coverDocument({
    title: l.title, subtitle: l.sub, clientName: d.client.fullName, lang, theme: t, branding: b, preparedBy: d.preparedBy,
    facts: [[l.dob, dobText(d.client.dob)], [l.date, fmtDate(d.generatedAt, lang)], [l.profession, d.client.profession]],
    imageDataUrl: d.annotated ?? d.samples?.[0], imageCaption: l.sig,
  });
}

const qr = (text: string) => QRCode.toString(text, { type: 'svg', margin: 0, width: 150, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });

export async function renderSignatureReportPdf(d: SignatureReportData, opts: { theme?: ThemeId; branding?: Partial<Branding>; contact?: ReportContact } = {}) {
  const branding: Branding = { ...DEFAULT_BRANDING, ...(opts.branding ?? {}) } as Branding;
  const t = resolveTheme(opts.theme, branding);
  const lang = d.client.language === 'hi' ? 'hi' : 'en';
  const contact = { ...DEFAULT_CONTACT, ...(opts.contact ?? {}) };
  const servicesUrl = `${(contact.website || 'https://www.mynumerologist.com').replace(/\/$/, '')}/services`;
  const [qrWhatsapp, qrWebsite] = await Promise.all([contact.whatsapp ? qr(waLink(contact.whatsapp)) : Promise.resolve(''), qr(/^https?:\/\//.test(servicesUrl) ? servicesUrl : `https://${servicesUrl}`)]);
  const font = "font-family:Georgia,'Times New Roman',serif;";
  const header = `<div style="${font}width:100%;font-size:7.5px;color:${t.muted};padding:0 15mm;margin-top:8mm;display:flex;justify-content:space-between;letter-spacing:.12em;text-transform:uppercase"><span style="color:${t.primary}">${esc(branding.brandName)}</span><span>${esc(L[lang].title)} · ${esc(d.client.fullName)}</span></div>`;
  const footer = `<div style="${font}width:100%;font-size:7.4px;color:${t.muted};padding:0 15mm;margin-bottom:10mm;display:flex;justify-content:space-between"><span>${esc(d.preparedBy)} · ${esc(branding.contactLine ?? '')}</span><span style="font-size:9px;color:${t.primary}"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  return renderSheetPdf({ html: buildSignatureReportHtml(d, t, branding, { contact, qrWhatsapp, qrWebsite }), coverHtml: buildSignatureCoverHtml(d, t, branding), header, footer, theme: t, branding, title: `${d.client.fullName} – ${L[lang].title}`, subject: L[lang].title, isoDate: d.generatedAt.slice(0, 10), language: lang });
}
