/**
 * Print HTML for the reports that admin generators print in the browser (Destiny Matrix, Pythagorean birth chart,
 * Complete Business, Business compatibility). Pure string builders shared by the admin screens (Print / Save PDF)
 * and by the server, which turns the same HTML into the PDF delivered automatically to the client's report area.
 */
import { SITE_NAME } from '@/lib/seo/site';
import { blockHtml, escHtml, fmtDob, type Blk, type WrittenReport } from '@/lib/report/blocks';
import { contentsAndGuide, endCta, extrasCss, type CoverWithExtras } from '@/lib/report/print-extras';
import { fmtDate, type Blk as BizBlk, type BizSection, type CompleteBizData } from '@/lib/business/complete';
import { verdictOf, type BizAnalytics } from '@/lib/business/engine';
import type { BizReport } from '@/lib/business/agent';
import { tr } from '@/lib/i18n/hi-terms';
import { qaHtml, qaTitle, type QA } from '@/lib/report/client-questions';

type Lang = 'en' | 'hi';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
void escHtml;

/** Body of the /api/admin/report-cover request (title, facts …) for a report. */
export interface CoverRequest { extras: 'destiny' | 'psychomatrix' | 'business' | 'compat'; title: string; subtitle?: string; clientName: string; preparedBy: string; lang: Lang; facts: [string, string][] }

/* ---------- Destiny Matrix / Pythagorean birth chart ---------- */
export type ChartKind = 'destiny' | 'psychomatrix';
export interface ChartResult { kind: ChartKind; name: string; dob: string; report: { en: WrittenReport; hi: WrittenReport }; generatedAt: string }
export const CHART_BRAND: Record<ChartKind, { en: string; hi: string }> = { destiny: { en: 'Destiny Matrix', hi: 'डेस्टिनी मैट्रिक्स' }, psychomatrix: { en: 'Pythagorean numerology', hi: 'पाइथागोरस अंक ज्योतिष' } };

const longDate = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function chartCoverRequest(r: ChartResult, lang: Lang, by: string): CoverRequest {
  const R = r.report[lang], hi = lang === 'hi';
  const tiles = R.sections[0]?.blocks.find((b): b is Extract<Blk, { k: 'tiles' }> => b.k === 'tiles')?.items ?? [];
  return { extras: r.kind, title: R.title.slice(0, 80), subtitle: R.subtitle.slice(0, 120), clientName: r.name, preparedBy: by, lang,
    facts: [[hi ? 'जन्म तिथि' : 'Date of birth', fmtDob(r.dob, lang)], ...tiles.slice(0, 2).map((t) => [t.label.slice(0, 40), t.value.slice(0, 120)] as [string, string]), [hi ? 'रिपोर्ट तिथि' : 'Report date', longDate(r.generatedAt, lang)]] };
}

export function chartReportHtml(r: ChartResult, lang: Lang, by: string, cover: CoverWithExtras | null, qa: QA[] = []): string {
  const R = r.report[lang], hi = lang === 'hi', m = { brand: CHART_BRAND[r.kind] };
  const date = longDate(r.generatedAt, lang);
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(R.title)} – ${esc(r.name)}</title><style>
@page{size:A4;margin:16mm 14mm}${cover ? '@page:first{margin:0}' : ''}body{font-family:Georgia,'Noto Serif Devanagari',serif;color:#2a1a10;margin:0;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc{max-width:860px;margin:0 auto;padding:0 18px}
h1{color:#7a1f2b;margin:0;font-size:28px}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:26px;font-size:20px;break-after:avoid}h3{color:#8a6d12;font-size:15px;margin:14px 0 4px;break-after:avoid}
.head{border:3px double #c9a227;border-radius:14px;padding:22px 26px;margin:18px 0 8px;background:linear-gradient(135deg,#fffaf0,#fbf1d9)}.brand{letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#8a6d12;margin:0 0 6px}
.k{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:12px 0}.k div{border:1px solid #e5d3a1;border-radius:8px;padding:8px;text-align:center;background:#fff;font-size:11px}.k b{display:block;font-size:20px;color:#7a1f2b}
table{border-collapse:collapse;width:100%;font-size:12.5px;margin:8px 0}td,th{border:1px solid #e5d3a1;padding:5px 7px;text-align:left;vertical-align:top}th{background:#fbf1d9}tr{break-inside:avoid}tr.hl td{background:#f6e2a8;font-weight:700}
.tip{border-left:4px solid #c9a227;background:#fbf1d9;padding:8px 12px;border-radius:6px}.chart{margin:10px auto;max-width:520px;text-align:center;break-inside:avoid}.chart figcaption{font-size:12px;color:#7a6a55}
.foot{margin-top:30px;border-top:1px solid #e5d3a1;padding-top:8px;font-size:11px;color:#7a6a55}
${extrasCss(cover?.extras)}${cover?.css ?? ''}</style></head><body>${cover?.html ?? ''}<main class="doc">
<div class="head"><p class="brand">${esc(SITE_NAME)} · ${esc(m.brand[lang])}</p><h1>${esc(R.title)}</h1><p style="margin:6px 0 0"><b style="font-size:18px">${esc(r.name)}</b> · ${esc(R.subtitle)}<br><small>${hi ? 'द्वारा तैयार' : 'Prepared by'} ${esc(by)} · ${date}</small></p></div>
${contentsAndGuide([...R.sections.map((s) => s.title), ...(qa.length ? [qaTitle(lang)] : [])], lang, cover?.extras)}
${R.sections.map((s, i) => `<section><h2>${i + 1}. ${esc(s.title)}</h2>${s.blocks.map(blockHtml).join('')}</section>`).join('')}
${qa.length ? qaHtml(qa, lang, { newPage: true }) : ''}
${endCta(cover?.extras)}
<p class="foot">${hi ? 'द्वारा तैयार' : 'Prepared by'} ${esc(by)} · ${esc(SITE_NAME)}. ${hi ? 'अंक ज्योतिष पारंपरिक मार्गदर्शन है; यह चिकित्सा, वित्तीय, कानूनी या पेशेवर सलाह का विकल्प नहीं है।' : 'Numerology is traditional guidance; it does not replace medical, financial, legal or professional advice.'}</p></main></body></html>`;
  return html;
}

/* ---------- Complete Business Numerology Report ---------- */
export type BizWritten = { title: string; subtitle: string; summary: string; sections: BizSection[] };
export interface BizReportResult { data: CompleteBizData; report: { en: BizWritten; hi: BizWritten }; generatedAt: string }

export function bizBlockHtml(b: BizBlk): string {
  switch (b.k) {
    case 'p': return `<p>${esc(b.t)}</p>`;
    case 'tip': return `<p class="tip">${esc(b.t)}</p>`;
    case 'list': return `<ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    case 'tiles': return `<div class="k">${b.items.map((x) => `<div>${esc(x.label)}<b>${esc(x.value)}</b></div>`).join('')}</div>`;
    case 'bars': return b.items.map((x) => `<div class="bar"><span>${esc(x.label)}</span><b>${x.value}</b><i style="width:${Math.max(2, Math.min(100, x.value))}%"></i></div>`).join('');
    case 'table': return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
}

export function bizCoverRequest(r: BizReportResult, lang: Lang, by: string): CoverRequest {
  const R = r.report[lang], d = r.data, hi = lang === 'hi';
  return { extras: 'business', title: R.title.slice(0, 80), subtitle: R.subtitle.slice(0, 120), clientName: d.owner.name, preparedBy: by, lang,
    facts: [[hi ? 'जन्म तिथि' : 'Date of birth', fmtDate(d.owner.dob, lang)], [hi ? 'व्यवसाय' : 'Business', d.best.text.slice(0, 120)], [hi ? 'समग्र स्कोर' : 'Overall score', `${d.overall}/100`], [hi ? 'रिपोर्ट तिथि' : 'Report date', longDate(r.generatedAt, lang)]] };
}

export function bizReportHtml(r: BizReportResult, lang: Lang, by: string, cover: CoverWithExtras | null, qa: QA[] = []): string {
  const R = r.report[lang], d = r.data, hi = lang === 'hi';
  const date = longDate(r.generatedAt, lang);
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(R.title)} – ${esc(d.owner.name)}</title><style>
@page{size:A4;margin:16mm 14mm}${cover ? '@page:first{margin:0}' : ''}body{font-family:Georgia,'Noto Serif Devanagari',serif;color:#2a1a10;margin:0;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc{max-width:860px;margin:0 auto;padding:0 18px}
h1{color:#7a1f2b;margin:0;font-size:28px}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:26px;font-size:20px;break-after:avoid}
.head{border:3px double #c9a227;border-radius:14px;padding:22px 26px;margin:18px 0 8px;background:linear-gradient(135deg,#fffaf0,#fbf1d9)}.brand{letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#8a6d12;margin:0 0 6px}
.k{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:12px 0}.k div{border:1px solid #e5d3a1;border-radius:8px;padding:8px;text-align:center;background:#fff;font-size:11px}.k b{display:block;font-size:20px;color:#7a1f2b}
.bar{position:relative;display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #eee;padding:5px 0;font-size:13px}.bar i{position:absolute;left:0;bottom:-1px;height:3px;background:#c9a227}
table{border-collapse:collapse;width:100%;font-size:12.5px;margin:8px 0}td,th{border:1px solid #e5d3a1;padding:5px 7px;text-align:left;vertical-align:top}th{background:#fbf1d9}tr{break-inside:avoid}
.tip{border-left:4px solid #c9a227;background:#fbf1d9;padding:8px 12px;border-radius:6px}section{break-inside:auto}.pb{break-before:page}.foot{margin-top:30px;border-top:1px solid #e5d3a1;padding-top:8px;font-size:11px;color:#7a6a55}
${extrasCss(cover?.extras)}${cover?.css ?? ''}</style></head><body>${cover?.html ?? ''}<main class="doc">
<div class="head"><p class="brand">${esc(SITE_NAME)} · ${hi ? 'व्यवसाय अंक ज्योतिष' : 'Business numerology'}</p><h1>${esc(R.title)}</h1><p style="margin:6px 0 0"><b style="font-size:18px">${esc(d.owner.name)}</b> · ${esc(d.names.map((n) => n.text).join(' · '))}<br><small>${hi ? 'द्वारा तैयार' : 'Prepared by'} ${esc(by)} · ${date}</small></p></div>
${contentsAndGuide([...R.sections.map((s) => s.title), ...(qa.length ? [qaTitle(lang)] : [])], lang, cover?.extras)}
${R.sections.map((s, i) => `<section${i === 6 ? ' class="pb"' : ''}><h2>${i + 1}. ${esc(s.title)}</h2>${s.blocks.map(bizBlockHtml).join('')}</section>`).join('')}
${qa.length ? qaHtml(qa, lang, { newPage: true }) : ''}
${endCta(cover?.extras)}
<p class="foot">${hi ? 'द्वारा तैयार' : 'Prepared by'} ${esc(by)} · ${esc(SITE_NAME)}. ${hi ? 'अंक ज्योतिष पारंपरिक मार्गदर्शन है; यह वित्तीय, कानूनी या पेशेवर सलाह का विकल्प नहीं है।' : 'Numerology is traditional guidance; it does not replace financial, legal or professional advice.'}</p></main></body></html>`;
  return html;
}

/* ---------- Business compatibility (1000+ categories) ---------- */
export const LOSHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
export const fmt = (n: number) => n.toLocaleString('en-IN');
export const escText = esc;
export function label(d: BizAnalytics, id: string) { return d.all.find((x) => x.id === id)?.label ?? id; }
export function score(d: BizAnalytics, id: string) { return d.all.find((x) => x.id === id)?.score ?? 0; }
export const VERDICT_CSS: Record<string, string> = { excellent: '#1f7a46', good: '#8a6d12', moderate: '#b5651d', weak: '#9b2335' };
/** Print labels for the Business compatibility report (category and business names stay as written). */
export const PL = {
  en: { preparing: 'Preparing the report…', title: 'Business Compatibility Report', subtitle: 'Business & career numerology', brandLine: 'Business Numerology', dob: 'Date of birth', place: 'Birth place', bizName: 'Business name', reportDate: 'Report date', by: 'Prepared by',
    analysed: (n: string) => `${n} categories analysed`, appendix: (n: string) => `Appendix – Complete Ranking of ${n} Categories`, appendixNote: (name: string) => `Every business and profession in the catalogue, ranked for ${name}. Scores: 75+ highly compatible · 62–74 compatible · 48–61 moderate · below 48 not advised.`,
    category: 'Category', group: 'Group', score: 'Score', moolank: 'Moolank', bhagyank: 'Bhagyank', nameNo: 'Name no.', py: 'Personal year', bestSector: 'Best sector', bestMatch: 'Best match', loshu: 'Lo Shu grid', missing: 'Missing', none: 'none',
    friendlyH: 'Friendly & difficult numbers', friendlyTo: (b: number) => `Friendly to Bhagyank ${b}`, difficult: 'Difficult', planet: 'Ruling planet', day: 'lucky day', colours: 'Colours',
    considering: 'Businesses You Are Considering', business: 'Business', rank: 'Rank', verdict: 'Verdict', numbers: 'numbers', rankOf: (r: string, n: string) => `${r} of ${n}`,
    top: 'Top Recommendations', howStart: 'How to start', watch: 'Watch', yourTop: (k: number, n: string) => `Your Top ${k} of ${n}`, sectors: 'Sector Analysis', bestInSector: 'Best businesses in each sector', groups: 'Strongest business groups', categories: 'categories',
    least: 'Least Suited', timingH: 'Timing, Name, Place & Partnership', timing: 'Timing', goodTotals: 'Good Chaldean totals', placeDir: 'Place & direction', partner: 'Partnership', remedies: 'Remedies', plan: 'Action Plan',
    disclaimer: 'Numerology offers guidance based on traditional methods. It is not financial, investment, tax or legal advice – check market demand, licences and finances with qualified professionals before investing.' },
  hi: { preparing: 'रिपोर्ट तैयार हो रही है…', title: 'व्यवसाय अनुकूलता रिपोर्ट', subtitle: 'व्यवसाय एवं करियर अंक ज्योतिष', brandLine: 'व्यवसाय अंक ज्योतिष', dob: 'जन्म तिथि', place: 'जन्म स्थान', bizName: 'व्यवसाय का नाम', reportDate: 'रिपोर्ट तिथि', by: 'द्वारा तैयार:',
    analysed: (n: string) => `${n} श्रेणियों का विश्लेषण`, appendix: (n: string) => `परिशिष्ट – सभी ${n} श्रेणियों की पूरी रैंकिंग`, appendixNote: (name: string) => `सूची के हर व्यवसाय और पेशे की ${name} के लिए रैंकिंग। स्कोर: 75+ अत्यंत अनुकूल · 62–74 अनुकूल · 48–61 सामान्य · 48 से कम अनुशंसित नहीं।`,
    category: 'श्रेणी', group: 'समूह', score: 'स्कोर', moolank: 'मूलांक', bhagyank: 'भाग्यांक', nameNo: 'नामांक', py: 'व्यक्तिगत वर्ष', bestSector: 'सर्वश्रेष्ठ क्षेत्र', bestMatch: 'सर्वश्रेष्ठ मेल', loshu: 'लो शू ग्रिड', missing: 'अनुपस्थित', none: 'कोई नहीं',
    friendlyH: 'मित्र और कठिन अंक', friendlyTo: (b: number) => `भाग्यांक ${b} के मित्र अंक`, difficult: 'कठिन', planet: 'स्वामी ग्रह', day: 'शुभ दिन', colours: 'रंग',
    considering: 'जिन व्यवसायों पर आप विचार कर रहे हैं', business: 'व्यवसाय', rank: 'रैंक', verdict: 'निर्णय', numbers: 'अंक', rankOf: (r: string, n: string) => `${n} में ${r}`,
    top: 'शीर्ष सुझाव', howStart: 'कैसे शुरू करें', watch: 'ध्यान रखें', yourTop: (k: number, n: string) => `${n} में से आपके शीर्ष ${k}`, sectors: 'क्षेत्र विश्लेषण', bestInSector: 'हर क्षेत्र के सर्वश्रेष्ठ व्यवसाय', groups: 'सबसे मज़बूत व्यवसाय समूह', categories: 'श्रेणियाँ',
    least: 'सबसे कम अनुकूल', timingH: 'समय, नाम, स्थान और साझेदारी', timing: 'समय', goodTotals: 'शुभ कैल्डियन योग', placeDir: 'स्थान और दिशा', partner: 'साझेदारी', remedies: 'उपाय', plan: 'कार्य योजना',
    disclaimer: 'अंक ज्योतिष पारंपरिक पद्धतियों पर आधारित मार्गदर्शन है। यह वित्तीय, निवेश, कर या कानूनी सलाह नहीं है – निवेश से पहले बाज़ार की माँग, लाइसेंस और वित्त की जाँच योग्य विशेषज्ञों से करें।' },
};

export interface CompatResult { data: BizAnalytics; report: BizReport; source: 'ai' | 'rules'; model?: string; note?: string; generatedAt: string }
export interface CompatOpts { by: string; appendix: boolean; lang?: Lang; meta: { dob: string; place: string; business?: string } }

export function compatCoverRequest(name: string, r: CompatResult, opts: CompatOpts): CoverRequest {
  const L = opts.lang === 'hi' ? 'hi' : 'en'; const B = PL[L];
  return { extras: 'compat', title: B.title, subtitle: B.subtitle, clientName: name, preparedBy: opts.by, lang: L,
    facts: [[B.dob, opts.meta.dob], [B.place, opts.meta.place], [B.bizName, opts.meta.business ?? ''], [B.reportDate, longDate(r.generatedAt, L)]] };
}

export function compatReportHtml(name: string, r: CompatResult, opts: CompatOpts, coverPage: CoverWithExtras | null, qa: QA[] = []): string {
  const L = opts.lang === 'hi' ? 'hi' : 'en'; const B = PL[L]; const loc = L === 'hi' ? 'hi-IN' : 'en-IN';
  const d = r.data, p = r.report;
  const date = new Date(r.generatedAt).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  const bars = (xs: { l: string; v: number }[]) => xs.map((x) => `<div class="bar"><span>${esc(x.l)}</span><b>${x.v}</b><i style="width:${x.v}%"></i></div>`).join('');
  const grid = LOSHU.map((row) => `<tr>${row.map((n) => `<td class="${d.grid.counts[n] ? '' : 'miss'}">${d.grid.counts[n] ? String(n).repeat(d.grid.counts[n]) : '–'}</td>`).join('')}</tr>`).join('');
  const appendix = opts.appendix ? `<section class="pb"><h2>${B.appendix(fmt(d.totals.analysed))}</h2><p><small>${B.appendixNote(esc(name))}</small></p>
    <table class="app"><thead><tr><th>#</th><th>${B.category}</th><th>${B.group}</th><th>${B.score}</th></tr></thead><tbody>${d.all.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.label)}</td><td>${esc(x.group)}</td><td style="color:${VERDICT_CSS[verdictOf(x.score).key]}"><b>${x.score}</b></td></tr>`).join('')}</tbody></table></section>` : '';
  const toc = [p.headline, d.checked.length ? B.considering : '', B.top, B.yourTop(d.top.length, fmt(d.totals.analysed)), B.sectors, B.least, B.timingH, B.remedies, B.plan, qa.length ? qaTitle(L) : '', opts.appendix ? B.appendix(fmt(d.totals.analysed)) : ''].filter(Boolean);
  const html = `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><title>${B.title} – ${esc(name)}</title><style>
@page{size:A4;margin:16mm 14mm}${coverPage ? '@page:first{margin:0}' : ''}body{font-family:Georgia,'Noto Serif Devanagari',serif;color:#2a1a10;margin:0;padding:0;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc{max-width:860px;margin:0 auto;padding:0 18px}
h1{color:#7a1f2b;margin:0;font-size:30px}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:28px;font-size:20px}h3{margin:14px 0 4px;color:#5a2a10}
.cover{border:3px double #c9a227;border-radius:14px;padding:26px 28px;margin:18px 0 8px;background:linear-gradient(135deg,#fffaf0,#fbf1d9)}.brand{letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#8a6d12}
.k{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:16px}.k div{border:1px solid #e5d3a1;border-radius:8px;padding:8px;text-align:center;background:#fff;font-size:11px}.k b{display:block;font-size:22px;color:#7a1f2b}
.bar{position:relative;display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #eee;padding:5px 0;font-size:13.5px}.bar i{position:absolute;left:0;bottom:-1px;height:3px;background:#c9a227}
.pick{border:1px solid #e5d3a1;border-radius:10px;padding:10px 14px;margin:8px 0;break-inside:avoid}small{color:#7a6a55}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #e5d3a1;padding:5px 8px;text-align:left}th{background:#fbf1d9}
.lo td{width:52px;height:46px;text-align:center;font-size:18px;font-weight:bold;color:#7a1f2b}.lo td.miss{color:#bbb;background:#fafafa}.lo{width:auto}
.v{display:inline-block;border-radius:99px;padding:1px 9px;color:#fff;font-size:12px}.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.app{font-size:10.5px}.app td,.app th{padding:2px 6px}.pb{break-before:page}.foot{margin-top:30px;border-top:1px solid #e5d3a1;padding-top:8px;font-size:11px;color:#7a6a55}
@media print{.noprint{display:none}}${extrasCss(coverPage?.extras)}${coverPage?.css ?? ''}</style></head><body>${coverPage?.html ?? ''}<main class="doc">
<div class="cover"><p class="brand">${esc(SITE_NAME)} · ${B.brandLine}</p><h1>${B.title}</h1>
<p style="margin:6px 0 0"><b style="font-size:18px">${esc(name)}</b><br>${B.dob} ${esc(opts.meta.dob)}${opts.meta.place ? ` · ${B.place} ${esc(opts.meta.place)}` : ''}${opts.meta.business ? ` · ${B.bizName} “${esc(opts.meta.business)}”` : ''}<br><small>${B.by} ${esc(opts.by)} · ${date} · ${B.analysed(fmt(d.totals.analysed))}</small></p>
<div class="k"><div>${B.moolank}<b>${d.person.moolank}</b></div><div>${B.bhagyank}<b>${d.person.bhagyankMaster ? `${d.person.bhagyankMaster}/${d.person.bhagyank}` : d.person.bhagyank}</b></div><div>${B.nameNo}<b>${d.person.nameCompound}/${d.person.nameNumber}</b></div><div>${B.py}<b>${d.currentYear.personalYear}</b></div><div>${B.bestSector}<b>${d.sectorScores[0].score}</b></div><div>${B.bestMatch}<b>${d.top[0].score}</b></div></div></div>
${contentsAndGuide(toc, L, coverPage?.extras)}

<h2>${esc(p.headline)}</h2><p>${esc(p.summary)}</p><ul>${p.businessPersonality.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<div class="two"><div><h3>${B.loshu}</h3><table class="lo">${grid}</table><p><small>${B.missing}: ${d.grid.missing.join(', ') || B.none}${d.grid.yogs.length ? ` · ${esc(d.grid.yogs.join(', '))}` : ''}</small></p></div>
<div><h3>${B.friendlyH}</h3><p>${B.friendlyTo(d.person.bhagyank)}: <b>${d.person.friendly.join(', ')}</b><br>${B.difficult}: <b>${d.person.avoid.join(', ') || B.none}</b><br>${B.planet}: ${esc(tr(L, d.person.planet.name))} · ${B.day} ${esc(tr(L, d.person.planet.weekday))}<br>${B.colours}: ${esc(d.person.planet.colours.map((x) => tr(L, x)).join(', '))}</p></div></div>

${d.checked.length ? `<h2>${B.considering}</h2><table><thead><tr><th>${B.business}</th><th>${B.score}</th><th>${B.rank}</th><th>${B.verdict}</th></tr></thead><tbody>${d.checked.map((c) => `<tr><td>${esc(c.label)}<br><small>${esc(c.group)} · ${B.numbers} ${c.numbers.join(', ')}${c.factors.length ? ` · ${esc(c.factors.join('; '))}` : ''}</small></td><td><b>${c.score}</b>/100</td><td>${B.rankOf(fmt(c.rank), fmt(d.totals.analysed))}</td><td><span class="v" style="background:${VERDICT_CSS[c.verdict.key]}">${c.verdict[L]}</span></td></tr>`).join('')}</tbody></table>${p.shortlistAdvice ? `<p>${esc(p.shortlistAdvice)}</p>` : ''}` : ''}

<h2>${B.top}</h2>${p.topPicks.map((t, i) => `<div class="pick"><b>${i + 1}. ${esc(label(d, t.id))} – ${score(d, t.id)}/100</b><p>${esc(t.why)}</p><p><b>${B.howStart}:</b> ${esc(t.howToStart)}</p><p><b>${B.watch}:</b> ${esc(t.watch)}</p></div>`).join('')}
<h2>${B.yourTop(d.top.length, fmt(d.totals.analysed))}</h2>${bars(d.top.map((x) => ({ l: `${x.label} · ${x.group}`, v: x.score })))}
<h2>${B.sectors}</h2>${bars(d.sectorScores.map((x) => ({ l: x.sector, v: x.score })))}
<h3>${B.bestInSector}</h3><table><tbody>${d.bestBySector.map((s) => `<tr><td><b>${esc(s.sector)}</b> (${s.score})</td><td>${s.items.map((x) => `${esc(x.label)} <small>${x.score}</small>`).join(' · ')}</td></tr>`).join('')}</tbody></table>
<h3>${B.groups}</h3>${bars(d.groupScores.slice(0, 10).map((x) => ({ l: `${x.group} (${x.count} ${B.categories})`, v: x.score })))}
<h2>${B.least}</h2><p>${esc(p.avoidNote)}</p><p><small>${d.avoid.map((x) => `${esc(x.label)} (${x.score})`).join(' · ')}</small></p>
<h2>${B.timingH}</h2><p><b>${B.timing}:</b> ${esc(p.timingAdvice)}</p>${bars(d.timing.map((t) => ({ l: L === 'hi' ? `${t.year} – ${B.py} ${t.personalYear}` : `${t.year} – personal year ${t.personalYear}: ${t.theme}`, v: t.score })))}
<p><b>${B.bizName}:</b> ${esc(p.nameAdvice)}</p><p><small>${B.goodTotals}: ${d.nameTargets.map((t) => `${t.single} (${t.compounds.join(', ')})`).join(' · ')}</small></p>
<p><b>${B.placeDir}:</b> ${esc(p.placeAdvice)}</p><p><b>${B.partner}:</b> ${esc(p.partnership)}</p>
<h2>${B.remedies}</h2><ul>${p.remedies.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h2>${B.plan}</h2><ol>${p.actionPlan.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p><i>${esc(p.closing)}</i></p>
${qa.length ? qaHtml(qa, L, { newPage: true }) : ''}
${appendix}
${endCta(coverPage?.extras)}
<p class="foot">${B.by} ${esc(opts.by)} · ${esc(SITE_NAME)}. ${B.disclaimer}</p></main></body></html>`;
  return html;
}
