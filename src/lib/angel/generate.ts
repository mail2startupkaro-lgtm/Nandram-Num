/**
 * Angel-number page builder. Pure and deterministic: the same number always produces the same page.
 * Popular numbers use hand-written text from flagship.ts; every other number is interpreted from its digits,
 * its pattern (repeating, mirror, sequence…) and its numerology root.
 */
import { ANGEL_RANKED } from './keywords';
import { DIGITS, MASTER } from './digits';
import { FLAGSHIP } from './flagship';

export type Pattern = 'single' | 'repeat' | 'mirror' | 'palindrome' | 'ascending' | 'descending' | 'pairs' | 'dominant' | 'mixed';
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: { title: string; text: string }[] }
  | { kind: 'digits'; items: { d: number; count: number; word: string; text: string }[] }
  | { kind: 'facts'; items: [string, string][] };
export interface Section { id: string; title: string; blocks: Block[] }
export interface AngelPage {
  n: string; rank: number | null; indexed: boolean; flagship: boolean;
  title: string; h1: string; description: string; keywords: string[]; theme: string; summary: string;
  clock: string | null; sum: number; root: number; master: number | null; pattern: Pattern;
  sections: Section[]; faqs: { q: string; a: string }[]; related: string[]; hindi: string;
}

export const isAngelNumber = (s: string) => /^\d{1,5}$/.test(s);

/** Number → { rank (1 = most searched), flags }. */
export const ANGEL_INDEX = new Map(ANGEL_RANKED.map(([n, f], i) => [n, { rank: i + 1, flags: f }]));
export const TOP_ANGEL = ANGEL_RANKED.map(([n]) => n);

const MEANS = ['infinite potential and divine connection', 'new beginnings and manifestation', 'balance, trust and partnership', 'growth, creativity and divine support', 'stability, protection and hard work', 'change, freedom and transformation', 'love, home and responsibility', 'inner wisdom and spiritual awakening', 'abundance, karma and success', 'completion, compassion and a higher purpose'];
const ASK = ['pause and listen to your inner guidance', 'take the first step with confidence', 'be patient and trust the timing', 'express yourself and keep growing', 'stay disciplined and build steadily', 'welcome change with an open mind', 'care for your heart, home and family', 'trust your intuition', 'keep working with honesty and patience', 'let go of what is ending'];
const PLANET_HI = ['—', 'सूर्य', 'चंद्रमा', 'गुरु (बृहस्पति)', 'राहु', 'बुध', 'शुक्र', 'केतु', 'शनि', 'मंगल'];
const NUM_WORD = ['zero', 'once', 'twice', 'three times', 'four times', 'five times'];

function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const pick = <T,>(arr: T[], seed: number, k = 0) => arr[(seed + k * 7) % arr.length];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const join = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

function reduceChain(total: number) {
  const chain = [total]; let x = total;
  while (x > 9) { x = String(x).split('').reduce((a, b) => a + +b, 0); chain.push(x); }
  return { root: x, master: chain.find((c) => c === 11 || c === 22 || c === 33) ?? null };
}

export function analyse(n: string) {
  const digits = n.split('').map(Number);
  const counts = new Map<number, number>();
  digits.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1));
  const order = [...counts.keys()].sort((a, b) => (counts.get(b)! - counts.get(a)!) || digits.indexOf(a) - digits.indexOf(b));
  const sum = digits.reduce((a, b) => a + b, 0);
  const { root, master } = reduceChain(sum);
  const masterInside = [11, 22, 33].filter((m) => n.includes(String(m)));
  let pattern: Pattern = 'mixed';
  const L = digits.length;
  const rev = [...digits].reverse().join('');
  if (L === 1) pattern = 'single';
  else if (counts.size === 1) pattern = 'repeat';
  else if (L >= 4 && L % 2 === 0 && counts.size === 2 && digits.every((d, i) => d === digits[i % 2])) pattern = 'mirror';
  else if (L >= 3 && digits.every((d, i) => i === 0 || d === digits[i - 1] + 1)) pattern = 'ascending';
  else if (L >= 3 && digits.every((d, i) => i === 0 || d === digits[i - 1] - 1)) pattern = 'descending';
  else if (L === 4 && digits[0] === digits[1] && digits[2] === digits[3]) pattern = 'pairs';
  else if (L >= 3 && rev === n) pattern = 'palindrome';
  else if (L >= 3 && counts.get(order[0])! >= L - 1) pattern = 'dominant';
  return { digits, counts, order, sum, root, master, masterInside, pattern };
}

/** Clock form, e.g. 1111 → 11:11, 222 → 2:22. */
function clockOf(n: string) {
  if (n.length === 4) { const h = +n.slice(0, 2), m = +n.slice(2); if (h < 24 && m < 60) return `${n.slice(0, 2)}:${n.slice(2)}`; }
  if (n.length === 3) { const m = +n.slice(1); if (m < 60 && n[0] !== '0') return `${n[0]}:${n.slice(1)}`; }
  return null;
}

function patternText(n: string, a: ReturnType<typeof analyse>, seed: number): string {
  const d0 = DIGITS[a.order[0]], d1 = a.order[1] !== undefined ? DIGITS[a.order[1]] : null;
  switch (a.pattern) {
    case 'single': return `${n} is a single-digit angel number, the purest form of its energy. When a single digit stands out to you, on a jersey, a house number or a date, its theme of ${d0.word.toLowerCase()} is the whole message.`;
    case 'repeat': return `${n} is the number ${a.order[0]} repeated ${NUM_WORD[n.length] ?? `${n.length} times`}. In angel-number tradition, repetition turns up the volume of a digit, so the theme of ${d0.word.toLowerCase()} becomes the clear, central message. ${pick(['The more times a digit repeats, the more urgent and focused its message is said to be.', 'Repeating numbers are the easiest for the mind to notice, which is why they are read as deliberate signs.', 'A repeating sequence is read as a single, concentrated message rather than a mix of themes.'], seed)}`;
    case 'mirror': return `${n} is a mirror pattern that alternates ${a.order[0]} and ${a.order[1]}. The back-and-forth rhythm suggests a balance between the two energies, ${d0.word.toLowerCase()} and ${d1!.word.toLowerCase()}, and a sense of steady forward movement, step after step.${a.order.includes(0) ? ' Because zero sits in the pattern, the other digit is amplified.' : ''}`;
    case 'palindrome': return `${n} reads the same forwards and backwards. Palindromic numbers are linked with reflection and karma: what you send out returns to you, and the outer world mirrors your inner state. Its outer digit ${n[0]} frames the message, while ${n[Math.floor(n.length / 2)]} sits at its heart.`;
    case 'ascending': return `${n} is a rising sequence. Ascending numbers are read like a staircase: progress in the right order, one step at a time. The message is to keep moving forward without skipping steps.`;
    case 'descending': return `${n} is a countdown sequence. Descending numbers are linked with release and simplification: letting go of extra weight, returning to basics and preparing for a fresh start.`;
    case 'pairs': return `${n} is made of two pairs, ${n.slice(0, 2)} and ${n.slice(2)}. Each pair doubles its digit, so the number blends ${d0.word.toLowerCase()} with ${d1!.word.toLowerCase()} in equal, amplified measure: one phase leading naturally into the next.`;
    case 'dominant': return `${n} is led by the digit ${a.order[0]}, which appears ${NUM_WORD[a.counts.get(a.order[0])!]}, with ${a.order[1]} adding its own note. So the main message is ${d0.word.toLowerCase()}, coloured by ${d1!.word.toLowerCase()}.`;
    default: return `${n} combines the energies of ${join(a.order.map((d) => `${d} (${DIGITS[d].word.toLowerCase()})`))}. ${pick(['Mixed sequences are read as a sentence rather than a single word: each digit adds a part of the message.', 'When digits differ, the first digit usually sets the theme and the rest describe how it unfolds.', 'Read the digits in order and the number tells a short story, from where you are to where you are heading.'], seed)}`;
  }
}

function themeOf(a: ReturnType<typeof analyse>) {
  const words = a.order.slice(0, 2).map((d) => DIGITS[d].word.toLowerCase());
  return cap(words.length > 1 ? `${words[0]} and ${words[1]}` : words[0]);
}

export function relatedOf(n: string, a = analyse(n)): string[] {
  const set = new Set(a.digits);
  const out: string[] = [];
  const add = (x: string) => { if (x !== n && !out.includes(x) && out.length < 12) out.push(x); };
  for (const x of TOP_ANGEL) { const xs = new Set(x.split('').map(Number)); if (xs.size === set.size && [...xs].every((d) => set.has(d))) add(x); if (out.length >= 5) break; }
  for (const x of TOP_ANGEL.slice(0, 300)) { if (analyse(x).root === a.root) add(x); if (out.length >= 9) break; }
  for (const x of TOP_ANGEL.slice(0, 16)) add(x);
  return out;
}

export function buildAngel(n: string): AngelPage {
  const a = analyse(n);
  const seed = hash(n);
  const idx = ANGEL_INDEX.get(n);
  const F = FLAGSHIP[n];
  const d0 = DIGITS[a.order[0]], d1 = a.order[1] !== undefined ? DIGITS[a.order[1]] : null;
  const rootD = DIGITS[a.root];
  const clock = clockOf(n);
  const theme = F?.title ?? themeOf(a);
  const means = a.order.slice(0, 2).map((d) => MEANS[d]);
  const summary = F?.summary ?? `Angel number ${n} means ${means[0]}${means[1] ? `, supported by ${means[1]}` : ''}. ${pick([`It is a sign to ${ASK[a.order[0]]}`, `Its message is to ${ASK[a.order[0]]}`, `When you keep seeing it, the guidance is to ${ASK[a.order[0]]}`], seed)}${d1 ? `, and to ${ASK[a.order[1]]}` : ''}.${n.length > 1 && a.root !== a.order[0] ? ` Its digits reduce to ${a.root}, adding the energy of ${rootD.word.toLowerCase()}.` : ''}`;

  const facts: [string, string][] = [
    ['Core theme', theme],
    ['Digits', join(a.order.map((d) => `${d} – ${DIGITS[d].word}`))],
    ['Pattern', { single: 'Single digit', repeat: 'Repeating', mirror: 'Mirror / alternating', palindrome: 'Palindrome', ascending: 'Rising sequence', descending: 'Countdown sequence', pairs: 'Double pairs', dominant: 'Dominant digit', mixed: 'Mixed sequence' }[a.pattern]],
    ['Numerology root', `${a.sum}${a.sum > 9 ? ` → ${a.root}` : ''}${a.master ? ` (master ${a.master})` : ''}`],
    ['Ruling planet', a.root ? rootD.planet : 'None (zero)'],
    ['Love', cap(DIGITS[a.order[0]].love.split(',')[0])],
    ['Career', cap(DIGITS[a.order[0]].career.split(',')[0])],
    ['Twin flame', cap(DIGITS[a.order[0]].twin.split(',')[0])],
  ];
  if (clock) facts.splice(1, 0, ['Clock form', clock]);

  const meaningParas = F ? [...F.meaning] : [
    pick([`If ${n} keeps appearing on clocks, number plates, bills or your phone screen, angel-number tradition reads it as a message worth noticing. Its core theme is ${theme.toLowerCase()}.`, `Seeing ${n} again and again is not just chance in angel-number tradition; it is read as a gentle nudge about ${theme.toLowerCase()}.`, `Many people search for the meaning of ${n} after noticing it repeatedly. In short, it is a number of ${theme.toLowerCase()}.`], seed),
    patternText(n, a, seed),
    `${d0.core}${d1 ? ` ${DIGITS[a.order[1]].core.split('. ')[0]}.` : ''}`,
  ];
  if (clock && !F) meaningParas.push(`You may also see this number on a clock as ${clock}. Mirror and repeating times are among the most common ways angel numbers show up in daily life.`);

  const spiritual = F?.spiritual ?? `Spiritually, ${n} is ${d0.spiritual}.${d1 ? ` The presence of ${a.order[1]} adds ${d1.spiritual.replace(/^a /, 'a further ')}.` : ''} ${pick(['Take a few quiet minutes when you notice it and ask what the message means for you right now.', 'Many people find it useful to note where they were and what they were thinking when the number appeared.', 'The meaning becomes clearer when you connect it with the question that is on your mind.'], seed)}`;
  const love = F?.love ?? `In love, ${n} speaks of ${d0.love}${d1 ? `, alongside ${d1.love}` : ''}. ${pick(['If you are in a relationship, it asks for honest conversation and attention to what your partner needs.', 'For couples, it encourages you to talk openly and act with patience rather than react.', 'In an existing relationship, it is a sign to nurture the bond with time and care.'], seed)} ${pick(['If you are single, it suggests that becoming clear about your own needs will attract the right person.', 'Singles are encouraged to stay open but not to settle for less than mutual respect.', 'If you are single, keep your heart open; meaningful connections often begin when you are being yourself.'], seed, 1)} Be careful of ${d0.caution}.`;
  const twin = F?.twin ?? `For twin flames, ${n} points to ${d0.twin}${d1 ? ` and ${d1.twin}` : ''}. ${pick(['Whether you are together or apart, the focus is on your own growth; the connection reflects it.', 'Twin-flame journeys move in stages, and this number usually reflects the stage you are in rather than a fixed outcome.', 'Use it as a prompt for self-reflection rather than a prediction about another person.'], seed)}`;
  const career = F?.career ?? `For career and money, ${n} favours ${d0.career}${d1 ? `, as well as ${d1.career}` : ''}. ${a.order.includes(8) ? 'Because 8 is present, financial discipline and long-term thinking are especially rewarded.' : a.order.includes(5) ? 'Because 5 is present, stay flexible but avoid impulsive financial risks.' : a.order.includes(4) ? 'Because 4 is present, budgeting and steady saving work better than shortcuts.' : 'Plan your next step clearly and back your ideas with consistent effort.'} ${pick(['For manifestation, write the goal down and take one concrete action each week.', 'If you are manifesting a specific goal, keep your intention simple and repeat it with gratitude.', 'This is a good number to keep in mind while setting goals or planning a new project.'], seed)}`;

  const rootTxt = a.root === 0
    ? `All the digits of ${n} are zero, so its root is 0: pure potential with no fixed direction. In numerology this is read as a blank page, a time to choose consciously.`
    : `In numerology, the digits of ${n} add up to ${a.sum}${a.sum > 9 ? `, which reduces to ${a.root}` : ''}. So the root of this angel number is ${a.root}, ruled by ${rootD.planet}. ${rootD.core.split('. ')[0]}. ${a.master ? MASTER[a.master].text : ''}`;
  const masterNote = a.masterInside.filter((m) => m !== a.master).map((m) => MASTER[m].text);

  const sections: Section[] = [
    { id: 'meaning', title: `What Does Angel Number ${n} Mean?`, blocks: meaningParas.map((t) => ({ kind: 'p' as const, text: t })) },
    { id: 'facts', title: `${n} Angel Number at a Glance`, blocks: [{ kind: 'facts', items: facts }] },
    { id: 'digits', title: `Digit-by-Digit Meaning of ${n}`, blocks: [
      { kind: 'p', text: `Every angel number is read through the digits it contains. Here is what each digit in ${n} brings, and how strongly it appears.` },
      { kind: 'digits', items: a.order.map((d) => ({ d, count: a.counts.get(d)!, word: DIGITS[d].word, text: DIGITS[d].core })) },
    ] },
    { id: 'spiritual', title: `Spiritual Meaning of ${n}`, blocks: [{ kind: 'p', text: spiritual }] },
    { id: 'love', title: `${n} Angel Number Meaning in Love`, blocks: [{ kind: 'p', text: love }] },
    { id: 'twin-flame', title: `${n} Twin Flame Meaning`, blocks: [{ kind: 'p', text: twin }] },
    { id: 'career', title: `${n} Meaning for Career, Money & Manifestation`, blocks: [{ kind: 'p', text: career }] },
    { id: 'numerology', title: `${n} in Numerology: Root Number ${a.root}`, blocks: [{ kind: 'p', text: rootTxt }, ...masterNote.map((t) => ({ kind: 'p' as const, text: t })),
      { kind: 'p', text: `How strongly ${n} speaks to you also depends on your own numbers. If its root ${a.root || ''} is friendly to your Moolank and Bhagyank, the message tends to feel supportive and easy to act on; if not, it may point to a lesson you are learning. Use the free angel number compatibility calculator below to check it against your date of birth.` }] },
    { id: 'seeing', title: `Why Do I Keep Seeing ${n}? What Should I Do?`, blocks: [
      { kind: 'list', items: [
        `You are being reminded to ${ASK[a.order[0]]}.`,
        `A situation connected with ${d0.keywords.slice(0, 2).join(' or ')} needs your attention.`,
        d1 ? `The energy of ${d1.word.toLowerCase()} is becoming important in your life.` : `The energy of ${d0.word.toLowerCase()} is becoming important in your life.`,
        `Your mind is primed to notice it, which makes it a useful moment to pause and check your thoughts.`,
      ] },
      { kind: 'steps', items: [
        { title: 'Pause and notice', text: 'Note what you were thinking or doing when you saw the number. That context is part of the message.' },
        { title: 'Act on the digit', text: d0.action },
        { title: 'Watch the caution', text: `Avoid ${d0.caution}.` },
        { title: 'Check your numbers', text: 'See how this angel number matches your Moolank and Bhagyank with the free calculator, or get a full reading.' },
      ] },
    ] },
  ];

  const hindi = F?.hindi ?? `${n} एंजेल नंबर में ${join(a.order.map((d) => `अंक ${d} (${DIGITS[d].hiWord})`))} की ऊर्जा है। ${d0.hiCore} ${a.root ? `इसके अंकों का योग ${a.sum}${a.sum > 9 ? ` → ${a.root}` : ''} है, जिसका स्वामी ग्रह ${PLANET_HI[a.root]} है।` : ''} जब आप बार-बार ${n} देखें, तो रुककर अपने विचारों पर ध्यान दें और इस संदेश के अनुसार छोटा-सा सकारात्मक कदम उठाएँ।`;
  sections.push({ id: 'hindi', title: `${n} Angel Number Meaning in Hindi`, blocks: [{ kind: 'p', text: hindi }] });
  sections.push({ id: 'faq', title: `${n} Angel Number FAQs`, blocks: [] });

  const faqs = [
    { q: `What does angel number ${n} mean?`, a: summary },
    { q: `What does ${n} mean in love?`, a: love.split('. ').slice(0, 2).join('. ') + '.' },
    { q: `Is ${n} a twin flame number?`, a: twin.split('. ')[0] + '.' },
    { q: `What does ${n} mean for money and career?`, a: career.split('. ')[0] + '.' },
    { q: `Is ${n} a good or bad sign?`, a: `In angel-number tradition no number is bad. ${n} is read as guidance: its core message is ${means[0]}${a.order.includes(4) || a.order.includes(8) ? ', and any challenge it points to is a lesson in patience and discipline' : ''}.` },
    { q: `What is ${n} in numerology?`, a: a.root ? `Its digits add up to ${a.sum}${a.sum > 9 ? ` and reduce to ${a.root}` : ''}, so its root number is ${a.root}, ruled by ${rootD.planet}.` : 'Its root is 0, the number of pure potential.' },
    ...(F?.faqs ?? []),
  ];

  const keywords = [`${n} angel number`, `angel number ${n}`, `${n} angel number meaning`, `${n} meaning`, `${n} angel number love`, `${n} twin flame`, `${n} meaning in hindi`, `${n} spiritual meaning`, `${n} angel number money`];
  if (clock) keywords.push(`${clock} meaning`);
  const titleTail = F ? theme : 'Love, Twin Flame & Career';
  return {
    n, rank: idx?.rank ?? null, indexed: !!idx, flagship: !!F,
    title: `${n} Angel Number Meaning – ${titleTail}`,
    h1: `${n} Angel Number Meaning`,
    description: `${summary.split('. ').slice(0, 2).join('. ')}. Love, twin flame, career, Hindi meaning and a free DOB compatibility check by Acharya Nandram.`.slice(0, 300),
    keywords, theme, summary, clock, sum: a.sum, root: a.root, master: a.master, pattern: a.pattern,
    sections, faqs, related: relatedOf(n, a), hindi,
  };
}

/** Personal angel numbers from a life number, e.g. 7 → "777", master 11 → "1111". */
export const angelOfLifeNumber = (v: number, master: number | null) => (master ? String(master).repeat(2) : String(v).repeat(3));
