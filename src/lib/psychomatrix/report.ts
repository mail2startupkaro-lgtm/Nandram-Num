/** Pythagoras Square (Pythagorean birth chart / Psychomatrix) – chart SVG and the English + Hindi report. */
import { cellLevel, cellText, LINES, psychomatrix, type CellDigit, type Psychomatrix } from './engine';
import { psychomatrixSvg } from './svg';
export { psychomatrixSvg };
import { CELL_LEVEL_NAME, CELLS, LEVEL_NAME, LINE_INFO } from './meanings';
import { fmtDob, type Blk, type Lang, type ReportSection, type WrittenReport } from '@/lib/report/blocks';

export interface PsychData { name: string; dob: string; p: Psychomatrix }
export const analysePsychomatrix = (input: { name: string; dob: string }): PsychData => { const p = psychomatrix(input.dob); return { name: input.name.trim(), dob: p.dob, p }; };

export function writePsychomatrix(d: PsychData, lang: Lang): WrittenReport {
  const hi = lang === 'hi', p = d.p;
  const T = (en: string, h: string) => (hi ? h : en);
  const s: ReportSection[] = [];
  const add = (id: string, title: string, blocks: Blk[]) => s.push({ id, title, blocks });
  const [w1, w2, w3, w4] = p.working;
  const lvl = (d: CellDigit) => CELL_LEVEL_NAME[cellLevel(p.counts[d])][lang];

  add('chart', T('Your Pythagoras Square', 'आपका पाइथागोरस वर्ग'), [
    { k: 'svg', svg: psychomatrixSvg(p, lang), caption: `${d.name} · ${fmtDob(d.dob, lang)} · ${T('circles: totals of the rows (right), columns (below) and diagonals (corners)', 'गोले: पंक्तियों (दाएँ), स्तंभों (नीचे) और विकर्णों (कोनों) का योग')}` },
    { k: 'tiles', items: [
      { label: T('1st working number', 'पहला कार्य-अंक'), value: String(w1) }, { label: T('2nd', 'दूसरा'), value: String(w2) },
      { label: T('3rd', 'तीसरा'), value: String(w3) }, { label: T('4th', 'चौथा'), value: String(w4) },
      { label: T('Digits in the square', 'वर्ग में अंक'), value: String(p.totalDigits) }, { label: T('Empty cells', 'खाली खाने'), value: p.empty.length ? p.empty.join(', ') : '—' },
    ] },
  ]);

  add('how', T('How your square was calculated', 'आपका वर्ग कैसे बना'), [
    { k: 'list', items: [
      T(`Date digits: ${p.dateDigits.join(' ')}`, `तिथि के अंक: ${p.dateDigits.join(' ')}`),
      T(`1st working number = sum of all digits = ${w1}`, `पहला कार्य-अंक = सभी अंकों का योग = ${w1}`),
      T(`2nd = sum of the digits of ${w1} = ${w2}`, `दूसरा = ${w1} के अंकों का योग = ${w2}`),
      T(`3rd = ${w1} − 2 × first digit of the day = ${w3}${p.absUsed ? ' (taken without the minus sign)' : ''}`, `तीसरा = ${w1} − 2 × जन्म दिन का पहला अंक = ${w3}${p.absUsed ? ' (ऋण चिह्न के बिना)' : ''}`),
      T(`4th = sum of the digits of ${w3} = ${w4}`, `चौथा = ${w3} के अंकों का योग = ${w4}`),
    ] },
    { k: 'p', t: T('All these digits (zeros left out) are placed in the nine cells. The number of times a digit appears shows how strongly that quality is expressed in you.', 'ये सभी अंक (शून्य छोड़कर) नौ खानों में रखे जाते हैं। कोई अंक जितनी बार आता है, वह गुण आपमें उतनी ही मज़बूती से व्यक्त होता है।') },
    ...(Number(d.dob.slice(0, 4)) >= 2000 ? [{ k: 'tip' as const, t: T('Born in 2000 or later: dates of this century contain more zeros, so the square naturally has fewer digits. Empty cells here are common and show qualities to build through life, not weaknesses.', '2000 या बाद में जन्म: इस शताब्दी की तिथियों में शून्य अधिक होते हैं, इसलिए वर्ग में स्वाभाविक रूप से कम अंक होते हैं। यहाँ खाली खाने सामान्य हैं और जीवन में विकसित करने वाले गुण दर्शाते हैं, कमज़ोरी नहीं।') }] : []),
  ]);

  add('cells', T('The nine qualities', 'नौ गुण'), [
    { k: 'table', head: [T('Cell', 'खाना'), T('Quality', 'गुण'), T('In your square', 'आपके वर्ग में'), T('Strength', 'शक्ति')], rows: ([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellDigit[]).map((x) => [String(x), CELLS[x].name[lang], cellText(x, p.counts[x]), lvl(x)]) },
    ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellDigit[]).flatMap((x): Blk[] => [
      { k: 'h', t: `${x} · ${CELLS[x].name[lang]} – ${cellText(x, p.counts[x])}` },
      { k: 'p', t: `${CELLS[x].about[lang]} ${CELLS[x].levels[Math.min(p.counts[x], 4)][lang]}` },
      ...(p.counts[x] <= 1 ? [{ k: 'tip' as const, t: `${T('To develop', 'विकसित करने के लिए')}: ${CELLS[x].tip[lang]}` }] : []),
    ]),
  ]);

  add('lines', T('Rows, columns and diagonals', 'पंक्तियाँ, स्तंभ और विकर्ण'), [
    { k: 'p', t: T('Each line adds up three cells and shows a wider life theme: 0–2 weak, 3–4 normal, 5–6 strong, 7 or more very strong.', 'हर रेखा तीन खानों का योग है और जीवन का व्यापक विषय दिखाती है: 0–2 कमज़ोर, 3–4 सामान्य, 5–6 मज़बूत, 7 या अधिक बहुत मज़बूत।') },
    { k: 'table', head: [T('Line', 'रेखा'), T('Total', 'योग'), T('Strength', 'शक्ति'), T('Meaning', 'अर्थ')], rows: LINES.map((l) => { const x = p.lines.find((y) => y.id === l.id)!; return [LINE_INFO[l.id].name[lang], String(x.total), LEVEL_NAME[x.level][lang], `${LINE_INFO[l.id].about[lang]} ${LINE_INFO[l.id].levels[x.level][lang]}`]; }) },
  ]);

  const strong = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellDigit[]).filter((x) => p.counts[x] >= 2);
  const develop = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellDigit[]).filter((x) => p.counts[x] === 0);
  add('summary', T('Strengths and what to develop', 'ताक़त और विकसित करने योग्य बातें'), [
    { k: 'h', t: T('Your strengths', 'आपकी ताक़त') },
    { k: 'list', items: strong.length ? strong.map((x) => `${CELLS[x].name[lang]} (${cellText(x, p.counts[x])})`) : [T('Your qualities are evenly spread – a balanced chart.', 'आपके गुण समान रूप से फैले हैं – संतुलित चार्ट।')] },
    { k: 'h', t: T('To develop through life', 'जीवन में विकसित करें') },
    { k: 'list', items: develop.length ? develop.map((x) => `${CELLS[x].name[lang]}: ${CELLS[x].tip[lang]}`) : [T('No empty cells – every quality is present in you.', 'कोई खाना खाली नहीं – हर गुण आपमें मौजूद है।')] },
    { k: 'p', t: T('The Pythagoras Square describes natural tendencies from your date of birth. Qualities can be developed at any age – use this chart as a guide, not a limit.', 'पाइथागोरस वर्ग जन्म तिथि से स्वाभाविक प्रवृत्तियाँ बताता है। गुण किसी भी आयु में विकसित किए जा सकते हैं – इस चार्ट को सीमा नहीं, मार्गदर्शक मानें।') },
  ]);

  return {
    title: T('Pythagorean Birth Chart Analysis', 'पाइथागोरस जन्म चार्ट विश्लेषण'),
    subtitle: `${fmtDob(d.dob, lang)} · ${T('working numbers', 'कार्य-अंक')} ${p.working.join(' · ')}`,
    summary: T(`Strongest qualities: ${strong.map((x) => CELLS[x].name.en).join(', ') || 'balanced'}.`, `सबसे मज़बूत गुण: ${strong.map((x) => CELLS[x].name.hi).join(', ') || 'संतुलित'}।`),
    sections: s,
  };
}
