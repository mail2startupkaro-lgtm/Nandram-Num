'use client';
import * as React from 'react';
import { Bot, Briefcase, ChevronLeft, ChevronRight, ClipboardList, Copy, Loader2, Printer, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { BUSINESS_COUNT, ITEM_BY_ID, ITEMS, SECTORS } from '@/lib/business/catalogue';
import { verdictOf, type BizAnalytics } from '@/lib/business/engine';
import { matchCategories } from '@/lib/business/match';
import { SITE_NAME } from '@/lib/seo/site';
import type { Order } from '@/components/admin/services-admin';
import type { BizReport } from '@/lib/business/agent';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n/hi-terms';

interface Result { data: BizAnalytics; report: BizReport; source: 'ai' | 'rules'; model?: string; note?: string; generatedAt: string }
const LOSHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const REL = { friend: 'Friendly', neutral: 'Neutral', enemy: 'Not friendly' } as const;
const tone = (v: number) => (v >= 75 ? 'from-emerald-600 to-emerald-400' : v >= 55 ? 'from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)]' : 'from-rose-700 to-rose-500');

function Bar({ label, value, sub, onClick, active }: { label: React.ReactNode; value: number; sub?: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn('block w-full rounded-md px-2 py-1.5 text-left', onClick && 'hover:bg-muted', active && 'bg-gold/10')}>
      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate">{label}</span><span className="tabular-nums font-semibold text-gold">{value}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', tone(value))} style={{ width: `${Math.max(3, value)}%` }} /></div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </button>
  );
}
const Card = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => <section className={cn('glass rounded-lg p-5', className)}><h3 className="mb-3 font-serif text-lg font-semibold text-gold">{title}</h3>{children}</section>;
const Kpi = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="gold-text font-serif text-3xl font-bold">{value}</p>{sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}</div>;
const fmt = (n: number) => n.toLocaleString('en-IN');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function label(d: BizAnalytics, id: string) { return d.all.find((x) => x.id === id)?.label ?? id; }
function score(d: BizAnalytics, id: string) { return d.all.find((x) => x.id === id)?.score ?? 0; }

function asText(name: string, r: Result) {
  const d = r.data, p = r.report;
  return [`BUSINESS COMPATIBILITY REPORT – ${name}`, `Moolank ${d.person.moolank} · Bhagyank ${d.person.bhagyank} · Name number ${d.person.nameNumber} · ${fmt(d.totals.analysed)} categories analysed`, '', p.headline, p.summary, '',
    ...(d.checked.length ? ['BUSINESSES YOU ARE CONSIDERING', ...d.checked.map((c) => `• ${c.label} – ${c.score}/100, rank ${fmt(c.rank)} of ${fmt(d.totals.analysed)} – ${c.verdict.en}`), ...(p.shortlistAdvice ? [p.shortlistAdvice] : []), ''] : []),
    'TOP MATCHES', ...p.topPicks.map((t, i) => `${i + 1}. ${label(d, t.id)} (${score(d, t.id)}/100) – ${t.why} Start: ${t.howToStart} Watch: ${t.watch}`), '',
    'RANKING', ...d.top.map((x, i) => `${i + 1}. ${x.label} – ${x.score}`), '', 'BEST SECTORS', ...d.bestBySector.slice(0, 5).map((s) => `${s.sector} ${s.score}: ${s.items.map((x) => x.label).join(', ')}`), '',
    `Least suited: ${p.avoidNote}`, '', `Partnership: ${p.partnership}`, `Name: ${p.nameAdvice}`, `Place: ${p.placeAdvice}`, `Timing: ${p.timingAdvice}`, '',
    'REMEDIES', ...p.remedies.map((x) => `• ${x}`), '', 'ACTION PLAN', ...p.actionPlan.map((x, i) => `${i + 1}. ${x}`), '', p.closing].join('\n');
}

const VERDICT_CSS: Record<string, string> = { excellent: '#1f7a46', good: '#8a6d12', moderate: '#b5651d', weak: '#9b2335' };

/** Print labels for the Business compatibility report (category and business names stay as written). */
const PL = {
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

async function printReport(name: string, r: Result, opts: { by: string; appendix: boolean; lang?: 'en' | 'hi'; meta: { dob: string; place: string; business?: string } }) {
  const L = opts.lang === 'hi' ? 'hi' : 'en'; const B = PL[L]; const loc = L === 'hi' ? 'hi-IN' : 'en-IN';
  // Open the window first (inside the click) so the browser does not block it, then fetch the branded cover page.
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<p style="font-family:Georgia,serif;padding:40px;color:#7a1f2b">${B.preparing}</p>`);
  const coverPage = await api<{ css: string; html: string }>('/api/admin/report-cover', { method: 'POST', json: {
    title: B.title, subtitle: B.subtitle, clientName: name, preparedBy: opts.by, lang: L,
    facts: [[B.dob, opts.meta.dob], [B.place, opts.meta.place], [B.bizName, opts.meta.business ?? ''], [B.reportDate, new Date(r.generatedAt).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })]],
  } }).catch(() => null);
  const d = r.data, p = r.report;
  const date = new Date(r.generatedAt).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  const bars = (xs: { l: string; v: number }[]) => xs.map((x) => `<div class="bar"><span>${esc(x.l)}</span><b>${x.v}</b><i style="width:${x.v}%"></i></div>`).join('');
  const grid = LOSHU.map((row) => `<tr>${row.map((n) => `<td class="${d.grid.counts[n] ? '' : 'miss'}">${d.grid.counts[n] ? String(n).repeat(d.grid.counts[n]) : '–'}</td>`).join('')}</tr>`).join('');
  const appendix = opts.appendix ? `<section class="pb"><h2>${B.appendix(fmt(d.totals.analysed))}</h2><p><small>${B.appendixNote(esc(name))}</small></p>
    <table class="app"><thead><tr><th>#</th><th>${B.category}</th><th>${B.group}</th><th>${B.score}</th></tr></thead><tbody>${d.all.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.label)}</td><td>${esc(x.group)}</td><td style="color:${VERDICT_CSS[verdictOf(x.score).key]}"><b>${x.score}</b></td></tr>`).join('')}</tbody></table></section>` : '';
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
@media print{.noprint{display:none}}${coverPage?.css ?? ''}</style></head><body>${coverPage?.html ?? ''}<main class="doc">
<div class="cover"><p class="brand">${esc(SITE_NAME)} · ${B.brandLine}</p><h1>${B.title}</h1>
<p style="margin:6px 0 0"><b style="font-size:18px">${esc(name)}</b><br>${B.dob} ${esc(opts.meta.dob)}${opts.meta.place ? ` · ${B.place} ${esc(opts.meta.place)}` : ''}${opts.meta.business ? ` · ${B.bizName} “${esc(opts.meta.business)}”` : ''}<br><small>${B.by} ${esc(opts.by)} · ${date} · ${B.analysed(fmt(d.totals.analysed))}</small></p>
<div class="k"><div>${B.moolank}<b>${d.person.moolank}</b></div><div>${B.bhagyank}<b>${d.person.bhagyankMaster ? `${d.person.bhagyankMaster}/${d.person.bhagyank}` : d.person.bhagyank}</b></div><div>${B.nameNo}<b>${d.person.nameCompound}/${d.person.nameNumber}</b></div><div>${B.py}<b>${d.currentYear.personalYear}</b></div><div>${B.bestSector}<b>${d.sectorScores[0].score}</b></div><div>${B.bestMatch}<b>${d.top[0].score}</b></div></div></div>

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
${appendix}
<p class="foot">${B.by} ${esc(opts.by)} · ${esc(SITE_NAME)}. ${B.disclaimer}</p></main></body></html>`;
  w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 800);
}

/** Search across all 1000+ categories and pick the ones the client is considering. */
function ShortlistPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = React.useState('');
  const n = q.trim().toLowerCase();
  const hits = n.length < 2 ? [] : ITEMS.filter((x) => !value.includes(x.id) && (x.label.toLowerCase().includes(n) || x.group.toLowerCase().includes(n))).slice(0, 10);
  const add = (id: string) => { if (value.length < 20) onChange([...value, id]); setQ(''); };
  return (
    <div className="space-y-2">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${fmt(BUSINESS_COUNT)} categories – e.g. café, pharmacy, transport`} className="pl-9" aria-label="Search business categories"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (hits[0]) add(hits[0].id); } }} />
        {hits.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-background shadow-xl">
            {hits.map((h) => <li key={h.id}><button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gold/10" onClick={() => add(h.id)}>{h.label}<span className="block text-[11px] text-muted-foreground">{h.sector} · {h.group}</span></button></li>)}
          </ul>
        )}
      </div>
      {value.length > 0 && <div className="flex flex-wrap gap-2">{value.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 text-xs font-medium">{ITEM_BY_ID.get(id)?.label ?? id}<button type="button" aria-label="Remove" onClick={() => onChange(value.filter((x) => x !== id))} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button></span>)}</div>}
      <p className="text-[11px] text-muted-foreground">Up to 20. Each one gets its own score, rank and verdict in the report.</p>
    </div>
  );
}

/** Browse the client's ranking of every category. */
function RankingExplorer({ d }: { d: BizAnalytics }) {
  const [q, setQ] = React.useState(''); const [sector, setSector] = React.useState(''); const [band, setBand] = React.useState(''); const [page, setPage] = React.useState(0);
  const PER = 30; const n = q.trim().toLowerCase();
  const rows = React.useMemo(() => d.all.map((x, i) => ({ ...x, rank: i + 1 })).filter((x) => (!sector || x.sector === sector) && (!band || verdictOf(x.score).key === band) && (!n || x.label.toLowerCase().includes(n) || x.group.toLowerCase().includes(n))), [d, sector, band, n]);
  React.useEffect(() => setPage(0), [sector, band, n]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  return (
    <Card title={`Full ranking – all ${fmt(d.totals.analysed)} categories`}>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a business or group" aria-label="Search the ranking" />
        <Select value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sector"><option value="">All sectors</option>{SECTORS.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={band} onChange={(e) => setBand(e.target.value)} aria-label="Verdict"><option value="">All verdicts</option><option value="excellent">Highly compatible (75+)</option><option value="good">Compatible (62–74)</option><option value="moderate">Moderate (48–61)</option><option value="weak">Not advised (&lt;48)</option></Select>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{fmt(rows.length)} shown · {(['excellent', 'good', 'moderate', 'weak'] as const).map((k) => `${d.all.filter((x) => verdictOf(x.score).key === k).length} ${k}`).join(' · ')}</p>
      <div className="divide-y divide-border/40">
        {rows.slice(page * PER, page * PER + PER).map((x) => (
          <div key={x.id} className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-2 py-1.5 text-sm">
            <span className="tabular-nums text-muted-foreground">#{x.rank}</span>
            <span className="min-w-0"><span className="block truncate">{x.label}</span><span className="block truncate text-[11px] text-muted-foreground">{x.group} · numbers {x.numbers.join(', ')}{x.factors.length ? ` · ${x.factors.join(' · ')}` : ''}</span></span>
            <span className={cn('text-right font-semibold tabular-nums', x.score >= 75 ? 'text-emerald-400' : x.score >= 62 ? 'text-gold' : x.score >= 48 ? 'text-amber-400' : 'text-rose-400')}>{x.score}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm"><Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Prev</Button><span className="text-muted-foreground">Page {page + 1} of {pages}</span><Button type="button" variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4" /></Button></div>
    </Card>
  );
}

const BLANK = { fullName: '', commonName: '', dob: '', gender: 'male', birthPlace: '', currentCity: '', businessName: '', mode: 'business', capital: '2', risk: 'medium', education: '', currentWork: '', goals: '', language: 'en', preparedBy: 'Acharya Nandram' };

/** Admin → Business compatibility report: separate report generator for the Business Compatibility service (1000+ categories). */
export function BusinessStudio({ preloadedOrder, onClearPreloadedOrder }: { preloadedOrder?: Order | null; onClearPreloadedOrder?: () => void } = {}) {
  const [f, setF] = React.useState(BLANK);
  const [interests, setInterests] = React.useState<string[]>([]);
  const [shortlist, setShortlist] = React.useState<string[]>([]);
  const [appendix, setAppendix] = React.useState(true);
  const [fromOrder, setFromOrder] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!preloadedOrder) return;
    const dt = preloadedOrder.details ?? {};
    const m = matchCategories(dt.businesses ?? '');
    setF({ ...BLANK, fullName: dt.clientName ?? '', dob: dt.dob ?? '', gender: dt.gender ?? 'male', birthPlace: dt.pob ?? '', businessName: dt.currentName ?? '',
      goals: [m.unmatched.length ? `Also considering (not in catalogue): ${m.unmatched.join(', ')}` : '', dt.questions ?? ''].filter(Boolean).join('\n').slice(0, 1000) });
    setShortlist(m.ids); setFromOrder(`${dt.clientName ?? 'Client'} · ordered ${new Date(preloadedOrder.createdAt).toLocaleDateString('en-IN')}${dt.businesses ? ` · considering: ${dt.businesses}` : ''}`);
    setRes(null); onClearPreloadedOrder?.();
  }, [preloadedOrder]); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [res, setRes] = React.useState<Result | null>(null);
  const [sel, setSel] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function run(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setRes(null); setSel(null);
    try {
      const r = await api<Result>('/api/admin/business', { method: 'POST', json: { ...f, preparedBy: undefined, capital: Number(f.capital), interests, shortlist,
        commonName: f.commonName || undefined, currentCity: f.currentCity || undefined, businessName: f.businessName || undefined, education: f.education || undefined, currentWork: f.currentWork || undefined, goals: f.goals || undefined } });
      setRes(r); setTimeout(() => document.getElementById('biz-result')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (x) { setErr(x instanceof ApiError ? (x.body.error === 'RATE_LIMITED' ? 'Too many reports – please wait a few minutes.' : x.message) : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  const d = res?.data, p = res?.report;
  const selItem = d && sel ? d.all.find((x) => x.id === sel) : null;
  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Briefcase className="h-6 w-6 text-gold" />Business Compatibility Report Generator</h2>
        <p className="mt-1 text-sm text-muted-foreground">The numerology engine scores all {fmt(BUSINESS_COUNT)} business categories (plus {ITEMS.length - BUSINESS_COUNT} jobs / professions) against the client&apos;s Moolank, Bhagyank, name number and Lo Shu grid, gives each business the client is considering its own verdict, and the AI agent writes the consultation from that data. Print / Save PDF gives the branded client report. Nothing is saved.</p>
        <p className="mt-2 text-xs text-muted-foreground">Paid orders for the Business Compatibility service open here from Services → Orders → Generate Report.</p>
      </div>
      {fromOrder && <div className="glass flex flex-wrap items-center gap-2 rounded-lg border border-gold/50 p-3 text-sm"><ClipboardList className="h-4 w-4 text-gold" /><span>Loaded from service order: {fromOrder}. Check the details, then generate.</span><button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setFromOrder(null)}>Dismiss</button></div>}

      <form onSubmit={run} className="glass space-y-6 rounded-lg p-5">
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">1. Client</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" htmlFor="bz-n" required><Input id="bz-n" value={f.fullName} onChange={set('fullName')} required /></Field>
            <Field label="Name commonly used" htmlFor="bz-cn" hint="Used for the name number; blank = full name"><Input id="bz-cn" value={f.commonName} onChange={set('commonName')} /></Field>
            <Field label="Date of birth" htmlFor="bz-d" required><Input id="bz-d" type="date" value={f.dob} onChange={set('dob')} required /></Field>
            <Field label="Gender" htmlFor="bz-g" hint="Used for the Kua direction"><Select id="bz-g" value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
            <Field label="Birth place" htmlFor="bz-bp" required><Input id="bz-bp" value={f.birthPlace} onChange={set('birthPlace')} placeholder="City, e.g. Jaipur" required /></Field>
            <Field label="Business / work city" htmlFor="bz-cc"><Input id="bz-cc" value={f.currentCity} onChange={set('currentCity')} placeholder="Where they work or plan to" /></Field>
          </div>
        </section>
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">2. Business parameters</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Looking for" htmlFor="bz-m"><Select id="bz-m" value={f.mode} onChange={set('mode')}><option value="business">Own business</option><option value="both">Business or job</option><option value="profession">Job / profession</option></Select></Field>
            <Field label="Capital available" htmlFor="bz-c"><Select id="bz-c" value={f.capital} onChange={set('capital')}><option value="1">Low (up to ₹5 lakh)</option><option value="2">Medium (₹5–50 lakh)</option><option value="3">High (above ₹50 lakh)</option></Select></Field>
            <Field label="Risk appetite" htmlFor="bz-r"><Select id="bz-r" value={f.risk} onChange={set('risk')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
            <Field label="Report language" htmlFor="bz-l"><Select id="bz-l" value={f.language} onChange={set('language')}><option value="en">English</option><option value="hi">हिंदी</option><option value="hinglish">Hinglish</option></Select></Field>
            <Field label="Existing / planned business name" htmlFor="bz-bn" className="sm:col-span-2"><Input id="bz-bn" value={f.businessName} onChange={set('businessName')} placeholder="Optional – checked against the owner's numbers" /></Field>
            <Field label="Education" htmlFor="bz-e"><Input id="bz-e" value={f.education} onChange={set('education')} placeholder="e.g. B.Com, MBA" /></Field>
            <Field label="Current work" htmlFor="bz-w"><Input id="bz-w" value={f.currentWork} onChange={set('currentWork')} placeholder="e.g. Sales manager, 8 yrs" /></Field>
          </div>
          <div><p className="mb-2 text-sm font-medium">Interested sectors</p><div className="flex flex-wrap gap-2">{SECTORS.map((s) => <button key={s} type="button" aria-pressed={interests.includes(s)} onClick={() => setInterests(interests.includes(s) ? interests.filter((x) => x !== s) : [...interests, s])} className={cn('rounded-full border px-3 py-1.5 text-xs', interests.includes(s) ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{s}</button>)}</div></div>
          <Field label="Goals / notes for the agent" htmlFor="bz-gl"><textarea id="bz-gl" rows={3} maxLength={1000} value={f.goals} onChange={set('goals')} placeholder="e.g. Wants to leave job in 2 years, family has a cloth shop, prefers low-risk…" className="w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" /></Field>
        </section>
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">3. Businesses the client is considering</h3><ShortlistPicker value={shortlist} onChange={setShortlist} /></section>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !f.fullName || !f.dob || !f.birthPlace}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{busy ? 'Agent is analysing…' : 'Generate compatibility report'}</Button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">Prepared by<Input value={f.preparedBy} onChange={set('preparedBy')} className="w-52" /></label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={appendix} onChange={(e) => setAppendix(e.target.checked)} />Add full ranking appendix to PDF</label>
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        </div>
      </form>

      {res && d && p && (
        <div id="biz-result" className="mk-rise scroll-mt-24 space-y-5" lang={f.language === 'hi' ? 'hi' : 'en'}>
          <div className="glass flex flex-wrap items-center gap-2 rounded-lg p-4 text-xs">
            <Badge tone={res.source === 'ai' ? 'gold' : 'default'}><Bot className="mr-1 inline h-3 w-3" />{res.source === 'ai' ? `AI agent${res.model ? ` · ${res.model}` : ''}` : 'Built-in analyst'}</Badge>
            {res.note && <span className="text-muted-foreground">{res.note}</span>}
            <div className="ml-auto flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(asText(f.fullName, res))}><Copy className="mr-1 h-4 w-4" />Copy text</Button>
              <Button type="button" size="sm" onClick={() => printReport(f.fullName, res, { by: f.preparedBy || 'Acharya Nandram', appendix, lang: f.language === 'hi' ? 'hi' : 'en', meta: { dob: f.dob ? new Date(`${f.dob}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '', place: f.birthPlace, business: f.businessName || undefined } })}><Printer className="mr-1 h-4 w-4" />Print / Save PDF</Button></div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Moolank" value={d.person.moolank} sub={undefined} />
            <Kpi label="Bhagyank" value={d.person.bhagyankMaster ? `${d.person.bhagyankMaster}/${d.person.bhagyank}` : d.person.bhagyank} sub={d.person.planet.name} />
            <Kpi label="Name number" value={`${d.person.nameCompound}/${d.person.nameNumber}`} sub={REL[d.person.nameToBhagyank]} />
            <Kpi label="Best match" value={d.top[0].score} sub={d.top[0].label} />
            <Kpi label="Personal year" value={d.currentYear.personalYear} sub={`Launch score ${d.currentYear.score}`} />
            <Kpi label="Categories analysed" value={fmt(d.totals.analysed)} sub={`Best sector: ${d.sectorScores[0].sector}`} />
          </div>

          <Card title={p.headline}><p className="text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
            <ul className="mt-3 space-y-1.5 text-sm">{p.businessPersonality.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul></Card>

          {d.checked.length > 0 && (
            <Card title="Businesses the client is considering">
              <div className="grid gap-3 md:grid-cols-2">{d.checked.map((c) => (
                <div key={c.id} className={cn('rounded-xl border p-4', c.score >= 75 ? 'border-emerald-400/50 bg-emerald-500/10' : c.score >= 62 ? 'border-gold/50 bg-gold/10' : c.score >= 48 ? 'border-amber-400/50 bg-amber-500/10' : 'border-rose-400/50 bg-rose-500/10')}>
                  <div className="flex items-start justify-between gap-2"><p className="font-serif text-lg font-semibold">{c.label}</p><span className="text-xl font-bold text-gold">{c.score}</span></div>
                  <p className="text-sm font-semibold">{c.verdict.en} · rank {fmt(c.rank)} of {fmt(d.totals.analysed)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.group} · numbers {c.numbers.join(', ')}{c.factors.length ? ` · ${c.factors.join(' · ')}` : ''}</p>
                </div>))}</div>
              {p.shortlistAdvice && <p className="mt-3 text-sm">{p.shortlistAdvice}</p>}
            </Card>
          )}

          <Card title="Top recommendations">
            <div className="grid gap-3 md:grid-cols-2">{p.topPicks.map((t, i) => (
              <div key={t.id} className="mk-card rounded-xl border border-gold/30 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-2"><p className="font-serif text-lg font-semibold"><span className="gold-text mr-1">{i + 1}.</span>{label(d, t.id)}</p><span className="rounded-full bg-gold/20 px-2 py-0.5 text-sm font-bold text-gold">{score(d, t.id)}</span></div>
                <p className="mt-1 text-sm">{t.why}</p><p className="mt-2 text-sm text-muted-foreground"><b className="text-foreground">How to start:</b> {t.howToStart}</p><p className="mt-1 text-xs text-amber-300/90"><b>Watch:</b> {t.watch}</p>
              </div>))}</div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Compatibility ranking (tap for details)">
              {d.top.map((x) => <Bar key={x.id} label={<>{x.label} <span className="text-[10px] uppercase text-muted-foreground">· {x.kind === 'business' ? 'business' : 'profession'}</span></>} value={x.score} onClick={() => setSel(sel === x.id ? null : x.id)} active={sel === x.id}
                sub={sel === x.id ? <>Numbers {x.numbers.join(', ')} · numerology fit {x.numerologyFit}{x.factors.length ? ` · ${x.factors.join(' · ')}` : ''}</> : undefined} />)}
              <p className="mt-3 text-xs text-muted-foreground">Least suited: {d.avoid.map((x) => `${x.label} (${x.score})`).join(', ')}</p>
              {selItem && <span className="sr-only" aria-live="polite">{selItem.label} selected</span>}
            </Card>
            <Card title="Sector analysis">{d.sectorScores.map((s) => <Bar key={s.sector} label={s.sector} value={s.score} />)}</Card>
            <Card title="Number strength 1–9">
              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <div><div className="grid grid-cols-3 gap-1">{LOSHU.flat().map((n) => <div key={n} className={cn('flex h-14 w-14 flex-col items-center justify-center rounded-md border text-sm', d.grid.counts[n] ? 'border-gold/50 bg-gold/10' : 'border-dashed border-border text-muted-foreground')}><span className="font-serif text-lg font-bold">{d.grid.counts[n] ? String(n).repeat(d.grid.counts[n]) : '–'}</span></div>)}</div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Lo Shu grid · missing {d.grid.missing.join(', ') || 'none'}{d.grid.yogs.length ? ` · ${d.grid.yogs.join(', ')}` : ''}</p></div>
                <div>{d.numberStrength.map((x) => <Bar key={x.n} label={`${x.n} · ${x.planet}`} value={x.score} />)}</div>
              </div>
            </Card>
            <Card title="Strongest business groups">{d.groupScores.slice(0, 10).map((x) => <Bar key={x.group} label={<>{x.group} <span className="text-[10px] text-muted-foreground">· {x.count}</span></>} value={x.score} />)}</Card>
            <Card title="Best businesses in each sector"><ul className="space-y-2 text-sm">{d.bestBySector.map((s) => <li key={s.sector}><span className="font-semibold">{s.sector}</span> <span className="text-gold">{s.score}</span><span className="block text-xs text-muted-foreground">{s.items.map((x) => `${x.label} (${x.score})`).join(' · ')}</span></li>)}</ul></Card>
            <Card title="Life-area scores">{Object.entries(d.lifeAreas).map(([k, v]) => <Bar key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} value={v} />)}</Card>
          </div>

          <RankingExplorer d={d} />

          <Card title="Timing – best years to launch or expand">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">{d.timing.map((t) => (
              <div key={t.year} title={t.theme} className={cn('rounded-lg border p-2 text-center', t.score >= 80 ? 'border-emerald-400/60 bg-emerald-500/10' : t.score >= 55 ? 'border-gold/40 bg-gold/5' : 'border-rose-400/40 bg-rose-500/5')}>
                <p className="text-xs text-muted-foreground">{t.year}</p><p className="gold-text font-serif text-2xl font-bold">{t.personalYear}</p><p className="text-[10px]">{t.score}</p></div>))}</div>
            <p className="mt-3 text-sm">{p.timingAdvice}</p>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Business name"><p className="text-sm">{p.nameAdvice}</p>{d.businessName && <p className="mt-2 text-xs text-muted-foreground">&quot;{d.businessName.text}&quot; = {d.businessName.compound}/{d.businessName.single} · {d.businessName.category} · harmony {d.businessName.score}</p>}
              <p className="mt-2 text-xs text-muted-foreground">Good totals: {d.nameTargets.map((t) => `${t.single} (${t.compounds.join(', ')})`).join(' · ')}</p></Card>
            <Card title="Place & direction"><p className="text-sm">{p.placeAdvice}</p><p className="mt-2 text-xs text-muted-foreground">Kua {d.person.kua} · success {d.directions.success} · growth {d.directions.growth} · avoid {d.directions.avoid}</p></Card>
            <Card title="Partnership"><p className="text-sm">{p.partnership}</p></Card>
            <Card title="Least suited"><p className="text-sm">{p.avoidNote}</p></Card>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Remedies"><ul className="space-y-1.5 text-sm">{p.remedies.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul></Card>
            <Card title="Action plan"><ol className="space-y-1.5 text-sm">{p.actionPlan.map((x, i) => <li key={x} className="flex gap-2"><span className="gold-text font-bold">{i + 1}.</span>{x}</li>)}</ol></Card>
          </div>
          <p className="text-sm italic">{p.closing}</p>
          <p className="text-xs text-muted-foreground">Numerology guidance only – not financial, investment, tax or legal advice. Review before sharing with the client.</p>
        </div>
      )}
    </div>
  );
}
