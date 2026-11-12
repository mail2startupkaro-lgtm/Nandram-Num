/**
 * 6.3 Post-processing filter: strips machine-sounding phrases, emojis, excess em dashes and
 * self-references; varies paragraph length; removes sentences repeated across sections.
 */

/** [pattern, replacement]. Order matters: longer phrases first. */
const PHRASE_RULES: [RegExp, string][] = [
  [/\bas an? (ai|artificial intelligence|language model|ai language model)[^,.]*[,.]?\s*/gi, ''],
  [/\b(i am|i'm) (an? )?(ai|language model|chatbot|assistant)\b[^.]*\.\s*/gi, ''],
  [/\bit(?:'s| is) (?:important|worth|crucial) (?:to note|noting|to remember|to mention) that\s*/gi, ''],
  [/\bit(?:'s| is) (?:important|worth|crucial) to (?:note|remember|mention)[,:]?\s*/gi, ''],
  [/\bin conclusion,?\s*/gi, ''],
  [/\bto sum (?:it )?up,?\s*/gi, ''],
  [/\bin summary,?\s*/gi, ''],
  [/\bfurthermore,?\s*/gi, ''],
  [/\bmoreover,?\s*/gi, ''],
  [/\badditionally,?\s*/gi, ''],
  [/\bnavigat(?:e|ing) (?:the|this|your) (?:journey|path|complexities|landscape)( of [a-z]+)?/gi, 'move through life'],
  [/\b(?:embark|embarking|embarked) on\b/gi, 'begin'],
  [/\bembark\b/gi, 'begin'],
  [/\bunlock(?:ing)? (?:your|the) (?:full |true )?potential\b/gi, 'grow'],
  [/\bunlock(?:s|ing)?\b/gi, 'open'],
  [/\bdelv(?:e|es|ing) (?:deep(?:er)? )?into\b/gi, 'look at'],
  [/\bdelve\b/gi, 'look'],
  [/\b(?:rich )?tapestry of\b/gi, 'mix of'],
  [/\btapestry\b/gi, 'pattern'],
  [/\btestament to\b/gi, 'sign of'],
  [/\bin today's (?:fast-paced|modern|ever-changing) world,?\s*/gi, ''],
  [/\bever-evolving\b/gi, 'changing'],
  [/\bharness(?:ing)? the power of\b/gi, 'using'],
  [/\bseamless(?:ly)?\b/gi, 'smooth'],
  [/\bholistic\b/gi, 'all-round'],
  [/\bjourney\b/gi, 'path'],
  [/\brealm\b/gi, 'area'],
  [/\b(?:generated|written|created) (?:by|with|using) (?:ai|an ai|a model|software|a computer)\b/gi, ''],
  [/\b(?:algorithm|algorithmic|machine learning|language model|LLM|chatgpt|claude|openai|anthropic)\b/gi, ''],
];

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B00}-\u{2BFF}]/gu;

export const BANNED_TERMS = ['delve', 'tapestry', 'embark', 'unlock your potential', "it's important to note", 'in conclusion', 'furthermore', 'navigate the journey', 'as an ai', 'language model'];

function fixDashes(text: string): string {
  // keep at most one em dash per paragraph; others become commas
  return text.split('\n').map((para) => {
    let seen = 0;
    return para.replace(/\s*[—–]\s*/g, (m, offset: number) => {
      // Keep number and date ranges ("2026–2027", "28 Aug 2026 – 27 Aug 2027") exactly as written.
      if (m.includes('–') && /\d$/.test(para.slice(0, offset)) && /^\d/.test(para.slice(offset + m.length))) return m;
      seen++;
      return seen === 1 && /—/.test(m) ? ' — ' : ', ';
    });
  }).join('\n');
}

function tidy(text: string): string {
  return text
    .replace(/\*\*|__|^#+\s*/gm, '') // stray markdown
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.')
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase()) // capitalise after phrase removal
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const splitSentences = (para: string): string[] => para.match(/[^.!?।]+[.!?।]+["')\]]*|\S[^.!?।]*$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]/g, '').replace(/\s+/g, ' ').trim();

/** Split very long paragraphs and merge one-line fragments so paragraph lengths vary naturally. */
function varyParagraphs(text: string): string {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of paras) {
    const s = splitSentences(p);
    if (s.length > 6) {
      const cut = Math.ceil(s.length / 2) + (s.length % 3 === 0 ? 1 : 0);
      out.push(s.slice(0, cut).join(' '), s.slice(cut).join(' '));
    } else out.push(p);
  }
  // merge consecutive single-sentence paragraphs (keeps at most one stand-alone short line)
  const merged: string[] = [];
  for (const p of out) {
    const prev = merged[merged.length - 1];
    if (prev && splitSentences(prev).length === 1 && splitSentences(p).length === 1 && merged.length > 1) merged[merged.length - 1] = `${prev} ${p}`;
    else merged.push(p);
  }
  return merged.join('\n\n');
}

export interface FilterOptions {
  /** Sentences already used in earlier sections (normalised). Mutated: this section's sentences are added. */
  seenSentences?: Set<string>;
}

export function postProcess(raw: string, opts: FilterOptions = {}): string {
  let text = raw.replace(EMOJI, '');
  for (const [re, rep] of PHRASE_RULES) text = text.replace(re, rep);
  text = fixDashes(text);
  text = tidy(text);

  if (opts.seenSentences) {
    const seen = opts.seenSentences;
    text = text.split(/\n\s*\n/).map((para) =>
      splitSentences(para).filter((s) => {
        const k = norm(s);
        if (k.split(' ').length < 5) return true; // short sentences may legitimately repeat
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).join(' '),
    ).filter(Boolean).join('\n\n');
  }
  return varyParagraphs(tidy(text));
}

/** Terms that must never appear in client-facing text (self-reference or fear-inducing predictions). */
const FORBIDDEN = [
  /\b(ai|a\.i\.|artificial intelligence|language model|algorithm|generated|chatbot|gpt|claude)\b/i,
  /\b(death|die|dying|fatal|accident|cancer|tumou?r|heart attack|disaster|tragedy|curse|doomed)\b/i,
];

export function forbiddenHits(text: string): string[] {
  return FORBIDDEN.flatMap((re) => {
    const m = text.match(new RegExp(re.source, 'gi'));
    return m ?? [];
  });
}
