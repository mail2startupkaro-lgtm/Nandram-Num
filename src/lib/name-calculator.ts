/**
 * Admin Name Numerology Calculator – pure logic on top of the shared engine
 * (same letter charts, compound categories and scoring as every report).
 * Runs in the browser; nothing is saved.
 */
import { analyseNameSystem, bhagyank, moolank, nameCompatibilityScore, normalizeName, parseDate, suggestNameCorrections, todayIST, type NameSuggestion } from '@/lib/numerology';
import { relationOf, type Relation } from '@/lib/numerology/data/relations';
import { compoundCategory, type CompoundCategory } from '@/lib/numerology/data/tables';
import { planetOf } from '@/lib/numerology/data/planets';
import { compoundMeaning } from '@/lib/signature/numbers';
import { compoundMeaningHi } from '@/lib/signature/hindi';

export type NameSys = ReturnType<typeof analyseNameSystem>;

export interface NameCalcInput {
  fullName: string;
  /** Name in daily use / signature name; analysed as the main name when given. */
  commonName?: string;
  /** ISO yyyy-mm-dd; optional – enables Moolank/Bhagyank compatibility and corrections. */
  dob?: string;
  /** Other spellings to compare (one per entry). */
  variants?: string[];
}

export type Verdict = 'excellent' | 'good' | 'average' | 'weak';
export const VERDICT: Record<Verdict, { en: string; hi: string; tone: 'good' | 'default' | 'bad' }> = {
  excellent: { en: 'Excellent – keep this spelling', hi: 'उत्तम – यही स्पेलिंग रखें', tone: 'good' },
  good: { en: 'Good – supportive name', hi: 'अच्छा – सहयोगी नाम', tone: 'good' },
  average: { en: 'Average – a small spelling change can help', hi: 'सामान्य – स्पेलिंग में छोटा बदलाव मदद करेगा', tone: 'default' },
  weak: { en: 'Weak – name correction recommended', hi: 'कमज़ोर – नाम सुधार की सलाह', tone: 'bad' },
};
export const verdictOf = (score: number): Verdict => (score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'average' : 'weak');

export interface Compat { moolank: number; bhagyank: number; bhagyankCompound: number; bhagyankMaster: number | null; dob: string }

export interface NameCard {
  label: string;
  chaldean: NameSys;
  pythagorean: NameSys;
  meaning: { en: string; hi: string };
  planet: { en: string; hi: string };
  relB: Relation | null;
  relM: Relation | null;
  score: number | null;
  verdict: Verdict | null;
}

export interface VariantRow {
  spelling: string;
  current: boolean;
  compound: number;
  single: number;
  category: CompoundCategory;
  meaning: { en: string; hi: string };
  relB: Relation | null;
  relM: Relation | null;
  score: number | null;
  best: boolean;
}

export interface LuckyTotals { singles: number[]; compounds: number[] }

export interface NameCalcResult {
  compat: Compat | null;
  main: NameCard;
  /** Full (document) name, when a different daily-use name is the main one. */
  official: NameCard | null;
  lucky: LuckyTotals | null;
  corrections: NameSuggestion[];
  variants: VariantRow[];
  skipped: string[];
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

function card(raw: string, label: string, c: Compat | null): NameCard {
  const ch = analyseNameSystem(raw, 'chaldean');
  const py = analyseNameSystem(raw, 'pythagorean');
  const p = planetOf(ch.nameNumber.single);
  const score = c ? nameCompatibilityScore(ch.nameNumber.single, ch.nameNumber.compound, c.moolank, c.bhagyank) : null;
  return {
    label,
    chaldean: ch,
    pythagorean: py,
    meaning: { en: compoundMeaning(ch.nameNumber.compound), hi: compoundMeaningHi(ch.nameNumber.compound) },
    planet: { en: p.name, hi: p.devanagari },
    relB: c ? relationOf(c.bhagyank, ch.nameNumber.single) : null,
    relM: c ? relationOf(c.moolank, ch.nameNumber.single) : null,
    score,
    verdict: score == null ? null : verdictOf(score),
  };
}

/** Name totals that suit this person: friend of Bhagyank, not against Moolank; 4/8 only when they are the person's own number. */
export function luckyNameTotals(m: number, b: number): LuckyTotals {
  const singles = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => relationOf(b, n) === 'friend' && relationOf(m, n) !== 'enemy' && ((n !== 4 && n !== 8) || n === m || n === b));
  const compounds: number[] = [];
  for (let c = 10; c <= 52; c++) {
    let s = c; while (s > 9) s = String(s).split('').reduce((a, d) => a + +d, 0);
    if (singles.includes(s) && compoundCategory(c) === 'favourable') compounds.push(c);
  }
  return { singles, compounds };
}

export function calculateName(input: NameCalcInput): NameCalcResult {
  const fullName = input.fullName.trim();
  if (!normalizeName(fullName)) throw new Error('Write the name in English letters (A–Z) – numerology values come from the English spelling.');
  const common = input.commonName?.trim() && normalizeName(input.commonName) && normalizeName(input.commonName) !== normalizeName(fullName) ? input.commonName.trim() : '';

  let compat: Compat | null = null;
  if (input.dob) {
    let d: ReturnType<typeof parseDate>;
    try { d = parseDate(input.dob); } catch { throw new Error('Please enter a valid date of birth.'); }
    const t = todayIST();
    if (d.year * 10000 + d.month * 100 + d.day > t.year * 10000 + t.month * 100 + t.day) throw new Error('Date of birth cannot be in the future.');
    const mo = moolank(d.day); const bh = bhagyank(d);
    compat = { moolank: mo.value, bhagyank: bh.value, bhagyankCompound: bh.compound, bhagyankMaster: bh.master, dob: input.dob };
  }

  const mainRaw = common || fullName;
  const main = card(mainRaw, common ? 'Name in daily use' : 'Full name', compat);
  const official = common ? card(fullName, 'Full name (documents)', compat) : null;

  // Spelling comparison: current spelling + every valid, distinct variant.
  const skipped: string[] = [];
  const seen = new Set<string>([normalizeName(mainRaw)]);
  const list: { raw: string; current: boolean }[] = [{ raw: mainRaw, current: true }];
  for (const v of input.variants ?? []) {
    const t = v.trim(); if (!t) continue;
    const n = normalizeName(t);
    if (!n) { skipped.push(t); continue; }
    if (seen.has(n)) continue;
    seen.add(n); list.push({ raw: t, current: false });
  }
  const variants: VariantRow[] = list.slice(0, 13).map(({ raw, current }) => {
    const a = analyseNameSystem(raw, 'chaldean');
    const s = a.nameNumber.single;
    return {
      spelling: titleCase(a.name), current,
      compound: a.nameNumber.compound, single: s, category: a.nameNumber.category,
      meaning: { en: compoundMeaning(a.nameNumber.compound), hi: compoundMeaningHi(a.nameNumber.compound) },
      relB: compat ? relationOf(compat.bhagyank, s) : null,
      relM: compat ? relationOf(compat.moolank, s) : null,
      score: compat ? nameCompatibilityScore(s, a.nameNumber.compound, compat.moolank, compat.bhagyank) : null,
      best: false,
    };
  });
  const catRank: Record<CompoundCategory, number> = { favourable: 2, mixed: 1, unfavourable: 0 };
  variants.sort((x, y) => (y.score ?? catRank[y.category] * 10) - (x.score ?? catRank[x.category] * 10) || Number(y.current) - Number(x.current));
  if (variants.length > 1) {
    const top = variants[0];
    const cur = variants.find((v) => v.current)!;
    const better = (top.score ?? catRank[top.category]) > (cur.score ?? catRank[cur.category]);
    (better ? top : cur).best = true;
  }

  return {
    compat,
    main,
    official,
    lucky: compat ? luckyNameTotals(compat.moolank, compat.bhagyank) : null,
    corrections: compat ? suggestNameCorrections(mainRaw, compat.moolank, compat.bhagyank, 8) : [],
    variants,
    skipped,
  };
}

// ---------------------------------------------------------------- Copy text (WhatsApp / email)

const REL_EN: Record<Relation, string> = { friend: 'friendly', neutral: 'neutral', enemy: 'challenging' };
const REL_HI: Record<Relation, string> = { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' };
const CAT_EN: Record<CompoundCategory, string> = { favourable: 'favourable', mixed: 'mixed', unfavourable: 'unfavourable' };
const CAT_HI: Record<CompoundCategory, string> = { favourable: 'शुभ', mixed: 'मिला-जुला', unfavourable: 'कम शुभ' };
export const relText = (r: Relation, lang: 'en' | 'hi') => (lang === 'hi' ? REL_HI[r] : REL_EN[r]);
export const catText = (c: CompoundCategory, lang: 'en' | 'hi') => (lang === 'hi' ? CAT_HI[c] : CAT_EN[c]);

export function nameCalcSummary(r: NameCalcResult, lang: 'en' | 'hi', preparedBy = ''): string {
  const m = r.main; const ch = m.chaldean; const py = m.pythagorean;
  const hi = lang === 'hi';
  const L: string[] = [];
  L.push(hi ? `*नाम अंक ज्योतिष – ${titleCase(ch.name)}*` : `*Name Numerology – ${titleCase(ch.name)}*`);
  if (r.compat) L.push(hi ? `जन्म तिथि ${r.compat.dob.split('-').reverse().join('-')} · मूलांक ${r.compat.moolank} · भाग्यांक ${r.compat.bhagyank}` : `DOB ${r.compat.dob.split('-').reverse().join('-')} · Moolank ${r.compat.moolank} · Bhagyank ${r.compat.bhagyank}`);
  L.push('');
  L.push(hi
    ? `नामांक (कैल्डियन): ${ch.nameNumber.compound}/${ch.nameNumber.single} – ${m.meaning.hi} (${catText(ch.nameNumber.category, lang)}) · ग्रह ${m.planet.hi}`
    : `Name number (Chaldean): ${ch.nameNumber.compound}/${ch.nameNumber.single} – ${m.meaning.en} (${catText(ch.nameNumber.category, lang)}) · planet ${m.planet.en}`);
  L.push(hi ? `पाइथागोरियन: ${py.nameNumber.compound}/${py.nameNumber.single} · सोल अर्ज ${ch.soulUrge.single} · पर्सनैलिटी ${ch.personality.single}` : `Pythagorean: ${py.nameNumber.compound}/${py.nameNumber.single} · Soul urge ${ch.soulUrge.single} · Personality ${ch.personality.single}`);
  if (m.score != null && m.relB && m.relM && m.verdict) {
    L.push(hi
      ? `भाग्यांक से ${relText(m.relB, lang)}, मूलांक से ${relText(m.relM, lang)} · अनुकूलता ${m.score}% – ${VERDICT[m.verdict].hi}`
      : `With Bhagyank: ${relText(m.relB, lang)}, with Moolank: ${relText(m.relM, lang)} · Compatibility ${m.score}% – ${VERDICT[m.verdict].en}`);
  }
  if (r.official) L.push(hi ? `दस्तावेज़ी नाम ${titleCase(r.official.chaldean.name)}: ${r.official.chaldean.nameNumber.compound}/${r.official.chaldean.nameNumber.single}` : `Document name ${titleCase(r.official.chaldean.name)}: ${r.official.chaldean.nameNumber.compound}/${r.official.chaldean.nameNumber.single}`);
  if (r.lucky) L.push(hi ? `शुभ नामांक: ${r.lucky.singles.join(', ')} (शुभ कुल: ${r.lucky.compounds.join(', ')})` : `Lucky name numbers: ${r.lucky.singles.join(', ')} (best totals: ${r.lucky.compounds.join(', ')})`);
  if (r.corrections.length) {
    L.push(''); L.push(hi ? '*सुझाई गई स्पेलिंग*' : '*Suggested spellings*');
    for (const c of r.corrections.slice(0, 5)) L.push(`• ${c.fullName} – ${c.compound}/${c.single} · ${c.score}%`);
  }
  const others = r.variants.filter((v) => !v.current);
  if (others.length) {
    L.push(''); L.push(hi ? '*स्पेलिंग तुलना*' : '*Spelling comparison*');
    for (const v of r.variants) L.push(`• ${v.spelling}${v.current ? (hi ? ' (अभी)' : ' (current)') : ''} – ${v.compound}/${v.single} ${catText(v.category, lang)}${v.score != null ? ` · ${v.score}%` : ''}${v.best ? ' ★' : ''}`);
  }
  if (preparedBy) { L.push(''); L.push(hi ? `– ${preparedBy}` : `– ${preparedBy}`); }
  return L.join('\n');
}
