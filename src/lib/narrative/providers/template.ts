/**
 * Offline writer: builds each section from the facts + the expert's knowledge base with
 * deterministic phrasing variety. Used when no LLM key is configured, as the fallback when the
 * LLM fails validation, and in tests. English and Hinglish are written here; Hindi (Devanagari) is written by
 * template-hi.ts with the Hindi knowledge base (knowledge/seed-hi.ts).
 */
import type { KnowledgeSeed } from '../knowledge';
import type { ClientContext, SectionPlan } from '../plan';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { isStudent, W_HI } from './template-hi';

type L = 'en' | 'hinglish';
type F = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = <T,>(arr: T[], seed: string): T => arr[hash(seed) % arr.length];

function list(xs: (string | number)[], l: L, or = false): string {
  const a = xs.map(String);
  if (a.length === 0) return '';
  if (a.length === 1) return a[0];
  const c = or ? (l === 'en' ? 'or' : 'ya') : l === 'en' ? 'and' : 'aur';
  return `${a.slice(0, -1).join(', ')} ${c} ${a[a.length - 1]}`;
}

/** "the Sun", "the Moon", but "Jupiter". */
const the = (p: string) => (p === 'Sun' || p === 'Moon' ? `the ${p}` : p);
const lc = (xs: string[]) => xs.map((x) => x.toLowerCase());

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

const kbText = (kb: KnowledgeSeed[], prefix: string) => kb.filter((k) => k.key.startsWith(prefix)).map((k) => k.body);

const STAGE_LINE: Record<string, Record<L, string>> = {
  student: { en: 'At this stage of life, studies and competitive exams such as UPSC, NEET or JEE deserve your best energy, and a fixed study timetable suits your numbers.', hinglish: 'Is umar mein padhai aur competitive exams jaise UPSC, NEET ya JEE par poora dhyan dena sabse shubh rahega. Ek fixed timetable aapke ankon ke anukool hai.' },
  youngProfessional: { en: 'This is the stage to build skills and reputation; choosing the right first few roles matters more than the salary alone.', hinglish: 'Yeh samay skills aur reputation banane ka hai. Sirf salary nahi, sahi role chunna zyada zaroori hai.' },
  settling: { en: 'With responsibilities growing, stability and steady growth matter, whether you are in a government post, a private company or the family business.', hinglish: 'Zimmedariyan badh rahi hain, isliye stability aur steady growth zaroori hai, chahe aap sarkari naukri mein hon, private company mein ya family business mein.' },
  midLife: { en: 'Your experience is now your biggest asset; consolidating savings and property and mentoring others brings both money and respect.', hinglish: 'Ab aapka anubhav hi aapki sabse badi taakat hai. Savings aur property ko mazboot karna aur doosron ko guide karna dhan aur samman dono laata hai.' },
  senior: { en: 'This stage favours guidance, family harmony and spiritual practice, while keeping finances simple and secure.', hinglish: 'Is samay margdarshan, parivar mein sukh-shanti aur adhyatmik abhyas shubh hain. Finance ko simple aur surakshit rakhein.' },
};

type Writer = (f: F, ctx: ClientContext, kb: KnowledgeSeed[], l: L, seed: string) => string[];

const W: Record<string, Writer> = {
  intro: (f, c, kb, l, s) => {
    const concerns = (f.concerns as string[]).map((x) => x.replace(/([A-Z])/g, ' $1').toLowerCase());
    if (l === 'hinglish') return [
      `${pick(['Namaste', 'Pranam'], s)} ${c.address}. Yeh report aapke janm ki tareekh aur naam ke ankon par aadharit hai, aur isme har baat ke saath vyavaharik upay bhi diye gaye hain.`,
      `Aapka Moolank ${f.moolank} hai (${f.moolankPlanet}), Bhagyank ${f.bhagyank} hai (${f.bhagyankPlanet}) aur Kua ank ${f.kua} hai.${f.nameNumber ? ` Aapke naam ka ank ${f.nameNumber} aata hai.` : ''} ${f.currentYear} aapke liye Personal Year ${f.personalYear} hai.`,
      concerns.length ? `Aapne ${list(concerns, l)} ke baare mein poocha hai, isliye in vishayon par khaas dhyan diya gaya hai.` : 'Is report mein jeevan ke sabhi mukhya kshetron ko dekha gaya hai.',
    ];
    return [
      pick([
        `${c.address}, thank you for trusting me with your numbers. What follows is a personal reading drawn from your date of birth and your name, with practical remedies for every finding.`,
        `Welcome, ${c.address}. Every person carries a unique set of numbers from the day they are born, and yours tell a clear and encouraging story.`,
      ], s),
      `Your Moolank is ${f.moolank}, ruled by ${the(f.moolankPlanet)}, and your Bhagyank is ${f.bhagyank}, ruled by ${the(f.bhagyankPlanet)}. Your Kua number is ${f.kua}${f.nameNumber ? `, and the name you use carries the vibration of ${f.nameNumber}` : ''}. In ${f.currentYear} you are running Personal Year ${f.personalYear}.`,
      concerns.length ? `You told me that ${list(concerns, l)} matter most to you right now, so you will find those themes given extra attention throughout.` : 'This reading covers every major area of life, from career to family.',
    ];
  },

  moolank: (f, c, kb, l, s) => {
    const [nature, daily] = [kbText(kb, 'NUMBER_')[0], kbText(kb, 'MOOLANK_')[0]];
    if (l === 'hinglish') return [
      `Aapka janm ${f.birthDay} tareekh ko hua hai, jisse Moolank ${f.moolank} banta hai. Is ank ka swami graha ${f.planetHindi} (${f.planet}) hai.`,
      nature, daily,
      `Upay ke roop mein, ${f.planetHindi} ki shakti ko roz ki aadat mein shamil karein; is report ke upay section mein iske liye din, rang aur mantra diye gaye hain.`,
    ];
    return [
      pick([
        `Born on the ${ordinal(f.birthDay)}, you carry Moolank ${f.moolank}, the number of ${the(f.planet)} (${f.planetHindi}). This is the energy people notice first in you.`,
        `The day you were born, the ${ordinal(f.birthDay)}, gives you Moolank ${f.moolank}. Its ruler is ${the(f.planet)}, known in our tradition as ${f.planetHindi}.`,
      ], s),
      `${nature} ${daily}`,
      `The more consciously you use the qualities of ${the(f.planet)}, the more smoothly daily life flows. The remedies later in this report give you the colours, day and mantra that strengthen this planet.`,
    ];
  },

  bhagyank: (f, c, kb, l, s) => {
    const nature = kbText(kb, 'NUMBER_')[0], path = kbText(kb, 'BHAGYANK_')[0], master = kbText(kb, 'MASTER_')[0];
    if (l === 'hinglish') return [
      `Aapki poori janm tithi ka yog ${f.compound} hai, jo ghat kar Bhagyank ${f.bhagyank} banta hai. Yeh ${f.planetHindi} ka ank hai aur aapke bhagya ki disha dikhata hai.`,
      `${path} ${master ?? ''}`.trim(),
      nature,
    ];
    return [
      pick([
        `When every digit of your birth date is added, the total is ${f.compound}, which reduces to Bhagyank ${f.bhagyank}. If your Moolank is how you walk, your Bhagyank is where the road leads.`,
        `Your Bhagyank, the number of destiny, is ${f.bhagyank} (from a total of ${f.compound}), ruled by ${the(f.planet)}.`,
      ], s),
      `${path}${master ? ` ${master}` : ''}`,
      nature,
    ];
  },

  combination: (f, c, kb, l, s) => {
    const rel = kbText(kb, 'MOOLANK_BHAGYANK')[0];
    if (l === 'hinglish') return [
      f.relation === 'friend' ? `Moolank ${f.moolank} aur Bhagyank ${f.bhagyank} aapas mein mitra hain, yeh ek shubh sanyog hai.` : f.relation === 'enemy' ? `Moolank ${f.moolank} aur Bhagyank ${f.bhagyank} ke beech thoda takraav hai.` : `Moolank ${f.moolank} aur Bhagyank ${f.bhagyank} ka sambandh sam (neutral) hai.`,
      rel ?? 'Dono ankon ko balance karke chalna aapke liye sabse accha rahega.',
      `Aapke liye mitra ank ${list(f.friendlyNumbers, l)} hain${f.enemyNumbers.length ? `, jabki ${list(f.enemyNumbers, l)} se savdhaan rahein` : ''}. Shubh ank: ${list(f.luckyNumbers, l)}.`,
    ];
    return [
      f.moolank === f.bhagyank ? `Your Moolank and Bhagyank are both ${f.moolank}, a doubling of the same energy that makes your direction in life unusually clear.` : f.relation === 'friend' ? `Moolank ${f.moolank} and Bhagyank ${f.bhagyank} are friends, which is a fortunate pairing.` : f.relation === 'enemy' ? `Moolank ${f.moolank} and Bhagyank ${f.bhagyank} do not naturally agree with each other.` : `Moolank ${f.moolank} and Bhagyank ${f.bhagyank} sit in a neutral relationship.`,
      rel ?? 'Neither number blocks the other, so results depend on how consciously you use both.',
      `Numbers that support you are ${list(f.friendlyNumbers, l)}${f.enemyNumbers.length ? `, while ${list(f.enemyNumbers, l)} tend to create friction` : ''}. Your luckiest numbers for dates, vehicle numbers and important choices are ${list(f.luckyNumbers, l)}.`,
    ];
  },

  loshu: (f, c, kb, l, s) => {
    const rep = (f.repeated as { number: number; count: number }[]);
    const excess = kb.filter((k) => k.key.startsWith('EXCESS_'));
    const yog = kbText(kb, 'YOG_'), arrows = kbText(kb, 'ARROW_STRENGTH_');
    const out: string[] = [];
    if (l === 'hinglish') {
      out.push(`Aapke Lo Shu grid mein ${list(f.present, l)} ank maujood hain.`);
      rep.forEach((r) => { const e = excess.find((k) => k.key === `EXCESS_${r.number}`); out.push(`Ank ${r.number} grid mein kul ${r.count} baar aata hai. ${e?.body ?? ''}`.trim()); });
      if (yog.length) out.push(`Aapki kundli mein ${list(f.yogs, l)} hai. ${yog.join(' ')}`);
      if (arrows.length) out.push(arrows.join(' '));
      return [out.slice(0, 2).join(' '), out.slice(2).join(' ')].filter(Boolean);
    }
    out.push(pick([
      `Your Lo Shu grid holds the numbers ${list(f.present, l)}, and each one is a quality you can draw on without effort.`,
      `Looking at your Lo Shu grid, the numbers ${list(f.present, l)} are present. These are your natural tools.`,
    ], s));
    const repLines = rep.map((r) => `The number ${r.number} appears ${r.count} times. ${excess.find((k) => k.key === `EXCESS_${r.number}`)?.body ?? ''}`.trim());
    const p2 = [...yog.length ? [`Your chart carries ${list(f.yogs, l)}. ${yog.join(' ')}`] : [], ...arrows].join(' ');
    return [out[0] + (repLines.length ? ' ' + repLines.slice(0, 1).join(' ') : ''), repLines.slice(1).join(' '), p2].filter(Boolean);
  },

  missing: (f, c, kb, l, s) => {
    const miss = kb.filter((k) => k.key.startsWith('MISSING_'));
    const arrows = kbText(kb, 'ARROW_WEAKNESS_');
    if (!f.missing.length) return [l === 'en' ? 'Every number from one to nine is present in your grid, which is rare and gives you a well-rounded personality.' : 'Aapke grid mein sabhi ank maujood hain, jo bahut kam dekhne ko milta hai.'];
    const lines = (f.missing as number[]).map((n) => `${l === 'en' ? `Number ${n}` : `Ank ${n}`}: ${miss.find((k) => k.key === `MISSING_${n}`)?.body.replace(/^With this number missing, /, '') ?? ''}`);
    const head = l === 'en'
      ? pick([`A missing number is not a flaw. It simply marks a quality that life asks you to build consciously. In your grid, ${list(f.missing, l)} are absent.`, `${list(f.missing, l).replace(/^./, (x) => x)} do not appear in your grid. Think of them as lessons rather than shortcomings.`], s)
      : `Aapke grid mein ${list(f.missing, l)} ank nahi hain. Inhe kami nahi, balki seekhne ke kshetra samjhein.`;
    return [head, lines.slice(0, Math.ceil(lines.length / 2)).join(' '), lines.slice(Math.ceil(lines.length / 2)).join(' '), arrows.join(' '),
      l === 'en' ? 'Each of these gaps has a simple remedy, listed in the remedies section.' : 'In sabke liye saral upay, upay section mein diye gaye hain.'].filter(Boolean);
  },

  kua: (f, c, kb, l) => {
    const d = f.favourable;
    if (l === 'hinglish') return [`Aapka Kua ank ${f.kua} hai aur aap ${f.group} group mein aate hain. Kaam karte samay safalta wali disha ki taraf muh karein aur swasthya wali disha mein sir rakh kar soyein.`, `Safalta ke liye ${d.success}, swasthya ke liye ${d.health}, rishton ke liye ${d.relationships} aur vyaktigat vikas ke liye ${d.personalGrowth} disha shubh hai. ${f.unfavourable.totalLoss} disha mein muh karke mahatvapurn kaam na karein.`];
    return [
      `Your Kua number is ${f.kua}. ${kbText(kb, 'KUA_')[0] ?? ''}`,
      `Face ${d.success} when you work or sign important papers; it is your success direction. Sleep with your head towards ${d.health} for health, keep family photographs in the ${d.relationships} and use ${d.personalGrowth} for study and prayer. Try not to face ${f.unfavourable.totalLoss} for important work.`,
    ];
  },

  forecast: (f, c, kb, l, s) => {
    const years = f.years as { year: number; personalYear: number; period?: string }[];
    const body = (py: number) => kb.find((k) => k.key === `PY_${py}`)?.body ?? '';
    const focus = c.concerns.length ? c.concerns[0].replace(/([A-Z])/g, ' $1').toLowerCase() : '';
    return years.map((y, i) => {
      if (l === 'hinglish') return `${y.period ?? y.year} – is avadhi mein aapka Personal Year ${y.personalYear} hai. ${body(y.personalYear)}${i === 0 && focus ? ` ${focus} ke liye is saal ki shuruaat ka sahi upyog karein.` : ''}`;
      const when = y.period ?? String(y.year);
      const opener = i === 0 ? pick([`Right now (${when.replace(' – ', ' to ')}) you are in Personal Year ${y.personalYear}.`, `From your birthday in ${y.year} until your next birthday you are in Personal Year ${y.personalYear}.`], s) : pick([`Your birthday in ${y.year} moves you into Personal Year ${y.personalYear} (${when}).`, `From your birthday in ${y.year} the energy shifts to Personal Year ${y.personalYear}.`, `Then comes Personal Year ${y.personalYear}, from your birthday in ${y.year}.`], s + y.year);
      return `${opener} ${body(y.personalYear)}${i === 0 && focus ? ` For ${focus}, use this energy deliberately rather than waiting for the right moment.` : ''}`;
    });
  },

  lifePeriods: (f, c, kb, l) => {
    const cur = (f.pinnacles as F[]).find((p) => p.current), next = (f.pinnacles as F[]).find((p) => cur && p.fromAge > cur.fromAge);
    const ch = (f.challenges as F[]).find((p) => p.current);
    const range = (p: F) => (p.toAge === null ? (l === 'en' ? `from age ${p.fromAge} onwards` : `${p.fromAge} saal ke baad`) : p.fromAge === 0 ? (l === 'en' ? `from birth to age ${p.toAge}` : `janm se ${p.toAge} saal tak`) : (l === 'en' ? `between ages ${p.fromAge} and ${p.toAge}` : `${p.fromAge} se ${p.toAge} saal ke beech`));
    if (!cur) return [];
    const tr = NUMBER_TRAITS.en[cur.number as number];
    if (l === 'hinglish') return [
      `Aap abhi ${f.age} saal ke hain aur ${range(cur)} aapka shikhar (pinnacle) ank ${cur.number} hai, jiska vishay hai ${tr.keyword.toLowerCase()}.`,
      ch ? `Isi samay chunauti ank ${ch.number} hai${ch.number === 0 ? ', jiska arth hai ki aapko khud chunna hai ki kis kshetra par mehnat karni hai' : ''}.` : '',
      next ? `Agla daur ${range(next)} shikhar ank ${next.number} ke saath aayega.` : '',
    ].filter(Boolean);
    return [
      `At ${f.age}, you are in the pinnacle of ${cur.number}, which runs ${range(cur)}. Its theme is ${tr.keyword.toLowerCase()}: a time to be ${tr.plus.toLowerCase()}, while watching for ${tr.minus.toLowerCase()}.`,
      ch ? `The challenge number for the same period is ${ch.number}${ch.number === 0 ? ', the challenge of choice: no single obstacle is fixed, so the lesson is to choose your priorities wisely' : ', and working on its lessons turns obstacles into strength'}.` : '',
      next ? (next.number === cur.number ? `The same pinnacle number returns ${range(next)}, so the lessons of this period deepen rather than change.` : `The next pinnacle, ${next.number}, runs ${range(next)} and shifts the focus towards ${NUMBER_TRAITS.en[next.number as number].keyword.toLowerCase()}.`) : '',
    ].filter(Boolean);
  },

  career: (f, c, kb, l, s) => {
    const student = isStudent(f.profession);
    const stage = STAGE_LINE[student ? 'student' : f.stage]?.[l] ?? '';
    const prof = student ? undefined : f.profession;
    const jobs = f.jobChangeYears?.length ? f.jobChangeYears : null, biz = f.businessYears?.length ? f.businessYears : null;
    const balance = c.gender === 'female' && c.maritalStatus === 'married' && f.careerScore >= 60
      ? (l === 'en' ? 'Your chart supports both a growing career and a stable home, so you need not choose one over the other; planning your week in advance keeps the balance.' : 'Aapke ank career aur ghar dono ko support karte hain, isliye ek ko chhodne ki zaroorat nahi. Hafte ki planning pehle se karein.')
      : '';
    if (l === 'hinglish') return [
      `${prof ? `Aap ${prof} ke roop mein kaam karte hain. ` : ''}Aapke ankon ke hisaab se ${list(f.suitableFields, l)} jaise kshetra sabse anukool hain. Career indicator ${f.careerScore}/100 aur dhan indicator ${f.moneyScore}/100 hai.`,
      `${stage} ${balance}`.trim(),
      [jobs ? `Naukri badalne ke liye ${list(jobs, l)} shubh hain.` : '', biz ? `Naya vyavsay shuru karne ke liye ${list(biz, l)} accha samay hai.` : ''].join(' ').trim(),
    ].filter(Boolean);
    return [
      pick([
        `${prof ? `As a ${prof.toLowerCase()}, you` : 'You'} are working in an area your numbers can support well, especially fields such as ${list(lc(f.suitableFields), l)}.`,
        `Your numbers point towards fields such as ${list(lc(f.suitableFields), l)}${prof ? `, and your present work as a ${prof.toLowerCase()} can draw on several of these strengths` : ''}.`,
      ], s),
      `Your career indicator stands at ${f.careerScore} out of 100 and your money indicator at ${f.moneyScore}. ${f.careerScore > f.moneyScore + 10 ? 'Recognition may come before wealth, so build savings habits now.' : f.moneyScore > f.careerScore + 10 ? 'Money tends to come more easily than titles; invest in your skills to rise in position.' : 'Career and money move together for you when you stay consistent.'}`,
      `${stage} ${balance}`.trim(),
      [jobs ? `The most favourable years for a job change are ${list(jobs, l)}.` : '', biz ? `For starting a business or a new venture, ${list(biz, l)} carry the right energy.` : ''].join(' ').trim(),
    ].filter(Boolean);
  },

  relationships: (f, c, kb, l, s) => {
    const style = kbText(kb, 'RELATION_')[0] ?? '';
    const ms = f.maritalStatus;
    const years = f.marriageYears?.length ? f.marriageYears : null;
    if (l === 'hinglish') return [
      `${style} Aapke liye anukool partner ke ank ${list(f.compatiblePartnerNumbers, l)} hain.`,
      ms === 'married' ? 'Vivahit jeevan mein, saath mein samay bitana aur sanyukt parivar ki zimmedariyan baantna rishton ko mazboot rakhta hai.' : ms === 'engaged' ? 'Sagai ke is samay mein dono parivaron ke beech achhi baatcheet bahut shubh rahegi.' : years ? `Vivah ke liye ${list(years, l)} shubh varsh hain.` : '',
      `Prem ${f.loveScore}/100 aur parivar ${f.familyScore}/100 indicator dikhate hain.`,
    ].filter(Boolean);
    return [
      pick([style, `When it comes to the heart, your numbers are clear. ${style}`], s),
      `Partners whose Moolank or Bhagyank is ${list(f.compatiblePartnerNumbers, l, true)} tend to understand you naturally${f.challengingPartnerNumbers.length ? `, while ${list(f.challengingPartnerNumbers, l)} need more patience on both sides` : ''}.`,
      ms === 'married' ? 'In married life, shared time and dividing responsibilities in the joint family or with in-laws keep the bond warm.'
        : ms === 'engaged' ? `This engagement period is a good time to build understanding between both families.${years ? ` By your own numbers, favourable years for the wedding are ${list(years, l)}.` : ''}`
        : years ? `If marriage is on your mind, whether arranged or love, ${list(years, l)} are the most supportive years.` : '',
      `Your love indicator reads ${f.loveScore} out of 100 and your family indicator ${f.familyScore}.`,
    ].filter(Boolean);
  },

  wellbeing: (f, c, kb, l) => {
    const tip = kbText(kb, 'WELLBEING_')[0] ?? '';
    if (l === 'hinglish') return [`Aapka wellbeing indicator ${f.healthScore}/100 hai. ${tip}`, 'Swasthya se jude kisi bhi sawal ke liye hamesha doctor se salah lein.'];
    return [`Your wellbeing indicator is ${f.healthScore} out of 100. As a ${f.planet}-ruled person, routine matters a great deal to how you feel. ${tip}`, 'For any health concern, please consult a qualified doctor; numerology can support a healthy routine but never replaces medical advice.'];
  },

  name: (f, c, kb, l, s) => {
    const cat = kbText(kb, 'NAME_COMPOUND_')[0] ?? '';
    const how = kbText(kb, 'NAME_CORRECTION_HOW')[0];
    const rel = (r: string) => (l === 'en' ? (r === 'friend' ? 'friendly' : r === 'enemy' ? 'not friendly' : 'neutral') : (r === 'friend' ? 'mitra' : r === 'enemy' ? 'shatru' : 'sam'));
    const opts = (f.corrections as F[]).map((o) => (l === 'en' ? `${o.spelling} (${o.compound}/${o.nameNumber}, score ${o.score})` : `${o.spelling} (${o.compound}/${o.nameNumber}, score ${o.score})`));
    if (l === 'hinglish') return [
      `Chaldean paddhati se "${f.name}" ka yog ${f.compound} hai, jo ank ${f.nameNumber} banta hai. ${cat}`,
      `Yeh ank aapke Moolank se ${rel(f.relationWithMoolank)} aur Bhagyank se ${rel(f.relationWithBhagyank)} hai. Compatibility score ${f.score}/100 hai.`,
      f.needsCorrection && opts.length ? `Sujhaye gaye naam: ${list(opts, l)}. ${how ?? ''}` : 'Aapke naam ki vartani pehle se aapke ankon ke anukool hai.',
    ];
    return [
      pick([`In the Chaldean system, "${f.name}" adds up to ${f.compound}, a name number of ${f.nameNumber}.`, `The name you use, "${f.name}", vibrates at ${f.compound}, which reduces to ${f.nameNumber}.`], s) + ` ${cat}`,
      `This number is ${rel(f.relationWithMoolank)} to your Moolank and ${rel(f.relationWithBhagyank)} to your Bhagyank, giving a compatibility score of ${f.score} out of 100. Your soul urge is ${f.soulUrge} and your outer personality number is ${f.personality}.`,
      f.needsCorrection && opts.length ? `A small change in spelling, without changing how your name sounds, can bring it into line with your numbers. The strongest options are ${list(opts, l)}. ${how ?? ''}` : 'Your present spelling already works well with your numbers, so no correction is needed.',
    ];
  },

  mobile: (f, c, kb, l) => {
    const v = kbText(kb, 'MOBILE_')[0] ?? '';
    const rel = (r: string) => (r === 'friend' ? (l === 'en' ? 'supports' : 'support karta hai') : r === 'enemy' ? (l === 'en' ? 'clashes with' : 'takraata hai') : (l === 'en' ? 'is neutral to' : 'neutral hai'));
    if (l === 'hinglish') return [
      `Aapke mobile ${f.masked} ka yog ${f.compound} hai, yaani ank ${f.total}. Yeh Bhagyank ko ${rel(f.relationWithBhagyank)}. Score ${f.score}/100, nishkarsh: ${f.verdict}. ${v}`,
      [f.maleficPairs.length ? `Isme ${list([...new Set(f.maleficPairs as string[])], l)} jaise kathin jode hain.` : '', f.missingNumbersFilled.length ? `Yeh aapke grid ke ${list(f.missingNumbersFilled, l)} ank ki kami poori karta hai.` : '', `Naye number ka yog ${list(f.idealTotals, l, true)} hona chahiye.`].join(' ').trim(),
    ];
    return [
      `Your mobile number ${f.masked} totals ${f.compound}, a single vibration of ${f.total}, which ${rel(f.relationWithBhagyank)} your Bhagyank. It scores ${f.score} out of 100: ${f.verdict}. ${v}`,
      [f.maleficPairs.length ? `It contains the difficult pairs ${list([...new Set(f.maleficPairs as string[])], l)}.` : 'There are no strongly malefic digit pairs in it.', f.missingNumbersFilled.length ? `It also brings in ${list(f.missingNumbersFilled, l)}, numbers missing from your grid.` : '', `If you ever choose a new number, aim for a total that reduces to ${list(f.idealTotals, l, true)}.`].join(' ').trim(),
    ];
  },

  aadhaar: (f, c, kb, l) => {
    if (l === 'hinglish') return [`Aadhaar ${f.masked} ka kampan ${f.total} hai (${f.verdict}). ${kbText(kb, 'AADHAAR')[0] ?? ''}`];
    const phr = ({ 'Highly Lucky': 'works very well with your numbers', Supportive: 'supports your numbers', Neutral: 'is neutral for you', 'Needs Change': 'is not a natural match for your numbers' } as Record<string, string>)[f.verdict] ?? 'is neutral for you';
    return [`Your Aadhaar (${f.masked}) carries a vibration of ${f.total}, which ${phr}. ${kbText(kb, 'AADHAAR')[0] ?? ''}${f.missingNumbersFilled.length ? ` On the positive side, it brings in ${list(f.missingNumbersFilled, l)} from your missing numbers.` : ''}`];
  },

  couple: (f, c, kb, l, s) => {
    const a = f.areaScores as Record<string, number>;
    const sorted = Object.entries(a).sort((x, y) => y[1] - x[1]);
    const best = sorted.slice(0, 2), weak = sorted.slice(-2);
    const lbl = (k: string) => ({ love: 'love and emotional bond', communication: 'communication', finance: 'finance', family: 'family and in-laws', health: 'physical harmony', stability: 'long-term stability' } as Record<string, string>)[k] ?? k;
    if (l === 'hinglish') return [
      `${c.address} aur ${f.partnerName} ki kul compatibility ${f.overall}% hai. ${kbText(kb, 'COUPLE_GENERAL')[0] ?? ''}`,
      `Sabse mazboot kshetra ${best.map(([k, v]) => `${lbl(k)} (${v})`).join(' aur ')} hain, jabki ${weak.map(([k, v]) => `${lbl(k)} (${v})`).join(' aur ')} par dhyan dena hoga.`,
      `Vivah ke liye ${list(f.marriageDateNumbers, l)} ank wali tareekhein shubh hain${f.auspiciousYears.length ? ` aur ${list(f.auspiciousYears, l)} shubh varsh hain` : ''}.`,
    ];
    return [
      pick([`Together, you and ${f.partnerName} share an overall compatibility of ${f.overall}%.`, `The combined numbers of you and ${f.partnerName} give an overall harmony of ${f.overall}%.`], s) + ` ${kbText(kb, 'COUPLE_GENERAL')[0] ?? ''}`,
      `Your strongest areas are ${best.map(([k, v]) => `${lbl(k)} (${v})`).join(' and ')}. The areas asking for conscious effort are ${weak.map(([k, v]) => `${lbl(k)} (${v})`).join(' and ')}.`,
      `${f.bothMissing.length ? `Neither of you has ${list(f.bothMissing, l, true)} in your grid, so the remedies for ${f.bothMissing.length > 1 ? 'these numbers' : 'this number'} are worth following together. ` : ''}For the wedding or other important joint decisions, dates that reduce to ${list(f.marriageDateNumbers, l, true)} are favourable${f.auspiciousYears.length ? `, and ${list(f.auspiciousYears, l)} ${f.auspiciousYears.length > 1 ? 'are' : 'is'} especially auspicious for the two of you together` : ''}.`,
    ];
  },

  remedies: (f, c, kb, l) => {
    const gem = kbText(kb, 'REMEDY_GEM')[0] ?? '';
    const grid = (f.gridRemedies as F[]).slice(0, 4);
    if (l === 'hinglish') return [
      `Roz ke upay: ${f.mantraDay} ko ${f.deity} ki pooja karein aur "${f.mantra}" mantra ${f.mantraCount} baar japein. ${list(f.luckyColours, l)} rang pehnein aur ${list(f.luckyDays, l)} ko mahatvapurn kaam shuru karein.`,
      `Ratna: ${f.gemstone} (${f.gemstoneHindi}) aur Rudraksha ${f.rudraksha}. ${gem} Daan: ${list(f.daan, l)}. ${f.fastingDay} ka vrat shubh hai.`,
      grid.length ? `Ghar ke liye: ${grid.map((g) => g.placement).join('. ')}.` : '',
      (f.habits as string[]).join(' '),
    ].filter(Boolean);
    return [
      pick([`Remedies work best when they become habits, so here is a simple plan.`, `Here is a practical upay plan built on your ruling planet and the gaps in your grid.`], c.firstName),
      `Every ${f.mantraDay}, offer prayers to ${f.deity} and chant "${f.mantra}" ${f.mantraCount} times. Wear ${list(lc(f.luckyColours), l, true)} on important days, begin new work on ${list(f.luckyDays, l, true)}, and keep ${f.fastingDay} as your fasting day if your health allows.`,
      `Your gemstone is ${f.gemstone} (${f.gemstoneHindi}), with ${f.rudraksha} Rudraksha as a gentle alternative. ${gem} Daan of ${list(f.daan, l).toLowerCase()} strengthens the same energy.`,
      grid.length ? `Simple changes at home support your missing numbers. ${grid.map((g) => `${g.placement.replace(/\.$/, '')}.`).join(' ')} A ${grid[0].wristband.toLowerCase()} is an easy wearable remedy.` : '',
      f.avoidColours.length ? `Use ${list(f.avoidColours, l).toLowerCase()} sparingly for important occasions. ${(f.habits as string[]).slice(0, 2).join(' ')}` : (f.habits as string[]).slice(0, 2).join(' '),
    ].filter(Boolean);
  },

  closing: (f, c, kb, l) => {
    const close = kbText(kb, 'CLOSING')[0] ?? '';
    if (l === 'hinglish') return [`${c.address}, ${close} abhi chal raha Personal Year ${f.personalYear} aur agle janmdin se shuru hone wala Personal Year ${f.nextPersonalYear} aapke liye naye avsar laa rahe hain. Upay niyamit roop se karein aur vishwas rakhein. Shubhkamnaon sahit.`];
    return [`${close} With Personal Year ${f.personalYear} running now and Personal Year ${f.nextPersonalYear} starting on your next birthday, the timing is on your side, ${c.address}. Follow the remedies with patience and you will feel the difference. With my blessings and best wishes.`];
  },
};

export function writeSectionTemplate(section: SectionPlan, ctx: ClientContext, kb: KnowledgeSeed[]): { text: string; languageFallback: boolean } {
  const seed = `${ctx.fullName}|${section.id}`;
  const clean = (paras: string[]) => paras.map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
  if (ctx.language === 'hi') {
    const hi = W_HI[section.id];
    if (hi) return { text: clean(hi(section.facts, ctx, kb, seed)), languageFallback: false };
  }
  const l: L = ctx.language === 'en' ? 'en' : 'hinglish';
  const writer = W[section.id];
  const paras = writer ? writer(section.facts, ctx, kb, l, seed) : [];
  return { text: clean(paras), languageFallback: ctx.language === 'hi' };
}
