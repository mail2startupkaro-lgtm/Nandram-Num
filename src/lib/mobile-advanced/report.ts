/**
 * Advanced Mobile Number Analysis with DOB – branded A4 PDF (same Chromium + framed-page pipeline as the signature report).
 *
 * Every section starts on a fresh page:
 *   Cover (full-bleed, signature-report design) · Summary of findings · 1 Your birth numbers · 2 Your mobile number decoded ·
 *   3 Digit pairs and patterns · 4 Lo Shu grid with this number · 5 Score card and checklist · 6 Lucky number blueprint
 *   (+ comparison of shortlisted numbers) · 7 Remedies and activation · 8 About your numerologist + services CTA, QR codes, disclaimer.
 */
import QRCode from 'qrcode';
import { esc, gridSvg, mandala, monogram, numberMedallion, radarSvg, ringSvg, scoreColour } from '@/lib/pdf/svg';
import { baseCss } from '@/lib/pdf/template';
import { COLOUR_HEX, DEFAULT_BRANDING, resolveTheme, type Branding, type PdfTheme, type ThemeId } from '@/lib/pdf/themes';
import { renderSheetPdf } from '@/lib/pdf/render';
import { DEFAULT_SERVICES } from '@/lib/billing/services';
import { compoundMeaningHi } from '@/lib/signature/hindi';
import { brandWordmark, DEFAULT_CONTACT, type ReportContact } from '@/lib/signature/report';
import { humaniseDeep } from '@/lib/signature/humanise';
import { tr } from '@/lib/i18n/hi-terms';
import { LOSHU_NUMBER_INFO } from '@/lib/numerology/data/grids';
import type { Relation } from '@/lib/numerology/data/relations';
import type { MobileAdvancedResult } from './analysis';
import { catText, checkText, digitNoteText, L, pairEffect, relText, TOTAL_MEANING, type Lab, type Lang } from './text';

export interface MobileReportOptions {
  lang: Lang;
  preparedBy: string;
  /** Print the full number (default) or the masked form (98XXXXXX10). */
  showFullNumber?: boolean;
  expertNote?: string;
}
export interface MobileReportExtras { contact?: ReportContact; qrWhatsapp?: string; qrWebsite?: string }

const CTA_SERVICES = ['SVC_MOBILE_NUMBER', 'SVC_PERSONAL_REPORT', 'SVC_NAME_CORRECTION', 'SVC_PERSONAL_YEAR', 'SVC_SIGNATURE', 'SVC_COUPLE'] as const;
const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
};

const fmtDate = (iso: string, lang: Lang) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+05:30` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
};
const dobText = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? `${m[3]}-${m[2]}-${m[1]}` : d; };
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase());
const firstName = (full: string) => titleCase(full.trim().split(/\s+/)[0] ?? full);
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^(?=\d{10}$)/, '91')}`;
const relScore = (r: Relation | null) => (r === 'friend' ? 100 : r === 'enemy' ? 20 : 60);
export const mobileDisplay = (r: MobileAdvancedResult, full = true) => { const n = full ? r.mobile.number : r.mobile.masked; return `+91 ${n.slice(0, 5)} ${n.slice(5)}`; };

/** Sub-scores (0–100) shown as bars on the summary page. */
export function subScores(r: MobileAdvancedResult) {
  const mo = r.mobile;
  const missing = r.dobGrid.missing.length;
  return {
    bhagyank: relScore(mo.relB), moolank: relScore(mo.relM),
    compound: mo.total.category === 'favourable' ? 100 : mo.total.category === 'unfavourable' ? 25 : 60,
    pairs: Math.max(10, 100 - mo.malefic.length * 25 - mo.conflict.length * 12),
    grid: missing === 0 ? 100 : Math.round(40 + (60 * mo.filled.length) / missing),
    last4: relScore(mo.last4.relationWithBhagyank),
  };
}

function css(t: PdfTheme) {
  return `
  @page{size:A4;margin:16mm 15mm 18mm}
  .page{break-before:page;page-break-before:always}
  .kicker{font-size:7.6pt;letter-spacing:.26em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .ttl{font-size:21pt;line-height:1.1;margin:1mm 0 1.5mm}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm 6mm;font-size:8.8pt;margin:2mm 0 4mm;padding:3mm 4mm;border:1px solid ${t.accent}55;border-radius:3mm;background:${t.soft}}
  .meta b{display:block;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:${t.muted};font-weight:600}
  .numcard{border:1.2px solid ${t.accent};border-radius:4mm;background:#fff;padding:5mm 4mm 3.5mm;display:flex;flex-direction:column;align-items:center;margin-bottom:4mm;position:relative;break-inside:avoid}
  .numcard .tag{position:absolute;top:-3mm;left:5mm;background:${t.paper};padding:0 2mm;font-size:7.4pt;letter-spacing:.18em;text-transform:uppercase;color:${t.accent};font-weight:600}
  .digits{display:flex;gap:1.8mm;align-items:center;justify-content:center}
  .digits .d{width:11mm;height:13mm;border-radius:2mm;border:1px solid ${t.accent}88;background:${t.soft};display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;font-size:18pt;color:${t.primary}}
  .digits .d.x{color:${t.muted};background:#fff}
  .digits .cc{font-size:10pt;color:${t.muted};margin-right:1.5mm;font-weight:600}
  .digits .gap{width:2mm}
  .digits.sm .d{width:8.5mm;height:10mm;font-size:13pt}
  .eqn{font-size:9pt;margin-top:2.5mm;color:${t.muted}}.eqn b{font-family:'Playfair Display',serif;font-size:12pt;color:${t.primary}}
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
  .intro{font-size:9.2pt;color:${t.muted};margin:0 0 4mm;max-width:170mm}
  h3.sub{font-size:12.5pt;margin:5mm 0 1.5mm;break-after:avoid}
  table.flow{break-inside:auto} table.flow tr{break-inside:avoid}
  .ftab td{font-size:8.4pt;padding:1.3mm 1.8mm;line-height:1.42;vertical-align:middle} .ftab th{padding:1.3mm 1.8mm;font-size:8.4pt}
  .big{font-family:'Playfair Display',serif;font-weight:700;font-size:12pt;color:${t.primary}}
  .pill{display:inline-block;padding:.5mm 2.2mm;border-radius:3mm;font-size:7.4pt;font-weight:600;white-space:nowrap}
  .pill.positive{background:${t.good}1f;color:${t.good};border:.6px solid ${t.good}66}
  .pill.neutral{background:${t.soft};color:${t.ink};border:.6px solid ${t.border}}
  .pill.watch{background:${t.warn}1f;color:${t.warn};border:.6px solid ${t.warn}66}
  .pill.bad{background:${t.bad}1a;color:${t.bad};border:.6px solid ${t.bad}66}
  .pill.rec{background:${t.accent};color:#fff} .pill.cur{background:${t.primary};color:#fff}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-bottom:2mm}
  .three{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-bottom:3mm}
  .stat{border:1px solid ${t.accent}66;border-radius:3mm;padding:3mm 4mm;background:${t.paper};break-inside:avoid}
  .stat .k{font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:.8mm}
  .stat .v{font-family:'Playfair Display',serif;font-size:17pt;font-weight:700;color:${t.primary};line-height:1.1}
  .stat .s{font-size:8.4pt;margin-top:.8mm;line-height:1.4}
  .gridpair{display:grid;grid-template-columns:1fr 1fr;gap:8mm;align-items:start;justify-items:center;margin:2mm 0 3mm;break-inside:avoid}
  .gridpair .cap{font-size:8.4pt;font-weight:600;color:${t.primary};text-align:center;margin-top:1.5mm;letter-spacing:.04em}
  .legend{display:flex;gap:6mm;justify-content:center;font-size:8pt;color:${t.muted};margin:-1mm 0 3mm}
  .legend i{display:inline-block;width:3.5mm;height:3.5mm;border-radius:1mm;margin-right:1.2mm;vertical-align:-.5mm}
  .chk{display:grid;grid-template-columns:7mm 1fr auto;gap:3mm;align-items:center;padding:2.2mm 3mm;border:.6px solid ${t.border}88;border-left:1.4mm solid ${t.border};border-radius:2mm;margin-bottom:1.8mm;background:${t.paper};break-inside:avoid}
  .chk.pass{border-left-color:${t.good}} .chk.warn{border-left-color:${t.warn}} .chk.fail{border-left-color:${t.bad}}
  .chk .ic{width:6mm;height:6mm;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:8.5pt}
  .chk.pass .ic{background:${t.good}} .chk.warn .ic{background:${t.warn}} .chk.fail .ic{background:${t.bad}}
  .chk h4{margin:0;font-size:9.4pt;color:${t.primary}} .chk p{margin:0;font-size:8.4pt;text-align:left}
  .lst{margin:0;padding:0;list-style:none}.lst li{position:relative;padding-left:4.5mm;margin-bottom:1.5mm;font-size:9.2pt;line-height:1.5}
  .lst li:before{content:'';position:absolute;left:.5mm;top:2.1mm;width:1.5mm;height:1.5mm;border-radius:50%;background:${t.accent}}
  .reco{border:1.2px solid ${t.accent};border-radius:3mm;padding:3.5mm 4.5mm;background:${t.paper};font-size:9.6pt;margin:3mm 0 0;break-inside:avoid}
  .reco.change{border-color:${t.bad};background:${t.bad}0d} .reco.keep{border-color:${t.good};background:${t.good}0d}
  .reco b.h{display:block;font-size:7.6pt;letter-spacing:.18em;text-transform:uppercase;color:${t.accent};margin-bottom:1mm}
  .rem{display:grid;grid-template-columns:repeat(2,1fr);gap:3mm;margin-top:2mm}
  .rem .r{border:.7px solid ${t.accent}77;border-left:1.4mm solid ${t.accent};border-radius:2.5mm;padding:2.8mm 3.5mm;background:${t.paper};break-inside:avoid}
  .rem .r h4{margin:0 0 .8mm;font-size:9.8pt;color:${t.primary}} .rem .r p{margin:0;font-size:8.6pt;line-height:1.45;text-align:left}
  .months{display:grid;grid-template-columns:repeat(6,1fr);gap:2mm;margin-top:2mm}
  .months .m{border:.7px solid ${t.border};border-radius:2mm;padding:1.8mm 1mm;text-align:center;background:${t.paper};font-size:8pt}
  .months .m b{display:block;font-family:'Playfair Display',serif;font-size:15pt;color:${t.muted};line-height:1.1}
  .months .m.good{border-color:${t.good};background:${t.good}14} .months .m.good b{color:${t.good}}
  .months .m .y{font-size:6.8pt;color:${t.muted}}
  .sw{display:inline-flex;align-items:center;gap:1.4mm;margin:0 3mm 1.4mm 0;font-size:8.6pt}
  .sw i{width:4.2mm;height:4.2mm;border-radius:50%;border:.6px solid ${t.border};display:inline-block}
  .note{border:1px dashed ${t.accent};border-radius:3mm;padding:3mm 4mm;margin:5mm 0;font-size:9.4pt;break-inside:avoid;white-space:pre-line}
  .close{display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;margin-top:7mm;break-inside:avoid}
  .close .q{font-family:'Playfair Display',serif;font-style:italic;font-size:12pt;color:${t.primary};flex:1}
  .close .sgn{text-align:center;font-size:8.4pt;min-width:55mm}.close .sgn .ln{border-top:.8px solid ${t.ink};margin-top:12mm;padding-top:1mm}
  .prof{display:grid;grid-template-columns:34mm 1fr;gap:6mm;align-items:center;break-inside:avoid;padding:3.5mm 5mm;border:1px solid ${t.accent}66;border-radius:4mm;background:linear-gradient(135deg,${t.soft},${t.paper})}
  .prof img{width:34mm;height:34mm;border-radius:50%;object-fit:cover;border:1.5px solid ${t.accent}}
  .prof h3{font-size:17pt;margin:0}.prof p{font-size:9.3pt;line-height:1.55;margin:1.5mm 0 0}
  .svc{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:2mm}
  .svc .s{border:.7px solid ${t.accent}77;border-radius:2.5mm;padding:2.8mm 3.5mm;background:${t.paper};break-inside:avoid}
  .svc .s h4{margin:0 0 .8mm;font-size:10pt;color:${t.primary}}
  .svc .s p{margin:0;font-size:8.3pt;line-height:1.45;text-align:left}
  .svc .s .why{margin-top:1.2mm;font-size:7.9pt;color:${t.accent};font-weight:600}
  .cta{display:grid;grid-template-columns:1fr 30mm 30mm;gap:5mm;align-items:center;margin-top:5mm;padding:4mm 5mm;border-radius:3mm;background:${t.primary};color:#fff;break-inside:avoid}
  .cta h4{margin:0 0 1mm;font-size:12pt;color:#fff}.cta .lead{font-size:8.6pt;opacity:.92;margin-bottom:1.5mm;line-height:1.45}
  .cta .ln{font-size:9.2pt;margin:.7mm 0}.cta .ln b{display:inline-block;min-width:20mm;font-size:7.4pt;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
  .cta .qr{background:#fff;border-radius:2mm;padding:1.5mm;line-height:0}.cta .qr svg{width:100%;height:auto}
  .cta .cap{font-size:6.6pt;text-align:center;margin-top:1mm;line-height:1.25;color:#fff}
  .disc{font-size:7.4pt;color:${t.muted};margin-top:5mm;line-height:1.45;text-align:justify}
  :lang(hi) .kicker,:lang(hi) .meta b,:lang(hi) .nums .k,:lang(hi) .stat .k,:lang(hi) .numcard .tag,:lang(hi) .reco b.h{letter-spacing:0;text-transform:none}
  `;
}

/** Shared sheet styles (also used by the baby name report). */
export const reportSheetCss = (t: PdfTheme) => css(t);

function bar(label: string, v: number, t: PdfTheme) {
  const x = Math.max(0, Math.min(100, Math.round(v)));
  return `<div class="bar"><span>${esc(label)}</span><div class="tr"><div class="fl" style="width:${Math.max(3, x)}%;background:${scoreColour(x, t)}"></div></div><span class="v">${x}</span></div>`;
}
const secHead = (n: number, title: string) => `<div class="sec-h"><div class="no">${n}</div><h2>${esc(title)}</h2></div>`;
const relPill = (r: Relation | null, l: Lab) => `<span class="pill ${r === 'friend' ? 'positive' : r === 'enemy' ? 'watch' : 'neutral'}">${esc(relText(r, l))}</span>`;
const catPill = (c: Parameters<typeof catText>[0], l: Lab) => `<span class="pill ${c === 'favourable' ? 'positive' : c === 'unfavourable' ? 'watch' : 'neutral'}">${esc(catText(c, l))}</span>`;
const chips = (xs: (number | string)[], kind: 'good' | 'bad' | 'neu' | 'warn', l: Lab) => `<div class="chips">${xs.length ? xs.map((x) => `<span class="chip ${kind}">${esc(x)}</span>`).join('') : `<span class="small muted">${esc(l.none)}</span>`}</div>`;

/** The number as digit boxes (masked digits shown as ×). */
function digitBoxes(r: MobileAdvancedResult, full: boolean, small = false) {
  const n = full ? r.mobile.number : r.mobile.masked;
  return `<div class="digits${small ? ' sm' : ''}"><span class="cc">+91</span>${n.split('').map((c, i) => `${i === 5 ? '<span class="gap"></span>' : ''}<span class="d${c === 'X' ? ' x' : ''}">${c === 'X' ? '•' : esc(c)}</span>`).join('')}</div>`;
}

export function buildMobileReportHtml(r: MobileAdvancedResult, t: PdfTheme, b: Branding, o: MobileReportOptions, extras: MobileReportExtras = {}): string {
  const lang = o.lang, l = L[lang], T = (s: string) => tr(lang, s);
  const contact = { ...DEFAULT_CONTACT, ...(extras.contact ?? {}) };
  const full = o.showFullNumber !== false;
  const mo = r.mobile, c = r.core;
  const isHouseExpert = (b.expertName || '').trim().toLowerCase() === (DEFAULT_BRANDING.expertName || '').trim().toLowerCase();
  const expert = o.preparedBy || b.expertName;
  const bh = c.bhagyank.master ? `${c.bhagyank.master}/${c.bhagyank.value}` : String(c.bhagyank.value);
  const sub = subScores(r);
  const good = r.checks.filter((x) => x.status === 'pass').length, bad = r.checks.length - good;
  const mean = (compound: number) => (lang === 'hi' ? compoundMeaningHi(compound) : mo.meaning).replace(/\s+[–—]\s+/g, ': ');
  const sections = [l.s1, l.s2, l.s3, l.s4, l.s5, l.s6, l.s7, l.s8];

  // ---------- Summary ----------
  const summary = `
  <div class="kicker">${esc(l.sub)}</div><h1 class="ttl">${esc(l.summary)}</h1>
  <div class="meta"><div><b>${esc(l.client)}</b>${esc(titleCase(r.client.fullName))}</div><div><b>${esc(l.dob)}</b>${esc(dobText(r.client.dob))} (${esc(T(r.client.weekday))})</div><div><b>${esc(l.date)}</b>${esc(fmtDate(r.asOf, lang))}</div>
    <div><b>${esc(l.mobile)}</b>${esc(mobileDisplay(r, full))}</div><div><b>${esc(l.moolank)} · ${esc(l.bhagyank)}</b>${c.moolank.value} · ${esc(bh)}</div><div><b>${esc(l.py)}</b>${c.personalYear.number} <span class="small muted">(${esc(T(c.personalYear.label))})</span></div></div>
  <div class="numcard"><span class="tag">${esc(l.mobile)}</span>${digitBoxes(r, full)}
    <div class="eqn">${full ? `${mo.digits.join(' + ')} = ` : ''}<b>${mo.total.compound}</b> → <b>${mo.total.single}</b> · ${esc(T(mo.planet))} · ${esc(catText(mo.total.category, l))}</div></div>
  <div class="dash"><div class="center">${ringSvg(r.score, t, l.score, 160)}</div>
    <div class="verdict"><div class="kicker" style="margin-bottom:.5mm">${esc(l.verdict[r.verdict])}</div><h2>${esc(l.headline[r.verdict])}</h2>
      <div class="bars">${bar(l.barB, sub.bhagyank, t)}${bar(l.barM, sub.moolank, t)}${bar(l.barC, sub.compound, t)}${bar(l.barP, sub.pairs, t)}${bar(l.barG, sub.grid, t)}${bar(l.barL, sub.last4, t)}</div></div></div>
  <div class="nums">
    <div>${numberMedallion(c.moolank.value, t, 64)}<div class="k">${esc(l.moolank)}</div></div>
    <div>${numberMedallion(bh, t, 64)}<div class="k">${esc(l.bhagyank)}</div></div>
    <div>${numberMedallion(`${mo.total.compound}/${mo.total.single}`, t, 64)}<div class="k">${esc(l.total)}</div></div>
    <div>${numberMedallion(`${mo.last4.compound}/${mo.last4.single}`, t, 64)}<div class="k">${esc(l.last4)}</div></div>
    <div>${numberMedallion(c.kua.value, t, 64)}<div class="k">${esc(l.kua)}</div></div>
  </div>
  <div class="letter"><div class="sal">${esc(l.dear(firstName(r.client.fullName)))}</div>${esc(l.letter({ total: `${mo.total.compound}/${mo.total.single}`, b: c.bhagyank.value, rel: l.relWord[mo.relB], score: r.score, good, bad, advice: l.advice[r.advice] }))}<div class="sgn">${esc(expert)}</div></div>
  <div class="kicker" style="margin-top:5mm">${esc(l.inside)}</div>
  <ol class="toc">${sections.map((x, i) => `<li><b>${i + 1}</b><span>${esc(x)}</span></li>`).join('')}</ol>`;

  // ---------- 1. Birth numbers ----------
  const s1 = `<section class="page">${secHead(1, l.s1)}<p class="intro">${esc(l.s1d)}</p>
    <div class="three">
      <div class="stat"><div class="k">${esc(l.moolank)}</div><div class="v">${c.moolank.value}</div><div class="s">${esc(T(c.moolank.planet))} · ${esc(l.born)} ${c.moolank.day}</div></div>
      <div class="stat"><div class="k">${esc(l.bhagyank)}</div><div class="v">${esc(bh)}</div><div class="s">${esc(T(c.bhagyank.planet))} · ${esc(c.bhagyank.chain.join(' → '))}</div></div>
      <div class="stat"><div class="k">${esc(l.kua)}</div><div class="v">${c.kua.value}</div><div class="s">${esc(T(c.kua.group))} ${lang === 'hi' ? 'समूह' : 'group'}</div></div>
    </div>
    <div class="reco"><b class="h">${esc(l.moolank)} ↔ ${esc(l.bhagyank)}</b>${lang === 'hi' ? `मूलांक ${c.moolank.value} और भाग्यांक ${c.bhagyank.value} का संबंध: ${esc(relText(c.mbRelation, l))}।` : `Your Moolank ${c.moolank.value} and Bhagyank ${c.bhagyank.value} are ${esc(relText(c.mbRelation, l).toLowerCase())} with each other.`} ${esc(l.py)} ${c.personalYear.number}: ${esc(T(c.personalYear.label))}.</div>
    <h3 class="sub">${esc(l.friendly)}</h3>${chips(c.friendly, 'good', l)}
    <div class="two" style="margin-top:3mm"><div><h3 class="sub" style="margin-top:0">${esc(l.neutralN)}</h3>${chips(c.neutral, 'neu', l)}</div><div><h3 class="sub" style="margin-top:0">${esc(l.avoid)}</h3>${chips(c.enemy, 'bad', l)}</div></div>
    <h3 class="sub">${esc(l.grid)} – ${esc(l.gridDob)}</h3>
    <div class="row" style="align-items:center"><div class="center" style="flex:none">${gridSvg(r.dobGrid.cells.map((x) => ({ ...x, label: T(planetLabel(x.number)) })), t, 190, { labels: true })}</div>
      <div><div class="stat" style="margin-bottom:3mm"><div class="k">${esc(l.missing)}</div>${chips(r.dobGrid.missing, 'warn', l)}</div>
      <div class="stat"><div class="k">${esc(l.repeatedN)}</div>${chips(r.dobGrid.repeated.map((x) => `${x.number}×${x.count}`), 'neu', l)}</div></div></div>
    </section>`;

  // ---------- 2. Number decoded ----------
  const s2 = `<section class="page">${secHead(2, l.s2)}<p class="intro">${esc(l.s2d)}</p>
    <div class="numcard"><span class="tag">${esc(l.mobile)}</span>${digitBoxes(r, full)}<div class="eqn">${esc(l.chain)}: ${full ? `${mo.digits.join(' + ')} = ` : ''}${mo.totalChain.map((x) => `<b>${x}</b>`).join(' → ')}</div></div>
    <div class="three">
      <div class="stat"><div class="k">${esc(l.total)}</div><div class="v">${mo.total.compound}/${mo.total.single}</div><div class="s">${catPill(mo.total.category, l)} ${esc(mean(mo.total.compound))}</div></div>
      <div class="stat"><div class="k">${esc(l.planet)}</div><div class="v" style="font-size:14pt">${esc(T(mo.planet))}</div><div class="s">${esc(l.barB)} ${relPill(mo.relB, l)}<br>${esc(l.barM)} ${relPill(mo.relM, l)}</div></div>
      <div class="stat"><div class="k">${esc(l.last4)}</div><div class="v">${full ? esc(mo.last4.digits) : '••' + esc(mo.last4.digits.slice(2))}</div><div class="s">= ${mo.last4.compound}/${mo.last4.single} · ${esc(T(mo.last4.planet))} ${relPill(mo.last4.relationWithBhagyank, l)}</div></div>
    </div>
    <div class="box advice"><div class="bt">${esc(l.meaning)} – ${mo.total.single}</div><p>${esc(TOTAL_MEANING[lang][mo.total.single] ?? '')}</p></div>
    <h3 class="sub">${esc(l.digit)} · ${esc(l.planet)}</h3>
    <table class="ftab"><thead><tr><th>${esc(l.digit)}</th><th>${esc(l.planet)}</th><th>${esc(l.count)}</th><th>${esc(l.barB)}</th><th>${esc(l.inDob)}</th><th>${esc(l.note)}</th></tr></thead><tbody>
    ${mo.digitTable.map((d) => `<tr${d.count ? '' : ' style="opacity:.55"'}><td class="big">${d.digit}</td><td>${esc(d.digit ? T(d.planet) : (lang === 'hi' ? 'शून्य' : 'Zero'))}</td><td><b>${d.count}</b></td><td>${d.digit ? relPill(d.relB, l) : '–'}</td><td>${d.digit ? (d.inDob ? esc(l.yes) : esc(l.no)) : '–'}</td><td class="small">${esc(digitNoteText(d.note, d.digit, d.count, lang))}</td></tr>`).join('')}
    </tbody></table></section>`;

  // ---------- 3. Pairs & patterns ----------
  const kindPill = (k: string) => `<span class="pill ${k === 'supportive' ? 'positive' : k === 'malefic' ? 'bad' : k === 'conflict' ? 'watch' : 'neutral'}">${esc(k === 'supportive' ? (lang === 'hi' ? 'सहायक' : 'Helpful') : k === 'malefic' ? (lang === 'hi' ? 'भारी' : 'Heavy') : k === 'conflict' ? (lang === 'hi' ? 'टकराव' : 'Clash') : l.neutral)}</span>`;
  const pairRows = mo.pairs.map((p) => `<tr><td>${p.position}–${p.position + 1}</td><td class="big">${full || p.position >= 9 || p.position === 1 ? esc(p.pair) : '••'}</td><td>${esc([p.planetA ? T(p.planetA) : '0', p.planetB ? T(p.planetB) : '0'].join(' + '))}</td><td>${kindPill(p.kind)}</td><td class="small">${esc(pairEffect(p, lang, T))}</td></tr>`).join('');
  const s3 = `<section class="page">${secHead(3, l.s3)}<p class="intro">${esc(l.s3d)}</p>
    <div class="numcard" style="padding-top:4mm"><span class="tag">${esc(l.pair)}</span>${digitBoxes(r, full, true)}</div>
    <table class="ftab"><thead><tr><th>${esc(l.pos)}</th><th>${esc(l.pair)}</th><th>${esc(l.planet)}</th><th>${esc(l.nature)}</th><th>${esc(l.effect)}</th></tr></thead><tbody>${pairRows}</tbody></table>
    <div class="three" style="margin-top:5mm">
      <div class="stat"><div class="k">${lang === 'hi' ? 'दोहराए अंक' : 'Repeated digits'}</div><div class="v">${mo.repeating.length ? esc(mo.repeating.map((x) => `${x.digit}×${x.count}`).join(', ')) : '–'}</div><div class="s">${esc(lang === 'hi' ? 'तीन या अधिक बार आने वाला अंक अपने ग्रह को बहुत बलवान कर देता है।' : 'A digit three or more times makes its planet very strong.')}</div></div>
      <div class="stat"><div class="k">${lang === 'hi' ? 'शून्य' : 'Zeros'}</div><div class="v">${mo.zeros}</div><div class="s">${esc(lang === 'hi' ? 'दो तक ठीक; उससे अधिक ऊर्जा को धीमा करते हैं।' : 'Up to two is fine; more slow the energy down.')}</div></div>
      <div class="stat"><div class="k">${lang === 'hi' ? 'अंतिम अंक' : 'Last digit'}</div><div class="v">${mo.lastDigit.digit}</div><div class="s">${mo.lastDigit.digit ? `${esc(T(mo.lastDigit.planet))} ${relPill(mo.lastDigit.relB, l)}` : esc(lang === 'hi' ? 'शून्य पर अंत कमज़ोर' : 'Ending in zero is weak')}</div></div>
    </div>
    ${mo.malefic.length || mo.conflict.length ? `<div class="box watch"><div class="bt">${lang === 'hi' ? 'ध्यान दें' : 'Watch out'}</div><p>${esc(lang === 'hi' ? `इस नंबर में ${[...mo.malefic, ...mo.conflict].join(', ')} जोड़ियाँ हैं। नया नंबर चुनते समय इनसे बचें।` : `This number has the pairs ${[...mo.malefic, ...mo.conflict].join(', ')}. Avoid them when you choose a new number.`)}</p></div>`
      : `<div class="box strength"><div class="bt">${lang === 'hi' ? 'अच्छी बात' : 'Good news'}</div><p>${esc(lang === 'hi' ? 'इस नंबर में कोई भारी या टकराने वाली जोड़ी नहीं है।' : 'There are no heavy or clashing pairs in this number.')}</p></div>`}
    </section>`;

  // ---------- 4. Lo Shu grid ----------
  const after = r.grid.cells.map((x) => ({ ...x, label: T(planetLabel(x.number)) }));
  const s4 = `<section class="page">${secHead(4, l.s4)}<p class="intro">${esc(l.s4d)}</p>
    <div class="gridpair"><div class="center">${gridSvg(r.dobGrid.cells.map((x) => ({ ...x, label: T(planetLabel(x.number)) })), t, 180, { labels: true })}<div class="cap">${esc(l.gridDob)}</div></div>
      <div class="center">${gridSvg(after, t, 180, { labels: true, highlight: r.grid.newlyFilled })}<div class="cap">${esc(l.gridMob)}</div></div></div>
    <div class="three">
      <div class="stat"><div class="k">${esc(l.filledNow)}</div>${chips(r.grid.newlyFilled, 'good', l)}</div>
      <div class="stat"><div class="k">${esc(l.stillMissing)}</div>${chips(r.grid.missing, 'warn', l)}</div>
      <div class="stat"><div class="k">${esc(l.arrows)}</div><div class="s">${esc(r.grid.arrowsOfStrength.map(T).join(', ') || l.none)}</div></div>
    </div>
    <h3 class="sub">${esc(l.areas)}</h3>
    <div class="row" style="align-items:center"><div class="center" style="flex:none">${radarSvg(r.lifeAreas.map((a) => ({ label: l.lifeArea[a.area] ?? a.area, value: a.after, value2: a.before })), t, 210)}
        <div class="legend"><span><i style="background:${t.chart[0]}"></i>${esc(l.after)}</span><span><i style="background:${t.chart[1]};opacity:.5"></i>${esc(l.before)}</span></div></div>
      <table class="ftab"><thead><tr><th>${esc(l.area)}</th><th>${esc(l.before)}</th><th>${esc(l.after)}</th><th>${esc(l.change)}</th></tr></thead><tbody>
      ${r.lifeAreas.map((a) => `<tr><td><b>${esc(l.lifeArea[a.area] ?? a.area)}</b></td><td>${a.before}</td><td><b>${a.after}</b></td><td style="color:${a.diff > 0 ? t.good : a.diff < 0 ? t.bad : t.muted};font-weight:600">${a.diff > 0 ? '+' : ''}${a.diff}</td></tr>`).join('')}
      </tbody></table></div>
    </section>`;

  // ---------- 5. Score card ----------
  const bd = Object.entries(mo.breakdown);
  const s5 = `<section class="page">${secHead(5, l.s5)}<p class="intro">${esc(l.s5d)}</p>
    <div class="row" style="align-items:flex-start;gap:7mm">
      <div style="flex:0 0 72mm"><table class="ftab"><thead><tr><th>${esc(l.factor)}</th><th style="text-align:right">${esc(l.points)}</th></tr></thead><tbody>
        ${bd.map(([k, v]) => `<tr><td>${esc(l.breakdown[k] ?? k)}</td><td style="text-align:right;font-weight:700;color:${k === 'base' ? t.ink : v > 0 ? t.good : v < 0 ? t.bad : t.muted}">${k !== 'base' && v > 0 ? '+' : ''}${v}</td></tr>`).join('')}
        <tr><td><b>${esc(l.totalScore)}</b></td><td style="text-align:right" class="big">${r.score}</td></tr></tbody></table>
        <div class="center" style="margin-top:4mm">${ringSvg(r.score, t, l.verdict[r.verdict], 130)}</div></div>
      <div style="flex:1"><div class="kicker" style="margin-bottom:2mm">${esc(l.checklist)}</div>
        ${r.checks.map((x) => { const ct = checkText(x, l, lang); return `<div class="chk ${x.status}"><span class="ic">${x.status === 'pass' ? '✓' : x.status === 'warn' ? '!' : '✕'}</span><div><h4>${esc(ct.title)}</h4><p>${esc(ct.detail)}</p></div><span class="pill ${x.status === 'pass' ? 'positive' : x.status === 'warn' ? 'watch' : 'bad'}">${esc(l[x.status])}</span></div>`; }).join('')}
      </div></div></section>`;

  // ---------- 6. Blueprint & comparison ----------
  const bpN = r.blueprint;
  const cmp = r.comparison.length > 1 ? `<h3 class="sub">${esc(l.compareH)}</h3><p class="intro" style="margin-bottom:2mm">${esc(l.compareD)}</p>
    <table class="ftab flow"><thead><tr><th>${esc(l.mobile)}</th><th>${esc(l.total)}</th><th>${esc(l.barB)}</th><th>${esc(l.barM)}</th><th>${esc(l.issues)}</th><th>${esc(l.scoreH)}</th><th>${esc(l.verdictH)}</th></tr></thead><tbody>
    ${r.comparison.map((x) => `<tr${x.best ? ` style="background:${t.accent}1a"` : ''}><td><b>${esc(full || !x.current ? x.number : x.masked)}</b> ${x.current ? `<span class="pill cur">${esc(l.current)}</span>` : ''}${x.best ? ` <span class="pill rec">${esc(l.best)}</span>` : ''}</td>
      <td>${x.compound}/${x.single} ${catPill(x.category, l)}</td><td>${relPill(x.relB, l)}</td><td>${relPill(x.relM, l)}</td><td>${x.malefic}</td><td><b style="color:${scoreColour(x.score, t)};font-size:11pt">${x.score}</b></td><td>${esc(l.verdict[x.verdict])}</td></tr>`).join('')}
    </tbody></table>${r.invalidAlternates.length ? `<p class="small muted" style="margin-top:1.5mm">${esc(l.invalid)}: ${esc(r.invalidAlternates.join(', '))}</p>` : ''}` : '';
  const s6 = `<section class="page">${secHead(6, l.s6)}<p class="intro">${esc(l.s6d)}</p>
    <div class="two">
      <div class="stat"><div class="k">${esc(l.idealTotals)}</div>${chips(bpN.idealTotals, 'good', l)}</div>
      <div class="stat"><div class="k">${esc(l.luckyDigits)}</div>${chips(bpN.luckyDigits, 'good', l)}</div>
    </div>
    <div class="stat" style="margin-bottom:3mm"><div class="k">${esc(l.idealCompounds)}</div>${chips(bpN.idealCompounds, 'neu', l)}</div>
    <div class="two">
      <div class="stat"><div class="k">${esc(l.goodPairs)}</div>${chips(bpN.favourablePairs, 'good', l)}</div>
      <div><div class="stat" style="margin-bottom:3mm"><div class="k">${esc(l.avoidDigits)}</div>${chips(bpN.avoidDigits, 'bad', l)}</div><div class="stat"><div class="k">${esc(l.avoidPairs)}</div>${chips(bpN.avoidPairs, 'bad', l)}</div></div>
    </div>
    <div class="box advice" style="margin-top:2mm"><div class="bt">${esc(l.howTo)}</div><ul class="lst" style="margin-top:1mm">${l.howToList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${cmp}</section>`;

  // ---------- 7. Remedies & activation ----------
  const rm = r.remedies;
  const sw = (cName: string) => { const h = COLOUR_HEX[cName.toLowerCase()] ?? '#ccc'; return `<span class="sw"><i style="background:${h}"></i>${esc(T(cName))}</span>`; };
  const still = r.grid.missing;
  const cards: [string, string][] = [
    [l.rem.day, l.rem.dayD(T(rm.weekday), T(rm.planet))],
    [l.rem.colour, l.rem.colourD(rm.colours.map(T).join(', '))],
    [l.rem.mantra, l.rem.mantraD(rm.mantra)],
    [l.rem.daan, l.rem.daanD(T(rm.weekday), rm.daan.slice(0, 3).map(T).join(', '))],
  ];
  if (still.length) cards.push([l.rem.grid, `${l.rem.gridD(still.join(', '))} ${still.map((n) => `${n}: ${T(LOSHU_NUMBER_INFO[n].crystal)}`).join(' · ')}`]);
  if (r.advice === 'keep') cards.push([l.rem.none, l.rem.noneD]);
  const s7 = `<section class="page">${secHead(7, l.s7)}<p class="intro">${esc(l.s7d)}</p>
    <div class="reco ${r.advice === 'change' ? 'change' : r.advice === 'keep' ? 'keep' : ''}"><b class="h">${esc(l.adviceH)} · ${esc(l.verdict[r.verdict])} (${r.score}/100)</b>${esc(l.advice[r.advice])}</div>
    <h3 class="sub">${esc(l.remediesH)}</h3>
    <div class="rem">${cards.map(([h, p]) => `<div class="r"><h4>${esc(h)}</h4><p>${esc(p)}</p></div>`).join('')}</div>
    <div style="margin-top:2.5mm">${rm.colours.slice(0, 4).map(sw).join('')}</div>
    <h3 class="sub">${esc(l.monthsH)}</h3><p class="intro" style="margin-bottom:1mm">${esc(l.monthsD)}</p>
    <div class="months">${r.months.map((m) => `<div class="m${m.good ? ' good' : ''}"><div>${esc(MONTHS[lang][m.month - 1])}</div><b>${m.personalMonth}</b><div class="y">${m.year}${m.good ? ' ✓' : ''}</div></div>`).join('')}</div>
    ${o.expertNote ? `<div class="note"><b>${esc(l.expertNote)}:</b> ${esc(o.expertNote)}</div>` : ''}
    <div class="close"><div class="q">“${esc(l.closing)}”</div><div class="sgn">${b.signatureDataUrl ? `<img src="${esc(b.signatureDataUrl)}" style="max-height:14mm;display:block;margin:0 auto -10mm">` : ''}<div class="ln">${esc(expert)}<br><span class="muted">${esc(b.brandName)}</span></div></div></div>
    </section>`;

  // ---------- 8. About + services CTA ----------
  const photo = b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" alt="">` : monogram(b.expertName, t, 140);
  const bio = contact.bio?.trim() || (isHouseExpert ? l.bioDefault(b.expertName) : l.bioOther(b.expertName));
  const why = (code: string) => code === 'SVC_MOBILE_NUMBER' ? l.whyMobile : code === 'SVC_NAME_CORRECTION' ? l.whyName(c.bhagyank.value) : code === 'SVC_PERSONAL_YEAR' ? l.whyYear(c.personalYear.number) : '';
  const svcs = CTA_SERVICES.map((code) => DEFAULT_SERVICES.find((x) => x.code === code)).filter((x): x is (typeof DEFAULT_SERVICES)[number] => !!x);
  const site = (contact.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const s8 = `<section class="page">${secHead(8, l.s8)}
    <div class="prof">${photo}<div><h3>${esc(b.expertName)}</h3><div class="small muted">${esc(b.expertTitle ?? '')}</div><p>${esc(bio)}</p></div></div>
    <h3 class="sub" style="margin-top:5mm">${esc(l.services)}</h3><p class="intro" style="margin-bottom:1mm">${esc(l.servicesD)}</p>
    <div class="svc">${svcs.map((x) => { const txt = humaniseDeep(lang === 'hi' ? x.hi : x.en); const w = why(x.code); return `<div class="s"><h4>${esc(txt.name)}</h4><p>${esc(txt.short)}</p>${w ? `<div class="why">${esc(w)}</div>` : ''}</div>`; }).join('')}</div>
    <div class="cta"><div><h4>${esc(l.ctaH)}</h4><div class="lead">${esc(l.ctaD)}</div>
        ${contact.whatsapp ? `<div class="ln"><b>${esc(l.whatsapp)}</b>${esc(contact.whatsapp)}</div>` : ''}
        ${contact.telegram ? `<div class="ln"><b>${esc(l.telegram)}</b>${esc(contact.telegram)}</div>` : ''}
        ${site ? `<div class="ln"><b>${esc(l.website)}</b>${esc(site)}</div>` : ''}</div>
      ${extras.qrWhatsapp ? `<div><div class="qr">${extras.qrWhatsapp}</div><div class="cap">${esc(l.scanWa)}</div></div>` : '<div></div>'}
      ${extras.qrWebsite ? `<div><div class="qr">${extras.qrWebsite}</div><div class="cap">${esc(l.scanWeb)}</div></div>` : '<div></div>'}
    </div>
    <p class="disc">${esc(l.disclaimer)} <b>${esc(l.madeLine(expert))}.</b></p></section>`;

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}${css(t)}</style></head><body>${summary}${s1}${s2}${s3}${s4}${s5}${s6}${s7}${s8}</body></html>`;
}

const PLANET_BY_N = ['', 'Sun', 'Moon', 'Jupiter', 'Rahu', 'Mercury', 'Venus', 'Ketu', 'Saturn', 'Mars'];
const planetLabel = (n: number) => PLANET_BY_N[n] ?? '';

/** Full-page cover – same design as the signature report cover, with the mobile number in place of the signature. */
export function buildMobileCoverHtml(r: MobileAdvancedResult, t: PdfTheme, b: Branding, o: MobileReportOptions, contact: ReportContact = DEFAULT_CONTACT): string {
  const lang = o.lang, l = L[lang];
  const w = brandWordmark(b.brandName || 'mynumerologist.com');
  const house = (b.expertName || '').trim().toLowerCase() === (DEFAULT_BRANDING.expertName || '').trim().toLowerCase();
  const full = o.showFullNumber !== false;
  const photo = b.photoDataUrl ? `<img class="pf-img" src="${esc(b.photoDataUrl)}" alt="">` : `<div class="pf-img pf-mono">${monogram(b.expertName, t, 150, true)}</div>`;
  const site = (contact.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const bh = r.core.bhagyank.master ? `${r.core.bhagyank.master}/${r.core.bhagyank.value}` : String(r.core.bhagyank.value);
  const facts: [string, string][] = [[l.dob, dobText(r.client.dob)], [l.date, fmtDate(r.asOf, lang)], [`${l.moolank} · ${l.bhagyank}`, `${r.core.moolank.value} · ${bh}`]];
  const n = full ? r.mobile.number : r.mobile.masked;
  const ink = t.coverInk, acc = t.coverAccent;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}
  @page{size:A4;margin:0}
  html,body{width:210mm;height:297mm;overflow:hidden;margin:0}
  .sc{position:relative;width:210mm;height:297mm;overflow:hidden;background:${t.coverBg};color:${ink};box-sizing:border-box;padding:17mm 18mm 14mm;display:flex;flex-direction:column;align-items:center;text-align:center}
  .sc .f1{position:absolute;inset:7mm;border:1.2px solid ${acc}aa;border-radius:2mm}
  .sc .f2{position:absolute;inset:9.5mm;border:.5px solid ${acc}66;border-radius:1.5mm}
  .sc .corner{position:absolute;width:9mm;height:9mm;border:1.6px solid ${acc}}
  .sc .c1{top:5mm;left:5mm;border-right:none;border-bottom:none}.sc .c2{top:5mm;right:5mm;border-left:none;border-bottom:none}.sc .c3{bottom:5mm;left:5mm;border-right:none;border-top:none}.sc .c4{bottom:5mm;right:5mm;border-left:none;border-top:none}
  .sc .md{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%)}
  .wm{position:relative;line-height:1;white-space:nowrap;display:flex;align-items:baseline;justify-content:center}
  .wm-pre{display:inline;font-family:'Playfair Display',serif;font-style:italic;font-weight:400;font-size:28pt;color:${acc};margin-right:1mm;vertical-align:.2em}
  .wm-core{display:inline;font-family:'Playfair Display',serif;font-weight:700;font-size:46pt;letter-spacing:.01em;color:${ink}}
  .wm-core:first-letter{color:${acc}}
  .wm-tld{display:inline;font-family:'Playfair Display',serif;font-style:italic;font-size:20pt;color:${acc};margin-left:.4mm}
  .wm-rule{position:relative;display:flex;align-items:center;gap:3mm;justify-content:center;margin:2.5mm auto 0;width:130mm}
  .wm-rule i{flex:1;height:.8px;background:linear-gradient(90deg,transparent,${acc})}.wm-rule i:last-child{background:linear-gradient(90deg,${acc},transparent)}
  .wm-rule b{width:2.4mm;height:2.4mm;background:${acc};transform:rotate(45deg)}
  .wm-tag{font-size:8pt;letter-spacing:.32em;text-transform:uppercase;color:${ink};opacity:.85;margin-top:2.2mm}
  .tt{position:relative;margin-top:15mm}
  .tt .k{font-size:9pt;letter-spacing:.38em;text-transform:uppercase;color:${acc};margin-bottom:3mm}
  .tt h1{color:${ink};font-family:'Playfair Display','Noto Sans Devanagari',serif;font-weight:700;margin:0;line-height:1.02}
  .tt h1 .a{display:block;font-size:52pt;letter-spacing:.02em}
  .tt h1 .b{display:block;font-size:28pt;letter-spacing:.14em;text-transform:uppercase;color:${acc};margin-top:2mm;font-weight:600}
  .pf{position:relative;margin-top:9mm}
  .pf .k{font-size:8.5pt;letter-spacing:.3em;text-transform:uppercase;opacity:.85}
  .pf .n{font-family:'Playfair Display',serif;font-size:27pt;font-weight:700;color:${ink};margin-top:1mm;line-height:1.1}
  .facts{display:flex;gap:10mm;justify-content:center;font-size:9.5pt;margin-top:3.5mm}
  .facts span{display:block;font-size:7.3pt;letter-spacing:.2em;text-transform:uppercase;color:${acc}}
  .sg{position:relative;margin-top:9mm;background:#fff;border-radius:3mm;padding:3mm 5mm 2mm;border:1.2px solid ${acc};box-shadow:0 2mm 6mm rgba(0,0,0,.25)}
  .sg .dg{display:flex;gap:1.4mm;align-items:center;justify-content:center}
  .sg .dg i{font-style:normal;width:8.6mm;height:10.5mm;border-radius:1.6mm;background:#fbf5e6;border:.7px solid #d8c08a;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;font-size:15pt;color:#5a1220}
  .sg .dg .cc{font-size:10pt;color:#7a6a55;font-weight:600;margin-right:1mm}.sg .dg .gp{width:1.6mm}
  .sg span.l{display:block;font-size:6.8pt;letter-spacing:.24em;text-transform:uppercase;color:#7a6a55;margin-top:1.2mm}
  .ex{position:absolute;left:14mm;right:14mm;bottom:20mm;display:flex;align-items:center;gap:7mm;padding:5mm 7mm;border-radius:4mm;background:rgba(0,0,0,.22);border:1px solid ${acc}88;text-align:left}
  .pf-img{width:46mm;height:46mm;border-radius:50%;object-fit:cover;border:2.2px solid ${acc};box-shadow:0 0 0 2.2mm ${acc}33,0 0 0 2.8mm ${acc}88;flex:none;background:#fff}
  .pf-mono{display:flex;align-items:center;justify-content:center;background:transparent}
  .ex .lab{font-size:8pt;letter-spacing:.3em;text-transform:uppercase;color:${acc}}
  .ex .nm{font-family:'Playfair Display',serif;font-size:26pt;font-weight:700;color:${ink};line-height:1.1;margin:1mm 0 1mm}
  .ex .ti{font-size:10pt;opacity:.95}
  .ex .yr{display:inline-block;margin-top:2.5mm;padding:1mm 3.5mm;border-radius:3mm;background:${acc};color:#2a1a08;font-size:8.6pt;font-weight:600;letter-spacing:.04em}
  .ex .ct{font-size:9pt;margin-top:2.2mm;opacity:.95}
  .conf{position:absolute;bottom:12.5mm;left:0;right:0;font-size:7.4pt;letter-spacing:.16em;text-transform:uppercase;opacity:.75}
  ${lang === 'hi' ? '.wm-tag,.tt .k,.tt h1 .b,.pf .k,.facts span,.ex .lab,.sg span.l,.conf{letter-spacing:0!important}.tt h1 .b{text-transform:none}' : ''}
  </style></head><body><div class="sc">
    <div class="f1"></div><div class="f2"></div><div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div>
    <div class="md">${mandala(620, acc, 0.22, 36)}</div>
    ${b.logoDataUrl && !/numerologist/i.test(b.brandName) ? `<img src="${esc(b.logoDataUrl)}" style="position:relative;height:16mm;margin-bottom:2mm" alt="">` : ''}
    <div class="wm">${w.pre ? `<span class="wm-pre">${esc(w.pre)}</span>` : ''}<span class="wm-core">${esc(w.core)}</span>${w.tld ? `<span class="wm-tld">${esc(w.tld)}</span>` : ''}</div>
    <div class="wm-rule"><i></i><b></b><i></i></div>
    <div class="wm-tag">${esc(l.tag)}</div>
    <div class="tt"><div class="k">${esc(lang === 'hi' ? 'एडवांस विश्लेषण · जन्म तिथि सहित' : 'Advanced analysis · with date of birth')}</div><h1><span class="a">${esc(l.t1)}</span><span class="b">${esc(l.t2)}</span></h1></div>
    <div class="pf"><div class="k">${esc(l.preparedFor)}</div><div class="n">${esc(titleCase(r.client.fullName))}</div>
      <div class="facts">${facts.map(([k, v]) => `<div><span>${esc(k)}</span>${esc(v)}</div>`).join('')}</div></div>
    <div class="sg"><div class="dg"><span class="cc">+91</span>${n.split('').map((ch, i) => `${i === 5 ? '<span class="gp"></span>' : ''}<i>${ch === 'X' ? '•' : esc(ch)}</i>`).join('')}</div><span class="l">${esc(l.mobile)}</span></div>
    <div class="ex">${photo}<div><div class="lab">${esc(l.by)}</div><div class="nm">${esc(o.preparedBy || b.expertName)}</div><div class="ti">${esc(b.expertTitle ?? '')}</div>
      ${house ? `<div class="yr">${esc(l.years)}</div>` : ''}
      <div class="ct">${[contact.whatsapp ? `WhatsApp ${esc(contact.whatsapp)}` : '', site ? esc(site) : ''].filter(Boolean).join('  ·  ')}</div></div></div>
    <div class="conf">${esc(l.conf)}</div>
  </div></body></html>`;
}

const qr = (text: string) => QRCode.toString(text, { type: 'svg', margin: 0, width: 150, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });

export async function renderMobileAdvancedPdf(r: MobileAdvancedResult, o: MobileReportOptions & { theme?: ThemeId; branding?: Partial<Branding>; contact?: ReportContact }) {
  const branding: Branding = { ...DEFAULT_BRANDING, ...(o.branding ?? {}) } as Branding;
  const t = resolveTheme(o.theme, branding);
  const contact = { ...DEFAULT_CONTACT, ...(o.contact ?? {}) };
  const servicesUrl = `${(contact.website || 'https://www.mynumerologist.com').replace(/\/$/, '')}/services`;
  const [qrWhatsapp, qrWebsite] = await Promise.all([contact.whatsapp ? qr(waLink(contact.whatsapp)) : Promise.resolve(''), qr(/^https?:\/\//.test(servicesUrl) ? servicesUrl : `https://${servicesUrl}`)]);
  const l = L[o.lang];
  const font = "font-family:Georgia,'Times New Roman',serif;";
  const header = `<div style="${font}width:100%;font-size:7.5px;color:${t.muted};padding:0 15mm;margin-top:8mm;display:flex;justify-content:space-between;letter-spacing:.12em;text-transform:uppercase"><span style="color:${t.primary}">${esc(branding.brandName)}</span><span>${esc(l.title)} · ${esc(titleCase(r.client.fullName))}</span></div>`;
  const footer = `<div style="${font}width:100%;font-size:7.4px;color:${t.muted};padding:0 15mm;margin-bottom:10mm;display:flex;justify-content:space-between"><span>${esc(o.preparedBy)} · ${esc(branding.contactLine ?? '')}</span><span style="font-size:9px;color:${t.primary}"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  return renderSheetPdf({
    html: buildMobileReportHtml(r, t, branding, o, { contact, qrWhatsapp, qrWebsite }), coverHtml: buildMobileCoverHtml(r, t, branding, o, contact),
    header, footer, theme: t, branding, title: `${titleCase(r.client.fullName)} – ${l.title}`, subject: l.title, isoDate: r.asOf, language: o.lang,
  });
}
