/**
 * 6.4 Accuracy control: every number written in a section must exist in that section's facts
 * (or in the global facts: core numbers, age, report years). Masked IDs are ignored.
 */

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

export function normaliseDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
}

/** Collect every number that appears in a facts object (numbers, numeric strings, "2-5-8", "12/3"). */
export function collectNumbers(value: unknown, out = new Set<number>()): Set<number> {
  if (value === null || value === undefined) return out;
  if (typeof value === 'number') { if (Number.isFinite(value)) out.add(value); return out; }
  if (typeof value === 'string') { for (const m of normaliseDigits(value).replace(/X+/gi, ' ').matchAll(/\d+/g)) out.add(Number(m[0])); return out; }
  if (Array.isArray(value)) { value.forEach((v) => collectNumbers(v, out)); return out; }
  if (typeof value === 'object') { Object.values(value as Record<string, unknown>).forEach((v) => collectNumbers(v, out)); return out; }
  return out;
}

/** Numbers that appear in client text. Masked tokens like XXXX-XXXX-1234 and 98XXXXXX10 are skipped. */
export function numbersInText(text: string): number[] {
  const cleaned = normaliseDigits(text).replace(/\b[\dX]*X[\dX-]*\b/gi, ' ');
  return [...cleaned.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
}

export interface NumberCheck {
  ok: boolean;
  unknown: number[];
}

export function checkNumbers(text: string, allowed: Set<number>): NumberCheck {
  const unknown = [...new Set(numbersInText(text).filter((n) => !allowed.has(n)))];
  return { ok: unknown.length === 0, unknown };
}
