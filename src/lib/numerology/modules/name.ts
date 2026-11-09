/**
 * 4.2 Name numerology – Chaldean (primary) + Pythagorean (comparison), compatibility score
 * and the name-correction engine.
 */
import { clamp, reduce, round } from '../core/reduce';
import { NumerologyInputError } from '../core/reduce';
import { relationOf } from '../data/relations';
import { CHALDEAN, compoundCategory, CompoundCategory, PYTHAGOREAN, SCORING, VOWELS } from '../data/tables';

export type NameSystem = 'chaldean' | 'pythagorean';

/** Letters that Unicode does not decompose into A–Z (NFKD keeps them as single code points). */
const SPECIAL_LETTERS: Record<string, string> = {
  'Æ': 'AE', 'æ': 'ae', 'Ø': 'O', 'ø': 'o', 'Œ': 'OE', 'œ': 'oe', 'ß': 'ss', 'Đ': 'D', 'đ': 'd', 'Ð': 'D', 'ð': 'd',
  'Ł': 'L', 'ł': 'l', 'Þ': 'TH', 'þ': 'th', 'ı': 'i', 'Ħ': 'H', 'ħ': 'h',
};

export function normalizeName(raw: string): string {
  return raw
    .replace(/[ÆæØøŒœßĐđÐðŁłÞþıĦħ]/g, (c) => SPECIAL_LETTERS[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

export function analyseNameSystem(raw: string, system: NameSystem) {
  const name = normalizeName(raw);
  if (!name) throw new NumerologyInputError('NAME_EMPTY', 'Name must contain at least one Latin letter.');
  const chart = system === 'chaldean' ? CHALDEAN : PYTHAGOREAN;
  const letters = name.replace(/ /g, '').split('').map((l) => ({ letter: l, value: chart[l], vowel: VOWELS.has(l) }));
  const sum = (xs: typeof letters) => xs.reduce((a, l) => a + l.value, 0);
  const total = reduce(sum(letters));
  const soul = reduce(sum(letters.filter((l) => l.vowel)));
  const pers = reduce(sum(letters.filter((l) => !l.vowel)));
  const words = name.split(' ').map((w) => {
    const r = reduce(w.split('').reduce((a, l) => a + chart[l], 0));
    return { word: w, compound: r.total, single: r.value };
  });
  return {
    system,
    name,
    letters,
    words,
    nameNumber: { compound: total.total, single: total.value, master: total.master, category: compoundCategory(total.total) as CompoundCategory },
    soulUrge: { compound: soul.total, single: soul.value, master: soul.master },
    personality: { compound: pers.total, single: pers.value, master: pers.master },
    expression: { compound: total.total, single: total.value, master: total.master },
  };
}

/** Name ↔ Moolank/Bhagyank compatibility, 0–100. */
export function nameCompatibilityScore(single: number, compound: number, moolankValue: number, bhagyankValue: number): number {
  const s = SCORING.name;
  let score = s.base;
  score += s.bhagyank[relationOf(bhagyankValue, single)];
  score += s.moolank[relationOf(moolankValue, single)];
  score += s.compound[compoundCategory(compound)];
  if ((single === 4 || single === 8) && ![4, 8].includes(moolankValue) && ![4, 8].includes(bhagyankValue)) score -= s.heavy48Penalty;
  return round(clamp(score));
}

// ---------- Name correction engine ----------

interface Edit {
  word: string;
  changes: string[];
}

/** Spelling edits that keep pronunciation (doubling letters, long-vowel spellings, silent trailing h). */
function singleEdits(word: string): Edit[] {
  const out: Edit[] = [];
  for (let i = 1; i < word.length; i++) {
    if (word[i] === word[i - 1] || word[i] === word[i + 1]) continue; // never triple a letter
    out.push({ word: word.slice(0, i + 1) + word[i] + word.slice(i + 1), changes: [`double '${word[i]}'`] });
  }
  const subs: [string, string][] = [['I', 'EE'], ['EE', 'I'], ['U', 'OO'], ['OO', 'U']];
  for (const [from, to] of subs) {
    let idx = word.indexOf(from, 1);
    while (idx !== -1) {
      out.push({ word: word.slice(0, idx) + to + word.slice(idx + from.length), changes: [`'${from}' → '${to}'`] });
      idx = word.indexOf(from, idx + 1);
    }
  }
  if (word.endsWith('A') || word.endsWith('E')) out.push({ word: word + 'H', changes: ["add silent 'H' at end"] });
  if (word.endsWith('Y')) out.push({ word: word.slice(0, -1) + 'EE', changes: ["'Y' → 'EE' at end"] });
  if (word.endsWith('I') && !word.endsWith('EE')) out.push({ word: word.slice(0, -1) + 'EE', changes: ["'I' → 'EE' at end"] }, { word: word.slice(0, -1) + 'Y', changes: ["'I' → 'Y' at end"] });
  return out.filter((e) => e.word !== word);
}

export interface NameSuggestion {
  spelling: string;
  fullName: string;
  compound: number;
  single: number;
  category: CompoundCategory;
  score: number;
  changes: string[];
}

export function suggestNameCorrections(raw: string, moolankValue: number, bhagyankValue: number, max = 5): NameSuggestion[] {
  const name = normalizeName(raw);
  const [first, ...rest] = name.split(' ');
  const current = analyseNameSystem(name, 'chaldean');
  const currentScore = nameCompatibilityScore(current.nameNumber.single, current.nameNumber.compound, moolankValue, bhagyankValue);

  const seen = new Map<string, Edit>();
  const lvl1 = singleEdits(first);
  for (const e of lvl1) if (!seen.has(e.word)) seen.set(e.word, e);
  for (const e of lvl1) {
    for (const e2 of singleEdits(e.word)) {
      if (e2.word !== first && !seen.has(e2.word)) seen.set(e2.word, { word: e2.word, changes: [...e.changes, ...e2.changes] });
    }
  }

  const results: NameSuggestion[] = [];
  for (const e of seen.values()) {
    const full = [e.word, ...rest].join(' ');
    const a = analyseNameSystem(full, 'chaldean');
    const score = nameCompatibilityScore(a.nameNumber.single, a.nameNumber.compound, moolankValue, bhagyankValue);
    if (score <= currentScore || a.nameNumber.category === 'unfavourable') continue;
    results.push({ spelling: titleCase(e.word), fullName: titleCase(full), compound: a.nameNumber.compound, single: a.nameNumber.single, category: a.nameNumber.category, score, changes: e.changes });
  }
  results.sort((x, y) => y.score - x.score || x.changes.length - y.changes.length || x.spelling.length - y.spelling.length || x.spelling.localeCompare(y.spelling));
  // keep variety: at most 2 suggestions per resulting compound number
  const perCompound = new Map<number, number>();
  return results.filter((r) => {
    const c = perCompound.get(r.compound) ?? 0;
    if (c >= 2) return false;
    perCompound.set(r.compound, c + 1);
    return true;
  }).slice(0, max);
}

// ---------- Main entry ----------

export interface NameInput {
  fullName: string;
  commonName?: string;
}

export function analyseName(input: NameInput, moolankValue: number, bhagyankValue: number) {
  const primaryRaw = input.commonName?.trim() || input.fullName;
  const chaldean = analyseNameSystem(primaryRaw, 'chaldean');
  const pythagorean = analyseNameSystem(primaryRaw, 'pythagorean');
  const official = input.commonName?.trim() ? analyseNameSystem(input.fullName, 'chaldean') : null;
  const score = nameCompatibilityScore(chaldean.nameNumber.single, chaldean.nameNumber.compound, moolankValue, bhagyankValue);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const relB = relationOf(bhagyankValue, chaldean.nameNumber.single);
  const relM = relationOf(moolankValue, chaldean.nameNumber.single);
  (relB === 'friend' ? strengths : relB === 'enemy' ? weaknesses : []).push(`NAME_BHAGYANK_${relB.toUpperCase()}`);
  (relM === 'friend' ? strengths : relM === 'enemy' ? weaknesses : []).push(`NAME_MOOLANK_${relM.toUpperCase()}`);
  if (chaldean.nameNumber.category === 'favourable') strengths.push(`COMPOUND_${chaldean.nameNumber.compound}_FAVOURABLE`);
  if (chaldean.nameNumber.category === 'unfavourable') weaknesses.push(`COMPOUND_${chaldean.nameNumber.compound}_UNFAVOURABLE`);

  return {
    module: 'name' as const,
    analysedName: chaldean.name,
    chaldean,
    pythagorean,
    officialName: official ? { name: official.name, nameNumber: official.nameNumber } : null,
    relationWithBhagyank: relB,
    relationWithMoolank: relM,
    compatibilityScore: score,
    needsCorrection: score < 65,
    corrections: suggestNameCorrections(primaryRaw, moolankValue, bhagyankValue),
    strengths,
    weaknesses,
  };
}
export type NameResult = ReturnType<typeof analyseName>;
