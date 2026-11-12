/**
 * Section 10 – Input Sheet (1–2 pages, client details for records/confirmation, Aadhaar masked)
 * and Output Sheet (one-page Numerology Snapshot: key numbers, grid, scores, top remedies).
 */
import type { NumerologyResult } from '@/lib/numerology';
import type { StoredInput } from '@/lib/numerology/schemas';
import { planetOf } from '@/lib/numerology/data/planets';
import { barsSvg, divider, esc, gaugeSvg, gridSvg, monogram, numberMedallion, planetIcon, remedyIcon, ringSvg, swatches } from './svg';
import { baseCss, labelsFor } from './template';
import { tr } from '@/lib/i18n/hi-terms';
import { DEFAULT_BRANDING, resolveTheme, type Branding, type PdfTheme, type ThemeId } from './themes';
import { renderSheetPdf } from './render';

const fmt = (d?: string) => {
  if (!d) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
};
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const SHEET_LABELS = {
  en: {
    inputTitle: 'Client Input Sheet', outputTitle: 'Numerology Snapshot', personal: 'Personal details', life: 'Life details', numbers: 'Numbers', partner: 'Partner details', confirm: 'Confirmation',
    fullName: 'Full name (as per documents)', commonName: 'Name commonly used', hindiName: 'Name in Hindi', gender: 'Gender', dob: 'Date of birth', tob: 'Time of birth', pob: 'Place of birth',
    marital: 'Marital status', profession: 'Profession / business', education: 'Education', location: 'City, State', concerns: 'Main concerns', language: 'Report language',
    mobile: 'Mobile number', aadhaar: 'Aadhaar', notProvided: 'Not provided', consent: 'Aadhaar consent recorded', none: 'Not added', name: 'Name',
    confirmText: 'I confirm that the details above are correct. I understand that numerology offers guidance only, and that my Aadhaar number (if given) was used only for calculation and is not stored.',
    clientSig: 'Client signature', expertSig: 'Expert signature', date: 'Date', privacy: 'Privacy: personal data is stored encrypted and deleted on request (DPDP Act, 2023). The full Aadhaar number is never stored or printed.',
    keyNumbers: 'Key numbers', scores: 'Scores', topRemedies: 'Top remedies', lucky: 'Lucky', yes: 'Yes', no: 'No', genderMap: { male: 'Male', female: 'Female', other: 'Other' } as Record<string, string>,
  },
  hi: {
    inputTitle: 'क्लाइंट इनपुट शीट', outputTitle: 'अंक ज्योतिष सारांश', personal: 'व्यक्तिगत विवरण', life: 'जीवन विवरण', numbers: 'नंबर', partner: 'जीवनसाथी का विवरण', confirm: 'पुष्टि',
    fullName: 'पूरा नाम (दस्तावेज़ों के अनुसार)', commonName: 'प्रचलित नाम', hindiName: 'हिंदी में नाम', gender: 'लिंग', dob: 'जन्म तिथि', tob: 'जन्म समय', pob: 'जन्म स्थान',
    marital: 'वैवाहिक स्थिति', profession: 'पेशा / व्यवसाय', education: 'शिक्षा', location: 'शहर, राज्य', concerns: 'मुख्य चिंताएँ', language: 'रिपोर्ट की भाषा',
    mobile: 'मोबाइल नंबर', aadhaar: 'आधार', notProvided: 'नहीं दिया', consent: 'आधार सहमति दर्ज', none: 'नहीं जोड़ा', name: 'नाम',
    confirmText: 'मैं पुष्टि करता/करती हूँ कि ऊपर दिए गए विवरण सही हैं। अंक ज्योतिष केवल मार्गदर्शन है, और मेरा आधार नंबर (यदि दिया) केवल गणना के लिए उपयोग हुआ और संग्रहीत नहीं है।',
    clientSig: 'क्लाइंट के हस्ताक्षर', expertSig: 'विशेषज्ञ के हस्ताक्षर', date: 'तिथि', privacy: 'गोपनीयता: व्यक्तिगत डेटा एन्क्रिप्टेड रूप में रखा जाता है और अनुरोध पर हटाया जाता है (DPDP अधिनियम, 2023)। पूरा आधार नंबर कभी संग्रहीत या मुद्रित नहीं होता।',
    keyNumbers: 'मुख्य अंक', scores: 'स्कोर', topRemedies: 'मुख्य उपाय', lucky: 'शुभ', yes: 'हाँ', no: 'नहीं', genderMap: { male: 'पुरुष', female: 'महिला', other: 'अन्य' } as Record<string, string>,
  },
};

function shell(t: PdfTheme, lang: 'en' | 'hi', b: Branding, title: string, sub: string, body: string, extraCss = '', watermark?: string) {
  const logo = b.logoDataUrl ? `<img src="${esc(b.logoDataUrl)}" style="height:13mm">` : monogram(b.brandName, t, 46);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${baseCss(t, lang)}
    @page{size:A4;margin:16mm 16mm 18mm}
    .sh{display:flex;align-items:center;gap:4mm;margin-bottom:2mm}
    .sh h1{font-size:22pt;line-height:1.1}
    .sh .sub{font-size:9pt;color:${t.muted}}
    .grp{margin:0 0 5mm;break-inside:avoid}
    .grp h3{font-size:12pt;margin:0 0 2mm;padding-bottom:1mm;border-bottom:1px solid ${t.accent}}
    .tbl td:first-child{width:62mm;color:${t.muted}}
    .tbl td{padding:1.8mm 2mm}
    .line{border-bottom:1px solid ${t.ink};height:12mm}
    ${extraCss}
  </style></head><body>
    ${watermark ? `<div class="watermark">${esc(watermark)}</div>` : ''}
    <div class="sh">${logo}<div style="flex:1"><h1>${esc(title)}</h1><div class="sub">${esc(b.brandName)} · ${esc(sub)}</div></div></div>
    <div style="margin-bottom:5mm">${divider(t, 640)}</div>
    ${body}
  </body></html>`;
}

function hf(t: PdfTheme, b: Branding, right: string, footerNote: string) {
  const font = "font-family:Georgia,'Times New Roman',serif;";
  return {
    header: `<div style="${font}width:100%;font-size:7.5px;color:${t.muted};padding:0 16mm;margin-top:8mm;display:flex;justify-content:space-between;letter-spacing:.12em;text-transform:uppercase"><span style="color:${t.primary}">${esc(b.brandName)}</span><span>${esc(right)}</span></div>`,
    footer: `<div style="${font}width:100%;font-size:7.4px;color:${t.muted};padding:0 16mm;margin-bottom:10mm;display:flex;justify-content:space-between;gap:10mm"><span style="max-width:150mm;line-height:1.35">${esc(footerNote)}</span><span style="font-size:9px;color:${t.primary}"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  };
}

// ---------- Input Sheet ----------
export interface InputSheetData {
  input: StoredInput;
  aadhaarLast4?: string | null;
  consentAt?: Date | string | null;
  profileId?: string;
  isoDate: string;
}

export function buildInputSheetHtml(d: InputSheetData, t: PdfTheme, b: Branding, lang: 'en' | 'hi') {
  const L = SHEET_LABELS[lang];
  const lab = labelsFor(lang);
  const i = d.input;
  const row = (k: string, v?: string | null) => `<tr><td>${esc(k)}</td><td><b>${esc(v || '—')}</b></td></tr>`;
  const hi = lang === 'hi';
  const CONCERN_HI: Record<string, string> = { career: 'करियर', business: 'व्यवसाय', money: 'धन', marriage: 'विवाह', love: 'प्रेम', health: 'स्वास्थ्य', children: 'संतान', education: 'शिक्षा', foreignTravel: 'विदेश यात्रा', property: 'संपत्ति', legal: 'क़ानूनी मामले' };
  const MARITAL_HI: Record<string, string> = { single: 'अविवाहित', married: 'विवाहित', engaged: 'सगाई हो चुकी', divorced: 'तलाक़शुदा', widowed: 'विधवा / विधुर' };
  const concerns = (i.concerns ?? []).map((c) => (hi ? CONCERN_HI[c] ?? c : c.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase()))).join(', ');
  const body = `
    <div class="grp"><h3>${esc(L.personal)}</h3><table class="tbl"><tbody>
      ${row(L.fullName, i.fullName)}${row(L.commonName, i.commonName)}${i.hindiName ? `<tr><td>${esc(L.hindiName)}</td><td style="font-family:'Noto Sans Devanagari'"><b>${esc(i.hindiName)}</b></td></tr>` : row(L.hindiName, null)}
      ${row(L.gender, L.genderMap[i.gender])}${row(L.dob, fmt(i.dob))}${row(L.tob, i.timeOfBirth)}${row(L.pob, i.placeOfBirth)}
    </tbody></table></div>
    <div class="grp"><h3>${esc(L.life)}</h3><table class="tbl"><tbody>
      ${row(L.marital, i.maritalStatus ? (hi ? MARITAL_HI[i.maritalStatus] ?? i.maritalStatus : titleCase(i.maritalStatus)) : null)}${row(L.profession, i.profession)}${row(L.education, i.education)}
      ${row(L.location, [i.city, i.state].filter(Boolean).join(', '))}${row(L.concerns, concerns)}${row(L.language, (hi ? { en: 'अंग्रेज़ी', hi: 'हिंदी', hinglish: 'हिंग्लिश' } : { en: 'English', hi: 'Hindi', hinglish: 'Hinglish' })[i.language ?? 'en'])}
    </tbody></table></div>
    <div class="grp"><h3>${esc(L.numbers)}</h3><table class="tbl"><tbody>
      ${row(L.mobile, i.mobile)}${row(L.aadhaar, d.aadhaarLast4 ? `XXXX-XXXX-${d.aadhaarLast4}` : L.notProvided)}
      ${d.aadhaarLast4 ? row(L.consent, d.consentAt ? fmt(new Date(d.consentAt).toISOString().slice(0, 10)) : L.yes) : ''}
    </tbody></table></div>
    <div class="grp"><h3>${esc(L.partner)}</h3><table class="tbl"><tbody>
      ${i.partner ? `${row(L.name, i.partner.name)}${row(L.gender, L.genderMap[i.partner.gender])}${row(L.dob, fmt(i.partner.dob))}${row(L.mobile, i.partner.mobile)}` : row(L.partner, L.none)}
    </tbody></table></div>
    <div class="grp"><h3>${esc(L.confirm)}</h3><p style="text-align:left">${esc(L.confirmText)}</p>
      <div class="row" style="margin-top:8mm"><div><div class="line"></div><div class="small muted">${esc(L.clientSig)}</div></div><div><div class="line"></div><div class="small muted">${esc(L.expertSig)} · ${esc(b.expertName)}</div></div><div style="flex:0 0 40mm"><div class="line"></div><div class="small muted">${esc(L.date)}</div></div></div>
    </div>
    <div class="panel small" style="margin-top:4mm">${esc(L.privacy)}</div>`;
  void lab;
  return shell(t, lang, b, L.inputTitle, `${fmt(d.isoDate)}${d.profileId ? ` · ID ${d.profileId.slice(0, 8).toUpperCase()}` : ''}`, body);
}

// ---------- Output Sheet ----------
export function buildOutputSheetHtml(r: NumerologyResult, t: PdfTheme, b: Branding, lang: 'en' | 'hi', watermark?: string) {
  const L = SHEET_LABELS[lang];
  const lab = labelsFor(lang);
  const x = r.results, d = x.dob, rm = x.remedies;
  const T = (v: string | null | undefined) => tr(lang, v);
  const rel = d.numberRelations.combined;
  const chips = (ns: number[], bg: string, fg: string) => ns.map((n) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:6.4mm;height:6.4mm;border-radius:50%;background:${bg};color:${fg};font-family:'Playfair Display',serif;font-weight:700;font-size:9pt;margin-right:1mm">${n}</span>`).join('') || '—';
  const core: [string, number][] = [[lab.moolank, d.moolank.value], [lab.bhagyank, d.bhagyank.value], [lab.kua, d.kua.value], ...(x.name ? [[lab.nameNo, x.name.chaldean.nameNumber.single] as [string, number]] : []), [lab.py, d.personalCycles.current.personalYear]];
  const scores = [
    x.name ? `<div class="center">${gaugeSvg(x.name.compatibilityScore, t, lab.compat, 108)}<div class="cap">${esc(L.name)}</div></div>` : '',
    x.mobile ? `<div class="center">${gaugeSvg(x.mobile.score, t, T(x.mobile.verdict), 108)}<div class="cap">${esc(L.mobile)} ${esc(x.mobile.masked)}</div></div>` : '',
    x.couple ? `<div class="center">${ringSvg(x.couple.overall, t, lab.overall, 88)}<div class="cap">${esc(titleCase(x.couple.partnerB.name))}</div></div>` : '',
  ].filter(Boolean);
  type Item = [Parameters<typeof remedyIcon>[0], string, string];
  const top5: Item[] = ([
    ['mantra', lab.mantra, `“${T(rm.mantra.mantra)}” · ${rm.mantra.dailyCount}× · ${T(rm.mantra.day)}`],
    ['gem', lab.gem, `${lang === 'hi' ? T(rm.gemstones[0].name) : `${rm.gemstones[0].name} (${rm.gemstones[0].hindi})`} · ${lab.rudraksha} ${T(rm.gemstones[0].rudraksha)} — ${lab.gemNote}`],
    ...rm.loShuRemedies.slice(0, 2).map((g) => ['home', `${lab.missing} ${g.number}`, `${T(g.placement)} · ${T(g.wristband)}`] as [Parameters<typeof remedyIcon>[0], string, string]),
    ['daan', `${lab.daan} · ${lab.fasting}`, `${rm.daan.map(T).join(', ')} · ${T(rm.fastingDay)}`],
    ...(x.name?.needsCorrection && x.name.corrections[0] ? [['signature', lab.corrections, `${x.name.corrections[0].fullName} (${x.name.corrections[0].compound}/${x.name.corrections[0].single})`] as [Parameters<typeof remedyIcon>[0], string, string]] : []),
  ] as Item[]).slice(0, 5);

  const body = `
    <div class="row" style="align-items:center;margin-bottom:3mm"><div><div class="serif" style="font-size:16pt">${esc(titleCase(r.client.commonName || r.client.fullName))}</div><div class="small muted">${esc(lab.dob)} ${fmt(d.dob.iso)} · ${esc(lab.reportDate)} ${fmt(r.asOf)}</div></div></div>
    <div class="core" style="grid-template-columns:repeat(${core.length},1fr);margin:0 0 3mm">${core.map(([k, n]) => `<div class="c" style="padding:2mm 1mm"><div class="k">${esc(k)}</div>${numberMedallion(n, t, 50)}<div class="p">${planetIcon(planetOf(n).id, t, 13)} ${esc(T(planetOf(n).name))}</div></div>`).join('')}</div>
    <div class="row" style="align-items:flex-start;gap:4mm;margin-bottom:3mm">
      <div class="center" style="flex:0 0 52mm">${gridSvg(d.loShu.cells, t, 132)}<div class="cap">${esc(lab.loShu)} · ${esc(lab.missing)}: ${d.loShu.missing.join(', ') || '—'}</div></div>
      <div class="center" style="flex:1">${barsSvg(d.personalCycles.timeline.slice(0, 6).map((y, i) => ({ label: String(y.year), value: y.personalYear, highlight: i === 0 })), t, 380, 128)}<div class="cap">${esc(lab.pyTimeline)}</div></div>
    </div>
    ${scores.length ? `<div class="row" style="justify-content:space-around;margin-bottom:2mm">${scores.join('')}</div>` : ''}
    <div class="row" style="gap:4mm">
      <div class="panel" style="flex:0 0 62mm;padding:3mm 4mm"><div class="serif" style="font-size:11pt;margin-bottom:1.5mm">${esc(L.lucky)}</div>
        <dl class="kv" style="grid-template-columns:20mm 1fr;font-size:8.4pt"><dt>${esc(lab.numbers)}</dt><dd><b>${rm.lucky.numbers.join(', ')}</b></dd><dt>${esc(lab.days)}</dt><dd>${esc(rm.lucky.days.map(T).join(', '))}</dd>
        <dt>${esc(lab.colours)}</dt><dd>${swatches(rm.lucky.colours.slice(0, 3), t, T)}</dd><dt>${esc(lab.directions)}</dt><dd>${esc(T(rm.lucky.directions.success))}, ${esc(T(rm.lucky.directions.health))}</dd><dt>${esc(lab.dates)}</dt><dd>${rm.lucky.dates.join(', ')}</dd>
        <dt>${esc(lab.friendly)}</dt><dd>${chips(rel.friendly, `${t.good}22`, t.good)}</dd><dt>${esc(lab.enemy)}</dt><dd>${chips(rel.enemy, `${t.bad}1a`, t.bad)}</dd></dl></div>
      <div style="flex:1"><div class="serif" style="font-size:11pt;margin-bottom:1.5mm">${esc(L.topRemedies)}</div>
        ${top5.map(([ic, k, v], i) => `<div style="display:flex;gap:2.5mm;align-items:flex-start;margin-bottom:1.8mm;font-size:8.4pt;line-height:1.4">${remedyIcon(ic, t, 16)}<div><b style="color:${t.primary}">${i + 1}. ${esc(k)}</b> — ${esc(v)}</div></div>`).join('')}
        <table style="font-size:8.4pt;margin-top:2mm"><thead><tr><th style="padding:1mm 2mm">${esc(lab.favYears)}</th><th></th></tr></thead><tbody>${Object.entries(rm.favourableYears).map(([k, ys]) => `<tr><td style="padding:1mm 2mm">${esc(lab.events[k] ?? k)}</td><td class="serif"><b>${ys.map((y) => y.year).join(', ') || '—'}</b></td></tr>`).join('')}</tbody></table>
        <p class="small muted" style="margin:1.5mm 0 0;text-align:left">${esc(lab.yearNote)}</p></div>
    </div>
    </div>`;
  return shell(t, lang, b, L.outputTitle, fmt(r.asOf), body, '.core .c>svg{margin:0 auto;display:block}', watermark);
}

// ---------- render ----------
export async function renderInputSheetPdf(d: InputSheetData, opts: { theme?: ThemeId; branding?: Partial<Branding>; language?: string } = {}) {
  const branding = { ...DEFAULT_BRANDING, ...(opts.branding ?? {}) } as Branding;
  const t = resolveTheme(opts.theme, branding);
  const lang = opts.language === 'hi' ? 'hi' : 'en';
  const L = SHEET_LABELS[lang];
  const h = hf(t, branding, `${d.input.commonName || d.input.fullName} · ${L.inputTitle}`, labelsFor(lang).disclaimer);
  return renderSheetPdf({ html: buildInputSheetHtml(d, t, branding, lang), ...h, theme: t, branding, title: `${d.input.commonName || d.input.fullName} – ${L.inputTitle}`, subject: L.inputTitle, isoDate: d.isoDate, language: lang });
}

export async function renderOutputSheetPdf(r: NumerologyResult, opts: { theme?: ThemeId; branding?: Partial<Branding>; language?: string; watermark?: string } = {}) {
  const branding = { ...DEFAULT_BRANDING, ...(opts.branding ?? {}) } as Branding;
  const t = resolveTheme(opts.theme, branding);
  const lang = opts.language === 'hi' ? 'hi' : 'en';
  const L = SHEET_LABELS[lang];
  const h = hf(t, branding, `${r.client.commonName || r.client.fullName} · ${L.outputTitle}`, labelsFor(lang).disclaimer);
  return renderSheetPdf({ html: buildOutputSheetHtml(r, t, branding, lang, opts.watermark), ...h, theme: t, branding, title: `${r.client.commonName || r.client.fullName} – ${L.outputTitle}`, subject: L.outputTitle, isoDate: r.asOf, language: lang });
}
