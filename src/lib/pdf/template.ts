/**
 * HTML templates for the premium A4 report: cover, table of contents, chapters (narrative + visuals +
 * highlight boxes), remedies and closing page. Rendered to PDF by render.ts.
 */
import type { NumerologyResult } from '@/lib/numerology';
import { planetOf, NUMBER_PLANET } from '@/lib/numerology/data/planets';
import type { Narrative, NarrativeSection } from '@/lib/narrative/service';
import { fontFaceCss } from './fonts';
import { barsSvg, compassSvg, divider, esc, gaugeSvg, gridSvg, mandala, monogram, numberMedallion, planetIcon, portraitPlaceholder, radarSvg, remedyIcon, ringSvg, swatches, timelineSvg, type RemedyIcon } from './svg';
import type { Branding, PdfTheme } from './themes';
import { DISCLAIMER } from '@/lib/disclaimer';
import { tr } from '@/lib/i18n/hi-terms';

type R = NumerologyResult['results'];
type Lang = 'en' | 'hi';

const L = {
  en: {
    reportTypes: { complete: 'Complete Life Report', dob: 'Date of Birth Numerology', name: 'Name Numerology', mobile: 'Mobile Number Numerology', aadhaar: 'Aadhaar Vibration Report', couple: 'Couple Compatibility Report' } as Record<string, string>,
    preparedFor: 'Prepared for', dob: 'Date of birth', reportDate: 'Report date', by: 'Prepared by', contents: 'Contents', chapter: 'Chapter',
    ch: { glance: 'Your Numbers at a Glance', core: 'Moolank & Bhagyank', grid: 'Lo Shu Grid Analysis', kua: 'Kua & Directions', timing: 'Timing & Forecast', life: 'Career, Love & Wellbeing', name: 'Name Numerology', numbers: 'Mobile & Aadhaar', couple: 'Couple Compatibility', remedies: 'Remedies & Solutions', closing: 'Closing & Consultation' } as Record<string, string>,
    moolank: 'Moolank', bhagyank: 'Bhagyank', kua: 'Kua', nameNo: 'Name number', py: 'Personal Year', strengths: 'Key Strengths', watch: 'Watch Out For', advice: 'Expert Advice', remedy: 'Your Remedy',
    loShu: 'Lo Shu Grid', vedic: 'Vedic Grid', present: 'Present', repeated: 'Repeated', missing: 'Missing', lifeAreas: 'Life areas', friendly: 'Friendly', neutral: 'Neutral', enemy: 'Challenging',
    planes: 'Planes, arrows & yogs', plane: 'Plane', status: 'Status', complete: 'Complete', partial: 'Partial', empty: 'Empty', pyTimeline: 'Personal Year energy (birthday to birthday; year = when it begins)',
    months: 'Personal months', pinnacles: 'Pinnacles', challenges: 'Challenges', compat: 'Compatibility', corrections: 'Name correction options', spelling: 'Spelling', score: 'Score',
    pairs: 'Digit pairs', ideal: 'Ideal totals for a new number', overall: 'Overall', overlay: 'Combined grid', brings: 'brings what the other lacks',
    lucky: 'Lucky', numbers: 'Numbers', dates: 'Dates', days: 'Days', colours: 'Colours', avoid: 'Use sparingly', directions: 'Directions', gem: 'Gemstone', mantra: 'Mantra', daan: 'Daan', fasting: 'Fasting day',
    habits: 'Daily habits', signature: 'Signature', favYears: 'Favourable years', events: { marriage: 'Marriage', jobChange: 'Job change', businessStart: 'Business start', propertyPurchase: 'Property purchase' } as Record<string, string>,
    book: 'Book a personal consultation', scan: 'Scan to book', disclaimer: `${DISCLAIMER.en.short} mynumerologist.com/disclaimer`,
    gemNote: 'Consult a qualified expert before wearing any gemstone.', element: 'Element', direction: 'Direction', placement: 'Placement', wear: 'Wear',
    jobYears: 'Best years for a job change', bizYears: 'Best years to start a business', marriageYears: 'Favourable years for marriage', planet: 'Ruling planet', day: 'Day',
    areas: { career: 'Career', money: 'Money', love: 'Love', health: 'Health', family: 'Family', spirituality: 'Spirituality', communication: 'Communication', finance: 'Finance', stability: 'Stability' } as Record<string, string>,
    vedicNote: 'planets by number', now: 'NOW', ageYears: 'age in years', rudraksha: 'Rudraksha',
    yearNote: 'A year means the 12 months that begin on your birthday in that year.',
    soulUrge: 'Soul urge', personality: 'Personality', chaldean: 'Chaldean', pythagorean: 'Pythagorean', words: 'Each word', officialName: 'Official name',
    pairGood: 'supportive', pairWarn: 'conflicting', pairBad: 'difficult',
    jointYears: 'Best years for both of you', alsoGoodYears: 'Also supportive',
    favDirs: 'Favourable directions', unfavDirs: 'Directions to avoid',
    kuaKinds: {
      success: ['Success (Sheng Chi)', 'Face this way at your desk and in important meetings'], health: ['Health (Tian Yi)', 'Sleep with your head pointing this way'],
      relationships: ['Relationships (Yan Nian)', 'Family seating, photographs and the bedroom'], personalGrowth: ['Personal growth (Fu Wei)', 'Study, prayer and meditation'],
      mishaps: ['Mishaps (Huo Hai)', 'Avoid facing this way for long hours of work'], fiveGhosts: ['Five Ghosts (Wu Gui)', 'Avoid for your desk and main seat'],
      sixKillings: ['Six Killings (Liu Sha)', 'Avoid for sleeping and important talks'], totalLoss: ['Total Loss (Jue Ming)', 'The direction to avoid most for work and sleep'],
    } as Record<string, [string, string]>,
    kuaLichun: 'Note: you were born between 1 January and 4 February. This report uses the calendar year; practitioners who change the year at Chinese New Year would use the previous year for your Kua.',
    methodTitle: 'How your numbers were calculated',
    methodNote: 'Moolank, Bhagyank and the Lo Shu grid follow the Vedic method; the name is read with the Chaldean chart; personal years run from birthday to birthday. All figures are calculated for the report date on the cover.',
  },
  hi: {
    reportTypes: { complete: 'संपूर्ण जीवन रिपोर्ट', dob: 'जन्म तिथि अंक ज्योतिष', name: 'नाम अंक ज्योतिष', mobile: 'मोबाइल नंबर अंक ज्योतिष', aadhaar: 'आधार कंपन रिपोर्ट', couple: 'दंपति मिलान रिपोर्ट' } as Record<string, string>,
    preparedFor: 'विशेष रूप से तैयार', dob: 'जन्म तिथि', reportDate: 'रिपोर्ट तिथि', by: 'प्रस्तुतकर्ता', contents: 'विषय सूची', chapter: 'अध्याय',
    ch: { glance: 'आपके अंक एक नज़र में', core: 'मूलांक और भाग्यांक', grid: 'लो शू ग्रिड विश्लेषण', kua: 'कुआ और दिशाएँ', timing: 'समय और भविष्यफल', life: 'करियर, प्रेम और स्वास्थ्य', name: 'नाम अंक ज्योतिष', numbers: 'मोबाइल और आधार', couple: 'दंपति मिलान', remedies: 'उपाय और समाधान', closing: 'समापन और परामर्श' } as Record<string, string>,
    moolank: 'मूलांक', bhagyank: 'भाग्यांक', kua: 'कुआ', nameNo: 'नामांक', py: 'व्यक्तिगत वर्ष', strengths: 'मुख्य शक्तियाँ', watch: 'ध्यान दें', advice: 'विशेषज्ञ सलाह', remedy: 'आपका उपाय',
    loShu: 'लो शू ग्रिड', vedic: 'वैदिक ग्रिड', present: 'उपस्थित', repeated: 'दोहराया', missing: 'अनुपस्थित', lifeAreas: 'जीवन क्षेत्र', friendly: 'मित्र', neutral: 'सम', enemy: 'शत्रु',
    planes: 'तल, तीर और योग', plane: 'तल', status: 'स्थिति', complete: 'पूर्ण', partial: 'आंशिक', empty: 'रिक्त', pyTimeline: 'व्यक्तिगत वर्ष ऊर्जा (जन्मदिन से जन्मदिन तक)',
    months: 'व्यक्तिगत माह', pinnacles: 'शिखर', challenges: 'चुनौतियाँ', compat: 'अनुकूलता', corrections: 'नाम सुधार विकल्प', spelling: 'वर्तनी', score: 'स्कोर',
    pairs: 'अंक जोड़े', ideal: 'नए नंबर के लिए आदर्श योग', overall: 'कुल', overlay: 'संयुक्त ग्रिड', brings: 'दूसरे की कमी पूरी करते हैं',
    lucky: 'शुभ', numbers: 'अंक', dates: 'तिथियाँ', days: 'दिन', colours: 'रंग', avoid: 'कम उपयोग करें', directions: 'दिशाएँ', gem: 'रत्न', mantra: 'मंत्र', daan: 'दान', fasting: 'व्रत',
    habits: 'दैनिक आदतें', signature: 'हस्ताक्षर', favYears: 'शुभ वर्ष', events: { marriage: 'विवाह', jobChange: 'नौकरी बदलना', businessStart: 'व्यवसाय आरंभ', propertyPurchase: 'संपत्ति खरीद' } as Record<string, string>,
    book: 'व्यक्तिगत परामर्श बुक करें', scan: 'बुक करने के लिए स्कैन करें', disclaimer: `${DISCLAIMER.hi.short} mynumerologist.com/disclaimer`,
    gemNote: 'कोई भी रत्न पहनने से पहले योग्य विशेषज्ञ से सलाह लें।', element: 'तत्व', direction: 'दिशा', placement: 'स्थान', wear: 'पहनें',
    jobYears: 'नौकरी बदलने के शुभ वर्ष', bizYears: 'व्यवसाय आरंभ के शुभ वर्ष', marriageYears: 'विवाह के शुभ वर्ष', planet: 'स्वामी ग्रह', day: 'दिन',
    areas: { career: 'करियर', money: 'धन', love: 'प्रेम', health: 'स्वास्थ्य', family: 'परिवार', spirituality: 'आध्यात्म', communication: 'संवाद', finance: 'वित्त', stability: 'स्थिरता' } as Record<string, string>,
    vedicNote: 'अंक के अनुसार ग्रह', now: 'अभी', ageYears: 'आयु (वर्ष)', rudraksha: 'रुद्राक्ष',
    yearNote: 'वर्ष का अर्थ है उस वर्ष के जन्मदिन से शुरू होने वाले 12 महीने।',
    soulUrge: 'आत्मांक', personality: 'व्यक्तित्व अंक', chaldean: 'कैल्डियन', pythagorean: 'पाइथागोरियन', words: 'प्रत्येक शब्द', officialName: 'आधिकारिक नाम',
    pairGood: 'सहायक', pairWarn: 'टकराव', pairBad: 'कठिन',
    jointYears: 'आप दोनों के लिए सर्वश्रेष्ठ वर्ष', alsoGoodYears: 'ये वर्ष भी सहायक',
    favDirs: 'शुभ दिशाएँ', unfavDirs: 'जिन दिशाओं से बचें',
    kuaKinds: {
      success: ['सफलता (शेंग ची)', 'काम की मेज़ पर और महत्वपूर्ण बैठकों में इस ओर मुँह रखें'], health: ['स्वास्थ्य (तियान यी)', 'सोते समय सिर इस दिशा में रखें'],
      relationships: ['संबंध (यान नियान)', 'परिवार के बैठने की जगह, तस्वीरें और शयनकक्ष'], personalGrowth: ['व्यक्तिगत विकास (फू वेई)', 'पढ़ाई, पूजा और ध्यान'],
      mishaps: ['बाधा (हुओ हाई)', 'लंबे समय तक काम करते हुए इस ओर मुँह न रखें'], fiveGhosts: ['पंच भूत (वू गुई)', 'काम की मेज़ और मुख्य आसन के लिए बचें'],
      sixKillings: ['षट् घात (लियू शा)', 'सोने और महत्वपूर्ण बातचीत के लिए बचें'], totalLoss: ['पूर्ण हानि (जुए मिंग)', 'काम और नींद के लिए सबसे अधिक बचने योग्य दिशा'],
    } as Record<string, [string, string]>,
    kuaLichun: 'ध्यान दें: आपका जन्म 1 जनवरी से 4 फ़रवरी के बीच हुआ है। यह रिपोर्ट कैलेंडर वर्ष का उपयोग करती है; जो विशेषज्ञ चीनी नव वर्ष से वर्ष बदलते हैं, वे आपके कुआ के लिए पिछला वर्ष लेंगे।',
    methodTitle: 'आपके अंक कैसे निकाले गए',
    methodNote: 'मूलांक, भाग्यांक और लो शू ग्रिड वैदिक पद्धति से हैं; नाम कैल्डियन तालिका से पढ़ा गया है; व्यक्तिगत वर्ष जन्मदिन से जन्मदिन तक चलता है। सभी गणनाएँ कवर पर लिखी रिपोर्ट तिथि के अनुसार हैं।',
  },
};
export type Labels = typeof L.en;
export const labelsFor = (lang: string): Labels => (lang === 'hi' ? L.hi : L.en);

export interface Chapter { id: string; title: string; icon: string; html: string }

export interface TemplateInput {
  result: NumerologyResult;
  narrative: Narrative;
  theme: PdfTheme;
  branding: Branding;
  reportDate: string; // ISO
  watermark?: string;
  /** Admin Report Studio: chapter ids to leave out (e.g. ['kua','couple']). */
  hiddenChapters?: string[];
  /** Admin Report Studio: a personal note from the expert, printed in the closing chapter. */
  expertNote?: string;
  /** Custom report title / service name to print on the cover and header. */
  reportTitle?: string;
}

const fmtDate = (iso: string) => iso.split('-').reverse().join('-');
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

function reportType(r: NumerologyResult, lab: Labels) {
  const mods = r.modules ?? ['complete'];
  const key = mods.includes('complete') || mods.length > 1 ? 'complete' : mods[0];
  return lab.reportTypes[key] ?? lab.reportTypes.complete;
}

// ---------- shared CSS ----------
export function baseCss(t: PdfTheme, lang: Lang): string {
  const body = lang === 'hi' ? "'Noto Sans Devanagari', 'Poppins', sans-serif" : "'Poppins', 'Noto Sans Devanagari', sans-serif";
  return `${fontFaceCss()}
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{margin:0;padding:0;background:transparent;color:${t.ink};font-family:${body};font-size:${lang === 'hi' ? '10.9pt' : '10.2pt'};line-height:${lang === 'hi' ? '1.7' : '1.62'}}
  h1,h2,h3,.serif{font-family:'Playfair Display','Noto Sans Devanagari',Georgia,serif;color:${t.primary};font-weight:700;margin:0}
  p{margin:0 0 3.2mm;text-align:justify;hyphens:auto}
  .mk{position:absolute;font-size:1px;line-height:1px;color:transparent;white-space:nowrap}
  .chapter{position:relative;break-before:page;page-break-before:always;margin-top:0}
  .chapter.newpage{break-before:page;page-break-before:always;margin-top:0}
  .ch-intro{break-inside:avoid}
  .ch-head{display:flex;align-items:center;gap:5mm;margin:0 0 3mm;break-after:avoid}
  .ch-icon{width:17mm;height:17mm;border-radius:50%;background:${t.soft};border:1.2px solid ${t.accent};display:flex;align-items:center;justify-content:center;flex:none}
  .ch-num{font-size:8pt;letter-spacing:.25em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .ch-title{font-size:23pt;line-height:1.15}
  .orn{margin:1mm 0 6mm;display:flex;justify-content:flex-start;break-after:avoid}
  .sec{margin:0 0 6mm}
  .sec p{orphans:3;widows:3}
  .sec h3{font-size:13.5pt;margin:0 0 2.2mm;display:flex;align-items:center;gap:2.5mm;break-after:avoid}
  .sec h3:before{content:'';width:2.2mm;height:2.2mm;background:${t.accent};transform:rotate(45deg);display:inline-block;flex:none}
  .lead p:first-of-type:first-letter{font-family:'Playfair Display',serif;font-size:30pt;float:left;line-height:.9;padding:1.2mm 1.4mm 0 0;color:${t.primary};font-weight:700}
  figure{margin:0 0 5mm;break-inside:avoid}
  .row{display:flex;gap:6mm;align-items:flex-start;break-inside:avoid}
  .row>*{flex:1;min-width:0}
  .center{display:flex;flex-direction:column;align-items:center;justify-content:center}
  .cap{font-size:8pt;color:${t.muted};text-align:center;margin-top:1mm;letter-spacing:.04em}
  .panel{background:${t.soft};border-radius:3mm;padding:4mm 5mm;break-inside:avoid}
  .box{border-left:1.2mm solid ${t.accent};background:${t.soft};border-radius:0 2.5mm 2.5mm 0;padding:3.2mm 4.5mm;margin:0 0 4mm;break-inside:avoid}
  .box .bt{font-size:7.8pt;letter-spacing:.18em;text-transform:uppercase;font-weight:600;margin-bottom:1mm;display:flex;align-items:center;gap:2mm}
  .box p{margin:0;text-align:left}
  .box.strength{border-color:${t.good}} .box.strength .bt{color:${t.good}}
  .box.watch{border-color:${t.warn}} .box.watch .bt{color:${t.warn}}
  .box.advice{border-color:${t.accent}} .box.advice .bt{color:${t.accent}}
  .box.remedy{border-color:${t.primary}} .box.remedy .bt{color:${t.primary}}
  table{border-collapse:collapse;width:100%;font-size:9pt;break-inside:avoid}
  th{font-weight:600;text-align:left;color:${t.primary};border-bottom:1.2px solid ${t.accent};padding:1.6mm 2mm}
  td{border-bottom:.5px solid ${t.border}55;padding:1.6mm 2mm;vertical-align:top}
  .chips{display:flex;flex-wrap:wrap;gap:1.6mm}
  .chip{display:inline-flex;align-items:center;justify-content:center;min-width:7.5mm;height:7.5mm;padding:0 2mm;border-radius:4mm;font-family:'Playfair Display',serif;font-weight:700;font-size:10.5pt}
  .chip.good{background:${t.good}22;color:${t.good};border:1px solid ${t.good}66}
  .chip.bad{background:${t.bad}1a;color:${t.bad};border:1px solid ${t.bad}55}
  .chip.neu{background:${t.soft};color:${t.ink};border:1px solid ${t.border}}
  .chip.warn{background:${t.warn}1f;color:${t.warn};border:1px solid ${t.warn}55}
  .sw{display:inline-flex;align-items:center;gap:1.4mm;margin:0 3mm 1.4mm 0;font-size:8.6pt}
  .sw i{width:4.2mm;height:4.2mm;border-radius:50%;border:.6px solid ${t.border};display:inline-block}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-bottom:5mm}
  .card{border:1px solid ${t.accent}66;border-radius:3mm;padding:3.5mm 4mm;background:${t.paper};break-inside:avoid}
  .card .ct{display:flex;align-items:center;gap:2mm;font-weight:600;color:${t.primary};font-size:9.5pt;margin-bottom:1.2mm}
  .card .cv{font-size:9pt;line-height:1.5}
  .kv{display:grid;grid-template-columns:28mm 1fr;gap:1mm 3mm;font-size:9pt}
  .kv dt{color:${t.muted}} .kv dd{margin:0}
  .core{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin:2mm 0 6mm}
  .core .c{text-align:center;border:1px solid ${t.accent}55;border-radius:3mm;padding:3mm 1mm 2.5mm;background:${t.paper}}
  .core .k{font-size:7.4pt;letter-spacing:.14em;text-transform:uppercase;color:${t.muted}}
  .core .p{display:flex;align-items:center;justify-content:center;gap:1mm;font-size:8pt;color:${t.ink}}
  .watermark{position:fixed;top:45%;left:-10%;width:120%;text-align:center;transform:rotate(-30deg);font-family:'Playfair Display',serif;font-size:54pt;color:${t.primary};opacity:.12;z-index:10}
  .bgm{position:fixed;right:-38mm;bottom:-38mm;opacity:.06;z-index:-1}
  .toc-row{display:flex;align-items:baseline;gap:3mm;padding:2.6mm 0;border-bottom:.5px dashed ${t.border}}
  .toc-row .n{font-family:'Playfair Display',serif;color:${t.accent};font-weight:700;width:9mm}
  .toc-row .t{font-size:12pt;flex:none}
  .toc-row .d{flex:1;border-bottom:1px dotted ${t.muted};transform:translateY(-1.5mm)}
  .toc-row .pg{font-family:'Playfair Display',serif;font-weight:700;color:${t.primary};width:10mm;text-align:right}
  .muted{color:${t.muted}} .small{font-size:8.4pt}
  :lang(hi) .lead p:first-of-type:first-letter{font-size:inherit;float:none;padding:0;color:inherit;font-weight:inherit;font-family:inherit;line-height:inherit}
  :lang(hi) .core .k,:lang(hi) .ch-num,:lang(hi) .box .bt,:lang(hi) .cap{letter-spacing:0;text-transform:none}
  `;
}

// ---------- building blocks ----------
const box = (kind: 'strength' | 'watch' | 'advice' | 'remedy', title: string, html: string, t: PdfTheme, icon?: RemedyIcon) =>
  `<div class="box ${kind}"><div class="bt">${icon ? remedyIcon(icon, t, 14) : ''}${esc(title)}</div><p>${html}</p></div>`;

const paras = (s?: NarrativeSection) => (s ? s.text.split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join('') : '');
const sec = (s: NarrativeSection | undefined, lead = false) => (s ? `<div class="sec${lead ? ' lead' : ''}"><h3>${esc(s.title)}</h3>${paras(s)}</div>` : '');
const chip = (n: number | string, kind: 'good' | 'bad' | 'neu' | 'warn') => `<span class="chip ${kind}">${esc(n)}</span>`;

interface ChapterParts { id: string; title: string; icon: string; /** Kept together with the chapter heading (never split across pages). */ intro: string; inner: string }

function chapterHtml(index: number, c: ChapterParts, t: PdfTheme, lab: Labels, newPage = true) {
  return `<section class="chapter${newPage ? ' newpage' : ''}" id="ch-${c.id}"><div class="ch-intro"><div class="ch-head"><div class="ch-icon">${c.icon}</div><div><div class="ch-num">${esc(lab.chapter)} ${String(index).padStart(2, '0')}</div><h2 class="ch-title">${esc(c.title)}<span class="mk">@@C:${c.id}@@</span></h2></div></div><div class="orn">${divider(t, 200)}</div>${c.intro}</div>${c.inner}</section>`;
}

const HI_DIR_ABBR: Record<string, string> = { North: 'उ', 'North-East': 'उ-पू', East: 'पू', 'South-East': 'द-पू', South: 'द', 'South-West': 'द-प', West: 'प', 'North-West': 'उ-प' };

// ---------- chapters ----------
function buildChapters(inp: TemplateInput, lab: Labels): ChapterParts[] {
  const { result, narrative, theme: t } = inp;
  const lang: Lang = narrative.language === 'hi' ? 'hi' : 'en';
  /** Engine terms (planets, days, colours, planes, remedies…) in the report language. */
  const T = (s: string | null | undefined) => tr(lang, s);
  const r: R = result.results;
  const d = r.dob;
  const S = Object.fromEntries(narrative.sections.map((s) => [s.id, s])) as Record<string, NarrativeSection | undefined>;
  const ch: ChapterParts[] = [];
  const area = (k: string) => lab.areas[k] ?? k;
  const planetLine = (n: number, withDay = false) => { const p = planetOf(n); return [...new Set([T(p.name), lang === 'hi' ? T(p.name) : p.hindiName, ...(withDay ? [T(p.weekday)] : [])])].join(' · '); };

  // 1. Glance
  const coreCards = [
    [lab.moolank, d.moolank.value], [lab.bhagyank, d.bhagyank.value], [lab.kua, d.kua.value],
    ...(r.name ? [[lab.nameNo, r.name.chaldean.nameNumber.single]] : []), [lab.py, d.personalCycles.current.personalYear],
  ] as [string, number][];
  const strengths = [...d.loShu.yogs.map((y) => T(y.name)), ...d.loShu.arrowsOfStrength.map((a) => T(a.name)), ...(d.moolankBhagyankRelation === 'friend' ? [`${lab.moolank}–${lab.bhagyank}: ${lab.friendly}`] : [])];
  const watch = [...d.loShu.arrowsOfWeakness.map((a) => T(a.name)), ...(d.loShu.missing.length ? [`${lab.missing}: ${d.loShu.missing.join(', ')}`] : []), ...d.loShu.repeated.filter((x) => x.count >= 3).map((x) => `${x.number} × ${x.count}`)];
  ch.push({
    id: 'glance', title: lab.ch.glance, icon: planetIcon(NUMBER_PLANET[d.moolank.value] as never, t, 40),
    intro: `<div class="core" style="grid-template-columns:repeat(${coreCards.length},1fr)">${coreCards.map(([k, n]) => `<div class="c"><div class="k">${esc(k)}</div>${numberMedallion(n, t, 74)}<div class="p">${planetIcon(planetOf(n).id, t, 16)} ${esc(planetLine(n))}</div></div>`).join('')}</div>`,
    inner: `${sec(S.intro, true)}
      <div class="row" style="margin-top:2mm">
        <figure class="center">${gridSvg(d.loShu.cells, t, 196)}<div class="cap">${esc(lab.loShu)} · <span style="color:${t.accent}">■</span> ${esc(lab.present)} <span style="color:${t.primary}">■</span> ${esc(lab.repeated)} ▢ ${esc(lab.missing)}</div></figure>
        <figure class="center">${gridSvg(d.vedicGrid.cells.map((c) => ({ ...c, label: T(c.planetName) })), t, 196, { labels: true })}<div class="cap">${esc(lab.vedic)} · ${esc(lab.vedicNote)}</div></figure>
      </div>
      <div class="row">
        ${box('strength', lab.strengths, esc(strengths.join(' · ') || '—'), t)}
        ${box('watch', lab.watch, esc(watch.join(' · ') || '—'), t)}
      </div>`,
  });

  // 2. Core numbers
  const mP = planetOf(d.moolank.value), bP = planetOf(d.bhagyank.value);
  const planetCard = (title: string, n: number) => {
    const p = planetOf(n);
    return `<div class="panel" style="padding:3mm 4mm"><div style="display:flex;align-items:center;gap:3mm;margin-bottom:1.5mm">${numberMedallion(n, t, 54)}<div class="serif" style="font-size:13pt">${esc(title)} ${n}<div class="small muted" style="font-family:Poppins,'Noto Sans Devanagari'">${planetIcon(p.id, t, 12)} ${esc(planetLine(n, true))}</div></div></div>
      <div>${swatches(p.colours.slice(0, 3), t, T)}</div>
      <dl class="kv" style="margin:1.5mm 0 0"><dt>${esc(lab.element)}</dt><dd>${esc(T(p.element))}</dd><dt>${esc(lab.gem)}</dt><dd>${esc(T(p.gemstone.name))}</dd><dt>${esc(lab.fasting)}</dt><dd>${esc(T(p.fastingDay))}</dd></dl></div>`;
  };
  const rel = d.numberRelations.combined;
  ch.push({
    id: 'core', title: lab.ch.core, icon: planetIcon(mP.id, t, 40),
    intro: `<div class="row" style="margin-bottom:4mm">${planetCard(lab.moolank, d.moolank.value)}${planetCard(lab.bhagyank, d.bhagyank.value)}</div>`,
    inner: `${sec(S.moolank, true)}${sec(S.bhagyank)}
      <figure class="panel"><div class="row"><div><div class="small muted">${esc(lab.friendly)}</div><div class="chips">${rel.friendly.map((n) => chip(n, 'good')).join('')}</div></div>
      <div><div class="small muted">${esc(lab.neutral)}</div><div class="chips">${rel.neutral.map((n) => chip(n, 'neu')).join('') || '—'}</div></div>
      <div><div class="small muted">${esc(lab.enemy)}</div><div class="chips">${rel.enemy.map((n) => chip(n, 'bad')).join('') || '—'}</div></div></div></figure>
      ${sec(S.combination)}`,
  });

  // 3. Lo Shu
  const lines = [...d.loShu.planes, ...d.loShu.diagonals];
  ch.push({
    id: 'grid', title: lab.ch.grid, icon: remedyIcon('number', t, 40),
    intro: `<div class="row" style="align-items:center;margin-bottom:4mm"><figure class="center" style="flex:0 0 72mm">${gridSvg(d.loShu.cells, t, 240)}<div class="cap">${esc(lab.loShu)}</div></figure>
      <table><thead><tr><th>${esc(lab.plane)}</th><th></th><th>${esc(lab.status)}</th></tr></thead><tbody>${lines.map((l) => `<tr><td>${esc(T(l.name))}${l.arrow ? `<div class="small muted">${esc(T(l.arrow))}${l.yog ? ` · <b style="color:${t.accent}">${esc(T(l.yog))}</b>` : ''}</div>` : ''}</td><td class="serif">${l.numbers.join('-')}</td><td>${chip(`${l.presentCount}/3`, l.status === 'complete' ? 'good' : l.status === 'empty' ? 'bad' : 'neu')}</td></tr>`).join('')}</tbody></table></div>`,
    inner: `${sec(S.loshu, true)}${sec(S.missing)}
      ${r.remedies.loShuRemedies.length ? `<div class="cards">${r.remedies.loShuRemedies.map((x) => `<div class="card"><div class="ct">${chip(x.number, 'warn')} ${esc(lab.remedy)}</div><div class="cv"><b>${esc(T(x.element))} · ${esc(T(x.direction))}</b><br>${esc(T(x.placement))}<br><span class="muted">${esc(lab.wear)}: ${esc(T(x.wristband))}</span></div></div>`).join('')}</div>` : ''}`,
  });

  // 4. Kua – all eight directions
  const dirRow = (kind: 'good' | 'bad', key: string, dir: string) => `<tr><td style="color:${kind === 'good' ? t.good : t.bad};width:5mm">●</td><td><b>${esc(lab.kuaKinds[key]?.[0] ?? key)}</b><div class="small muted">${esc(lab.kuaKinds[key]?.[1] ?? '')}</div></td><td style="white-space:nowrap"><b>${esc(T(dir))}</b></td></tr>`;
  ch.push({
    id: 'kua', title: lab.ch.kua, icon: remedyIcon('compass', t, 40),
    intro: `<div class="row" style="align-items:center"><figure class="center" style="flex:0 0 70mm">${compassSvg(d.kua.favourable, d.kua.unfavourable, t, 240, lang === 'hi' ? { abbr: HI_DIR_ABBR, tags: { success: 'सफलता', health: 'स्वास्थ्य', relationships: 'संबंध', personalGrowth: 'विकास' } } : {})}<div class="cap">${esc(lab.kua)} ${d.kua.value} · ${esc(T(`${d.kua.group} group`))}</div></figure>
      <div>${sec(S.kua, true)}</div></div>`,
    inner: `<div class="row" style="margin-top:2mm">
        <table><thead><tr><th colspan="3" style="color:${t.good}">${esc(lab.favDirs)}</th></tr></thead><tbody>${Object.entries(d.kua.favourable).map(([k, v]) => dirRow('good', k, v)).join('')}</tbody></table>
        <table><thead><tr><th colspan="3" style="color:${t.bad}">${esc(lab.unfavDirs)}</th></tr></thead><tbody>${Object.entries(d.kua.unfavourable).map(([k, v]) => dirRow('bad', k, v)).join('')}</tbody></table>
      </div>${d.flags.includes('KUA_NEAR_CHINESE_NEW_YEAR') ? `<p class="small muted" style="margin-top:2mm;text-align:left">${esc(lab.kuaLichun)}</p>` : ''}`,
  });

  // 5. Timing
  const tl = d.personalCycles.timeline;
  const cur = d.personalCycles.detailed[0];
  const monthInitials = lang === 'hi' ? ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं'] : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  ch.push({
    id: 'timing', title: lab.ch.timing, icon: remedyIcon('calendar', t, 40),
    intro: `<figure class="center">${barsSvg(tl.map((y, i) => ({ label: String(y.year), value: y.personalYear, highlight: i === 0 })), t, 640, 190)}<div class="cap">${esc(lab.pyTimeline)}</div></figure>`,
    inner: `${sec(S.forecast, true)}
      ${cur ? `<figure><table><thead><tr><th>${esc(lab.months)} ${esc(T(cur.label ?? String(cur.year)))}</th>${cur.months.map((m) => `<th style="text-align:center${lang === 'hi' ? ';font-size:7pt;padding:1.6mm .5mm' : ''}">${monthInitials[m.month - 1]}</th>`).join('')}</tr></thead><tbody><tr><td>${esc(lab.py)} ${cur.personalYear}</td>${cur.months.map((m) => `<td style="text-align:center" class="serif">${m.personalMonth}</td>`).join('')}</tr></tbody></table></figure>` : ''}
      <figure><div class="small muted" style="margin-bottom:1mm">${esc(lab.pinnacles)} · ${esc(lab.ageYears)}</div>${timelineSvg(d.pinnacles, t, 640, lab.now)}<div class="small muted" style="margin:2mm 0 1mm">${esc(lab.challenges)}</div>${timelineSvg(d.challenges, t, 640, lab.now)}</figure>
      ${sec(S.lifePeriods)}`,
  });

  // 6. Life areas
  const fy = r.remedies.favourableYears;
  ch.push({
    id: 'life', title: lab.ch.life, icon: planetIcon(bP.id, t, 40),
    intro: `<div class="row" style="align-items:center"><figure class="center" style="flex:0 0 96mm">${radarSvg(Object.entries(d.lifeAreaScores).map(([k, v]) => ({ label: area(k), value: v })), t, 240)}<div class="cap">${esc(lab.lifeAreas)}</div></figure>
      <div>${box('advice', lab.advice, `${esc(lab.jobYears)}: <b>${fy.jobChange?.map((y) => y.year).join(', ') || '—'}</b><br>${esc(lab.bizYears)}: <b>${fy.businessStart?.map((y) => y.year).join(', ') || '—'}</b><br>${esc(lab.marriageYears)}: <b>${fy.marriage?.map((y) => y.year).join(', ') || '—'}</b><br><span class="small muted">${esc(lab.yearNote)}</span>`, t, 'calendar')}</div></div>`,
    inner: `${sec(S.career, true)}${sec(S.relationships)}${sec(S.wellbeing)}`,
  });

  // 7. Name
  if (r.name) {
    const n = r.name;
    const rowLabel = { nameNumber: lab.nameNo, soulUrge: lab.soulUrge, personality: lab.personality } as const;
    ch.push({
      id: 'name', title: lab.ch.name, icon: remedyIcon('signature', t, 40),
      intro: `<div class="row" style="align-items:center;margin-bottom:4mm"><figure class="center" style="flex:0 0 60mm">${gaugeSvg(n.compatibilityScore, t, lab.compat, 200)}</figure>
        <div><div class="serif" style="font-size:15pt;margin-bottom:2mm">${esc(titleCase(n.analysedName))}</div>
        <div class="chips" style="margin-bottom:3mm;gap:1mm">${n.chaldean.letters.map((x) => `<span style="display:inline-block;text-align:center;width:6.6mm;border:.6px solid ${t.border};border-radius:1.5mm;font-size:8pt;line-height:1.3"><b>${x.letter}</b><br><span style="color:${t.accent}">${x.value}</span></span>`).join('')}</div>
        <table><thead><tr><th></th><th>${esc(lab.chaldean)}</th><th>${esc(lab.pythagorean)}</th></tr></thead><tbody>${(['nameNumber', 'soulUrge', 'personality'] as const).map((k) => `<tr><td>${esc(rowLabel[k])}</td><td class="serif"><b>${n.chaldean[k].compound}/${n.chaldean[k].single}</b></td><td class="serif">${n.pythagorean[k].compound}/${n.pythagorean[k].single}</td></tr>`).join('')}
          ${n.chaldean.words.length > 1 ? `<tr><td>${esc(lab.words)}</td><td colspan="2" class="small">${n.chaldean.words.map((w) => `${esc(titleCase(w.word))} <b class="serif">${w.compound}/${w.single}</b>`).join(' · ')}</td></tr>` : ''}
          ${n.officialName ? `<tr><td>${esc(lab.officialName)}</td><td colspan="2" class="small">${esc(titleCase(n.officialName.name))} <b class="serif">${n.officialName.nameNumber.compound}/${n.officialName.nameNumber.single}</b></td></tr>` : ''}
        </tbody></table></div></div>`,
      inner: `${sec(S.name, true)}
        ${n.needsCorrection && n.corrections.length ? `<figure><div class="serif" style="font-size:12pt;margin-bottom:2mm">${esc(lab.corrections)}</div><table><thead><tr><th>${esc(lab.spelling)}</th><th>${esc(lab.chaldean)}</th><th>${esc(lab.score)}</th><th></th></tr></thead><tbody>${n.corrections.map((c) => `<tr><td class="serif" style="font-size:11pt"><b>${esc(c.fullName)}</b></td><td>${c.compound}/${c.single}</td><td>${chip(c.score, 'good')}</td><td class="small muted">${esc(c.changes.map(T).join(', '))}</td></tr>`).join('')}</tbody></table></figure>` : ''}`,
    });
  }

  // 8. Mobile & Aadhaar
  if (r.mobile || r.aadhaar) {
    const m = r.mobile, a = r.aadhaar;
    const mobileHead = m ? `<div class="row" style="align-items:center;margin-bottom:4mm"><figure class="center" style="flex:0 0 60mm">${gaugeSvg(m.score, t, T(m.verdict), 200)}</figure>
        <div><div class="serif" style="font-size:15pt;letter-spacing:.08em">${esc(m.masked)}</div><div class="small muted" style="margin-bottom:2mm">${m.total.compound} → ${m.total.single}</div>
        <div class="small muted">${esc(lab.pairs)}</div><div class="chips" style="margin-bottom:1mm">${m.pairs.map((p) => chip(p.pair, p.kind === 'malefic' ? 'bad' : p.kind === 'conflict' ? 'warn' : p.kind === 'supportive' ? 'good' : 'neu')).join('')}</div>
        <div class="small muted" style="margin-bottom:2mm"><span style="color:${t.good}">■</span> ${esc(lab.pairGood)} <span style="color:${t.warn}">■</span> ${esc(lab.pairWarn)} <span style="color:${t.bad}">■</span> ${esc(lab.pairBad)}</div>
        ${box('advice', lab.ideal, `<b>${m.suggestion.idealTotals.join(', ')}</b> · ${m.suggestion.idealCompounds.slice(0, 8).join(', ')}`, t, 'number')}</div></div>` : '';
    const aadhaarHead = a ? `<div class="row" style="align-items:center;margin-top:3mm"><figure class="center" style="flex:0 0 50mm">${gaugeSvg(a.score, t, T(a.verdict), 160)}</figure><div><div class="serif" style="font-size:14pt;letter-spacing:.1em">${esc(a.masked)}</div><div class="small muted">${a.total.compound} → ${a.total.single}</div></div></div>` : '';
    ch.push({
      id: 'numbers', title: lab.ch.numbers, icon: remedyIcon('number', t, 40),
      intro: m ? mobileHead : aadhaarHead,
      inner: m ? `${sec(S.mobile, true)}${a ? `<div style="break-before:page;page-break-before:always;margin-top:0">${aadhaarHead}${sec(S.aadhaar)}</div>` : ''}` : sec(S.aadhaar, true),
    });
  }

  // 9. Couple
  if (r.couple) {
    const c = r.couple;
    const strong = c.marriage.auspiciousYears.map((y) => y.year);
    const good = c.marriage.yearTable.filter((y) => y.score === 2).map((y) => y.year).slice(0, 5);
    ch.push({
      id: 'couple', title: lab.ch.couple, icon: remedyIcon('daan', t, 40),
      intro: `<div class="row" style="align-items:center"><figure class="center" style="flex:0 0 55mm">${ringSvg(c.overall, t, lab.overall, 170)}<div class="serif" style="font-size:11pt;margin-top:2mm;text-align:center">${esc(titleCase(c.partnerA.name))}<br><span style="color:${t.accent}">&amp;</span><br>${esc(titleCase(c.partnerB.name))}</div></figure>
        <figure class="center">${radarSvg(Object.entries(c.areaScores).map(([k, v]) => ({ label: area(k), value: v })), t, 250)}</figure></div>`,
      inner: `<figure><div class="serif" style="font-size:12pt;margin-bottom:2mm">${esc(lab.overlay)}</div><table><thead><tr><th></th><th>${esc(lab.moolank)}</th><th>${esc(lab.bhagyank)}</th><th>${esc(lab.nameNo)}</th><th>${esc(lab.kua)}</th>${c.combinedGrid.overlay.map((o) => `<th style="text-align:center">${o.number}</th>`).join('')}</tr></thead><tbody>
        ${(['partnerA', 'partnerB'] as const).map((p) => `<tr><td>${esc(titleCase(c[p].name.split(' ')[0]))}</td><td class="serif"><b>${c[p].moolank}</b></td><td class="serif"><b>${c[p].bhagyank}</b></td><td class="serif"><b>${c[p].nameNumber}</b></td><td class="serif"><b>${c[p].kua}</b></td>${c.combinedGrid.overlay.map((o) => { const brings = p === 'partnerA' ? o.aBringsToB : o.bBringsToA; return `<td style="text-align:center">${o[p] ? chip(o[p], brings ? 'good' : 'neu') : '<span class="muted">·</span>'}</td>`; }).join('')}</tr>`).join('')}
        </tbody></table><div class="small muted" style="margin-top:1mm"><span style="color:${t.good}">■</span> ${esc(lab.brings)}</div></figure>
        ${box('advice', lab.advice, `${esc(lab.dates)}: <b>${c.marriage.favourableDatesOfMonth.join(', ')}</b><br>${esc(lab.jointYears)}: <b>${strong.join(', ') || '—'}</b>${good.length ? `<br>${esc(lab.alsoGoodYears)}: <b>${good.join(', ')}</b>` : ''}<br><span class="small muted">${esc(lab.yearNote)}</span>`, t, 'calendar')}
        ${sec(S.couple, true)}`,
    });
  }

  // 10. Remedies
  const rm = r.remedies;
  const card = (icon: RemedyIcon, title: string, body: string) => `<div class="card"><div class="ct">${remedyIcon(icon, t, 20)} ${esc(title)}</div><div class="cv">${body}</div></div>`;
  const tl2 = (xs: string[]) => xs.map((x) => esc(T(x))).join(', ');
  ch.push({
    id: 'remedies', title: lab.ch.remedies, icon: remedyIcon('mantra', t, 40),
    intro: '',
    inner: `${sec(S.remedies, true)}
      <div class="cards" style="margin-bottom:4mm">
        ${card('number', `${lab.lucky} ${lab.numbers}`, `<div class="chips">${rm.lucky.numbers.map((n) => chip(n, 'good')).join('')}</div><div class="small" style="margin-top:1.5mm">${esc(lab.dates)}: ${rm.lucky.dates.join(', ')}</div>`)}
        ${card('colour', lab.colours, `${swatches(rm.lucky.colours, t, T)}<div class="small muted">${esc(lab.avoid)}: ${tl2(rm.lucky.avoidColours) || '—'}</div>`)}
        ${card('calendar', `${lab.lucky} ${lab.days}`, tl2(rm.lucky.days))}
        ${card('gem', lab.gem, rm.gemstones.map((g) => `<b>${esc(T(g.name))}</b>${lang === 'hi' ? '' : ` (${esc(g.hindi)})`} <span class="small muted">· ${esc(g.for === 'Moolank' ? lab.moolank : lab.bhagyank)}</span><br><span class="small muted">${esc(T(g.metal))} · ${esc(T(g.finger))} · ${esc(lab.rudraksha)} ${esc(T(g.rudraksha))}</span>`).join('<br>') + `<div class="small" style="color:${t.warn};margin-top:1mm">${esc(lab.gemNote)}</div>`)}
        ${card('mantra', lab.mantra, `<i class="serif" style="font-size:9.5pt;color:${t.ink}">“${esc(T(rm.mantra.mantra))}”</i><br><span class="small muted">${rm.mantra.dailyCount}× · ${esc(T(rm.mantra.day))} · ${esc(T(rm.mantra.deity))}</span>`)}
        ${card('compass', lab.directions, Object.values(rm.lucky.directions).map((x) => esc(T(x))).join(', '))}
        ${card('daan', lab.daan, tl2(rm.daan))}
        ${card('fast', lab.fasting, esc(T(rm.fastingDay)))}
        ${card('home', lab.remedy, rm.loShuRemedies.slice(0, 2).map((x) => esc(T(x.placement))).join('<br>') || '—')}
      </div>
      <div class="row">
        <div class="panel"><div class="ct serif" style="font-size:12pt;margin-bottom:1.5mm">${remedyIcon('habit', t, 18)} ${esc(lab.habits)}</div><ul style="margin:0;padding-left:5mm;font-size:9pt">${rm.dailyHabits.map((h) => `<li>${esc(T(h))}</li>`).join('')}</ul>
          <div class="ct serif" style="font-size:12pt;margin:3mm 0 1.5mm">${remedyIcon('signature', t, 18)} ${esc(lab.signature)}</div><ul style="margin:0;padding-left:5mm;font-size:9pt">${rm.signature.map((h) => `<li>${esc(T(h))}</li>`).join('')}</ul></div>
        <div><table><thead><tr><th>${esc(lab.favYears)}</th><th></th></tr></thead><tbody>${Object.entries(rm.favourableYears).map(([k, ys]) => `<tr><td>${esc(lab.events[k] ?? k)}</td><td class="serif"><b>${ys.map((y) => y.year).join(', ') || '—'}</b></td></tr>`).join('')}</tbody></table>
          <p class="small muted" style="margin:1.5mm 0 0;text-align:left">${esc(lab.yearNote)}</p></div>
      </div>`,
  });

  return ch;
}

/** "How your numbers were calculated" – printed under the contents so every figure in the report can be checked. */
function methodPanel(inp: TemplateInput, lab: Labels, lang: Lang) {
  const { theme: t } = inp;
  const r = inp.result.results, d = r.dob;
  const digits = `${String(d.dob.day).padStart(2, '0')}${String(d.dob.month).padStart(2, '0')}${d.dob.year}`.split('').join(' + ');
  const cur = d.personalCycles.current;
  const hi = lang === 'hi';
  const moolankInGrid = d.loShu.sources.some((s) => s.source === 'moolank');
  const rows: [string, string][] = [
    [lab.moolank, hi ? `जन्म का दिन ${d.dob.day} → ${d.moolank.value}` : `Day of birth ${d.dob.day} → ${d.moolank.value}`],
    [lab.bhagyank, `${digits} = ${d.bhagyank.compound} → ${d.bhagyank.value}`],
    [lab.kua, hi ? `जन्म वर्ष ${d.dob.year}, ${d.kua.basis === 'male' ? 'पुरुष' : 'महिला'} सूत्र → ${d.kua.value}` : `Birth year ${d.dob.year}, ${d.kua.basis} formula → ${d.kua.value}`],
    ...(r.name ? [[lab.nameNo, hi ? `"${titleCase(r.name.analysedName)}" के कैल्डियन मान = ${r.name.chaldean.nameNumber.compound} → ${r.name.chaldean.nameNumber.single}` : `Chaldean values of "${titleCase(r.name.analysedName)}" = ${r.name.chaldean.nameNumber.compound} → ${r.name.chaldean.nameNumber.single}`] as [string, string]] : []),
    [lab.py, hi ? `जन्म का दिन ${d.dob.day} + माह ${d.dob.month} + वर्ष ${cur.startYear} → ${cur.personalYear} (${tr('hi', cur.label)})` : `Birth day ${d.dob.day} + month ${d.dob.month} + year ${cur.startYear} → ${cur.personalYear} (${cur.label})`],
    [lab.loShu, hi ? `जन्म तिथि के अंक${moolankInGrid ? ' + मूलांक' : ''} + भाग्यांक + कुआ` : `Birth-date digits${moolankInGrid ? ' + Moolank' : ''} + Bhagyank + Kua`],
  ];
  return `<div class="panel" style="margin-top:9mm;break-inside:avoid"><div class="serif" style="font-size:12.5pt;color:${t.primary};margin-bottom:2mm">${esc(lab.methodTitle)}</div>
    <dl class="kv" style="grid-template-columns:34mm 1fr;font-size:9.2pt;gap:1.4mm 3mm">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="small muted" style="margin:2.5mm 0 0;text-align:left">${esc(lab.methodNote)}</p></div>`;
}

// ---------- Cover ----------
export function buildCoverHtml(inp: TemplateInput): string {
  const { result, theme: t, branding: b } = inp;
  const lab = labelsFor(inp.narrative.language);
  const c = result.client;
  const logo = b.logoDataUrl ? `<img src="${esc(b.logoDataUrl)}" style="height:20mm">` : monogram(b.brandName, t, 72, true);
  const photo = b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" style="width:26mm;height:26mm;border-radius:50%;object-fit:cover;border:1.5px solid ${t.coverAccent}">` : portraitPlaceholder(b.expertName, { ...t, soft: 'rgba(255,255,255,.12)', accent: t.coverAccent }, 98);
  return `<!doctype html><html lang="${inp.narrative.language === 'hi' ? 'hi' : 'en'}"><head><meta charset="utf-8"><style>${baseCss(t, inp.narrative.language === 'hi' ? 'hi' : 'en')}
    @page{size:A4;margin:0}
    html,body{width:210mm;height:297mm;overflow:hidden}
    .cv{position:relative;width:210mm;height:297mm;background:${t.coverBg};color:${t.coverInk};display:flex;flex-direction:column;align-items:center;text-align:center;padding:20mm 18mm 16mm}
    .cv .frame{position:absolute;inset:8mm;border:1px solid ${t.coverAccent}88;border-radius:2mm}
    .cv .frame2{position:absolute;inset:10mm;border:.4px solid ${t.coverAccent}55;border-radius:1.5mm}
    .cv .md{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%)}
    .cv h1{color:${t.coverInk};font-size:34pt;line-height:1.1;margin:0}
    .cv .type{font-size:10pt;letter-spacing:.42em;text-transform:uppercase;color:${t.coverAccent};margin:6mm 0 3mm}
    .cv .brand{font-family:'Playfair Display',serif;font-size:14pt;letter-spacing:.12em;margin-top:3mm}
    .cv .meta{display:flex;gap:12mm;justify-content:center;font-size:9.5pt;margin-top:5mm}
    .cv .meta div span{display:block;font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:${t.coverAccent};opacity:.9}
    .cv .exp{position:absolute;bottom:22mm;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:5mm;font-size:9.5pt}
    .cv .exp b{font-family:'Playfair Display',serif;font-size:13pt;display:block}
  </style></head><body><div class="cv"><div class="frame"></div><div class="frame2"></div>
    <div class="md">${mandala(560, t.coverAccent, 0.38, 32)}</div>
    <div style="position:relative">${logo}<div class="brand">${esc(b.brandName)}</div></div>
    <div style="position:relative;margin-top:62mm">
      <div class="type">${esc(inp.reportTitle || reportType(result, lab))}</div>
      <div style="font-size:9pt;letter-spacing:.3em;text-transform:uppercase;opacity:.8">${esc(lab.preparedFor)}</div>
      <h1>${esc(titleCase(c.commonName || c.fullName))}</h1>
      ${c.hindiName ? `<div style="font-family:'Noto Sans Devanagari';font-size:15pt;margin-top:1mm">${esc(c.hindiName)}</div>` : ''}
      <div style="margin:5mm auto 0;width:60mm">${divider({ ...t, accent: t.coverAccent }, 220)}</div>
      <div class="meta"><div><span>${esc(lab.dob)}</span>${fmtDate(result.results.dob.dob.iso)}</div><div><span>${esc(lab.reportDate)}</span>${fmtDate(inp.reportDate)}</div></div>
    </div>
    <div class="exp">${photo}<div style="text-align:left"><span style="font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:${t.coverAccent}">${esc(lab.by)}</span><b>${esc(b.expertName)}</b>${esc(b.expertTitle ?? '')}</div></div>
  </div></body></html>`;
}

/** Full numerology disclaimer printed at the end of every report (closing chapter). */
function disclaimerPanel(lang: Lang, t: PdfTheme) {
  const d = DISCLAIMER[lang];
  return `<div class="panel small" style="margin-top:10mm;border:1px solid ${t.accent}55;break-inside:avoid">
    <div class="serif" style="font-size:12pt;color:${t.primary};margin-bottom:2mm">${esc(d.heading)}</div>
    <p style="margin:0 0 2.5mm"><b>${esc(d.short)}</b></p>
    ${d.points.map((x) => `<p style="margin:0 0 1.6mm;line-height:1.45"><b>${esc(x.h)}${lang === 'hi' ? ':' : '.'}</b> ${esc(x.p)}</p>`).join('')}
    <p class="muted" style="margin:2mm 0 0">mynumerologist.com/disclaimer</p>
  </div>`;
}

// ---------- Body (TOC + chapters + closing) ----------
export function buildBodyHtml(inp: TemplateInput, pages: Record<string, number> | null, qrSvg: string): { html: string; chapterIds: string[] } {
  const { theme: t, branding: b, narrative } = inp;
  const lang: Lang = narrative.language === 'hi' ? 'hi' : 'en';
  const lab = labelsFor(narrative.language);
  const chapters = buildChapters(inp, lab).filter((c) => !inp.hiddenChapters?.includes(c.id));
  const S = Object.fromEntries(narrative.sections.map((s) => [s.id, s])) as Record<string, NarrativeSection | undefined>;

  const closing = `<section class="chapter newpage" id="ch-closing"><div class="ch-intro"><div class="ch-head"><div class="ch-icon">${remedyIcon('signature', t, 40)}</div><div><div class="ch-num">${esc(lab.chapter)} ${String(chapters.length + 1).padStart(2, '0')}</div><h2 class="ch-title">${esc(lab.ch.closing)}<span class="mk">@@C:closing@@</span></h2></div></div><div class="orn">${divider(t, 200)}</div>
    ${sec(S.closing, true)}</div>
    ${inp.expertNote?.trim() ? `<div class="panel" style="margin-top:6mm;white-space:pre-line">${esc(inp.expertNote.trim())}</div>` : ''}
    <div style="margin-top:8mm" class="row">
      <div style="display:flex;gap:4mm;align-items:center">
        ${b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" style="width:22mm;height:22mm;border-radius:50%;object-fit:cover;border:1.5px solid ${t.accent};background:rgba(0,0,0,0.04);flex-shrink:0">` : ''}
        <div>
          <div class="muted small" style="letter-spacing:.2em;text-transform:uppercase">${esc(lab.by)}</div>
          ${b.signatureDataUrl ? `<img src="${esc(b.signatureDataUrl)}" style="height:18mm;margin:3mm 0">` : `<div class="serif" style="font-style:italic;font-size:24pt;color:${t.primary};margin:2mm 0 1mm">${esc(b.expertName)}</div>`}
          <div style="width:60mm;border-top:1px solid ${t.accent};padding-top:1.5mm"><b>${esc(b.expertName)}</b><br><span class="small muted">${esc(b.expertTitle ?? '')}</span></div>
          <div class="small" style="margin-top:3mm">${esc(b.brandName)}<br>${esc(b.contactLine ?? '')}${b.website ? `<br>${esc(b.website)}` : ''}</div>
        </div>
      </div>
      <div class="panel center" style="flex:0 0 62mm;text-align:center"><div class="serif" style="font-size:12pt;margin-bottom:2mm">${esc(lab.book)}</div><div style="background:#fff;padding:2mm;border-radius:2mm;line-height:0">${qrSvg}</div><div class="small muted" style="margin-top:1.5mm">${esc(lab.scan)}</div></div>
    </div>
    ${disclaimerPanel(lang, t)}
  </section>`;

  const ids = [...chapters.map((c) => c.id), 'closing'];
  const toc = `<section id="toc"><h2 class="ch-title" style="text-align:center;margin-top:8mm">${esc(lab.contents)}</h2><div class="center" style="margin:3mm 0 8mm">${divider(t, 200)}</div>
    ${ids.map((id, i) => `<div class="toc-row"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(lab.ch[id])}</span><span class="d"></span><span class="pg">${pages?.[id] ?? '00'}</span></div>`).join('')}
    ${methodPanel(inp, lab, lang)}</section>`;

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}@page{size:A4;margin:22mm 18mm 20mm}</style></head><body>
    <div class="bgm">${mandala(150 * 3.78, t.accent, 1, 24)}</div>
    ${inp.watermark ? `<div class="watermark">${esc(inp.watermark)}</div>` : ''}
    ${toc}
    ${chapters.map((c, i) => chapterHtml(i + 1, c, t, lab, true)).join('')}
    ${closing}
  </body></html>`;
  return { html, chapterIds: ids };
}

export function headerFooter(inp: TemplateInput) {
  const { theme: t, branding: b, result } = inp;
  const lab = labelsFor(inp.narrative.language);
  const client = titleCase(result.client.commonName || result.client.fullName);
  const font = "font-family:Georgia,'Times New Roman',serif;";
  return {
    header: `<div style="${font}width:100%;font-size:7.5px;color:${t.muted};padding:0 18mm;margin-top:9mm;display:flex;justify-content:space-between;letter-spacing:.12em;text-transform:uppercase"><span style="color:${t.primary}">${esc(b.brandName)}</span><span>${esc(client)} · ${esc(inp.reportTitle || reportType(result, lab))}</span></div>`,
    footer: `<div style="${font}width:100%;font-size:7.4px;color:${t.muted};padding:0 18mm;margin-bottom:10mm;display:flex;justify-content:space-between;align-items:flex-end;gap:10mm"><span style="max-width:150mm;line-height:1.35">${esc(lab.disclaimer)}</span><span style="font-size:9px;color:${t.primary};white-space:nowrap"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  };
}
