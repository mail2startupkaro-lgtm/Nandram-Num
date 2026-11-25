/**
 * Light clean-up of report text so it reads like a consultant wrote it, not a machine:
 * spaced dashes become commas, stock connector words at sentence starts are dropped and a few
 * over-used phrases are replaced with plain ones. Number ranges such as "10–15°" are left alone.
 */
const PHRASES: [RegExp, string][] = [
  [/\bdelve(s|d)? into\b/gi, 'look$1 at'],
  [/\ba testament to\b/gi, 'a sign of'],
  [/\btapestry of\b/gi, 'mix of'],
  [/\bunlock(?:ing)? your (?:full )?potential\b/gi, 'make the most of your abilities'],
  [/\bin today'?s fast-paced world,?\s*/gi, ''],
  [/\bit is important to note that\s*/gi, ''],
  [/\bit'?s worth noting that\s*/gi, ''],
  [/\bembark on (?:a|your) journey\b/gi, 'start'],
  [/\bseamless(?:ly)?\b/gi, 'smooth'],
  [/\bholistic\b/gi, 'all-round'],
];
const OPENERS = /(^|[.!?।]\s+)(?:Moreover|Furthermore|Additionally|In conclusion|Overall|Ultimately|Notably|Importantly),\s+(\p{L})/gu;

export function humanise(text: string): string {
  if (!text) return text;
  let s = text
    // "word — word", "word – word", "word -- word" → "word, word"
    .replace(/\s+(?:—|–|--)\s+/g, ', ')
    // "word—word" (no spaces) between letters → "word, word"
    .replace(/(\p{L})—(\p{L})/gu, '$1, $2');
  for (const [re, to] of PHRASES) s = s.replace(re, to);
  s = s.replace(OPENERS, (_m, pre: string, c: string) => `${pre}${c.toUpperCase()}`);
  return s.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').replace(/,\s*([.!?।])/g, '$1').trim();
}

/** Applies `humanise` to every string inside a value (objects and arrays are copied). */
export function humaniseDeep<T>(v: T): T {
  if (typeof v === 'string') return humanise(v) as T;
  if (Array.isArray(v)) return v.map((x) => humaniseDeep(x)) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, humaniseDeep(x)])) as T;
  return v;
}
