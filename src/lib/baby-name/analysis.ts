/**
 * Advanced Baby Name Analysis – pure logic on top of the shared engine (same Chaldean chart, compound categories,
 * relation table and name-compatibility scoring as every other report).
 *
 * For every candidate name (the family's own list + names from the curated bank) it checks:
 * first name and full name (with surname) against the baby's Moolank and Bhagyank, the compound number, the starting
 * letter, the soul urge, whether the name fills a number missing from the birth Lo Shu grid, and harmony with the
 * parents' name numbers. Names are ranked by one transparent 0–100 score; spelling tweaks are offered for weak ones.
 * Also: lucky name numbers and letters, and good dates for the naming ceremony.
 * Runs in the browser (admin preview) and on the server (PDF). Nothing is saved.
 */
import {
  analyseDob, analyseNameSystem, nameCompatibilityScore, normalizeName, NumerologyInputError, parseDate, reduce, suggestNameCorrections, sumDigits, todayIST, toIso,
  type DateParts, type NameSuggestion,
} from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { relationOf, RELATION_TABLE, type Relation } from '@/lib/numerology/data/relations';
import { CHALDEAN, type CompoundCategory } from '@/lib/numerology/data/tables';
import { compoundMeaning } from '@/lib/signature/numbers';
import { compoundMeaningHi } from '@/lib/signature/hindi';
import { luckyNameTotals } from '@/lib/name-calculator';
import { parseLetters, startsWithAny, type BankName, type NameGender } from './names';
import { resolveNameStyle, WORLD_BANKS, type NameStyle, type NameStyleChoice } from './world-names';

/** Every curated name (all cultures) – used to show the meaning of a family-chosen name from any culture. */
const ALL_BANK_NAMES: BankName[] = Object.values(WORLD_BANKS).flat();

export type BabyGender = 'boy' | 'girl' | 'any';
export interface BabyNameInput {
  /** YYYY-MM-DD or DD-MM-YYYY */
  dob: string;
  gender?: BabyGender | '';
  /** Family name / surname that will go on documents (optional). */
  surname?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  /** Preferred starting letters or syllables, e.g. "A, Sh, K" (from the family or the pandit's rashi letters). */
  letters?: string;
  /** First names the family is considering (up to 12). */
  candidates?: string[];
  /** Add names from the curated bank that suit the date of birth (default true). */
  suggest?: boolean;
  /** Client's country (name or ISO code). Clients outside India get names from their country's naming culture. */
  country?: string;
  /** Which names to suggest: 'auto' (from the country, default), 'mix' (country + Indian), or a fixed culture. */
  nameStyle?: NameStyleChoice;
  /** Report "as of" date (YYYY-MM-DD) – defaults to today in India. */
  asOf?: string;
}

export type Verdict = 'excellent' | 'good' | 'average' | 'weak';
export const verdictOf = (s: number): Verdict => (s >= 80 ? 'excellent' : s >= 65 ? 'good' : s >= 50 ? 'average' : 'weak');
export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckId = 'fullB' | 'firstB' | 'moolank' | 'compound' | 'heavy' | 'initial' | 'soul' | 'grid' | 'family';
export interface Check { id: CheckId; status: CheckStatus; v: Record<string, string | number> }
export type LetterClass = 'lucky' | 'neutral' | 'avoid';

export interface NameNum { compound: number; single: number; category: CompoundCategory; meaning: { en: string; hi: string } }
export interface EvaluatedName {
  first: string;
  full: string;
  source: 'family' | 'bank';
  bank: BankName | null;
  firstNum: NameNum;
  fullNum: NameNum | null;
  pythagorean: { compound: number; single: number };
  soul: number;
  personality: number;
  planet: string;
  initial: { letter: string; value: number; rel: Relation; cls: LetterClass };
  relB: Relation;
  relM: Relation;
  /** Sub-scores 0–100 (family is null when no parent names were given). */
  parts: { full: number | null; first: number; initial: number; soul: number; grid: number; family: number | null };
  fillsMissing: boolean;
  family: { father: Relation | null; mother: Relation | null };
  matchesLetters: boolean;
  score: number;
  verdict: Verdict;
  checks: Check[];
  letters: { letter: string; ch: number; py: number; vowel: boolean }[];
  /** Spelling tweaks (same sound) re-scored with the full method – only for the family's own names below 80. */
  tweaks: { first: string; full: string; changes: string[]; score: number; compound: number; single: number }[];
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayOf = (p: DateParts) => WEEKDAYS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase());
const relPts = (r: Relation | null) => (r === 'friend' ? 100 : r === 'enemy' ? 20 : 60);
const num = (raw: string): NameNum => {
  const a = analyseNameSystem(raw, 'chaldean').nameNumber;
  return { compound: a.compound, single: a.single, category: a.category, meaning: { en: compoundMeaning(a.compound), hi: compoundMeaningHi(a.compound) } };
};
function addDays(p: DateParts, n: number): DateParts {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
const dateNumber = (p: DateParts) => reduce(sumDigits(`${p.day}${p.month}${p.year}`)).value;

/** Spelling tweaks that keep the sound: one change preferred, two only when no single change helps. Max 3. */
function readableTweaks(full: string, m: number, b: number, current: number): NameSuggestion[] {
  const all = suggestNameCorrections(full, m, b, 12).filter((t) => t.score > current && !/(.)\1\1|HH/.test(t.spelling.toUpperCase()));
  const one = all.filter((t) => t.changes.length === 1);
  return (one.length ? one : all.filter((t) => t.changes.length === 2)).slice(0, 3);
}

/** How a letter's Chaldean value sits with the baby: lucky = friend of Bhagyank and not against Moolank. */
export function letterClass(value: number, m: number, b: number): LetterClass {
  const rb = relationOf(b, value), rm = relationOf(m, value);
  if (rb === 'enemy' || rm === 'enemy') return 'avoid';
  return rb === 'friend' ? 'lucky' : 'neutral';
}

export function analyseBabyName(input: BabyNameInput) {
  if (!input.dob) throw new NumerologyInputError('DOB_REQUIRED', 'Enter the baby’s date of birth.');
  const dobP = parseDate(input.dob);
  const asOf = input.asOf ? parseDate(input.asOf) : todayIST();
  const gender: BabyGender = input.gender === 'boy' || input.gender === 'girl' ? input.gender : 'any';
  const dob = analyseDob({ dob: dobP, gender: gender === 'girl' ? 'female' : 'male' }, { asOf });
  const m = dob.moolank.value, b = dob.bhagyank.value;
  const missing = dob.loShu.missing;

  const surname = input.surname?.trim() && normalizeName(input.surname) ? titleCase(normalizeName(input.surname)) : '';
  const parent = (raw?: string) => (raw?.trim() && normalizeName(raw) ? { name: titleCase(normalizeName(raw)), ...num(raw) } : null);
  const father = parent(input.fatherName), mother = parent(input.motherName);
  const prefLetters = parseLetters(input.letters);

  function evaluate(rawFirst: string, source: 'family' | 'bank', bank: BankName | null, withTweaks = true): EvaluatedName {
    const firstN = normalizeName(rawFirst).split(' ')[0];
    const first = titleCase(firstN);
    const full = surname ? `${first} ${surname}` : first;
    const ch = analyseNameSystem(first, 'chaldean');
    const py = analyseNameSystem(first, 'pythagorean');
    const firstNum = num(first);
    const fullNum = surname ? num(full) : null;
    const main = fullNum ?? firstNum;
    const iv = CHALDEAN[firstN[0]];
    const initial = { letter: firstN[0], value: iv, rel: relationOf(b, iv), cls: letterClass(iv, m, b) };
    const famF = father ? relationOf(father.single, main.single) : null;
    const famM = mother ? relationOf(mother.single, main.single) : null;
    const fillsMissing = missing.includes(main.single) || missing.includes(firstNum.single);

    const parts = {
      full: fullNum ? nameCompatibilityScore(fullNum.single, fullNum.compound, m, b) : null,
      first: nameCompatibilityScore(firstNum.single, firstNum.compound, m, b),
      initial: initial.cls === 'lucky' ? 100 : initial.cls === 'neutral' ? 60 : 20,
      soul: relPts(relationOf(m, ch.soulUrge.single || m)),
      grid: missing.length === 0 ? 80 : fillsMissing ? 100 : 55,
      family: father || mother ? Math.round([famF, famM].filter((x): x is Relation => !!x).reduce((s, r) => s + (r === 'friend' ? 100 : r === 'enemy' ? 25 : 65), 0) / [famF, famM].filter(Boolean).length) : null,
    };
    // Weights: full name 35 + first name 25 (or first name 60 without a surname), starting letter 10, soul urge 10, grid 10, family 10.
    const w: [number | null, number][] = fullNum ? [[parts.full, 35], [parts.first, 25]] : [[parts.first, 60]];
    w.push([parts.initial, 10], [parts.soul, 10], [parts.grid, 10], [parts.family, 10]);
    const used = w.filter(([v]) => v !== null) as [number, number][];
    let score = Math.round(used.reduce((s, [v, k]) => s + v * k, 0) / used.reduce((s, [, k]) => s + k, 0));
    if (main.category === 'unfavourable') score = Math.min(score, 60);
    if (relationOf(b, main.single) === 'enemy') score = Math.min(score, 55);

    const st = (good: boolean, bad: boolean): CheckStatus => (good ? 'pass' : bad ? 'fail' : 'warn');
    const heavy = (main.single === 4 || main.single === 8) && ![4, 8].includes(m) && ![4, 8].includes(b);
    const relFullB = relationOf(b, main.single), relFirstB = relationOf(b, firstNum.single), relMm = relationOf(m, main.single);
    const soulRel = relationOf(m, ch.soulUrge.single || m);
    const checks: Check[] = [
      ...(fullNum ? [{ id: 'fullB' as const, status: st(relFullB === 'friend', relFullB === 'enemy'), v: { n: fullNum.single, b, rel: relFullB } }] : []),
      { id: 'firstB', status: st(relFirstB === 'friend', relFirstB === 'enemy'), v: { n: firstNum.single, b, rel: relFirstB } },
      { id: 'moolank', status: st(relMm === 'friend', relMm === 'enemy'), v: { n: main.single, m, rel: relMm } },
      { id: 'compound', status: st(main.category === 'favourable', main.category === 'unfavourable'), v: { c: main.compound, cat: main.category } },
      { id: 'heavy', status: heavy ? 'fail' : 'pass', v: { n: main.single } },
      { id: 'initial', status: initial.cls === 'lucky' ? 'pass' : initial.cls === 'avoid' ? 'fail' : 'warn', v: { l: initial.letter, n: iv, rel: initial.rel } },
      { id: 'soul', status: st(soulRel === 'friend', soulRel === 'enemy'), v: { n: ch.soulUrge.single, m, rel: soulRel } },
      { id: 'grid', status: missing.length === 0 ? 'pass' : fillsMissing ? 'pass' : 'warn', v: { missing: missing.join(', '), n: main.single, fills: fillsMissing ? 1 : 0, none: missing.length ? 0 : 1 } },
      ...(father || mother ? [{ id: 'family' as const, status: (famF === 'enemy' || famM === 'enemy') ? 'warn' as const : 'pass' as const, v: { f: famF ?? '', mo: famM ?? '' } }] : []),
    ];
    const scoreN = score;
    return {
      first, full, source, bank, firstNum, fullNum,
      pythagorean: { compound: py.nameNumber.compound, single: py.nameNumber.single },
      soul: ch.soulUrge.single, personality: ch.personality.single, planet: planetOf(main.single).name,
      initial, relB: relFullB, relM: relMm, parts, fillsMissing, family: { father: famF, mother: famM },
      matchesLetters: startsWithAny(first, prefLetters),
      score: scoreN, verdict: verdictOf(scoreN), checks,
      letters: ch.letters.map((x, i) => ({ letter: x.letter, ch: x.value, py: py.letters[i].value, vowel: x.vowel })),
      tweaks: withTweaks && source === 'family' && scoreN < 80
        ? readableTweaks(full, m, b, fullNum ? parts.full! : parts.first).map((t) => { const e = evaluate(t.spelling, 'family', null, false); return { first: e.first, full: e.full, changes: t.changes, score: e.score, compound: (e.fullNum ?? e.firstNum).compound, single: (e.fullNum ?? e.firstNum).single }; }).filter((t) => t.score > scoreN).sort((x, y) => y.score - x.score)
        : [],
    };
  }

  // ---------- Family's own names ----------
  const invalid: string[] = [];
  const names = resolveNameStyle(input.nameStyle, input.country);
  const seen = new Set<string>();
  const family: EvaluatedName[] = [];
  for (const raw of input.candidates ?? []) {
    const t = raw.trim(); if (!t) continue;
    const n = normalizeName(t).split(' ')[0];
    if (!n || n.length < 2) { invalid.push(t); continue; }
    if (seen.has(n)) continue;
    seen.add(n); family.push(evaluate(n, 'family', [...names.banks, ...ALL_BANK_NAMES].find((x) => normalizeName(x.n) === n) ?? null));
    if (family.length >= 12) break;
  }

  // ---------- Suggestions from the bank ----------
  const allow: NameGender[] = gender === 'boy' ? ['b', 'u'] : gender === 'girl' ? ['g', 'u'] : ['b', 'g', 'u'];
  let suggestions: EvaluatedName[] = [];
  if (input.suggest !== false) {
    const pool = names.banks.filter((x) => allow.includes(x.g) && !seen.has(normalizeName(x.n)));
    const pick = (xs: BankName[]) => xs.map((x) => evaluate(x.n, 'bank', x)).sort((x, y) => y.score - x.score || x.first.localeCompare(y.first));
    const inLetters = prefLetters.length ? pick(pool.filter((x) => startsWithAny(x.n, prefLetters))) : [];
    const rest = pick(pool.filter((x) => !prefLetters.length || !startsWithAny(x.n, prefLetters)));
    // Names in the preferred letters first (if they are good), then the best of the rest.
    const goodIn = inLetters.filter((x) => x.score >= 65);
    suggestions = [...goodIn.slice(0, 10), ...rest.filter((x) => x.score >= 70).slice(0, Math.max(4, 12 - Math.min(goodIn.length, 10)))].slice(0, 12);
    if (!suggestions.length) suggestions = [...inLetters, ...rest].sort((x, y) => y.score - x.score).slice(0, 8);
  }

  // Names in the preferred letters (family names always count) that score 65+ come first, then the rest, each by score.
  const band = (x: EvaluatedName) => (x.score >= 65 && (x.source === 'family' || x.matchesLetters) ? 0 : 1);
  const ranked = [...family, ...suggestions].sort((x, y) => band(x) - band(y) || y.score - x.score || Number(y.source === 'family') - Number(x.source === 'family') || x.first.localeCompare(y.first));
  if (!ranked.length) throw new NumerologyInputError('NO_NAMES', 'Add at least one name to check, or tick “suggest names”.');
  const top = ranked.slice(0, 3);
  const bestFamily = family.length ? [...family].sort((x, y) => y.score - x.score)[0] : null;

  // ---------- Lucky blueprint ----------
  const lucky = luckyNameTotals(m, b);
  const az = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterGroups: Record<LetterClass, string[]> = { lucky: [], neutral: [], avoid: [] };
  for (const l of az) letterGroups[letterClass(CHALDEAN[l], m, b)].push(l);
  const prefCheck = prefLetters.map((p) => { const v = CHALDEAN[p[0]]; return { prefix: p, value: v, cls: letterClass(v, m, b), planet: planetOf(v).name }; });

  // ---------- Naming ceremony dates ----------
  // From the 11th day after birth (traditional Namkaran) or from the report date, whichever is later; next 60 days.
  const start = [addDays(dobP, 11), asOf].sort((x, y) => (x.year - y.year) || (x.month - y.month) || (x.day - y.day))[1];
  const ceremony: { iso: string; weekday: string; dateNumber: number }[] = [];
  for (let i = 0; i < 60 && ceremony.length < 8; i++) {
    const d = addDays(start, i); const n = dateNumber(d);
    if (relationOf(b, n) === 'friend' && relationOf(m, n) !== 'enemy' && n !== 4 && n !== 8) ceremony.push({ iso: toIso(d), weekday: weekdayOf(d), dateNumber: n });
  }

  const mp = planetOf(m), bp = planetOf(b);
  return {
    client: { dob: toIso(dobP), weekday: weekdayOf(dobP), gender, surname, timeOfBirth: input.timeOfBirth?.trim() || '', placeOfBirth: input.placeOfBirth?.trim() || '', country: input.country?.trim() || '' },
    nameStyle: { style: names.style as NameStyle, mix: names.mix },
    asOf: toIso(asOf),
    core: {
      moolank: { value: m, planet: mp.name }, bhagyank: { value: b, compound: dob.bhagyank.compound, master: dob.bhagyank.master, planet: bp.name, chain: dob.bhagyank.chain },
      kua: { value: dob.kua.value, group: dob.kua.group }, mbRelation: dob.moolankBhagyankRelation,
      friendly: RELATION_TABLE[b].friend, neutral: RELATION_TABLE[b].neutral, enemy: RELATION_TABLE[b].enemy,
    },
    grid: { cells: dob.loShu.cells, missing, repeated: dob.loShu.repeated },
    parents: { father, mother },
    prefLetters, prefCheck,
    lucky, letterGroups,
    family, suggestions, ranked, top, bestFamily, invalid,
    ceremony,
    guidance: { weekday: mp.weekday, colours: mp.colours, mantra: mp.mantra.beej, bColours: bp.colours },
  };
}
export type BabyNameResult = ReturnType<typeof analyseBabyName>;
