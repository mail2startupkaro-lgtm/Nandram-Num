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
import { babyCareer } from './career';
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
import { INDIAN_PET_NAMES, shortForms, soundKey, WORLD_PET_NAMES, type PetName } from './nicknames';
import { GROWTH, MISSING_DEV, PLANET_REMEDY } from './remedies';

/** Every curated name (all cultures) – used to show the meaning of a family-chosen name from any culture. */
const ALL_BANK_NAMES: BankName[] = Object.values(WORLD_BANKS).flat();

export type BabyGender = 'boy' | 'girl' | 'any';
/** What the family wants: a formal (documents) name, a nickname (calling name), or both. */
export type NameFor = 'formal' | 'nickname' | 'both';
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
  /** Formal name, nickname or both (default both). */
  nameFor?: NameFor;
  /** The baby's current formal first name, if already named – checked and corrected if needed. */
  currentName?: string;
  /** The nickname the family already uses, if any. */
  currentNickname?: string;
}

export type Verdict = 'excellent' | 'good' | 'average' | 'weak';
export const verdictOf = (s: number): Verdict => (s >= 80 ? 'excellent' : s >= 65 ? 'good' : s >= 50 ? 'average' : 'weak');
export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckId = 'fullB' | 'firstB' | 'moolank' | 'compound' | 'heavy' | 'initial' | 'soul' | 'grid' | 'family' | 'formalH';
export interface Check { id: CheckId; status: CheckStatus; v: Record<string, string | number> }
export type LetterClass = 'lucky' | 'neutral' | 'avoid';

export interface NameNum { compound: number; single: number; category: CompoundCategory; meaning: { en: string; hi: string } }
export interface EvaluatedName {
  first: string;
  full: string;
  source: 'family' | 'bank';
  /** current = the name the baby already has; corrected = its improved spelling. */
  tag?: 'current' | 'corrected';
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

/** A nickname checked on its own (no surname – it is spoken, not written on documents) and against the formal name. */
export interface NickEval {
  name: string;
  source: 'current' | 'short' | 'pet' | 'corrected';
  pet: PetName | null;
  num: NameNum;
  soul: number;
  planet: string;
  initial: { letter: string; value: number; rel: Relation; cls: LetterClass };
  relB: Relation;
  relM: Relation;
  /** Relation of the nickname number with the formal (full) name number. */
  relFormal: Relation;
  score: number;
  verdict: Verdict;
  checks: Check[];
  letters: { letter: string; ch: number; vowel: boolean }[];
  tweaks: { name: string; changes: string[]; score: number; compound: number; single: number }[];
}
export type Advice = 'keep' | 'spelling' | 'change';

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

  function evaluate(rawFirst: string, source: 'family' | 'bank', bank: BankName | null, withTweaks = true, tag?: 'current' | 'corrected'): EvaluatedName {
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
      first, full, source, tag, bank, firstNum, fullNum,
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
  const curFirst = input.currentName?.trim() ? normalizeName(input.currentName).split(' ')[0] ?? '' : '';
  for (const raw of [...(curFirst ? [curFirst] : []), ...(input.candidates ?? [])]) {
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

  // ---------- Current name: check and correction ----------
  const nameFor: NameFor = input.nameFor === 'formal' || input.nameFor === 'nickname' ? input.nameFor : 'both';
  const current = curFirst ? family.find((x) => x.first === titleCase(curFirst)) ?? null : null;
  let correction: null | { advice: Advice; corrected: EvaluatedName | null; sameLetter: EvaluatedName[]; recommended: EvaluatedName } = null;
  if (current) {
    current.tag = 'current';
    const tw = current.tweaks[0];
    const corrected = tw ? evaluate(tw.first, 'family', current.bank, false, 'corrected') : null;
    // Names with the same starting sound (first two letters, else the first letter) – for families open to a new name.
    const pool = names.banks.filter((x) => allow.includes(x.g) && normalizeName(x.n) !== normalizeName(current.first));
    const two = current.first.slice(0, 2).toUpperCase();
    const byTwo = pool.filter((x) => x.n.toUpperCase().startsWith(two));
    const sameLetter = (byTwo.length >= 3 ? byTwo : pool.filter((x) => x.n[0].toUpperCase() === current.first[0].toUpperCase()))
      .map((x) => evaluate(x.n, 'bank', x, false)).filter((x) => x.score >= 70 && x.score > current.score).sort((x, y) => y.score - x.score).slice(0, 4);
    const advice: Advice = current.score >= 80 ? 'keep'
      : corrected && corrected.score >= 65 && corrected.score >= current.score + 5 ? 'spelling'
        : current.score >= 65 ? 'keep' : 'change';
    const recommended = advice === 'keep' ? current : advice === 'spelling' ? corrected! : sameLetter[0] ?? ranked.find((x) => x !== current) ?? current;
    correction = { advice, corrected, sameLetter, recommended };
    // The recommended formal name leads the report.
    const i = ranked.indexOf(recommended);
    if (i >= 0) ranked.splice(i, 1);
    ranked.unshift(recommended);
  }
  const top = ranked.slice(0, 3);
  const bestFamily = family.length ? [...family].sort((x, y) => y.score - x.score)[0] : null;

  // ---------- Nickname (calling name) ----------
  const formalRef = top[0];
  const refNum = formalRef.fullNum ?? formalRef.firstNum;
  function evalNick(raw: string, source: NickEval['source'], pet: PetName | null, withTweaks = true): NickEval {
    const n = normalizeName(raw).replace(/\s+/g, '');
    const name = titleCase(n);
    const ch = analyseNameSystem(n, 'chaldean');
    const nm = num(n);
    const iv = CHALDEAN[n[0]];
    const initial = { letter: n[0], value: iv, rel: relationOf(b, iv), cls: letterClass(iv, m, b) };
    const relB = relationOf(b, nm.single), relM = relationOf(m, nm.single), relFormal = relationOf(refNum.single, nm.single);
    const soulRel = relationOf(m, ch.soulUrge.single || m);
    const fills = missing.includes(nm.single);
    // Weights: own number 45, harmony with the formal name 20, first letter 15, soul urge 10, Lo Shu grid 10.
    let score = Math.round((nameCompatibilityScore(nm.single, nm.compound, m, b) * 45 + relPts(relFormal) * 20
      + (initial.cls === 'lucky' ? 100 : initial.cls === 'neutral' ? 60 : 20) * 15 + relPts(soulRel) * 10 + (missing.length === 0 ? 80 : fills ? 100 : 55) * 10) / 100);
    if (nm.category === 'unfavourable') score = Math.min(score, 60);
    if (relB === 'enemy') score = Math.min(score, 55);
    const st = (good: boolean, bad: boolean): CheckStatus => (good ? 'pass' : bad ? 'fail' : 'warn');
    const heavy = (nm.single === 4 || nm.single === 8) && ![4, 8].includes(m) && ![4, 8].includes(b);
    const checks: Check[] = [
      { id: 'firstB', status: st(relB === 'friend', relB === 'enemy'), v: { n: nm.single, b, rel: relB } },
      { id: 'moolank', status: st(relM === 'friend', relM === 'enemy'), v: { n: nm.single, m, rel: relM } },
      { id: 'formalH', status: st(relFormal === 'friend', relFormal === 'enemy'), v: { n: nm.single, f: refNum.single, name: formalRef.full, rel: relFormal } },
      { id: 'compound', status: st(nm.category === 'favourable', nm.category === 'unfavourable'), v: { c: nm.compound, cat: nm.category } },
      { id: 'heavy', status: heavy ? 'fail' : 'pass', v: { n: nm.single } },
      { id: 'initial', status: initial.cls === 'lucky' ? 'pass' : initial.cls === 'avoid' ? 'fail' : 'warn', v: { l: initial.letter, n: iv, rel: initial.rel } },
      { id: 'soul', status: st(soulRel === 'friend', soulRel === 'enemy'), v: { n: ch.soulUrge.single, m, rel: soulRel } },
    ];
    return {
      name, source, pet, num: nm, soul: ch.soulUrge.single, planet: planetOf(nm.single).name, initial, relB, relM, relFormal,
      score, verdict: verdictOf(score), checks, letters: ch.letters.map((x) => ({ letter: x.letter, ch: x.value, vowel: x.vowel })),
      tweaks: withTweaks && score < 80
        ? readableTweaks(n, m, b, nameCompatibilityScore(nm.single, nm.compound, m, b)).map((t) => { const e = evalNick(t.spelling, 'corrected', null, false); return { name: e.name, changes: t.changes, score: e.score, compound: e.num.compound, single: e.num.single }; }).filter((t) => t.score > score).sort((x, y) => y.score - x.score)
        : [],
    };
  }
  let nickname: null | { current: NickEval | null; advice: Advice | null; corrected: NickEval | null; suggestions: NickEval[]; recommended: NickEval | null } = null;
  if (nameFor !== 'formal') {
    const curNick = input.currentNickname?.trim() && normalizeName(input.currentNickname).replace(/\s+/g, '').length >= 2 ? evalNick(input.currentNickname, 'current', null) : null;
    const used = new Set<string>([curNick?.name.toUpperCase() ?? '', formalRef.first.toUpperCase()]);
    const pets = names.style === 'indian' ? INDIAN_PET_NAMES : names.mix ? [...WORLD_PET_NAMES, ...INDIAN_PET_NAMES] : WORLD_PET_NAMES;
    const pool: NickEval[] = [];
    // Short forms only for Indian-style names (Abhinav → Abhi); other cultures use their own well-known short forms from the list.
    const shortsFrom = [formalRef.first, ...(current && current !== formalRef ? [current.first] : [])];
    if (names.style === 'indian' || names.mix) for (const f of shortsFrom) for (const s of shortForms(f)) if (!used.has(s.toUpperCase())) { used.add(s.toUpperCase()); pool.push(evalNick(s, 'short', null, false)); }
    for (const p of pets) if (allow.includes(p.g) && !used.has(p.n.toUpperCase())) { used.add(p.n.toUpperCase()); pool.push(evalNick(p.n, 'pet', p, false)); }
    const good = pool.filter((x) => x.relB !== 'enemy' && x.relFormal !== 'enemy' && x.num.category !== 'unfavourable');
    // Pet names that start like the formal name feel natural (Olivia → Ollie), so they come first among equals.
    const sameStart = (x: NickEval) => Number(x.name[0] === formalRef.first[0]);
    const sorted0 = (good.length ? good : pool).sort((x, y) => y.score - x.score || Number(y.source === 'short') - Number(x.source === 'short') || sameStart(y) - sameStart(x) || x.name.localeCompare(y.name));
    const sounds = new Set<string>();
    const sorted = sorted0.filter((x) => { const k = soundKey(x.name); if (sounds.has(k)) return false; sounds.add(k); return true; });
    // Up to 3 short forms of the formal name (they feel natural), then the best pet names – 6 in all.
    const shorts = sorted.filter((x) => x.source === 'short' && x.score >= 65).slice(0, 3);
    const alike = names.style === 'indian' ? [] : sorted.filter((x) => x.source === 'pet' && sameStart(x) && x.score >= 65).slice(0, 2);
    const lead = [...shorts, ...alike];
    const all = [...lead, ...sorted.filter((x) => !lead.includes(x))];
    const strong = all.filter((x) => x.score >= 65);
    const suggestions = (strong.length >= 3 ? strong : all).slice(0, 6).sort((x, y) => y.score - x.score);
    let advice: Advice | null = null, corrected: NickEval | null = null, recommended: NickEval | null = suggestions[0] ?? null;
    if (curNick) {
      const tw = curNick.tweaks[0];
      corrected = tw ? evalNick(tw.name, 'corrected', null, false) : null;
      // A nickname that works against the birth number or the formal name is not kept, whatever its score.
      const clash = curNick.relB === 'enemy' || curNick.relFormal === 'enemy';
      advice = !clash && curNick.score >= 75 ? 'keep'
        : corrected && corrected.score >= 65 && corrected.score >= curNick.score + 5 && corrected.relFormal !== 'enemy' && corrected.relB !== 'enemy' ? 'spelling'
          : !clash && curNick.score >= 60 ? 'keep' : 'change';
      recommended = advice === 'keep' ? curNick : advice === 'spelling' ? corrected : suggestions[0] ?? curNick;
    }
    nickname = { current: curNick, advice, corrected, suggestions, recommended };
  }

  // ---------- Remedies for the child's development ----------
  const planetNums = [...new Set([m, b])];
  const remedies = {
    growth: GROWTH[m],
    missing: missing.map((n) => ({ n, ...MISSING_DEV[n] })),
    planets: planetNums.map((n) => { const p = planetOf(n); return { n, planet: p.name, weekday: p.weekday, colours: p.colours, mantra: p.mantra.beej, ...PLANET_REMEDY[n] }; }),
  };

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
    nameFor, current, correction, nickname, remedies,
    /** Best career path for the child from Bhagyank, Moolank, the recommended name number and the Lo Shu grid. */
    career: babyCareer({ moolank: m, bhagyank: b, nameNumber: top[0] ? (top[0].fullNum ?? top[0].firstNum).single : null, gridNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => !missing.includes(x)), missing }),
    ceremony,
    guidance: { weekday: mp.weekday, colours: mp.colours, mantra: mp.mantra.beej, bColours: bp.colours },
  };
}
export type BabyNameResult = ReturnType<typeof analyseBabyName>;
