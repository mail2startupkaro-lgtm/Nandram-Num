/**
 * Complete Business Numerology Report – deterministic engine + plain-language writer (English / Hindi).
 * Sections: CEO numerology, business name analysis, name correction, brand & logo numerology,
 * partner compatibility, business growth cycle forecast, remedies and a 90-day plan.
 * Uses the same friendship table, Chaldean values and personal-year rule as every other report.
 */
import { analyseDob, analyseMobile, analyseNameSystem, parseDate, personalYear, type DateParts } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { mutualHarmony, relationOf, type Relation } from '@/lib/numerology/data/relations';
import { compoundCategory } from '@/lib/numerology/data/tables';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { tr } from '@/lib/i18n/hi-terms';
import { businessAnalytics } from './engine';
import { YEAR_TIMING } from './catalogue';
import { matchCategory } from './match';

export type Lang = 'en' | 'hi';
const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const REL: Record<Relation, number> = { friend: 100, neutral: 60, enemy: 15 };
const CAT: Record<string, number> = { favourable: 100, mixed: 60, unfavourable: 20 };
const red = (x: number) => { while (x > 9) x = String(x).split('').reduce((a, d) => a + Number(d), 0); return x; };
const dsum = (s: string) => s.replace(/\D/g, '').split('').reduce((a, d) => a + Number(d), 0);
const iso = (d: DateParts) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
const PL_HI = ['सूर्य', 'चंद्र', 'गुरु', 'राहु', 'बुध', 'शुक्र', 'केतु', 'शनि', 'मंगल'];

/* ───────────────────────── input & analysis ───────────────────────── */

export interface CompleteBizInput {
  owner: { name: string; dob: string; gender: 'male' | 'female' | 'other' };
  /** 1–5 current or proposed business / brand names. */
  names: string[];
  /** Free text, e.g. "café", "CA practice" – matched to the business catalogue. */
  businessType?: string;
  /** Date the business opened or is planned to open (YYYY-MM-DD / DD-MM-YYYY). */
  launchDate?: string;
  partners?: { name: string; dob: string }[];
  tagline?: string; brandColours?: string; businessMobile?: string;
  /** Report date (default today, IST). */
  asOf: DateParts;
}

function scoreName(text: string, b: number, m: number, fit: number[] | null) {
  const r = analyseNameSystem(text, 'chaldean');
  const n = r.nameNumber.single, cat = compoundCategory(r.nameNumber.compound);
  const fitScore = !fit ? 70 : fit.includes(n) ? 100 : fit.some((x) => relationOf(x, n) === 'friend') ? 75 : fit.some((x) => relationOf(x, n) === 'enemy') ? 30 : 55;
  const score = Math.round(0.45 * REL[relationOf(b, n)] + 0.25 * REL[relationOf(m, n)] + 0.15 * CAT[cat] + 0.15 * fitScore);
  const first = r.letters.find((l) => /[A-Z]/.test(l.letter));
  return { text: r.name, compound: r.nameNumber.compound, single: n, category: cat as 'favourable' | 'mixed' | 'unfavourable', toBhagyank: relationOf(b, n), toMoolank: relationOf(m, n), fit: fitScore, score, firstLetter: first?.letter ?? '', firstValue: first?.value ?? 0 };
}
export type NameCheck = ReturnType<typeof scoreName>;

const SUFFIXES = ['Enterprises', 'Solutions', 'Studio', 'Group', 'Ventures', 'Traders', 'Industries', 'Associates'];
/** Small, readable spelling changes (doubled letter, added A/H) and common suffixes; best-scoring first. */
export function nameCorrections(base: string, b: number, m: number, fit: number[] | null, max = 6) {
  const start = scoreName(base, b, m, fit);
  const words = base.trim().split(/\s+/);
  const cands = new Map<string, { how: { en: string; hi: string } }>();
  words.forEach((w, wi) => {
    if (!/^[A-Za-z]+$/.test(w) || w.length < 2) return;
    for (let i = 1; i < w.length; i++) {
      const ch = w[i];
      if (/[aeiouAEIOU]/.test(ch) && w[i - 1]?.toLowerCase() !== ch.toLowerCase() && w[i + 1]?.toLowerCase() !== ch.toLowerCase()) {
        const nw = w.slice(0, i + 1) + ch.toLowerCase() + w.slice(i + 1);
        cands.set([...words.slice(0, wi), nw, ...words.slice(wi + 1)].join(' '), { how: { en: `double “${ch.toLowerCase()}” in ${w}`, hi: `${w} में “${ch.toLowerCase()}” दोहराएँ` } });
      }
      if (/[lnrstmpLNRSTMP]/.test(ch) && i < w.length - 1 && w[i - 1]?.toLowerCase() !== ch.toLowerCase() && w[i + 1]?.toLowerCase() !== ch.toLowerCase()) {
        const nw = w.slice(0, i + 1) + ch.toLowerCase() + w.slice(i + 1);
        cands.set([...words.slice(0, wi), nw, ...words.slice(wi + 1)].join(' '), { how: { en: `double “${ch.toLowerCase()}” in ${w}`, hi: `${w} में “${ch.toLowerCase()}” दोहराएँ` } });
      }
    }
    if (!/[aeh]$/i.test(w)) cands.set([...words.slice(0, wi), `${w}a`, ...words.slice(wi + 1)].join(' '), { how: { en: `add “a” at the end of ${w}`, hi: `${w} के अंत में “a” जोड़ें` } });
    if (/[aeiou]$/i.test(w) && !/h$/i.test(w)) cands.set([...words.slice(0, wi), `${w}h`, ...words.slice(wi + 1)].join(' '), { how: { en: `add “h” at the end of ${w}`, hi: `${w} के अंत में “h” जोड़ें` } });
  });
  const lower = base.toLowerCase();
  for (const s of SUFFIXES) if (!lower.includes(s.toLowerCase())) cands.set(`${base.trim()} ${s}`, { how: { en: `add “${s}”`, hi: `“${s}” जोड़ें` } });
  const out = [...cands.entries()].map(([text, c]) => ({ ...scoreName(text, b, m, fit), how: c.how }))
    .filter((x) => x.score > start.score && x.score >= 75 && x.category !== 'unfavourable')
    .sort((a, z) => z.score - a.score || (a.category === 'favourable' ? -1 : 1) - (z.category === 'favourable' ? -1 : 1) || a.text.length - z.text.length);
  const seen = new Set<string>(); const picked: typeof out = [];
  for (const x of out) { if (seen.has(x.how.en)) continue; seen.add(x.how.en); picked.push(x); if (picked.length >= max) break; }
  return { base: start, options: picked };
}

/** Business "personal year": opening day + month + calendar year (anniversary to anniversary). */
export const businessYear = (launch: DateParts, year: number) => red(dsum(String(launch.day)) + dsum(String(launch.month)) + dsum(String(year)));

export function analyseCompleteBusiness(i: CompleteBizInput) {
  const dobP = parseDate(i.owner.dob);
  const dob = analyseDob({ dob: iso(dobP), gender: i.owner.gender }, { asOf: i.asOf });
  const M = dob.moolank.value, B = dob.bhagyank.value;
  const ownerName = analyseNameSystem(i.owner.name, 'chaldean');
  const item = i.businessType?.trim() ? matchCategory(i.businessType) : null;
  const fit = item ? item.numbers : null;
  const names = i.names.map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s)).slice(0, 5).map((s) => scoreName(s, B, M, fit));
  if (!names.length) throw new Error('Enter at least one business name with English letters.');
  const best = [...names].sort((a, z) => z.score - a.score)[0];
  // Correct the client's main (first) name when it is weak, otherwise the best one if it can still improve.
  const corr = nameCorrections(names[0].score < 85 ? names[0].text : best.text, B, M, fit);
  const N = best.single;

  // Partners
  const partners = (i.partners ?? []).filter((p) => p.name.trim() && p.dob.trim()).slice(0, 6).map((p) => {
    const d = parseDate(p.dob);
    const pm = red(dsum(String(d.day))), pb = analyseDob({ dob: iso(d), gender: 'male' }, { asOf: i.asOf }).bhagyank.value;
    const harmony = Math.round(0.6 * mutualHarmony(B, pb) + 0.4 * mutualHarmony(M, pm));
    return { name: p.name.trim(), dob: iso(d), moolank: pm, bhagyank: pb, harmony, toName: relationOf(pb, N), score: Math.round(0.75 * harmony + 0.25 * REL[relationOf(pb, N)]) };
  });

  // Growth cycle
  const launch = i.launchDate?.trim() ? parseDate(i.launchDate) : null;
  const years = Array.from({ length: 9 }, (_, k) => i.asOf.year + k).map((y) => {
    const owner = personalYear(dobP, y);
    const biz = launch ? businessYear(launch, y) : null;
    const score = Math.round(biz ? 0.6 * YEAR_TIMING[biz].score + 0.4 * YEAR_TIMING[owner].score : YEAR_TIMING[owner].score);
    return { year: y, owner, biz, score };
  });

  // Lucky dates in the next 60 days: day number friendly with the name number and the owner's Bhagyank, full date not unfriendly
  const dates: string[] = [];
  const t0 = Date.UTC(i.asOf.year, i.asOf.month - 1, i.asOf.day);
  for (let k = 1; k <= 60 && dates.length < 10; k++) {
    const d = new Date(t0 + k * 86_400_000); const dp = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    const dn = red(dp.day), full = red(dsum(iso(dp)));
    if (relationOf(N, dn) === 'friend' && relationOf(B, dn) === 'friend' && relationOf(B, full) !== 'enemy' && relationOf(N, full) !== 'enemy') dates.push(iso(dp));
  }
  const mobileTotals = NUMS.filter((n) => relationOf(B, n) === 'friend' && relationOf(N, n) !== 'enemy' && n !== 4 && n !== 8);
  const mobile = i.businessMobile?.replace(/\D/g, '').length && i.businessMobile.replace(/\D/g, '').length >= 10
    ? analyseMobile(i.businessMobile, { moolank: M, bhagyank: B, missingNumbers: dob.loShu.missing }) : null;
  const tagline = i.tagline?.trim() && /[A-Za-z]/.test(i.tagline) ? scoreName(i.tagline.trim(), B, M, null) : null;
  const avoidNums = NUMS.filter((n) => relationOf(B, n) === 'enemy' || relationOf(N, n) === 'enemy');

  let sectors: { sector: string; score: number }[] = [], topBiz: { label: string; score: number }[] = [];
  try {
    const a = businessAnalytics({ fullName: i.owner.name, dob: dobP, gender: i.owner.gender, birthPlace: 'India', mode: 'business', capital: 2, risk: 'medium', interests: [], asOf: i.asOf });
    sectors = a.sectorScores.slice(0, 3).map((x) => ({ sector: x.sector, score: x.score }));
    topBiz = a.top.slice(0, 6).map((x) => ({ label: x.label, score: x.score }));
  } catch { /* optional */ }

  const partnerAvg = partners.length ? Math.round(partners.reduce((a, p) => a + p.score, 0) / partners.length) : null;
  const overall = Math.round(0.45 * best.score + 0.35 * years[0].score + 0.2 * (partnerAvg ?? 70));
  return {
    asOf: iso(i.asOf), owner: { name: i.owner.name, dob: iso(dobP), gender: i.owner.gender, moolank: M, bhagyank: B, master: dob.bhagyank.master ?? null, nameNo: ownerName.nameNumber.single, nameCompound: ownerName.nameNumber.compound,
      missing: dob.loShu.missing, kua: dob.kua.value, kuaGood: dob.kua.favourable, personalYear: personalYear(dobP, i.asOf.year) },
    item: item ? { label: item.label, group: item.group, numbers: item.numbers } : null, businessTypeText: i.businessType?.trim() || '',
    names, best, corrections: corr, partners, partnerAvg, launch: launch ? iso(launch) : null, years, dates, mobileTotals, mobile: mobile ? { number: mobile.number ?? i.businessMobile, compound: mobile.total.compound, single: mobile.total.single, score: mobile.score } : null,
    tagline, brandColours: i.brandColours?.trim() || '', avoidNums, sectors, topBiz, overall,
  };
}
export type CompleteBizData = ReturnType<typeof analyseCompleteBusiness>;

/* ───────────────────────── writer ───────────────────────── */

export type Blk =
  | { k: 'p'; t: string }
  | { k: 'list'; items: string[] }
  | { k: 'table'; head: string[]; rows: string[][] }
  | { k: 'tiles'; items: { label: string; value: string }[] }
  | { k: 'bars'; items: { label: string; value: number }[] }
  | { k: 'tip'; t: string };
export interface BizSection { id: string; title: string; blocks: Blk[] }

const LEAD: Record<Lang, Record<number, string>> = {
  en: { 1: 'a pioneer who leads from the front – fast decisions, strong vision and a need for independence', 2: 'a diplomatic leader who builds through people, partnerships and trust', 3: 'a guide and adviser – leads through knowledge, ethics and inspiring others', 4: 'a systems builder – practical, hard-working and good at structure, technology and process', 5: 'a dealmaker and communicator – quick, adaptable, at home in sales, marketing and networking', 6: 'a caring leader – customer service, quality, design and loyal teams', 7: 'a strategist and specialist – research, analysis and deep expertise', 8: 'an executive and empire-builder – finance, scale, discipline and long-term wealth', 9: 'a warrior leader – courage, energy, competition and turning crises around' },
  hi: { 1: 'आगे बढ़कर नेतृत्व करने वाले अग्रदूत – तेज़ निर्णय, स्पष्ट दृष्टि और स्वतंत्रता की आवश्यकता', 2: 'कूटनीतिक नेता – लोगों, साझेदारी और विश्वास से व्यवसाय बनाते हैं', 3: 'मार्गदर्शक और सलाहकार – ज्ञान, नैतिकता और प्रेरणा से नेतृत्व', 4: 'व्यवस्था बनाने वाले – व्यावहारिक, मेहनती, ढाँचे, तकनीक और प्रक्रिया में कुशल', 5: 'सौदे और संवाद के धनी – तेज़, लचीले, बिक्री, मार्केटिंग और संपर्कों में सहज', 6: 'देखभाल करने वाले नेता – ग्राहक सेवा, गुणवत्ता, डिज़ाइन और वफ़ादार टीम', 7: 'रणनीतिकार और विशेषज्ञ – शोध, विश्लेषण और गहरी विशेषज्ञता', 8: 'प्रबंधक और साम्राज्य-निर्माता – वित्त, विस्तार, अनुशासन और दीर्घकालिक धन', 9: 'योद्धा नेता – साहस, ऊर्जा, प्रतिस्पर्धा और संकट को अवसर में बदलना' },
};
const ROLE: Record<Lang, Record<number, string>> = {
  en: { 1: 'leadership, vision and new launches', 2: 'client relations, HR and partnerships', 3: 'strategy, training and advisory', 4: 'operations, technology and systems', 5: 'sales, marketing and expansion', 6: 'customer experience, design and quality', 7: 'research, product and analysis', 8: 'finance, legal and administration', 9: 'production, field work and growth targets' },
  hi: { 1: 'नेतृत्व, दृष्टि और नए लॉन्च', 2: 'ग्राहक संबंध, मानव संसाधन और साझेदारी', 3: 'रणनीति, प्रशिक्षण और परामर्श', 4: 'संचालन, तकनीक और व्यवस्था', 5: 'बिक्री, मार्केटिंग और विस्तार', 6: 'ग्राहक अनुभव, डिज़ाइन और गुणवत्ता', 7: 'शोध, उत्पाद और विश्लेषण', 8: 'वित्त, कानूनी और प्रशासन', 9: 'उत्पादन, फ़ील्ड कार्य और विकास लक्ष्य' },
};
const LOGO: Record<Lang, Record<number, { shape: string; font: string; mood: string }>> = {
  en: {
    1: { shape: 'circle or sun-burst, a single strong initial', font: 'bold, upright capitals', mood: 'confident, premium, authoritative' },
    2: { shape: 'soft curves, crescent or wave', font: 'rounded, light lettering', mood: 'calm, caring, trustworthy' },
    3: { shape: 'upward triangle, book or tree', font: 'classic serif', mood: 'wise, ethical, growing' },
    4: { shape: 'square, grid or geometric mark', font: 'modern geometric sans-serif', mood: 'reliable, technical, structured' },
    5: { shape: 'arrow, swoosh or interlinked forms', font: 'light, fast, italic or lower-case sans', mood: 'quick, connected, youthful' },
    6: { shape: 'symmetry, floral, heart or ornament', font: 'elegant script or refined serif', mood: 'beautiful, luxurious, warm' },
    7: { shape: 'abstract, minimal or a single line mark', font: 'thin, minimal lettering', mood: 'thoughtful, exclusive, expert' },
    8: { shape: 'solid square, pillar or shield', font: 'heavy block letters', mood: 'strong, stable, long-lasting' },
    9: { shape: 'triangle, flame or shield with energy', font: 'bold condensed lettering', mood: 'powerful, active, competitive' },
  },
  hi: {
    1: { shape: 'वृत्त या सूर्य-किरणें, एक प्रबल आद्य अक्षर', font: 'मोटे, सीधे बड़े अक्षर', mood: 'आत्मविश्वासी, प्रीमियम, प्रभावशाली' },
    2: { shape: 'कोमल वक्र, अर्धचंद्र या लहर', font: 'गोलाकार, हल्के अक्षर', mood: 'शांत, देखभाल करने वाला, भरोसेमंद' },
    3: { shape: 'ऊपर की ओर त्रिभुज, पुस्तक या वृक्ष', font: 'क्लासिक सेरिफ़', mood: 'ज्ञानी, नैतिक, बढ़ता हुआ' },
    4: { shape: 'वर्ग, ग्रिड या ज्यामितीय चिह्न', font: 'आधुनिक ज्यामितीय सैंस-सेरिफ़', mood: 'विश्वसनीय, तकनीकी, व्यवस्थित' },
    5: { shape: 'तीर, घुमावदार रेखा या जुड़ी आकृतियाँ', font: 'हल्के, तेज़, तिरछे या छोटे अक्षर', mood: 'तेज़, जुड़ा हुआ, युवा' },
    6: { shape: 'समरूपता, पुष्प, हृदय या अलंकरण', font: 'सुंदर स्क्रिप्ट या परिष्कृत सेरिफ़', mood: 'सुंदर, विलासी, आत्मीय' },
    7: { shape: 'अमूर्त, न्यूनतम या एक रेखा का चिह्न', font: 'पतले, न्यूनतम अक्षर', mood: 'विचारशील, विशिष्ट, विशेषज्ञ' },
    8: { shape: 'ठोस वर्ग, स्तंभ या ढाल', font: 'भारी ब्लॉक अक्षर', mood: 'मज़बूत, स्थिर, दीर्घकालिक' },
    9: { shape: 'त्रिभुज, ज्वाला या ऊर्जावान ढाल', font: 'मोटे संकरे अक्षर', mood: 'शक्तिशाली, सक्रिय, प्रतिस्पर्धी' },
  },
};
const PHASE: Record<Lang, Record<number, string>> = {
  en: { 1: 'Launch – start, register, take the lead', 2: 'Partnerships – collaborate, be patient', 3: 'Visibility – marketing, branding, networking', 4: 'Build – systems, processes, property', 5: 'Expansion – new markets, products, travel', 6: 'Customers – service, quality, loyalty', 7: 'Review – research, planning, avoid big launches', 8: 'Harvest – profit, investment, recover dues', 9: 'Completion – close what is not working, clear debts' },
  hi: { 1: 'शुरुआत – प्रारंभ, पंजीकरण, नेतृत्व', 2: 'साझेदारी – सहयोग, धैर्य', 3: 'पहचान – मार्केटिंग, ब्रांडिंग, संपर्क', 4: 'निर्माण – व्यवस्था, प्रक्रिया, संपत्ति', 5: 'विस्तार – नए बाज़ार, उत्पाद, यात्रा', 6: 'ग्राहक – सेवा, गुणवत्ता, विश्वास', 7: 'समीक्षा – शोध, योजना, बड़े लॉन्च से बचें', 8: 'फ़सल – लाभ, निवेश, बकाया वसूली', 9: 'समापन – जो काम न करे उसे बंद करें, ऋण चुकाएँ' },
};
const CATL: Record<Lang, Record<string, string>> = { en: { favourable: 'Favourable', mixed: 'Mixed', unfavourable: 'Unfavourable' }, hi: { favourable: 'शुभ', mixed: 'मिश्रित', unfavourable: 'अशुभ' } };
const RELL: Record<Lang, Record<Relation, string>> = { en: { friend: 'Friendly', neutral: 'Neutral', enemy: 'Challenging' }, hi: { friend: 'मित्र', neutral: 'सम', enemy: 'चुनौतीपूर्ण' } };
export function verdictFor(score: number, lang: Lang) {
  const v = score >= 80 ? ['Excellent', 'उत्तम'] : score >= 65 ? ['Good', 'अच्छा'] : score >= 50 ? ['Average – improve', 'सामान्य – सुधार करें'] : ['Weak – correction advised', 'कमज़ोर – सुधार उचित'];
  return lang === 'hi' ? v[1] : v[0];
}
const MONTHS = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'] };
export const fmtDate = (s: string, lang: Lang) => { const [y, m, d] = s.split('-').map(Number); return `${d} ${MONTHS[lang][m - 1]} ${y}`; };

export function writeCompleteBusiness(d: CompleteBizData, lang: Lang): { title: string; subtitle: string; summary: string; sections: BizSection[] } {
  const hi = lang === 'hi';
  const T = (s: string) => tr(lang, s);
  const pl = (n: number) => (hi ? PL_HI[n - 1] : planetOf(n).name);
  const o = d.owner, N = d.best.single, PN = planetOf(N), PB = planetOf(o.bhagyank);
  const bh = o.master ? `${o.master}/${o.bhagyank}` : String(o.bhagyank);
  const lo = LOGO[lang][N];
  const yNow = d.years[0];
  const bestYears = [...d.years].sort((a, z) => z.score - a.score).slice(0, 3).map((y) => y.year).sort();
  const S: BizSection[] = [];

  const summary = hi
    ? `${o.name} (मूलांक ${o.moolank}, भाग्यांक ${bh}) के व्यवसाय के लिए सबसे अनुकूल नाम “${d.best.text}” है – नामांक ${d.best.compound}/${N} (${pl(N)}), स्कोर ${d.best.score}/100 (${verdictFor(d.best.score, lang)})। समग्र व्यवसाय स्कोर ${d.overall}/100 है। ${yNow.biz ? `व्यवसाय का वर्तमान वर्ष-अंक ${yNow.biz} है – ${PHASE.hi[yNow.biz]}।` : `मालिक का व्यक्तिगत वर्ष ${o.personalYear} है – ${PHASE.hi[o.personalYear]}।`} अगले नौ वर्षों में सबसे मज़बूत वर्ष: ${bestYears.join(', ')}।`
    : `For ${o.name} (Mulank ${o.moolank}, Bhagyank ${bh}) the strongest business name is “${d.best.text}” – name number ${d.best.compound}/${N} (${pl(N)}), score ${d.best.score}/100 (${verdictFor(d.best.score, lang)}). Overall business score: ${d.overall}/100. ${yNow.biz ? `The business is in year-number ${yNow.biz} – ${PHASE.en[yNow.biz].toLowerCase()}.` : `The owner is in personal year ${o.personalYear} – ${PHASE.en[o.personalYear].toLowerCase()}.`} Strongest years in the next nine: ${bestYears.join(', ')}.`;

  /* 1 Overview */
  S.push({ id: 'overview', title: hi ? 'सारांश' : 'Summary', blocks: [
    { k: 'tiles', items: [
      { label: hi ? 'समग्र स्कोर' : 'Overall score', value: `${d.overall}/100` }, { label: hi ? 'मूलांक / भाग्यांक' : 'Mulank / Bhagyank', value: `${o.moolank} / ${bh}` },
      { label: hi ? 'सर्वश्रेष्ठ नाम-अंक' : 'Best name number', value: `${d.best.compound}/${N}` }, { label: hi ? 'नाम स्कोर' : 'Name score', value: `${d.best.score}/100` },
      { label: hi ? 'साझेदार सामंजस्य' : 'Partner harmony', value: d.partnerAvg == null ? '—' : `${d.partnerAvg}/100` }, { label: hi ? 'वर्तमान वर्ष स्कोर' : 'This year’s score', value: `${yNow.score}/100` },
    ] },
    { k: 'p', t: summary },
  ] });

  /* 2 CEO */
  const tr_ = NUMBER_TRAITS[lang];
  S.push({ id: 'ceo', title: hi ? 'सीईओ / मालिक अंक ज्योतिष रिपोर्ट' : 'CEO Numerology Report', blocks: [
    { k: 'table', head: hi ? ['अंक', 'मान', 'अर्थ'] : ['Number', 'Value', 'Meaning'], rows: [
      [hi ? 'मूलांक' : 'Mulank', String(o.moolank), `${pl(o.moolank)} – ${tr_[o.moolank].keyword}`],
      [hi ? 'भाग्यांक' : 'Bhagyank', bh, `${pl(o.bhagyank)} – ${tr_[o.bhagyank].keyword}`],
      [hi ? 'नामांक (कैल्डियन)' : 'Name number (Chaldean)', `${o.nameCompound}/${o.nameNo}`, hi ? `भाग्यांक से ${RELL.hi[relationOf(o.bhagyank, o.nameNo)]}` : `${RELL.en[relationOf(o.bhagyank, o.nameNo)]} with Bhagyank`],
      [hi ? 'व्यक्तिगत वर्ष' : 'Personal year', String(o.personalYear), PHASE[lang][o.personalYear]],
      [hi ? 'अनुपस्थित अंक' : 'Missing numbers', o.missing.join(', ') || '—', hi ? 'इन गुणों पर सचेत ध्यान दें' : 'qualities to strengthen consciously'],
      [hi ? 'कुआ अंक' : 'Kua number', String(o.kua), `${hi ? 'सफलता दिशा' : 'Success direction'}: ${T(o.kuaGood.success)}`],
    ] },
    { k: 'p', t: hi ? `नेतृत्व शैली: भाग्यांक ${o.bhagyank} आपको ${LEAD.hi[o.bhagyank]} बनाता है। निर्णय लेने का स्वभाव (मूलांक ${o.moolank}): ${tr_[o.moolank].plus}; ध्यान रखें – ${tr_[o.moolank].minus}।` : `Leadership style: Bhagyank ${o.bhagyank} makes you ${LEAD.en[o.bhagyank]}. Decision style (Mulank ${o.moolank}): ${tr_[o.moolank].plus.toLowerCase()}; watch for ${tr_[o.moolank].minus.toLowerCase()}.` },
    ...(d.sectors.length ? [{ k: 'bars' as const, items: d.sectors.map((s) => ({ label: s.sector, value: s.score })) }] : []),
    ...(d.topBiz.length ? [{ k: 'p' as const, t: hi ? `आपकी जन्म तिथि के लिए सबसे अनुकूल व्यवसाय: ${d.topBiz.map((x) => `${x.label} (${x.score})`).join(', ')}।` : `Businesses that suit your date of birth best: ${d.topBiz.map((x) => `${x.label} (${x.score})`).join(', ')}.` }] : []),
    ...(d.item ? [{ k: 'p' as const, t: hi ? `आपका व्यवसाय “${d.businessTypeText}” – श्रेणी ${d.item.label} (${d.item.group}), स्वामी अंक ${d.item.numbers.join(', ')}।` : `Your business “${d.businessTypeText}” maps to ${d.item.label} (${d.item.group}), ruled by numbers ${d.item.numbers.join(', ')}.` }] : []),
    { k: 'list', items: hi ? [
      `महत्वपूर्ण बैठकों और हस्ताक्षर के लिए शुभ दिन: ${T(PB.weekday)}`,
      `ऑफ़िस में बैठते समय मुख ${T(o.kuaGood.success)} की ओर रखें`,
      `हस्ताक्षर: ${T(PB.signatureTip)}`,
    ] : [
      `Best day for key meetings and signing: ${PB.weekday}`,
      `Sit facing ${o.kuaGood.success} in the office`,
      `Signature: ${PB.signatureTip}`,
    ] },
  ] });

  /* 3 Name analysis */
  S.push({ id: 'names', title: hi ? 'व्यवसाय नाम विश्लेषण' : 'Business Name Analysis', blocks: [
    { k: 'p', t: hi ? 'हर नाम की कैल्डियन पद्धति से गणना की गई है और मालिक के भाग्यांक (45%), मूलांक (25%), मिश्रित अंक की श्रेणी (15%) और व्यवसाय के स्वामी अंकों (15%) से तुलना की गई है।' : 'Each name is calculated with Chaldean values and scored against the owner’s Bhagyank (45%), Mulank (25%), the compound-number category (15%) and the ruling numbers of the business (15%).' },
    { k: 'table', head: hi ? ['नाम', 'अंक', 'श्रेणी', 'भाग्यांक से', 'मूलांक से', 'स्कोर', 'निर्णय'] : ['Name', 'Number', 'Compound', 'With Bhagyank', 'With Mulank', 'Score', 'Verdict'],
      rows: [...d.names].sort((a, z) => z.score - a.score).map((x) => [x.text, `${x.compound}/${x.single}`, CATL[lang][x.category], RELL[lang][x.toBhagyank], RELL[lang][x.toMoolank], String(x.score), verdictFor(x.score, lang)]) },
    { k: 'bars', items: d.names.map((x) => ({ label: x.text, value: x.score })) },
    { k: 'p', t: hi ? `सर्वश्रेष्ठ: “${d.best.text}” – ${pl(N)} का अंक ${N}। पहला अक्षर ${d.best.firstLetter} (मान ${d.best.firstValue}) ब्रांड की पहली छाप तय करता है।` : `Best: “${d.best.text}” – number ${N} of ${pl(N)}. The first letter ${d.best.firstLetter} (value ${d.best.firstValue}) sets the first impression of the brand.` },
  ] });

  /* 4 Correction */
  const c = d.corrections;
  S.push({ id: 'correction', title: hi ? 'व्यवसाय नाम सुधार' : 'Business Name Correction', blocks: c.options.length ? [
    { k: 'p', t: hi ? `“${c.base.text}” (स्कोर ${c.base.score}) के लिए छोटे, पढ़ने में आसान सुधार – ताकि नाम पहचान में वही रहे और अंक अनुकूल हो जाए:` : `Small, readable corrections for “${c.base.text}” (score ${c.base.score}) – the name stays recognisable while the number becomes supportive:` },
    { k: 'table', head: hi ? ['सुझाया गया नाम', 'बदलाव', 'अंक', 'श्रेणी', 'स्कोर'] : ['Suggested spelling', 'Change', 'Number', 'Compound', 'Score'], rows: c.options.map((x) => [x.text, x.how[lang], `${x.compound}/${x.single}`, CATL[lang][x.category], String(x.score)]) },
    { k: 'tip', t: hi ? 'नई वर्तनी साइनबोर्ड, विज़िटिंग कार्ड, वेबसाइट, सोशल मीडिया और बिल – हर जगह एक जैसी रखें। पंजीकृत नाम बदलना ज़रूरी नहीं; ब्रांड नाम का दैनिक उपयोग सबसे अधिक प्रभाव डालता है।' : 'Use the new spelling everywhere – signboard, visiting cards, website, social media and invoices. Changing the registered name is not required; the brand name used every day has the most effect.' },
  ] : [{ k: 'p', t: hi ? `“${c.base.text}” पहले से अनुकूल है (स्कोर ${c.base.score}); वर्तनी बदलने की आवश्यकता नहीं।` : `“${c.base.text}” already scores well (${c.base.score}); no spelling change is needed.` }] });

  /* 5 Brand & logo */
  const enemyColours = [...new Set(d.avoidNums.flatMap((n) => planetOf(n).colours.slice(0, 1)))].filter((x) => !PN.colours.includes(x));
  const given = d.brandColours.toLowerCase();
  const givenGood = PN.colours.filter((x) => given.includes(x.toLowerCase()));
  const givenBad = enemyColours.filter((x) => given.includes(x.toLowerCase()));
  S.push({ id: 'brand', title: hi ? 'ब्रांड और लोगो अंक ज्योतिष' : 'Brand & Logo Numerology', blocks: [
    { k: 'table', head: hi ? ['तत्व', 'सुझाव'] : ['Element', 'Recommendation'], rows: [
      [hi ? 'ब्रांड ग्रह' : 'Brand planet', `${pl(N)} (${N})`],
      [hi ? 'ब्रांड रंग' : 'Brand colours', PN.colours.map(T).join(', ')],
      [hi ? 'कम उपयोग करें' : 'Use sparingly', enemyColours.map(T).join(', ') || '—'],
      [hi ? 'लोगो आकृति' : 'Logo shape', lo.shape], [hi ? 'अक्षर शैली' : 'Lettering', lo.font], [hi ? 'ब्रांड भाव' : 'Brand mood', lo.mood],
      [hi ? 'व्यवसायिक मोबाइल के शुभ योग' : 'Lucky business mobile totals', d.mobileTotals.join(', ') || '—'],
      [hi ? 'साइनबोर्ड / प्रवेश दिशा' : 'Signboard / entrance', T(o.kuaGood.success)],
    ] },
    ...(d.brandColours ? [{ k: 'p' as const, t: hi ? `आपके वर्तमान ब्रांड रंग (“${d.brandColours}”): ${givenGood.length ? `${givenGood.map(T).join(', ')} अनुकूल हैं।` : 'इनमें ब्रांड ग्रह का मुख्य रंग नहीं है – एक शुभ रंग जोड़ें।'}${givenBad.length ? ` ${givenBad.map(T).join(', ')} कम मात्रा में रखें।` : ''}` : `Your current brand colours (“${d.brandColours}”): ${givenGood.length ? `${givenGood.join(', ')} support the brand planet.` : 'none of them is a main colour of the brand planet – add one lucky colour.'}${givenBad.length ? ` Keep ${givenBad.join(', ')} to a minimum.` : ''}` }] : []),
    ...(d.tagline ? [{ k: 'p' as const, t: hi ? `टैगलाइन “${d.tagline.text}” – अंक ${d.tagline.compound}/${d.tagline.single}, ${RELL.hi[d.tagline.toBhagyank]} (भाग्यांक से), स्कोर ${d.tagline.score}।` : `Tagline “${d.tagline.text}” – number ${d.tagline.compound}/${d.tagline.single}, ${RELL.en[d.tagline.toBhagyank].toLowerCase()} with the Bhagyank, score ${d.tagline.score}.` }] : []),
    ...(d.mobile ? [{ k: 'p' as const, t: hi ? `व्यवसायिक मोबाइल का योग ${d.mobile.compound}/${d.mobile.single}, स्कोर ${d.mobile.score}/100 – ${d.mobile.score >= 65 ? 'अनुकूल' : 'नया नंबर लेने पर विचार करें'}।` : `Business mobile total ${d.mobile.compound}/${d.mobile.single}, score ${d.mobile.score}/100 – ${d.mobile.score >= 65 ? 'supportive' : 'consider a better-matched number'}.` }] : []),
    { k: 'p', t: hi ? `लॉन्च, उद्घाटन या नए उत्पाद के लिए अगले 60 दिनों की शुभ तिथियाँ: ${d.dates.map((x) => fmtDate(x, lang)).join(', ') || '—'}।` : `Lucky dates in the next 60 days for a launch, opening or new product: ${d.dates.map((x) => fmtDate(x, lang)).join(', ') || '—'}.` },
  ] });

  /* 6 Partners */
  S.push({ id: 'partners', title: hi ? 'व्यवसाय साझेदार अनुकूलता' : 'Business Partner Compatibility', blocks: d.partners.length ? [
    { k: 'table', head: hi ? ['साझेदार', 'मूलांक', 'भाग्यांक', 'मालिक से सामंजस्य', 'व्यवसाय नाम से', 'स्कोर', 'उपयुक्त भूमिका'] : ['Partner', 'Mulank', 'Bhagyank', 'Harmony with owner', 'With business name', 'Score', 'Best role'],
      rows: d.partners.map((x) => [x.name, String(x.moolank), String(x.bhagyank), `${x.harmony}/100`, RELL[lang][x.toName], `${x.score} · ${verdictFor(x.score, lang)}`, ROLE[lang][x.bhagyank]]) },
    { k: 'bars', items: d.partners.map((x) => ({ label: x.name, value: x.score })) },
    { k: 'p', t: hi ? `साझेदारी का औसत स्कोर ${d.partnerAvg}/100। ${d.partnerAvg! >= 65 ? 'टीम में स्वाभाविक तालमेल है – भूमिकाएँ लिखित रूप से बाँटें।' : 'तालमेल के लिए स्पष्ट भूमिकाएँ, लिखित समझौता और नियमित हिसाब ज़रूरी है।'} साझेदारी विलेख ऐसी तिथि पर करें जिसका अंक ${d.mobileTotals.join(' या ') || N} हो।` : `Average partnership score ${d.partnerAvg}/100. ${d.partnerAvg! >= 65 ? 'The team has natural harmony – divide roles in writing.' : 'Clear roles, a written agreement and regular accounts are essential for harmony.'} Sign the partnership deed on a date whose number is ${d.mobileTotals.join(' or ') || N}.` },
  ] : [{ k: 'p', t: hi ? 'कोई साझेदार दर्ज नहीं किया गया। साझेदार जोड़ने पर हर साझेदार का मालिक और व्यवसाय नाम से मिलान और उपयुक्त भूमिका दिखाई जाएगी।' : 'No partners were entered. When partners are added, each is matched with the owner and the business name, with a suggested role.' }] });

  /* 7 Growth cycle */
  S.push({ id: 'growth', title: hi ? 'व्यवसाय विकास चक्र पूर्वानुमान' : 'Business Growth Cycle Forecast', blocks: [
    { k: 'p', t: d.launch
      ? (hi ? `व्यवसाय का वर्ष-अंक उसकी शुरुआत की तिथि (${fmtDate(d.launch, lang)}) से निकलता है और हर वर्षगाँठ पर बदलता है। स्कोर में व्यवसाय के वर्ष (60%) और मालिक के व्यक्तिगत वर्ष (40%) दोनों का प्रभाव है।` : `The business year-number comes from the opening date (${fmtDate(d.launch, lang)}) and changes on each anniversary. Scores combine the business year (60%) and the owner’s personal year (40%).`)
      : (hi ? 'शुरुआत की तिथि नहीं दी गई, इसलिए पूर्वानुमान मालिक के व्यक्तिगत वर्षों पर आधारित है। उद्घाटन तिथि जोड़ने से व्यवसाय का अपना चक्र भी दिखेगा।' : 'No opening date was given, so the forecast follows the owner’s personal years. Add the opening date to include the business’s own cycle.') },
    { k: 'table', head: hi ? ['वर्ष', 'व्यवसाय वर्ष', 'मालिक का वर्ष', 'चरण', 'स्कोर'] : ['Year', 'Business year', 'Owner year', 'Phase', 'Score'],
      rows: d.years.map((y) => [String(y.year), y.biz ? String(y.biz) : '—', String(y.owner), PHASE[lang][y.biz ?? y.owner], String(y.score)]) },
    { k: 'bars', items: d.years.map((y) => ({ label: String(y.year), value: y.score })) },
    { k: 'list', items: hi ? [
      `विस्तार, नई शाखा या बड़े निवेश के लिए सर्वश्रेष्ठ वर्ष: ${bestYears.join(', ')}`,
      `सावधानी के वर्ष (योजना और सुधार): ${d.years.filter((y) => y.score < 50).map((y) => y.year).join(', ') || '—'}`,
      'हमारी विधि में व्यवसाय शुरू करने के लिए मालिक के व्यक्तिगत वर्ष 1, 3 और 5 अनुकूल हैं; 8 धन और विस्तार का वर्ष है।',
    ] : [
      `Best years for expansion, a new branch or major investment: ${bestYears.join(', ')}`,
      `Years for caution (planning and correction): ${d.years.filter((y) => y.score < 50).map((y) => y.year).join(', ') || '—'}`,
      'In our method the owner’s personal years 1, 3 and 5 favour starting a business; 8 is the year of money and expansion.',
    ] },
  ] });

  /* 8 Remedies & plan */
  S.push({ id: 'remedies', title: hi ? 'उपाय और 90-दिन की कार्य-योजना' : 'Remedies and 90-Day Action Plan', blocks: [
    { k: 'list', items: hi ? [
      `व्यवसाय ग्रह ${pl(N)}: ${T(PN.weekday)} को ${T(PN.deity)} का स्मरण करें; मंत्र ${T(PN.mantra.beej)} (${PN.mantra.dailyCount} बार)।`,
      `मालिक के ग्रह ${pl(o.bhagyank)} के लिए दान: ${PB.daan.slice(0, 2).map(T).join(', ')}।`,
      `कैश काउंटर और मालिक की कुर्सी ${T(o.kuaGood.success)} दिशा का लाभ लें; प्रवेश द्वार साफ़ और रोशन रखें।`,
      `${PN.colours.slice(0, 2).map(T).join(' या ')} रंग साइनबोर्ड, वर्दी या पैकेजिंग में उपयोग करें।`,
    ] : [
      `Brand planet ${pl(N)}: remember ${PN.deity} on ${PN.weekday}s; mantra ${PN.mantra.beej} (${PN.mantra.dailyCount} times).`,
      `Daan for the owner’s planet ${pl(o.bhagyank)}: ${PB.daan.slice(0, 2).join(', ')}.`,
      `Use the ${o.kuaGood.success} direction for the cash counter and the owner’s chair; keep the entrance clean and bright.`,
      `Use ${PN.colours.slice(0, 2).join(' or ').toLowerCase()} in the signboard, uniforms or packaging.`,
    ] },
    { k: 'table', head: hi ? ['समय', 'कार्य'] : ['When', 'Action'], rows: hi ? [
      ['पहले 30 दिन', `अंतिम नाम/वर्तनी तय करें, लोगो और रंग ${pl(N)} के अनुसार बनवाएँ, व्यवसायिक मोबाइल योग ${d.mobileTotals.join('/') || N} वाला चुनें।`],
      ['31–60 दिन', `शुभ तिथि (${d.dates.slice(0, 3).map((x) => fmtDate(x, lang)).join(', ') || 'ऊपर दी गई'}) पर लॉन्च/पुनः लॉन्च, साझेदारों की भूमिकाएँ लिखित में।`],
      ['61–90 दिन', `वर्तमान चरण (${PHASE.hi[yNow.biz ?? yNow.owner]}) के अनुसार लक्ष्य, मासिक समीक्षा और उपायों की नियमितता।`],
    ] : [
      ['First 30 days', `Finalise the name/spelling, design the logo and colours for ${pl(N)}, choose a business mobile with total ${d.mobileTotals.join('/') || N}.`],
      ['Days 31–60', `Launch or relaunch on a lucky date (${d.dates.slice(0, 3).map((x) => fmtDate(x, lang)).join(', ') || 'see above'}); put partner roles in writing.`],
      ['Days 61–90', `Set targets for the current phase (${PHASE.en[yNow.biz ?? yNow.owner].toLowerCase()}), review monthly and keep the remedies regular.`],
    ] },
    { k: 'tip', t: hi ? 'अंक ज्योतिष सही नाम, समय और दिशा चुनने में मदद करता है; व्यवसाय की सफलता के लिए बाज़ार, गुणवत्ता और वित्तीय अनुशासन उतने ही ज़रूरी हैं। यह वित्तीय या कानूनी सलाह नहीं है।' : 'Numerology helps choose the right name, timing and direction; market demand, quality and financial discipline matter just as much. This is not financial or legal advice.' },
  ] });

  return {
    title: hi ? 'संपूर्ण व्यवसाय अंक ज्योतिष रिपोर्ट' : 'Complete Business Numerology Report',
    subtitle: hi ? 'नाम · ब्रांड · साझेदार · विकास चक्र · सीईओ' : 'Name · Brand · Partners · Growth cycle · CEO',
    summary, sections: S,
  };
}

/** Partner lines from a booking ("Arjun Mehta – 03-01-1990", "Kavita Rao, 1985-06-21") → name + ISO date; unreadable lines are skipped. */
export function parsePartners(text: string): { name: string; dob: string }[] {
  return text.split(/\n|;/).map((line) => {
    const m = line.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})|(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const dob = m[4] ? `${m[4]}-${m[5]}-${m[6]}` : `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const name = line.replace(m[0], '').replace(/[–—,:()|-]+/g, ' ').replace(/\b(dob|born|date of birth)\b/gi, '').replace(/\s+/g, ' ').trim();
    return /[A-Za-z]{2}/.test(name) && /^\d{4}-\d{2}-\d{2}$/.test(dob) ? { name, dob } : null;
  }).filter((x): x is { name: string; dob: string } => !!x).slice(0, 6);
}
/** Business names from a booking box: one per line or comma-separated, up to 5. */
export const splitNames = (text: string) => text.split(/\n|,|;/).map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s)).slice(0, 5);
