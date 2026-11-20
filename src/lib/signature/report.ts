/**
 * Signature Analysis Report – branded A4 PDF (rendered with the same Chromium + framed-page pipeline as the main reports).
 * Sections: cover & score dashboard · what the signature shows (annotated sample + feature table) · numerology of the
 * signature (number harmony, signing-name options) · personality & life areas · corrections · ideal-signature blueprint,
 * start dates and a 21-day practice tracker · closing & disclaimer.
 */
import { divider, esc, gaugeSvg, monogram, numberMedallion, ringSvg, scoreColour } from '@/lib/pdf/svg';
import { baseCss } from '@/lib/pdf/template';
import { COLOUR_HEX, DEFAULT_BRANDING, resolveTheme, type Branding, type PdfTheme, type ThemeId } from '@/lib/pdf/themes';
import { renderSheetPdf } from '@/lib/pdf/render';
import { coverDocument } from '@/lib/pdf/cover';
import { compoundMeaningHi, dayHi, optionLabelHi, professionHi } from './hindi';
import { tr } from '@/lib/i18n/hi-terms';
import type { AgentResult, SignatureAnalysis } from './agent';
import type { SignatureNumbers } from './numbers';

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

const L = {
  en: {
    title: 'Signature Analysis Report', sub: 'Graphology × Numerology', client: 'Client', dob: 'Date of birth', profession: 'Profession', goals: 'Goals', date: 'Report date', by: 'Prepared by',
    overall: 'Signature score', glance: 'Score at a glance', graph: 'Graphology', nameVib: 'Name vibration', first: 'First letter', prof: 'Profession fit', cons: 'Consistency',
    keyNums: 'Key numbers', moolank: 'Moolank', bhagyank: 'Bhagyank', signed: 'Signed name', full: 'Full name', letter: 'First letter',
    s1: 'What your signature shows', s1d: 'Each feature was measured from the image and checked by the analyst. Markings on the sample: gold line = baseline direction, red line = strokes crossing the name, arrow = ending stroke, box = first letter.',
    feature: 'Feature', observed: 'Observed', meaning: 'What it indicates', impact: 'Effect', conf: 'Certainty', supports: 'Supports', neutral: 'Neutral', watch: 'Needs attention',
    high: 'High', medium: 'Medium', low: 'Low', expert: 'Expert', measured: 'Measured', samples: 'Samples analysed',
    s2: 'Numerology of your signature', number: 'Number', value: 'Value', planet: 'Planet', toB: 'With Bhagyank', toM: 'With Moolank', nature: 'Nature', friendly: 'Friendly numbers', avoid: 'Numbers to avoid',
    friend: 'Friendly', neutralR: 'Neutral', enemy: 'Not friendly', favourable: 'Favourable', mixed: 'Mixed', unfavourable: 'Unfavourable',
    options: 'Ways to sign your name – ranked', optionsD: 'Each form of your name carries its own number. The current form is shown first; the others are ranked by how well they suit your Moolank, Bhagyank and profession.',
    form: 'Name form', score: 'Score', recommended: 'Recommended', current: 'Current',
    s3: 'Personality & life areas', personality: 'Personality', career: 'Career', finance: 'Wealth & finance', relationships: 'Relationships', strengths: 'Strengths', watchouts: 'Watch-outs',
    s4: 'Recommended corrections', priority: { high: 'High priority', medium: 'Medium', low: 'Low' },
    s5: 'Your ideal signature – blueprint', steps: 'How to sign', do: 'Do', dont: 'Avoid', start: 'When to start', ink: 'Ink colour', practice: 'Practice', dates: 'Suggested start dates', luckyCol: 'Lucky colours',
    tracker: '21-day practice tracker', trackerD: 'Tick a box each day after practising the new signature (traditionally 108 times). Keep the old signature only for existing documents and bank records until they are updated.',
    expertNote: 'Note from your numerologist', closing: 'Closing', sig: 'Signature', disclaimer: 'Signature analysis offers guidance based on graphology and numerology traditions. It is not a substitute for medical, psychological, legal or financial advice. Results depend on effort and circumstances; no outcome is guaranteed. Update bank and legal signatures only through the proper process.',
    madeLine: (by: string) => `Prepared by ${by} from your signature samples, their measurements and your numerology chart`, none: 'None significant', day: 'Day',
  },
  hi: {
    title: 'हस्ताक्षर विश्लेषण रिपोर्ट', sub: 'हस्तलेख विज्ञान × अंक ज्योतिष', client: 'क्लाइंट', dob: 'जन्म तिथि', profession: 'पेशा', goals: 'लक्ष्य', date: 'रिपोर्ट तिथि', by: 'तैयारकर्ता',
    overall: 'हस्ताक्षर स्कोर', glance: 'स्कोर एक नज़र में', graph: 'हस्तलेख', nameVib: 'नाम कंपन', first: 'पहला अक्षर', prof: 'पेशा अनुकूलता', cons: 'एकरूपता',
    keyNums: 'मुख्य अंक', moolank: 'मूलांक', bhagyank: 'भाग्यांक', signed: 'हस्ताक्षर नाम', full: 'पूरा नाम', letter: 'पहला अक्षर',
    s1: 'आपका हस्ताक्षर क्या दर्शाता है', s1d: 'हर विशेषता को चित्र से मापा गया और विशेषज्ञ द्वारा जाँचा गया। नमूने पर निशान: सुनहरी रेखा = आधार रेखा की दिशा, लाल रेखा = नाम को काटती रेखा, तीर = अंतिम स्ट्रोक, बॉक्स = पहला अक्षर।',
    feature: 'विशेषता', observed: 'देखा गया', meaning: 'क्या दर्शाता है', impact: 'प्रभाव', conf: 'निश्चितता', supports: 'सहायक', neutral: 'सामान्य', watch: 'ध्यान दें',
    high: 'उच्च', medium: 'मध्यम', low: 'कम', expert: 'विशेषज्ञ', measured: 'मापा गया', samples: 'विश्लेषित नमूने',
    s2: 'आपके हस्ताक्षर का अंक ज्योतिष', number: 'अंक', value: 'मान', planet: 'ग्रह', toB: 'भाग्यांक से', toM: 'मूलांक से', nature: 'प्रकृति', friendly: 'मित्र अंक', avoid: 'बचने वाले अंक',
    friend: 'मित्र', neutralR: 'सम', enemy: 'शत्रु', favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ',
    options: 'नाम लिखने के तरीके – क्रमवार', optionsD: 'नाम के हर रूप का अपना अंक होता है। वर्तमान रूप पहले है; बाकी आपके मूलांक, भाग्यांक और पेशे से मेल के अनुसार क्रम में हैं।',
    form: 'नाम का रूप', score: 'स्कोर', recommended: 'अनुशंसित', current: 'वर्तमान',
    s3: 'व्यक्तित्व और जीवन क्षेत्र', personality: 'व्यक्तित्व', career: 'करियर', finance: 'धन और वित्त', relationships: 'संबंध', strengths: 'शक्तियाँ', watchouts: 'सावधानियाँ',
    s4: 'सुझाए गए सुधार', priority: { high: 'उच्च प्राथमिकता', medium: 'मध्यम', low: 'कम' },
    s5: 'आपका आदर्श हस्ताक्षर – ब्लूप्रिंट', steps: 'कैसे हस्ताक्षर करें', do: 'करें', dont: 'न करें', start: 'कब शुरू करें', ink: 'स्याही का रंग', practice: 'अभ्यास', dates: 'शुरुआत की शुभ तिथियाँ', luckyCol: 'शुभ रंग',
    tracker: '21 दिन का अभ्यास चार्ट', trackerD: 'नए हस्ताक्षर का अभ्यास (परंपरागत रूप से 108 बार) करने के बाद हर दिन एक बॉक्स पर निशान लगाएँ। पुराने दस्तावेज़ और बैंक रिकॉर्ड अपडेट होने तक वहाँ पुराना हस्ताक्षर ही रखें।',
    expertNote: 'अंक ज्योतिषी का संदेश', closing: 'समापन', sig: 'हस्ताक्षर', disclaimer: 'हस्ताक्षर विश्लेषण हस्तलेख विज्ञान और अंक ज्योतिष परंपराओं पर आधारित मार्गदर्शन है। यह चिकित्सा, मनोवैज्ञानिक, कानूनी या वित्तीय सलाह का विकल्प नहीं है। परिणाम प्रयास और परिस्थितियों पर निर्भर करते हैं; किसी परिणाम की गारंटी नहीं है। बैंक और कानूनी हस्ताक्षर उचित प्रक्रिया से ही बदलें।',
    madeLine: (by: string) => `${by} द्वारा आपके हस्ताक्षर के नमूनों, उनके माप और आपके अंक ज्योतिष चार्ट से तैयार`, none: 'कोई विशेष नहीं', day: 'दिन',
  },
};
type Lab = typeof L.en;

const fmtDate = (iso: string, lang: 'en' | 'hi') => new Date(iso.length === 10 ? `${iso}T12:00:00+05:30` : iso).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const dobText = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? `${m[3]}-${m[2]}-${m[1]}` : d; };

function css(t: PdfTheme) {
  return `
  @page{size:A4;margin:16mm 15mm 18mm}
  .hero{display:flex;gap:6mm;align-items:center;margin-bottom:4mm}
  .hero h1{font-size:25pt;line-height:1.05}
  .hero .sub{font-size:8.5pt;letter-spacing:.28em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm 6mm;font-size:8.8pt;margin:3mm 0 5mm;padding:3mm 4mm;border:1px solid ${t.accent}55;border-radius:3mm;background:${t.soft}}
  .meta b{display:block;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:${t.muted};font-weight:600}
  .sigcard{border:1.2px solid ${t.accent};border-radius:4mm;background:#fff;padding:4mm;display:flex;justify-content:center;align-items:center;min-height:42mm;margin-bottom:5mm;position:relative}
  .sigcard img{max-width:100%;max-height:58mm;object-fit:contain}
  .sigcard .tag{position:absolute;top:-3mm;left:5mm;background:${t.paper};padding:0 2mm;font-size:7.4pt;letter-spacing:.18em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .dash{display:grid;grid-template-columns:52mm 1fr;gap:6mm;align-items:center;break-inside:avoid}
  .verdict h2{font-size:15pt;line-height:1.25;margin-bottom:2mm}
  .verdict p{font-size:9.6pt}
  .bars{display:grid;gap:2.2mm;margin-top:3mm}
  .bar{display:grid;grid-template-columns:30mm 1fr 10mm;align-items:center;gap:3mm;font-size:8.6pt}
  .bar .tr{height:3.2mm;border-radius:2mm;background:${t.soft};overflow:hidden}
  .bar .fl{height:100%;border-radius:2mm}
  .bar .v{text-align:right;font-family:'Playfair Display',serif;font-weight:700}
  .nums{display:grid;grid-template-columns:repeat(5,1fr);gap:2mm;margin-top:4mm;text-align:center;break-inside:avoid}
  .nums .k{font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:${t.muted};margin-top:-1mm}
  .sec-h{display:flex;align-items:center;gap:4mm;margin:0 0 2mm;break-after:avoid}
  .sec-h .no{width:11mm;height:11mm;border-radius:50%;border:1.2px solid ${t.accent};background:${t.soft};display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;color:${t.primary};font-size:13pt;flex:none}
  .sec-h h2{font-size:18pt}
  .page{break-before:page}
  .intro{font-size:9pt;color:${t.muted};margin:0 0 4mm}
  table.flow{break-inside:auto} table.flow tr{break-inside:avoid}
  .ftab td{font-size:8.2pt;padding:1.2mm 1.6mm;line-height:1.4} .ftab th{padding:1.2mm 1.6mm} .ftab td:first-child{font-weight:600;color:${t.primary};width:28mm}
  .pill{display:inline-block;padding:.5mm 2.2mm;border-radius:3mm;font-size:7.4pt;font-weight:600;white-space:nowrap}
  .pill.positive{background:${t.good}1f;color:${t.good};border:.6px solid ${t.good}66}
  .pill.neutral{background:${t.soft};color:${t.ink};border:.6px solid ${t.border}}
  .pill.watch{background:${t.warn}1f;color:${t.warn};border:.6px solid ${t.warn}66}
  .pill.rec{background:${t.accent};color:#fff} .pill.cur{background:${t.primary};color:#fff}
  .dotc{display:inline-flex;gap:.8mm;vertical-align:middle}.dotc i{width:1.8mm;height:1.8mm;border-radius:50%;background:${t.border};display:inline-block}.dotc i.on{background:${t.accent}}
  .src{font-size:6.8pt;color:${t.muted};display:block}
  .samples{display:flex;gap:3mm;margin:0 0 4mm}.samples img{flex:1;min-width:0;max-height:17mm;object-fit:contain;background:#fff;border:.6px solid ${t.border};border-radius:2mm;padding:1mm}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-bottom:2mm;break-inside:auto}
  .two .box{margin-bottom:2mm}
  .lst{margin:0;padding:0;list-style:none}.lst li{position:relative;padding-left:5mm;margin-bottom:1.6mm;font-size:9.2pt;line-height:1.5}
  .lst li:before{content:'✦';position:absolute;left:0;color:${t.accent};font-size:8pt;top:.3mm}
  .lst.good li:before{content:'✓';color:${t.good};font-weight:700}.lst.warn li:before{content:'!';color:${t.warn};font-weight:700}.lst.bad li:before{content:'✕';color:${t.bad};font-weight:700}
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
  .grid21{display:grid;grid-template-columns:repeat(7,1fr);gap:2mm;margin-top:2mm}
  .grid21 div{border:.8px solid ${t.accent}88;border-radius:2mm;height:12mm;position:relative;background:${t.paper}}
  .grid21 span{position:absolute;top:1mm;left:1.5mm;font-size:7pt;color:${t.muted}}
  .note{border:1px dashed ${t.accent};border-radius:3mm;padding:3mm 4mm;margin:4mm 0;font-style:italic;font-size:9.4pt;break-inside:avoid}
  .close{display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;margin-top:6mm;break-inside:avoid}
  .close .q{font-family:'Playfair Display',serif;font-style:italic;font-size:12pt;color:${t.primary};flex:1}
  .close .sgn{text-align:center;font-size:8.4pt;min-width:55mm}.close .sgn .ln{border-top:.8px solid ${t.ink};margin-top:12mm;padding-top:1mm}
  .disc{font-size:7.4pt;color:${t.muted};margin-top:5mm;line-height:1.45;text-align:justify}
  .expert{display:flex;gap:3mm;align-items:center}.expert img{width:15mm;height:15mm;border-radius:50%;object-fit:cover;border:1px solid ${t.accent}}
  `;
}

const relLabel = (r: string, l: Lab) => (r === 'friend' ? l.friend : r === 'enemy' ? l.enemy : l.neutralR);
const relPill = (r: string, l: Lab) => `<span class="pill ${r === 'friend' ? 'positive' : r === 'enemy' ? 'watch' : 'neutral'}">${esc(relLabel(r, l))}</span>`;
const catPill = (c: string, l: Lab) => `<span class="pill ${c === 'favourable' ? 'positive' : c === 'unfavourable' ? 'watch' : 'neutral'}">${esc(c === 'favourable' ? l.favourable : c === 'unfavourable' ? l.unfavourable : l.mixed)}</span>`;
const impPill = (i: string, l: Lab) => `<span class="pill ${esc(i)}">${esc(i === 'positive' ? l.supports : i === 'watch' ? l.watch : l.neutral)}</span>`;
const confDots = (c: string | undefined, l: Lab) => { const n = c === 'high' ? 3 : c === 'medium' ? 2 : c === 'low' ? 1 : 0; return n ? `<span class="dotc">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span> <span class="src">${esc(c === 'high' ? l.high : c === 'medium' ? l.medium : l.low)}</span>` : ''; };
const list = (xs: string[] | undefined, cls = '', l?: Lab) => `<ul class="lst ${cls}">${(xs?.length ? xs : [l?.none ?? '—']).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
function bar(label: string, v: number | null, t: PdfTheme) {
  if (v === null || v === undefined) return '';
  return `<div class="bar"><span>${esc(label)}</span><div class="tr"><div class="fl" style="width:${Math.max(3, v)}%;background:${scoreColour(v, t)}"></div></div><span class="v">${v}</span></div>`;
}
const secHead = (n: number, title: string) => `<div class="sec-h"><div class="no">${n}</div><h2>${esc(title)}</h2></div>`;

/** Hindi reason for a suggested start date (simple words). */
function startReasonHi(x: { weekday: string; dayNumber: number; dateNumber: number }, friendly: number[], b: number) {
  const day = friendly.includes(x.dayNumber), date = friendly.includes(x.dateNumber);
  return `${dayHi(x.weekday)}; ${day && date ? `दिन का अंक ${x.dayNumber} और तारीख़ का जोड़ ${x.dateNumber}, दोनों भाग्यांक ${b} के मित्र हैं` : day ? `दिन का अंक ${x.dayNumber} भाग्यांक ${b} का मित्र है` : `तारीख़ का जोड़ ${x.dateNumber} भाग्यांक ${b} का मित्र है`}`;
}

export function buildSignatureReportHtml(d: SignatureReportData, t: PdfTheme, b: Branding): string {
  const lang: 'en' | 'hi' = d.client.language === 'hi' ? 'hi' : 'en';
  const l = L[lang];
  const a: SignatureAnalysis = d.result.analysis; const n = d.numbers; const s = d.result.scores;
  // Hindi reports: number meanings, planet names and option labels in Hindi too.
  const mean = (compound: number, en: string) => (lang === 'hi' ? compoundMeaningHi(compound) : en);
  const pl = (x: string) => tr(lang, x);
  const optLabel = (x: string) => (lang === 'hi' ? optionLabelHi(x) : x);
  const logo = b.logoDataUrl ? `<img src="${esc(b.logoDataUrl)}" style="height:16mm">` : monogram(b.brandName, t, 58);
  const main = d.annotated ?? d.samples?.[0];
  const bySource = new Map(d.result.features.map((f) => [f.id, f]));

  const cover = `
  <div class="hero">${logo}<div style="flex:1"><div class="sub">${esc(l.sub)}</div><h1>${esc(l.title)}</h1><div class="small muted">${esc(b.brandName)}</div></div>
    <div class="expert">${b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" alt="">` : ''}<div class="small"><b>${esc(d.preparedBy)}</b><br><span class="muted">${esc(b.expertTitle ?? '')}</span></div></div></div>
  <div style="margin-bottom:3mm">${divider(t, 650)}</div>
  <div class="meta"><div><b>${esc(l.client)}</b>${esc(d.client.fullName)}</div><div><b>${esc(l.dob)}</b>${esc(dobText(d.client.dob))}</div><div><b>${esc(l.date)}</b>${esc(fmtDate(d.generatedAt, lang))}</div>
    <div><b>${esc(l.profession)}</b>${esc(d.client.profession)}</div><div style="grid-column:span 2"><b>${esc(l.goals)}</b>${esc(d.client.goals.join(', ') || '—')}</div></div>
  ${main ? `<div class="sigcard"><span class="tag">${esc(l.sig)}</span><img src="${esc(main)}" alt=""></div>` : ''}
  <div class="dash"><div class="center">${ringSvg(a.overallScore, t, l.overall, 175)}</div>
    <div class="verdict"><h2>${esc(a.headline)}</h2><p>${esc(a.summary)}</p>
      <div class="bars">${bar(l.graph, s.graphology, t)}${bar(l.nameVib, s.nameVibration, t)}${bar(l.first, s.firstLetter, t)}${bar(l.prof, s.professionFit, t)}${bar(l.cons, s.consistency, t)}</div></div></div>
  <div class="nums">
    <div>${numberMedallion(n.moolank, t, 70)}<div class="k">${esc(l.moolank)}</div></div>
    <div>${numberMedallion(n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank, t, 70)}<div class="k">${esc(l.bhagyank)}</div></div>
    <div>${numberMedallion(`${n.signName.compound}/${n.signName.single}`, t, 70)}<div class="k">${esc(l.signed)}</div></div>
    <div>${numberMedallion(`${n.fullName.compound}/${n.fullName.single}`, t, 70)}<div class="k">${esc(l.full)}</div></div>
    <div>${numberMedallion(`${n.firstLetter.letter}=${n.firstLetter.value}`, t, 70)}<div class="k">${esc(l.letter)}</div></div>
  </div>
  <p class="small muted" style="text-align:center;margin-top:3mm">${esc(l.madeLine(d.preparedBy))}</p>`;

  const s1 = `<section class="page">${secHead(1, l.s1)}<p class="intro">${esc(l.s1d)}</p>
    ${d.samples && d.samples.length > 1 ? `<div class="small muted" style="margin-bottom:1mm">${esc(l.samples)}: ${d.samples.length}</div><div class="samples">${d.samples.map((x) => `<img src="${esc(x)}" alt="">`).join('')}</div>` : ''}
    <table class="ftab flow"><thead><tr><th>${esc(l.feature)}</th><th>${esc(l.observed)}</th><th>${esc(l.meaning)}</th><th>${esc(l.impact)}</th><th>${esc(l.conf)}</th></tr></thead><tbody>
    ${a.observations.map((o) => { const src = o.featureId ? bySource.get(o.featureId) : undefined; return `<tr><td>${esc(o.feature)}</td><td>${esc(o.observed)}</td><td>${esc(o.meaning)}</td><td>${impPill(o.impact, l)}</td><td>${confDots(o.confidence, l)}${src ? `<span class="src">${esc(src.by === 'expert' ? l.expert : l.measured)}</span>` : ''}</td></tr>`; }).join('')}
    </tbody></table></section>`;

  const rows: [string, string, string, string, string, string][] = [
    [l.moolank, String(n.moolank), pl(n.moolankPlanet.name), '—', '—', ''],
    [l.bhagyank, String(n.bhagyank), pl(n.planet.name), '—', '—', ''],
    [l.full, `${n.fullName.compound}/${n.fullName.single}`, '', relPill(n.nameToBhagyank, l), relPill(n.nameToMoolank, l), `${catPill(n.fullName.category, l)} <span class="small">${esc(mean(n.fullName.compound, n.fullName.meaning))}</span>`],
    [l.signed, `${n.signName.compound}/${n.signName.single}`, '', relPill(n.signToBhagyank, l), relPill(n.signToMoolank, l), `${catPill(n.signName.category, l)} <span class="small">${esc(mean(n.signName.compound, n.signName.meaning))}</span>`],
    [`${l.letter} (${n.firstLetter.letter})`, String(n.firstLetter.value), pl(n.firstLetter.planet), relPill(n.firstLetter.toBhagyank, l), relPill(n.firstLetter.toMoolank, l), ''],
  ];
  const s2 = `<section class="page">${secHead(2, l.s2)}
    <table><thead><tr><th>${esc(l.number)}</th><th>${esc(l.value)}</th><th>${esc(l.planet)}</th><th>${esc(l.toB)}</th><th>${esc(l.toM)}</th><th>${esc(l.nature)}</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td style="font-family:'Playfair Display',serif;font-weight:700;font-size:11pt;color:${t.primary}">${esc(r[1])}</td><td>${esc(r[2])}</td><td>${r[3] === '—' ? '—' : r[3]}</td><td>${r[4] === '—' ? '—' : r[4]}</td><td>${r[5]}</td></tr>`).join('')}
    </tbody></table>
    <div class="two" style="margin-top:4mm"><div class="panel"><b class="small">${esc(l.friendly)}</b><div class="chips" style="margin-top:1.5mm">${n.friendly.map((x) => `<span class="chip good">${x}</span>`).join('')}</div></div>
      <div class="panel"><b class="small">${esc(l.avoid)}</b><div class="chips" style="margin-top:1.5mm">${(n.avoid.length ? n.avoid : ['—']).map((x) => `<span class="chip bad">${x}</span>`).join('')}</div></div></div>
    <h3 style="font-size:13pt;margin:5mm 0 1mm">${esc(l.options)}</h3><p class="intro">${esc(l.optionsD)}</p>
    <table class="flow"><thead><tr><th>${esc(l.form)}</th><th>${esc(l.number)}</th><th>${esc(l.toB)}</th><th>${esc(l.toM)}</th><th>${esc(l.nature)}</th><th>${esc(l.score)}</th></tr></thead><tbody>
    ${n.nameOptions.map((o) => `<tr${n.bestOption?.text === o.text ? ` style="background:${t.accent}1a"` : ''}><td><b>${esc(o.text)}</b> ${o.current ? `<span class="pill cur">${esc(l.current)}</span>` : ''}${n.bestOption?.text === o.text ? ` <span class="pill rec">${esc(l.recommended)}</span>` : ''}<span class="src">${esc(optLabel(o.label))}</span></td>
      <td>${o.compound}/${o.single}</td><td>${relPill(o.toBhagyank, l)}</td><td>${relPill(o.toMoolank, l)}</td><td>${catPill(o.category, l)}<span class="src">${esc(mean(o.compound, o.meaning))}</span></td><td><b style="color:${scoreColour(o.score, t)}">${o.score}</b></td></tr>`).join('')}
    </tbody></table></section>`;

  const s3 = `<section class="page">${secHead(3, l.s3)}
    <div class="box advice"><div class="bt">${esc(l.personality)}</div>${list(a.personality)}</div>
    <div class="two"><div class="box remedy"><div class="bt">${esc(l.career)} – ${esc(lang === 'hi' ? professionHi(n.profession.label) : n.profession.label)}</div><p>${esc(a.career.fit)}</p><p style="margin-top:2mm">${esc(a.career.advice)}</p></div>
      <div>${a.finance ? `<div class="box advice"><div class="bt">${esc(l.finance)}</div><p>${esc(a.finance)}</p></div>` : ''}${a.relationships ? `<div class="box advice"><div class="bt">${esc(l.relationships)}</div><p>${esc(a.relationships)}</p></div>` : ''}
      ${!a.finance && !a.relationships ? `<div style="display:flex;justify-content:center">${gaugeSvg(n.profession.fitScore, t, l.prof, 210)}</div>` : ''}</div></div>
    <div class="two"><div class="box strength"><div class="bt">${esc(l.strengths)}</div>${list(a.strengths, 'good', l)}</div><div class="box watch"><div class="bt">${esc(l.watchouts)}</div>${list(a.watchouts, 'warn', l)}</div></div></section>`;

  const pri = (p?: string) => (p === 'high' || p === 'low' ? p : 'medium') as 'high' | 'medium' | 'low';
  const fixes = [...a.corrections].sort((x, y) => ['high', 'medium', 'low'].indexOf(pri(x.priority)) - ['high', 'medium', 'low'].indexOf(pri(y.priority)));
  const s4 = `<section style="margin-top:6mm">${secHead(4, l.s4)}
    ${fixes.map((c, i) => `<div class="fix ${pri(c.priority)}"><div class="n">${i + 1}</div><div><h4>${esc(c.title)} <span class="pill ${pri(c.priority) === 'high' ? 'watch' : 'neutral'}">${esc(l.priority[pri(c.priority)])}</span></h4><p>${esc(c.detail)}</p></div></div>`).join('')}
    ${d.expertNote ? `<div class="note"><b>${esc(l.expertNote)}:</b> ${esc(d.expertNote)}</div>` : ''}</section>`;

  const sw = (c: string) => { const h = COLOUR_HEX[c.toLowerCase()] ?? '#ccc'; return `<span class="sw"><i style="background:${h}"></i>${esc(tr(lang, c))}</span>`; };
  const ideal = a.idealSignature;
  const s5 = `<section class="${fixes.length > 3 ? 'page' : ''}" style="${fixes.length > 3 ? '' : 'margin-top:7mm'}">${secHead(5, l.s5)}
    <div class="blue"><b class="serif" style="font-size:11pt">${esc(l.steps)}</b><ol class="steps" style="margin-top:2mm">${ideal.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
    ${ideal.do?.length || ideal.dont?.length ? `<div class="two"><div class="box strength"><div class="bt">${esc(l.do)}</div>${list(ideal.do, 'good', l)}</div><div class="box watch"><div class="bt">${esc(l.dont)}</div>${list(ideal.dont, 'bad', l)}</div></div>` : ''}
    <div class="facts"><div class="f"><b>${esc(l.start)}</b>${esc(ideal.startDay)}</div><div class="f"><b>${esc(l.ink)}</b>${esc(ideal.inkColour)}<div style="margin-top:1.5mm">${n.planet.colours.slice(0, 3).map(sw).join('')}</div></div><div class="f"><b>${esc(l.practice)}</b>${esc(ideal.practice)}</div></div>
    ${n.startDates.length ? `<h3 style="font-size:12pt;margin:5mm 0 2mm">${esc(l.dates)}</h3><table><tbody>${n.startDates.map((x) => `<tr><td style="width:45mm"><b>${esc(fmtDate(x.iso, lang))}</b></td><td>${esc(lang === 'hi' ? startReasonHi(x, n.friendly, n.bhagyank) : x.reason)}</td></tr>`).join('')}</tbody></table>` : ''}
    <div style="break-inside:avoid"><h3 style="font-size:12pt;margin:5mm 0 1mm">${esc(l.tracker)}</h3><p class="intro">${esc(l.trackerD)}</p>
    <div class="grid21">${Array.from({ length: 21 }, (_, i) => `<div><span>${esc(l.day)} ${i + 1}</span></div>`).join('')}</div></div>
    <div class="close"><div class="q">“${esc(a.closing)}”</div><div class="sgn">${b.signatureDataUrl ? `<img src="${esc(b.signatureDataUrl)}" style="max-height:14mm;display:block;margin:0 auto -10mm">` : ''}<div class="ln">${esc(d.preparedBy)}<br><span class="muted">${esc(b.brandName)}</span></div></div></div>
    <p class="disc">${esc(l.disclaimer)}</p></section>`;

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}${css(t)}</style></head><body>${cover}${s1}${s2}${s3}${s4}${s5}</body></html>`;
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

export async function renderSignatureReportPdf(d: SignatureReportData, opts: { theme?: ThemeId; branding?: Partial<Branding> } = {}) {
  const branding: Branding = { ...DEFAULT_BRANDING, ...(opts.branding ?? {}) } as Branding;
  const t = resolveTheme(opts.theme, branding);
  const lang = d.client.language === 'hi' ? 'hi' : 'en';
  const font = "font-family:Georgia,'Times New Roman',serif;";
  const header = `<div style="${font}width:100%;font-size:7.5px;color:${t.muted};padding:0 15mm;margin-top:8mm;display:flex;justify-content:space-between;letter-spacing:.12em;text-transform:uppercase"><span style="color:${t.primary}">${esc(branding.brandName)}</span><span>${esc(L[lang].title)} · ${esc(d.client.fullName)}</span></div>`;
  const footer = `<div style="${font}width:100%;font-size:7.4px;color:${t.muted};padding:0 15mm;margin-bottom:10mm;display:flex;justify-content:space-between"><span>${esc(d.preparedBy)} · ${esc(branding.contactLine ?? '')}</span><span style="font-size:9px;color:${t.primary}"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  return renderSheetPdf({ html: buildSignatureReportHtml(d, t, branding), coverHtml: buildSignatureCoverHtml(d, t, branding), header, footer, theme: t, branding, title: `${d.client.fullName} – ${L[lang].title}`, subject: L[lang].title, isoDate: d.generatedAt.slice(0, 10), language: lang });
}
