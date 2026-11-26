/**
 * Advanced Baby Name Analysis – branded A4 PDF (same Chromium + framed-page pipeline and look as the mobile and signature reports).
 *
 * Cover (full-bleed, recommended name as letter tiles) · Summary (score ring, top-3 podium, letter to parents, contents), then every
 * section on a fresh page: Birth numbers · Lucky name blueprint · All names compared · Recommended name in depth · Second and third
 * choices · Family harmony (when parent names are given) · More suitable names (when suggestions are on) · Naming ceremony and guidance ·
 * About the numerologist + services CTA, WhatsApp / website QR codes and disclaimer.
 */
import QRCode from 'qrcode';
import { esc, gridSvg, mandala, monogram, numberMedallion, ringSvg, scoreColour } from '@/lib/pdf/svg';
import { baseCss } from '@/lib/pdf/template';
import { COLOUR_HEX, DEFAULT_BRANDING, resolveTheme, type Branding, type PdfTheme, type ThemeId } from '@/lib/pdf/themes';
import { renderSheetPdf } from '@/lib/pdf/render';
import { DEFAULT_SERVICES } from '@/lib/billing/services';
import { brandWordmark, DEFAULT_CONTACT, type ReportContact } from '@/lib/signature/report';
import { humaniseDeep } from '@/lib/signature/humanise';
import { tr } from '@/lib/i18n/hi-terms';
import { LOSHU_NUMBER_INFO } from '@/lib/numerology/data/grids';
import type { Relation } from '@/lib/numerology/data/relations';
import type { CompoundCategory } from '@/lib/numerology/data/tables';
import { reportSheetCss } from '@/lib/mobile-advanced/report';
import type { BabyNameResult, EvaluatedName, LetterClass } from './analysis';
import { CHILD_NATURE, checkText, L, LIFE_PATH, NAME_NUMBER_TEXT, relText, type Lab, type Lang } from './text';

export interface BabyReportOptions {
  lang: Lang;
  preparedBy: string;
  /** Family name for the salutation ("Dear Sharma family"); defaults to the surname. */
  familyName?: string;
  expertNote?: string;
}
export interface BabyReportExtras { contact?: ReportContact; qrWhatsapp?: string; qrWebsite?: string }

const CTA_SERVICES = ['SVC_BABY_NAME', 'SVC_PERSONAL_REPORT', 'SVC_LOSHU', 'SVC_NAME_CORRECTION', 'SVC_COUPLE', 'SVC_MOBILE_NUMBER'] as const;
const PLANET_BY_N = ['', 'Sun', 'Moon', 'Jupiter', 'Rahu', 'Mercury', 'Venus', 'Ketu', 'Saturn', 'Mars'];

const fmtDate = (iso: string, lang: Lang, short = false) => {
  const d = new Date(`${iso}T12:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: short ? 'short' : 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
};
const dobText = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? `${m[3]}-${m[2]}-${m[1]}` : d; };
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^(?=\d{10}$)/, '91')}`;
const nn = (x: { compound: number; single: number }) => `${x.compound}/${x.single}`;
const mainNum = (e: EvaluatedName) => e.fullNum ?? e.firstNum;

function css(t: PdfTheme) {
  return `${reportSheetCss(t)}
  .chkgrid{display:grid;grid-template-columns:1fr 1fr;gap:0 3mm}.chkgrid .chk{grid-template-columns:6mm 1fr;padding:1.6mm 2.4mm;margin-bottom:1.6mm}.chkgrid .chk .pill{display:none}.chkgrid .chk h4{font-size:8.8pt}.chkgrid .chk p{font-size:7.9pt;line-height:1.35}
  .podium{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;margin:3mm 0 1mm;break-inside:avoid}
  .pod{border:1px solid ${t.accent}77;border-radius:3.5mm;background:#fff;padding:3.5mm 3mm 3mm;text-align:center;position:relative}
  .pod.p1{border:1.6px solid ${t.accent};background:linear-gradient(180deg,${t.soft},#fff)}
  .pod .rk{position:absolute;top:-3mm;left:50%;transform:translateX(-50%);width:6.5mm;height:6.5mm;border-radius:50%;background:${t.primary};color:#fff;font-family:'Playfair Display',serif;font-weight:700;font-size:9pt;display:flex;align-items:center;justify-content:center}
  .pod.p1 .rk{background:${t.accent}}
  .pod .nm{font-family:'Playfair Display','Noto Serif Devanagari',serif;font-size:15pt;font-weight:700;color:${t.primary};line-height:1.15;margin-top:1.5mm}
  .pod .hi{font-size:9pt;color:${t.muted}}
  .pod .mn{font-size:8pt;color:${t.muted};margin:.8mm 0 1.5mm;min-height:3.5mm}
  .pod .sc{font-family:'Playfair Display',serif;font-size:19pt;font-weight:700;line-height:1}
  .pod .sc small{font-size:8pt;color:${t.muted};font-weight:400}
  .pod .nb{font-size:8pt;margin-top:1.2mm}
  .tiles{display:flex;gap:1.6mm;justify-content:center;flex-wrap:wrap}
  .tiles .tl{width:10.5mm;height:13mm;border-radius:2mm;border:1px solid ${t.accent}88;background:${t.soft};display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
  .tiles .tl b{font-family:'Playfair Display',serif;font-size:16pt;color:${t.primary}}
  .tiles .tl i{font-style:normal;font-size:7pt;color:${t.accent};margin-top:.8mm;font-weight:600}
  .tiles .tl.v{background:#fff;border-color:${t.primary}66}
  .tiles .sp{width:3mm}
  .ltab td,.ltab th{text-align:center} .ltab td:first-child,.ltab th:first-child{text-align:left}
  .lgroups{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:1mm 0 3mm}
  .lg{border:1px solid ${t.border}88;border-radius:3mm;padding:2.6mm 3mm;background:${t.paper};break-inside:avoid}
  .lg.lucky{border-color:${t.good};background:${t.good}0d} .lg.avoid{border-color:${t.bad}88;background:${t.bad}08}
  .lg .k{font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;font-weight:600;margin-bottom:1.2mm;color:${t.accent}}
  .lg.lucky .k{color:${t.good}} .lg.avoid .k{color:${t.bad}}
  .lg .ls{display:flex;flex-wrap:wrap;gap:1.2mm}
  .lg .ls span{min-width:6.2mm;height:6.2mm;border-radius:1.4mm;border:.6px solid ${t.border};background:#fff;display:inline-flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;font-size:10pt;color:${t.primary};padding:0 .8mm}
  .medals{display:flex;gap:3mm;align-items:center;flex-wrap:wrap}
  .rk-row.top td{background:${t.soft}} .rk-row td{vertical-align:middle}
  .nmc{font-family:'Playfair Display','Noto Serif Devanagari',serif;font-weight:700;font-size:10.5pt;color:${t.primary}}
  .nmc small{display:block;font-family:inherit;font-weight:400;font-size:7.6pt;color:${t.muted}}
  .scb{font-family:'Playfair Display',serif;font-weight:700;font-size:12pt}
  .star{color:${t.accent}}
  .runner{border:1px solid ${t.accent}66;border-radius:3.5mm;padding:3.5mm 4.5mm;background:${t.paper};margin-bottom:4mm;break-inside:avoid}
  .runner .hd{display:flex;justify-content:space-between;align-items:center;gap:4mm;margin-bottom:2mm}
  .runner .hd .nmc{font-size:15pt}
  .mini{display:grid;grid-template-columns:repeat(2,1fr);gap:1.2mm 4mm;font-size:8.4pt}
  .mini .it{display:flex;gap:1.8mm;align-items:baseline}
  .mini .dot{width:2.2mm;height:2.2mm;border-radius:50%;flex:none;transform:translateY(.2mm)}
  .tw{margin-top:2mm;font-size:8.6pt}
  .tw b.h{display:block;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:${t.accent};margin-bottom:.8mm}
  .tw .t{display:inline-block;margin:0 2mm 1mm 0;padding:.6mm 2.2mm;border:.6px solid ${t.good}88;border-radius:2mm;background:${t.good}10}
  .dates{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm;margin-top:2mm}
  .dates .d{border:.8px solid ${t.good};border-radius:2.5mm;padding:2.2mm 1.5mm;text-align:center;background:${t.good}0d;break-inside:avoid}
  .dates .d b{display:block;font-family:'Playfair Display',serif;font-size:11pt;color:${t.primary}}
  .dates .d span{font-size:7.6pt;color:${t.muted}}
  :lang(hi) .lg .k,:lang(hi) .tw b.h{letter-spacing:0;text-transform:none}
  `;
}

const secHead = (n: number, title: string) => `<div class="sec-h"><div class="no">${n}</div><h2>${esc(title)}</h2></div>`;
const relPill = (r: Relation | null, l: Lab) => `<span class="pill ${r === 'friend' ? 'positive' : r === 'enemy' ? 'watch' : 'neutral'}">${esc(relText(r, l))}</span>`;
const catPill = (c: CompoundCategory, l: Lab) => `<span class="pill ${c === 'favourable' ? 'positive' : c === 'unfavourable' ? 'watch' : 'neutral'}">${esc(l.cat[c])}</span>`;
const clsPill = (c: LetterClass, l: Lab) => `<span class="pill ${c === 'lucky' ? 'positive' : c === 'avoid' ? 'bad' : 'neutral'}">${esc(l.cls[c])}</span>`;
const chips = (xs: (number | string)[], kind: 'good' | 'bad' | 'neu' | 'warn', l: Lab) => `<div class="chips">${xs.length ? xs.map((x) => `<span class="chip ${kind}">${esc(x)}</span>`).join('') : `<span class="small muted">${esc(l.none)}</span>`}</div>`;
const vPill = (e: EvaluatedName, l: Lab) => `<span class="pill ${e.verdict === 'excellent' || e.verdict === 'good' ? 'positive' : e.verdict === 'average' ? 'neutral' : 'watch'}">${esc(l.verdict[e.verdict])}</span>`;
const meaningOf = (e: EvaluatedName, lang: Lang) => (e.bank ? (lang === 'hi' ? e.bank.hm : e.bank.en) : '');
const hiName = (e: EvaluatedName) => e.bank?.hi ?? '';

/** Name as letter tiles with Chaldean values (vowels outlined). */
function tiles(e: EvaluatedName): string {
  return `<div class="tiles">${e.letters.map((x) => `<span class="tl${x.vowel ? ' v' : ''}"><b>${esc(x.letter)}</b><i>${x.ch}</i></span>`).join('')}</div>`;
}

function checklist(e: EvaluatedName, l: Lab, lang: Lang) {
  return e.checks.map((c) => { const x = checkText(c, l, lang); return `<div class="chk ${c.status}"><div class="ic">${c.status === 'pass' ? '✓' : c.status === 'fail' ? '✕' : '!'}</div><div><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p></div><span class="pill ${c.status === 'pass' ? 'positive' : c.status === 'fail' ? 'bad' : 'watch'}">${esc(l[c.status])}</span></div>`; }).join('');
}

function tweakList(e: EvaluatedName, l: Lab, lang: Lang, t: PdfTheme) {
  if (e.source !== 'family') return '';
  const T = (s: string) => tr(lang, s);
  return `<div class="tw"><b class="h">${esc(l.tweaks)}</b>${e.tweaks.length ? e.tweaks.map((w) => `<span class="t"><b>${esc(w.full)}</b> · ${w.compound}/${w.single} · <b style="color:${t.good}">${w.score}</b> <span class="muted">(${esc(w.changes.map(T).join(', '))})</span></span>`).join('') : `<span class="muted">${esc(e.score >= 80 ? l.noTweaks : (lang === 'hi' ? 'आवाज़ बदले बिना कोई बेहतर स्पेलिंग नहीं मिली।' : 'No better spelling with the same sound was found.'))}</span>`}</div>`;
}

export function buildBabyReportHtml(r: BabyNameResult, t: PdfTheme, b: Branding, o: BabyReportOptions, extras: BabyReportExtras = {}): string {
  const lang = o.lang, l = L[lang], T = (s: string) => tr(lang, s);
  const contact = { ...DEFAULT_CONTACT, ...(extras.contact ?? {}) };
  const isHouseExpert = (b.expertName || '').trim().toLowerCase() === (DEFAULT_BRANDING.expertName || '').trim().toLowerCase();
  const expert = o.preparedBy || b.expertName;
  const c = r.core;
  const bh = c.bhagyank.master ? `${c.bhagyank.master}/${c.bhagyank.value}` : String(c.bhagyank.value);
  const best = r.top[0];
  const fam = o.familyName?.trim() || r.client.surname;
  const hasParents = !!(r.parents.father || r.parents.mother);
  const runners = r.top.slice(1);
  const bankList = r.suggestions;

  // Section list (numbered in order; optional ones drop out).
  const plan: { key: keyof Lab['sec']; on: boolean }[] = [
    { key: 'birth', on: true }, { key: 'blueprint', on: true }, { key: 'ranking', on: true }, { key: 'top', on: true },
    { key: 'runners', on: runners.length > 0 }, { key: 'family', on: hasParents }, { key: 'bank', on: bankList.length > 0 }, { key: 'ceremony', on: true }, { key: 'about', on: true },
  ];
  const active = plan.filter((x) => x.on).map((x) => x.key);
  const no = (k: keyof Lab['sec']) => active.indexOf(k) + 1;
  const parentsLine = [r.parents.father?.name, r.parents.mother?.name].filter(Boolean).join(' & ');
  const genderText = r.client.gender === 'boy' ? l.boy : r.client.gender === 'girl' ? l.girl : l.any;

  // ---------- Summary ----------
  const meta: [string, string][] = [
    [l.dob, `${dobText(r.client.dob)} (${T(r.client.weekday)})`], [l.gender, genderText], [l.date, fmtDate(r.asOf, lang)],
    [l.parents, parentsLine || '–'], [l.tob, r.client.timeOfBirth || '–'], [l.pob, r.client.placeOfBirth || '–'],
  ];
  const pod = (e: EvaluatedName, i: number) => `<div class="pod p${i + 1}"><div class="rk">${i + 1}</div><div class="nm">${esc(e.first)}</div>${hiName(e) ? `<div class="hi">${esc(hiName(e))}</div>` : ''}<div class="mn">${esc(meaningOf(e, lang))}</div><div class="sc" style="color:${scoreColour(e.score, t)}">${e.score}<small>/100</small></div><div class="nb">${esc(e.full)} · ${nn(mainNum(e))} · ${esc(T(e.planet))}</div><div style="margin-top:1.2mm">${vPill(e, l)}</div></div>`;
  const summary = `
  <div class="kicker">${esc(l.sub)}</div><h1 class="ttl">${esc(l.summary)}</h1>
  <div class="meta">${meta.map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v)}</div>`).join('')}</div>
  <div class="dash"><div class="center">${ringSvg(best.score, t, l.score, 160)}</div>
    <div class="verdict"><div class="kicker" style="margin-bottom:.5mm">${esc(l.recommended)} · ${esc(l.verdict[best.verdict])}</div><h2>${esc(best.full)} – ${esc(l.headline[best.verdict])}</h2>
      <div class="nums" style="grid-template-columns:repeat(4,1fr);margin:2mm 0 0">
        <div>${numberMedallion(c.moolank.value, t, 58)}<div class="k">${esc(l.moolank)}</div></div>
        <div>${numberMedallion(bh, t, 58)}<div class="k">${esc(l.bhagyank)}</div></div>
        <div>${numberMedallion(nn(best.firstNum), t, 58)}<div class="k">${esc(l.firstN)}</div></div>
        <div>${numberMedallion(nn(mainNum(best)), t, 58)}<div class="k">${esc(best.fullNum ? l.fullN : l.compound)}</div></div>
      </div></div></div>
  <div class="kicker" style="margin-top:3mm">${esc(l.topPicks)}</div>
  <div class="podium">${r.top.map(pod).join('')}</div>
  <div class="letter"><div class="sal">${esc(l.dear(fam))}</div>${esc(l.letter({ name: best.full, score: best.score, b: c.bhagyank.value, m: c.moolank.value, n: mainNum(best).single, fam: hasParents ? 'y' : null }))}<div class="sgn">${esc(expert)}</div></div>
  <div class="kicker" style="margin-top:4mm">${esc(l.inside)}</div>
  <ol class="toc">${active.map((k, i) => `<li><b>${i + 1}</b><span>${esc(l.sec[k])}</span></li>`).join('')}</ol>`;

  // ---------- Birth numbers ----------
  const cells = r.grid.cells.map((x) => ({ ...x, label: T(PLANET_BY_N[x.number] ?? '') }));
  const sBirth = `<section class="page">${secHead(no('birth'), l.sec.birth)}<p class="intro">${esc(l.secD.birth)}</p>
    <div class="three">
      <div class="stat"><div class="k">${esc(l.moolank)}</div><div class="v">${c.moolank.value}</div><div class="s">${esc(T(c.moolank.planet))}</div></div>
      <div class="stat"><div class="k">${esc(l.bhagyank)}</div><div class="v">${esc(bh)}</div><div class="s">${esc(T(c.bhagyank.planet))} · ${esc(c.bhagyank.chain.join(' → '))}</div></div>
      <div class="stat"><div class="k">${esc(l.kua)}</div><div class="v">${c.kua.value}</div><div class="s">${esc(T(c.kua.group))} ${esc(l.group)}</div></div>
    </div>
    <div class="two">
      <div class="box advice"><div class="bt">${esc(l.nature)} – ${c.moolank.value}</div><p>${esc(CHILD_NATURE[lang][c.moolank.value])}</p></div>
      <div class="box strength"><div class="bt">${esc(l.path)} – ${c.bhagyank.value}</div><p>${esc(LIFE_PATH[lang][c.bhagyank.value])}</p></div>
    </div>
    <h3 class="sub">${esc(l.grid)}</h3>
    <div class="row" style="align-items:center"><div class="center" style="flex:none">${gridSvg(cells, t, 190, { labels: true })}</div>
      <div style="flex:1"><div class="stat" style="margin-bottom:3mm"><div class="k">${esc(l.missing)}</div>${chips(r.grid.missing, 'warn', l)}</div>
      <div class="stat"><div class="k">${esc(l.repeated)}</div>${chips(r.grid.repeated.map((x) => `${x.number}×${x.count}`), 'neu', l)}</div></div></div>
    <h3 class="sub">${esc(l.friendly)}</h3>${chips(c.friendly, 'good', l)}
    <div class="two" style="margin-top:3mm"><div><h3 class="sub" style="margin-top:0">${esc(l.neutralN)}</h3>${chips(c.neutral, 'neu', l)}</div><div><h3 class="sub" style="margin-top:0">${esc(l.avoidN)}</h3>${chips(c.enemy, 'bad', l)}</div></div>
  </section>`;

  // ---------- Lucky blueprint ----------
  const lg = (k: LetterClass, title: string) => `<div class="lg ${k}"><div class="k">${esc(title)}</div><div class="ls">${r.letterGroups[k].map((x) => `<span>${x}</span>`).join('')}</div></div>`;
  const sBlue = `<section class="page">${secHead(no('blueprint'), l.sec.blueprint)}<p class="intro">${esc(l.secD.blueprint)}</p>
    <div class="two"><div class="stat"><div class="k">${esc(l.luckyNums)}</div><div class="medals" style="margin-top:1mm">${r.lucky.singles.map((n) => numberMedallion(n, t, 54)).join('') || `<span class="muted">${esc(l.none)}</span>`}</div></div>
      <div class="stat"><div class="k">${esc(l.bestTotals)}</div>${chips(r.lucky.compounds, 'good', l)}</div></div>
    <div class="lgroups">${lg('lucky', l.luckyLetters)}${lg('neutral', l.neutralLetters)}${lg('avoid', l.avoidLetters)}</div>
    ${r.prefCheck.length ? `<h3 class="sub">${esc(l.prefH)}</h3><p class="intro" style="margin-bottom:1mm">${esc(l.prefD)}</p>
      <table class="ftab"><thead><tr><th>${esc(l.letterH)}</th><th>${esc(l.value)}</th><th>${esc(l.planet)}</th><th>${esc(l.verdictH)}</th></tr></thead><tbody>
      ${r.prefCheck.map((p) => `<tr><td class="big">${esc(p.prefix.charAt(0) + p.prefix.slice(1).toLowerCase())}</td><td><b>${p.value}</b></td><td>${esc(T(p.planet))}</td><td>${clsPill(p.cls, l)}</td></tr>`).join('')}</tbody></table>` : ''}
    <div class="box advice" style="margin-top:4mm"><div class="bt">${esc(l.tips)}</div><ul class="lst" style="margin-top:1mm">${l.tipsList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </section>`;

  // ---------- Ranking ----------
  const rows = r.ranked.slice(0, 18).map((e, i) => `<tr class="rk-row${i < 3 ? ' top' : ''}"><td class="big">${i + 1}${i === 0 ? ' <span class="star">★</span>' : ''}</td>
    <td><span class="nmc">${esc(e.first)}${hiName(e) ? ` <small>${esc(hiName(e))}</small>` : ''}</span></td><td class="small">${esc(meaningOf(e, lang)) || '–'}</td>
    <td>${nn(e.firstNum)}</td><td>${e.fullNum ? `${nn(e.fullNum)} ${catPill(e.fullNum.category, l)}` : catPill(e.firstNum.category, l)}</td>
    <td>${esc(e.initial.letter)} ${clsPill(e.initial.cls, l)}</td><td><span class="scb" style="color:${scoreColour(e.score, t)}">${e.score}</span></td>
    <td class="small">${esc(e.source === 'family' ? l.fromFamily : l.fromBank)}${e.matchesLetters && r.prefLetters.length ? ` · ${esc(l.prefMark)}` : ''}</td></tr>`).join('');
  const sRank = `<section class="page">${secHead(no('ranking'), l.sec.ranking)}<p class="intro">${esc(l.secD.ranking)}</p>
    <table class="ftab flow"><thead><tr><th>${l.rank}</th><th>${esc(l.name)}</th><th>${esc(l.meaning)}</th><th>${esc(l.firstN)}</th><th>${esc(r.client.surname ? l.fullN : l.compound)}</th><th>${esc(l.initial)}</th><th>${esc(l.score)}</th><th>${esc(l.source)}</th></tr></thead><tbody>${rows}</tbody></table>
    ${r.invalid.length ? `<p class="small muted" style="margin-top:1.5mm">${esc(lang === 'hi' ? 'जाँच नहीं हुई (अंग्रेज़ी अक्षरों में लिखें)' : 'Not checked (write in English letters)')}: ${esc(r.invalid.join(', '))}</p>` : ''}
    <p class="small muted" style="margin-top:2mm">${esc(lang === 'hi' ? 'स्कोर: पूरा नाम 35% · पहला नाम 25% · पहला अक्षर 10% · सोल अर्ज 10% · लो शू ग्रिड 10% · परिवार 10% (जो जानकारी नहीं दी गई, उसका भार बाकी में बँट जाता है)।' : 'Score: full name 35% · first name 25% · first letter 10% · soul urge 10% · Lo Shu grid 10% · family 10% (weights of parts not given are shared by the rest).')}</p>
  </section>`;

  // ---------- Top name in depth ----------
  const mn = mainNum(best);
  const sTop = `<section class="page">${secHead(no('top'), l.sec.top)}<p class="intro">${esc(l.secD.top)}</p>
    <div class="numcard"><span class="tag">${esc(l.recommended)}</span>${tiles(best)}
      <div class="eqn">${esc(best.first)}: ${best.letters.map((x) => x.ch).join(' + ')} = <b>${best.firstNum.compound}</b> → <b>${best.firstNum.single}</b>${best.fullNum ? ` · ${esc(best.full)} = <b>${best.fullNum.compound}</b> → <b>${best.fullNum.single}</b>` : ''}${meaningOf(best, lang) ? ` · “${esc(meaningOf(best, lang))}”` : ''}</div></div>
    <div class="three">
      <div class="stat"><div class="k">${esc(best.fullNum ? l.fullN : l.firstN)}</div><div class="v">${nn(mn)}</div><div class="s">${catPill(mn.category, l)} ${esc(T(best.planet))}</div></div>
      <div class="stat"><div class="k">${esc(l.bhagyank)} · ${esc(l.moolank)}</div><div class="v" style="font-size:13pt">${relPill(best.relB, l)} ${relPill(best.relM, l)}</div><div class="s">${esc(l.bhagyank)} ${c.bhagyank.value} · ${esc(l.moolank)} ${c.moolank.value}</div></div>
      <div class="stat"><div class="k">${esc(l.soul)} · ${esc(l.personality)} · ${esc(l.pyth)}</div><div class="v">${best.soul} · ${best.personality} · ${best.pythagorean.single}</div><div class="s">${esc(l.initial)}: ${esc(best.initial.letter)} = ${best.initial.value} ${clsPill(best.initial.cls, l)}</div></div>
    </div>
    <div class="two"><div class="box strength"><div class="bt">${esc(l.numMeaning(mn.single))}</div><p>${esc(NAME_NUMBER_TEXT[lang][mn.single])}</p></div>
      <div class="box advice"><div class="bt">${esc(l.cmpMeaning)} – ${mn.compound}</div><p>${esc((lang === 'hi' ? mn.meaning.hi : mn.meaning.en).replace(/\s+[–—]\s+/g, ': '))}</p></div></div>
    <h3 class="sub">${esc(l.letterH)} · ${esc(l.chaldean)} · ${esc(l.pyth)}</h3>
    <table class="ftab ltab"><thead><tr><th>${esc(l.letterH)}</th>${best.letters.map((x) => `<th>${esc(x.letter)}</th>`).join('')}<th>=</th></tr></thead><tbody>
      <tr><td>${esc(l.chaldean)}</td>${best.letters.map((x) => `<td class="big">${x.ch}</td>`).join('')}<td><b>${nn(best.firstNum)}</b></td></tr>
      <tr><td>${esc(l.pyth)}</td>${best.letters.map((x) => `<td>${x.py}</td>`).join('')}<td><b>${nn(best.pythagorean)}</b></td></tr>
      <tr><td>${esc(l.vowel)}</td>${best.letters.map((x) => `<td>${x.vowel ? '●' : ''}</td>`).join('')}<td>${best.soul}</td></tr>
    </tbody></table>
    <h3 class="sub">${esc(l.checklist)}</h3><div class="chkgrid">${checklist(best, l, lang)}</div>
    ${tweakList(best, l, lang, t)}
  </section>`;

  // ---------- Runners-up ----------
  const runnerCard = (e: EvaluatedName, i: number) => {
    const m = mainNum(e);
    return `<div class="runner"><div class="hd"><div><span class="kicker">${i + 2} · ${esc(e.source === 'family' ? l.fromFamily : l.fromBank)}</span><div class="nmc">${esc(e.full)}${hiName(e) ? ` <small style="display:inline;font-size:10pt">${esc(hiName(e))}</small>` : ''}</div>${meaningOf(e, lang) ? `<div class="small muted">${esc(meaningOf(e, lang))}</div>` : ''}</div>
      <div class="center">${ringSvg(e.score, t, l.score, 70)}</div></div>
      <div class="three" style="margin:1mm 0 2mm"><div class="stat"><div class="k">${esc(l.firstN)} · ${esc(e.fullNum ? l.fullN : l.compound)}</div><div class="v" style="font-size:14pt">${nn(e.firstNum)}${e.fullNum ? ` · ${nn(e.fullNum)}` : ''}</div><div class="s">${catPill(m.category, l)} ${esc(T(e.planet))}</div></div>
        <div class="stat"><div class="k">${esc(l.bhagyank)} · ${esc(l.moolank)}</div><div class="v" style="font-size:12pt">${relPill(e.relB, l)} ${relPill(e.relM, l)}</div></div>
        <div class="stat"><div class="k">${esc(l.soul)} · ${esc(l.initial)}</div><div class="v" style="font-size:14pt">${e.soul} · ${esc(e.initial.letter)}</div><div class="s">${clsPill(e.initial.cls, l)}</div></div></div>
      <div class="mini">${e.checks.filter((ck) => ck.status !== 'pass').map((ck) => { const x = checkText(ck, l, lang); return `<div class="it"><span class="dot" style="background:${ck.status === 'fail' ? t.bad : t.warn}"></span><span><b>${esc(x.title)}:</b> ${esc(x.detail)}</span></div>`; }).join('')}</div>
      <p class="small" style="margin:1.5mm 0 0"><span class="dot" style="display:inline-block;width:2.2mm;height:2.2mm;border-radius:50%;background:${t.good};margin-right:1.5mm"></span><b>${esc(lang === 'hi' ? `अच्छा (${e.checks.filter((ck) => ck.status === 'pass').length}/${e.checks.length})` : `Good (${e.checks.filter((ck) => ck.status === 'pass').length} of ${e.checks.length})`)}:</b> ${esc(e.checks.filter((ck) => ck.status === 'pass').map((ck) => checkText(ck, l, lang).title).join(' · '))}</p>
      ${tweakList(e, l, lang, t)}</div>`;
  };
  const sRun = runners.length ? `<section class="page">${secHead(no('runners'), l.sec.runners)}<p class="intro">${esc(l.secD.runners)}</p>${runners.map(runnerCard).join('')}
    ${r.bestFamily && !r.top.includes(r.bestFamily) ? `<div class="reco"><b class="h">${esc(lang === 'hi' ? 'आपकी सूची का सबसे अच्छा नाम' : 'Best name from your own list')}</b>${esc(r.bestFamily.full)} – ${r.bestFamily.score}/100 (${esc(l.verdict[r.bestFamily.verdict])}). ${tweakList(r.bestFamily, l, lang, t)}</div>` : ''}
  </section>` : '';

  // ---------- Family harmony ----------
  const pf = r.parents.father, pm = r.parents.mother;
  const sFam = hasParents ? `<section class="page">${secHead(no('family'), l.sec.family)}<p class="intro">${esc(l.secD.family)}</p>
    <div class="two">${[[l.father, pf], [l.mother, pm]].map(([k, p]) => p && typeof p === 'object' ? `<div class="stat"><div class="k">${esc(k as string)}</div><div class="v" style="font-size:14pt">${esc(p.name)}</div><div class="s">${esc(l.nameNo)} <b>${p.compound}/${p.single}</b> · ${esc(T(PLANET_BY_N[p.single]))} ${catPill(p.category, l)}</div></div>` : `<div class="stat"><div class="k">${esc(k as string)}</div><div class="s muted">–</div></div>`).join('')}</div>
    <table class="ftab" style="margin-top:3mm"><thead><tr><th>${esc(l.name)}</th><th>${esc(l.nameNo)}</th><th>${esc(l.withFather)}</th><th>${esc(l.withMother)}</th><th>${esc(l.score)}</th></tr></thead><tbody>
    ${[...r.top, ...r.family.filter((x) => !r.top.includes(x))].slice(0, 8).map((e) => `<tr><td class="nmc">${esc(e.full)}</td><td>${nn(mainNum(e))}</td><td>${pf ? relPill(e.family.father, l) : '–'}</td><td>${pm ? relPill(e.family.mother, l) : '–'}</td><td><span class="scb" style="color:${scoreColour(e.parts.family ?? 0, t)}">${e.parts.family ?? '–'}</span></td></tr>`).join('')}
    </tbody></table>
    <div class="box advice" style="margin-top:4mm"><div class="bt">${esc(lang === 'hi' ? 'ध्यान दें' : 'Good to know')}</div><p>${esc(lang === 'hi' ? 'परिवार से तालमेल नाम स्कोर का केवल 10% है। जन्म अंकों से मेल सबसे ज़रूरी है; अगर कोई नाम माता या पिता के अंक के विरोधी है, तो उसका असर घर में सामंजस्य और आपसी समझ बढ़ाकर आसानी से संतुलित हो जाता है।' : 'Family harmony is only 10% of the name score. The match with the baby’s own birth numbers matters most; if a name is against one parent’s number, warmth and understanding at home balance it easily.')}</p></div>
  </section>` : '';

  // ---------- Bank suggestions ----------
  const sBank = bankList.length ? `<section class="page">${secHead(no('bank'), l.sec.bank)}<p class="intro">${esc(l.secD.bank)}${r.prefLetters.length ? esc(lang === 'hi' ? ` (पहले आपके अक्षर ${r.prefLetters.join(', ')} वाले नाम)।` : ` (names in your letters ${r.prefLetters.join(', ')} first).`) : '.'}</p>
    <table class="ftab flow"><thead><tr><th>${esc(l.name)}</th><th>${esc(l.meaning)}</th><th>${esc(l.firstN)}</th><th>${esc(r.client.surname ? l.fullN : l.compound)}</th><th>${esc(l.planet)}</th><th>${esc(l.score)}</th><th>${esc(l.verdictH)}</th></tr></thead><tbody>
    ${bankList.map((e) => `<tr><td><span class="nmc">${esc(e.first)} <small>${esc(hiName(e))}</small></span></td><td class="small">${esc(meaningOf(e, lang))}</td><td>${nn(e.firstNum)}</td><td>${nn(mainNum(e))}</td><td>${esc(T(e.planet))}</td><td><span class="scb" style="color:${scoreColour(e.score, t)}">${e.score}</span></td><td>${vPill(e, l)}</td></tr>`).join('')}
    </tbody></table>
    <p class="small muted" style="margin-top:2mm">${esc(lang === 'hi' ? 'अर्थ पारंपरिक हैं। किसी नाम की स्पेलिंग बदलनी हो तो मुझसे पूछें – मैं उसे भी जाँच दूँगा।' : 'Meanings are traditional. If you like a name but want a different spelling, ask me and I will check it too.')}</p>
  </section>` : '';

  // ---------- Ceremony & guidance ----------
  const sw = (cName: string) => { const h = COLOUR_HEX[cName.toLowerCase()] ?? '#ccc'; return `<span class="sw"><i style="background:${h}"></i>${esc(T(cName))}</span>`; };
  const nursery = r.grid.missing.map((n) => { const x = LOSHU_NUMBER_INFO[n]; return `${n}: ${T(x.colour)} · ${T(x.direction)} · ${T(x.crystal)}`; });
  const sCer = `<section class="page">${secHead(no('ceremony'), l.sec.ceremony)}<p class="intro">${esc(l.secD.ceremony)}</p>
    <h3 class="sub" style="margin-top:1mm">${esc(l.ceremonyH)}</h3><p class="intro" style="margin-bottom:1mm">${esc(l.ceremonyD)}</p>
    ${r.ceremony.length ? `<div class="dates">${r.ceremony.map((d) => `<div class="d"><b>${esc(fmtDate(d.iso, lang, true))}</b><span>${esc(T(d.weekday))} · ${esc(l.dayNo)} ${d.dateNumber}</span></div>`).join('')}</div>` : `<p class="muted">${esc(l.noDates)}</p>`}
    <div class="rem" style="margin-top:4mm">
      <div class="r"><h4>${esc(l.colours)}</h4><p>${r.guidance.colours.slice(0, 4).map(sw).join('')}</p></div>
      <div class="r"><h4>${esc(l.luckyDay)}</h4><p>${esc(T(r.guidance.weekday))} – ${esc(lang === 'hi' ? `मूलांक ${c.moolank.value} के ग्रह ${T(c.moolank.planet)} का दिन। टीकाकरण के बाद की पहली पूजा या शुभ शुरुआत इसी दिन करें।` : `the day of ${c.moolank.planet}, planet of Moolank ${c.moolank.value}. Good for first pujas and new beginnings for the baby.`)}</p></div>
      <div class="r"><h4>${esc(l.mantra)}</h4><p>${esc(r.guidance.mantra)} – ${esc(lang === 'hi' ? 'माता-पिता नामकरण के दिन 11 बार जप करें।' : 'parents may chant it 11 times on the naming day.')}</p></div>
      ${nursery.length ? `<div class="r"><h4>${esc(l.nursery)}</h4><p>${esc(nursery.join(' | '))}</p></div>` : ''}
    </div>
    <div class="box advice" style="margin-top:4mm"><div class="bt">${esc(l.useH)}</div><ul class="lst" style="margin-top:1mm">${l.useList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${o.expertNote ? `<div class="note"><b>${esc(l.expertNote)}:</b> ${esc(o.expertNote)}</div>` : ''}
    <div class="close"><div class="q">“${esc(l.closing)}”</div><div class="sgn">${b.signatureDataUrl ? `<img src="${esc(b.signatureDataUrl)}" style="max-height:14mm;display:block;margin:0 auto -10mm">` : ''}<div class="ln">${esc(expert)}<br><span class="muted">${esc(b.brandName)}</span></div></div></div>
  </section>`;

  // ---------- About + services CTA ----------
  const photo = b.photoDataUrl ? `<img src="${esc(b.photoDataUrl)}" alt="">` : monogram(b.expertName, t, 140);
  const bio = contact.bio?.trim() || (isHouseExpert ? l.bioDefault(b.expertName) : l.bioOther(b.expertName));
  const why = (code: string) => (code === 'SVC_BABY_NAME' ? l.whyBaby : code === 'SVC_PERSONAL_REPORT' ? l.whyReport : code === 'SVC_NAME_CORRECTION' ? l.whyName : '');
  const svcs = CTA_SERVICES.map((code) => DEFAULT_SERVICES.find((x) => x.code === code)).filter((x): x is (typeof DEFAULT_SERVICES)[number] => !!x);
  const site = (contact.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const sAbout = `<section class="page">${secHead(no('about'), l.sec.about)}
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

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}${css(t)}</style></head><body>${summary}${sBirth}${sBlue}${sRank}${sTop}${sRun}${sFam}${sBank}${sCer}${sAbout}</body></html>`;
}

/** Full-page cover – same design family as the signature and mobile report covers, with the recommended name as letter tiles. */
export function buildBabyCoverHtml(r: BabyNameResult, t: PdfTheme, b: Branding, o: BabyReportOptions, contact: ReportContact = DEFAULT_CONTACT): string {
  const lang = o.lang, l = L[lang];
  const w = brandWordmark(b.brandName || 'mynumerologist.com');
  const house = (b.expertName || '').trim().toLowerCase() === (DEFAULT_BRANDING.expertName || '').trim().toLowerCase();
  const photo = b.photoDataUrl ? `<img class="pf-img" src="${esc(b.photoDataUrl)}" alt="">` : `<div class="pf-img pf-mono">${monogram(b.expertName, t, 150, true)}</div>`;
  const site = (contact.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const bh = r.core.bhagyank.master ? `${r.core.bhagyank.master}/${r.core.bhagyank.value}` : String(r.core.bhagyank.value);
  const facts: [string, string][] = [[l.dob, dobText(r.client.dob)], ...(r.client.timeOfBirth ? [[l.tob, r.client.timeOfBirth] as [string, string]] : []), [`${l.moolank} · ${l.bhagyank}`, `${r.core.moolank.value} · ${bh}`], [l.date, fmtDate(r.asOf, lang)]];
  const best = r.top[0];
  const fam = o.familyName?.trim() || r.client.surname;
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
  .tt{position:relative;margin-top:14mm}
  .tt .k{font-size:9pt;letter-spacing:.38em;text-transform:uppercase;color:${acc};margin-bottom:3mm}
  .tt h1{color:${ink};font-family:'Playfair Display','Noto Sans Devanagari',serif;font-weight:700;margin:0;line-height:1.02}
  .tt h1 .a{display:block;font-size:52pt;letter-spacing:.02em}
  .tt h1 .b{display:block;font-size:26pt;letter-spacing:.14em;text-transform:uppercase;color:${acc};margin-top:2mm;font-weight:600}
  .pf{position:relative;margin-top:8mm}
  .pf .k{font-size:8.5pt;letter-spacing:.3em;text-transform:uppercase;opacity:.85}
  .pf .n{font-family:'Playfair Display','Noto Serif Devanagari',serif;font-size:25pt;font-weight:700;color:${ink};margin-top:1mm;line-height:1.1}
  .facts{display:flex;gap:9mm;justify-content:center;font-size:9.5pt;margin-top:3.5mm}
  .facts span{display:block;font-size:7.3pt;letter-spacing:.2em;text-transform:uppercase;color:${acc}}
  .sg{position:relative;margin-top:8mm;background:#fff;border-radius:3mm;padding:3mm 6mm 2.2mm;border:1.2px solid ${acc};box-shadow:0 2mm 6mm rgba(0,0,0,.25)}
  .sg .dg{display:flex;gap:1.4mm;align-items:center;justify-content:center}
  .sg .dg i{font-style:normal;width:9.6mm;height:12mm;border-radius:1.6mm;background:#fbf5e6;border:.7px solid #d8c08a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;font-size:16pt;color:#5a1220;line-height:1}
  .sg .dg i small{font-family:Poppins,sans-serif;font-size:6.4pt;color:#a07a2a;font-weight:600;margin-top:.6mm}
  .sg .nb{font-size:8.6pt;color:#5a1220;margin-top:1.4mm;font-weight:600}
  .sg span.l{display:block;font-size:6.8pt;letter-spacing:.24em;text-transform:uppercase;color:#7a6a55;margin-top:.8mm}
  .ex{position:absolute;left:14mm;right:14mm;bottom:20mm;display:flex;align-items:center;gap:7mm;padding:5mm 7mm;border-radius:4mm;background:rgba(0,0,0,.22);border:1px solid ${acc}88;text-align:left}
  .pf-img{width:44mm;height:44mm;border-radius:50%;object-fit:cover;border:2.2px solid ${acc};box-shadow:0 0 0 2.2mm ${acc}33,0 0 0 2.8mm ${acc}88;flex:none;background:#fff}
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
    <div class="tt"><div class="k">${esc(l.kickerCover)}</div><h1><span class="a">${esc(l.t1)}</span><span class="b">${esc(l.t2)}</span></h1></div>
    <div class="pf"><div class="k">${esc(l.preparedFor)}</div><div class="n">${esc(l.babyOf(fam))}</div>
      <div class="facts">${facts.map(([k, v]) => `<div><span>${esc(k)}</span>${esc(v)}</div>`).join('')}</div></div>
    <div class="sg"><div class="dg">${best.letters.map((x) => `<i>${esc(x.letter)}<small>${x.ch}</small></i>`).join('')}</div>
      <div class="nb">${esc(best.full)}${best.bank ? ` · ${esc(best.bank.hi)}` : ''} · ${nn(mainNum(best))}</div><span class="l">${esc(l.recommended)}</span></div>
    <div class="ex">${photo}<div><div class="lab">${esc(l.by)}</div><div class="nm">${esc(o.preparedBy || b.expertName)}</div><div class="ti">${esc(b.expertTitle ?? '')}</div>
      ${house ? `<div class="yr">${esc(l.years)}</div>` : ''}
      <div class="ct">${[contact.whatsapp ? `WhatsApp ${esc(contact.whatsapp)}` : '', site ? esc(site) : ''].filter(Boolean).join('  ·  ')}</div></div></div>
    <div class="conf">${esc(l.conf)}</div>
  </div></body></html>`;
}

const qr = (text: string) => QRCode.toString(text, { type: 'svg', margin: 0, width: 150, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });

export async function renderBabyNamePdf(r: BabyNameResult, o: BabyReportOptions & { theme?: ThemeId; branding?: Partial<Branding>; contact?: ReportContact }) {
  const branding: Branding = { ...DEFAULT_BRANDING, ...(o.branding ?? {}) } as Branding;
  const t = resolveTheme(o.theme, branding);
  const contact = { ...DEFAULT_CONTACT, ...(o.contact ?? {}) };
  const servicesUrl = `${(contact.website || 'https://www.mynumerologist.com').replace(/\/$/, '')}/services`;
  const [qrWhatsapp, qrWebsite] = await Promise.all([contact.whatsapp ? qr(waLink(contact.whatsapp)) : Promise.resolve(''), qr(/^https?:\/\//.test(servicesUrl) ? servicesUrl : `https://${servicesUrl}`)]);
  const l = L[o.lang];
  const fam = o.familyName?.trim() || r.client.surname;
  const font = "font-family:Georgia,'Times New Roman',serif;";
  const header = `<div style="${font}width:100%;font-size:7.5px;color:${t.muted};padding:0 15mm;margin-top:8mm;display:flex;justify-content:space-between;letter-spacing:.12em;text-transform:uppercase"><span style="color:${t.primary}">${esc(branding.brandName)}</span><span>${esc(l.title)} · ${esc(l.babyOf(fam))}</span></div>`;
  const footer = `<div style="${font}width:100%;font-size:7.4px;color:${t.muted};padding:0 15mm;margin-bottom:10mm;display:flex;justify-content:space-between"><span>${esc(o.preparedBy)} · ${esc(branding.contactLine ?? '')}</span><span style="font-size:9px;color:${t.primary}"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  return renderSheetPdf({
    html: buildBabyReportHtml(r, t, branding, o, { contact, qrWhatsapp, qrWebsite }), coverHtml: buildBabyCoverHtml(r, t, branding, o, contact),
    header, footer, theme: t, branding, title: `${l.babyOf(fam)} – ${l.title}`, subject: l.title, isoDate: r.asOf, language: o.lang,
  });
}
