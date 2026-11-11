/**
 * Vehicle-number and house-number numerology (deterministic).
 *
 * Method (stated on the calculator pages so the reader can check it by hand):
 *  - Vehicle: the registration number = the LAST group of digits on the plate (MP09 AB 1234 → 1234). Its digits are
 *    added and reduced. The whole plate (letters by Chaldean values + every digit) is shown as a secondary total.
 *  - House / flat: every digit plus any letter (Chaldean value) in the number, added and reduced (12A → 1+2+1 = 4).
 *  - The total is compared with the person's Mulank and Bhagyank using the house friendship table, and the compound
 *    number is classed with the same favourable / mixed / unfavourable list used for names and mobiles.
 */
import { NumerologyInputError, reduce } from '../core/reduce';
import { CHALDEAN, compoundCategory } from '../data/tables';
import { relationOf, type Relation } from '../data/relations';
import { mobileIdealTotals, verdictFor } from './mobile';

export type IdentifierKind = 'vehicle' | 'house';
export interface IdentifierContext { moolank: number; bhagyank: number }

export const IDENTIFIER_SCORING = { base: 50, bhagyank: { friend: 22, neutral: 4, enemy: -18 }, moolank: { friend: 16, neutral: 3, enemy: -14 }, compound: { favourable: 8, mixed: 0, unfavourable: -10 }, heavy48: -8 } as const;

const total = (nums: number[]) => { const sum = nums.reduce((a, b) => a + b, 0); const r = reduce(sum); return { compound: sum, single: r.value }; };

export function analyseIdentifier(raw: string, ctx: IdentifierContext, kind: IdentifierKind) {
  const clean = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length > 20) throw new NumerologyInputError('NUMBER_TOO_LONG', 'This number is too long.');
  const digitGroups = clean.match(/\d+/g) ?? [];
  if (digitGroups.length === 0) throw new NumerologyInputError('NUMBER_REQUIRED', 'Enter a number that contains at least one digit.');
  const letters = clean.replace(/\d/g, '').split('').filter(Boolean);
  const allDigits = clean.replace(/\D/g, '').split('').map(Number);
  const letterValues = letters.map((l) => CHALDEAN[l] ?? 0);

  const registration = digitGroups[digitGroups.length - 1];
  const primaryDigits = kind === 'vehicle' ? registration.split('').map(Number) : allDigits;
  const primary = kind === 'vehicle' ? total(primaryDigits) : total([...allDigits, ...letterValues]);
  if (primary.compound === 0) throw new NumerologyInputError('NUMBER_ZERO', 'A number made only of zeros has no vibration to read.');
  const full = total([...allDigits, ...letterValues]);

  const relB: Relation = relationOf(ctx.bhagyank, primary.single);
  const relM: Relation = relationOf(ctx.moolank, primary.single);
  const category = compoundCategory(primary.compound);
  const s = IDENTIFIER_SCORING;
  const heavy = (primary.single === 4 || primary.single === 8) && ![4, 8].includes(ctx.moolank) && ![4, 8].includes(ctx.bhagyank);
  const breakdown = { base: s.base, bhagyankRelation: s.bhagyank[relB], moolankRelation: s.moolank[relM], compound: s.compound[category], heavy48: heavy ? s.heavy48 : 0 };
  const score = Math.max(0, Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0)));

  return {
    kind, normalized: clean, registration: kind === 'vehicle' ? registration : null,
    digits: primaryDigits, letters: letters.map((l, i) => ({ letter: l, value: letterValues[i] })),
    total: { ...primary, category }, fullTotal: full,
    relationWithMoolank: relM, relationWithBhagyank: relB,
    score, verdict: verdictFor(score), scoreBreakdown: breakdown,
    suggestion: { idealTotals: mobileIdealTotals(ctx.moolank, ctx.bhagyank).idealTotals },
  };
}
export type IdentifierResult = ReturnType<typeof analyseIdentifier>;
