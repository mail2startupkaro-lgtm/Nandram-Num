/**
 * Admin finders: Angel Number Finder and Lucky Number Finder (Name + DOB).
 * Pure functions on top of the calculation engine – same rules as the reports
 * (Chaldean names, house friendship table, birthday-to-birthday personal years).
 */
import {
  analyseDob, analyseName, buildRemedies, combinedRelations, mobileIdealTotals, parseDate, personalYearOn,
  type DateParts, type Gender, type Relation,
} from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { angelOfLifeNumber, buildAngel } from '@/lib/angel/generate';
import { angelCompatibility, personalAngels } from '@/lib/angel/compat';
import { DIGITS } from '@/lib/angel/digits';

export interface FinderInput {
  fullName: string;
  /** Name the person actually uses (signature / everyday). Falls back to the full name. */
  commonName?: string;
  dob: string | DateParts;
  gender?: Gender;
  /** Report date (defaults to today in IST at the caller). */
  asOf: DateParts;
}

const reduceTo = (n: number) => { while (n > 9) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };
const triple = (v: number, master: number | null) => angelOfLifeNumber(v, master);

function core(input: FinderInput) {
  const dob = parseDate(input.dob);
  const d = analyseDob({ dob, gender: input.gender ?? 'male' }, { asOf: input.asOf });
  const name = analyseName({ fullName: input.fullName, commonName: input.commonName }, d.moolank.value, d.bhagyank.value);
  return { dob, d, name };
}

// ---------------- Angel Number Finder ----------------

export interface AngelPick {
  key: 'life' | 'mulank' | 'birthday' | 'year' | 'name' | 'soul' | 'destiny';
  group: 'dob' | 'name';
  label: string;
  n: string;
  why: string;
  theme: string;
  summary: string;
  /** Alignment with the person's Mulank + Bhagyank (house friendship table). */
  score: number;
  verdict: string;
  relB: Relation;
  relM: Relation;
}

export function findAngelNumbers(input: FinderInput) {
  const { dob, d, name } = core(input);
  const pa = personalAngels(dob, input.asOf);
  const c = name.chaldean;
  const nm = c.nameNumber, soul = c.soulUrge;
  const destinyRoot = reduceTo(nm.single + d.bhagyank.value);

  const raw: Omit<AngelPick, 'theme' | 'summary' | 'score' | 'verdict' | 'relB' | 'relM'>[] = [
    ...pa.list.map((x) => ({ key: x.key as AngelPick['key'], group: 'dob' as const, label: x.key === 'year' ? 'Personal Year Angel Number' : x.label, n: x.n, why: x.why })),
    { key: 'name', group: 'name', label: 'Name Angel Number', n: triple(nm.single, nm.master), why: `From the Chaldean name number of "${name.analysedName}" – ${nm.compound}${nm.compound > 9 ? ` → ${nm.single}` : ''}${nm.master ? ` (master ${nm.master})` : ''}. How the world receives the person.` },
    { key: 'soul', group: 'name', label: 'Soul Urge Angel Number', n: soul.single ? triple(soul.single, soul.master) : '000', why: soul.single ? `From the vowels of the name (soul urge) – ${soul.compound}${soul.compound > 9 ? ` → ${soul.single}` : ''}. The inner desire.` : 'The name has no vowels A, E, I, O, U – shown as 000 (pure potential).' },
    { key: 'destiny', group: 'name', label: 'Name + Destiny Angel Number', n: String(destinyRoot).repeat(3), why: `Name number ${nm.single} + Bhagyank ${d.bhagyank.value} → ${destinyRoot}. Where the name and the life path meet.` },
  ];

  const list: AngelPick[] = raw.map((x) => {
    const comp = angelCompatibility(x.n, dob);
    const page = buildAngel(x.n);
    return { ...x, theme: page.theme, summary: page.summary, score: comp.score, verdict: comp.verdict, relB: comp.relB, relM: comp.relM };
  });
  // Strongest = best alignment; ties go to the Life Path number, then list order.
  const strongest = [...list].sort((a, b) => b.score - a.score || (a.key === 'life' ? -1 : b.key === 'life' ? 1 : 0))[0];

  return {
    name: name.analysedName,
    dob: d.dob.iso,
    moolank: d.moolank.value,
    bhagyank: d.bhagyank.value,
    bhagyankMaster: d.bhagyank.master,
    nameNumber: { compound: nm.compound, single: nm.single, master: nm.master },
    soulUrge: { compound: soul.compound, single: soul.single },
    personalYear: { value: pa.personalYear, period: d.personalCycles.current.label },
    list,
    strongest: strongest.key,
  };
}
export type AngelFinderResult = ReturnType<typeof findAngelNumbers>;

// ---------------- Lucky Number Finder ----------------

export function findLuckyNumbers(input: FinderInput) {
  const { d, name } = core(input);
  const rm = buildRemedies(d, { name });
  const m = d.moolank.value, b = d.bhagyank.value;
  const rel = combinedRelations([m, b]);
  const mob = mobileIdealTotals(m, b);
  const nm = name.chaldean.nameNumber;
  const best = name.corrections[0] ?? null;
  const py = personalYearOn(d.dob, input.asOf);

  return {
    name: name.analysedName,
    dob: d.dob.iso,
    primary: { number: m, planet: planetOf(m).name, planetHindi: planetOf(m).hindiName, why: `Mulank (day of birth ${d.dob.day})` },
    destiny: { number: b, master: d.bhagyank.master, planet: planetOf(b).name, planetHindi: planetOf(b).hindiName, why: `Bhagyank (full date of birth, total ${d.bhagyank.compound})` },
    nameNumber: {
      compound: nm.compound, single: nm.single, master: nm.master, category: nm.category,
      relationWithMoolank: name.relationWithMoolank, relationWithBhagyank: name.relationWithBhagyank,
      score: name.compatibilityScore, needsCorrection: name.needsCorrection,
      suggestion: best ? { spelling: best.fullName, compound: best.compound, single: best.single, score: best.score } : null,
    },
    luckyNumbers: rm.lucky.numbers,
    neutralNumbers: rel.neutral,
    avoidNumbers: rel.enemy,
    luckyDates: rm.lucky.dates,
    luckyDays: rm.lucky.days,
    luckyColours: rm.lucky.colours,
    avoidColours: rm.lucky.avoidColours,
    directions: rm.lucky.directions,
    kua: d.kua.value,
    mobile: { idealTotals: mob.idealTotals, idealCompounds: mob.idealCompounds.slice(0, 12) },
    gemstone: rm.gemstones[0],
    personalYear: { value: py, period: d.personalCycles.current.label },
    favourableYears: rm.favourableYears,
  };
}
export type LuckyFinderResult = ReturnType<typeof findLuckyNumbers>;

// ---------------- Client summaries (copy / WhatsApp / email) ----------------

const HI_REL: Record<Relation, string> = { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' };
const HI_DAY: Record<string, string> = { Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार' };
const HI_COLOUR: Record<string, string> = {
  Golden: 'सुनहरा', Orange: 'नारंगी', Saffron: 'केसरिया', Yellow: 'पीला', White: 'सफ़ेद', Cream: 'क्रीम', Silver: 'चाँदी', 'Light green': 'हल्का हरा', Green: 'हरा',
  Red: 'लाल', Pink: 'गुलाबी', Blue: 'नीला', 'Light blue': 'हल्का नीला', 'Dark blue': 'गहरा नीला', Black: 'काला', Grey: 'स्लेटी', Brown: 'भूरा', Purple: 'बैंगनी', Violet: 'बैंगनी', Maroon: 'मैरून', 'Sky blue': 'आसमानी',
  'Light orange': 'हल्का नारंगी', 'Electric blue': 'चमकीला नीला', 'Smoky shades': 'धुएँ जैसे रंग', Turquoise: 'फ़िरोज़ी', Pastels: 'हल्के (पेस्टल) रंग',
  'Smoky grey': 'धुएँ जैसा स्लेटी', 'Light yellow': 'हल्का पीला', Multicolour: 'बहुरंगी', 'Navy blue': 'नेवी नीला', Coral: 'मूँगिया',
};
const hiColour = (c: string) => HI_COLOUR[c] ?? c;
const SIGN = 'Acharya Nandram · myNumerologist.com';

export function angelSummary(r: AngelFinderResult, lang: 'en' | 'hi', preparedBy = SIGN): string {
  const top = r.list.find((x) => x.key === r.strongest)!;
  if (lang === 'hi') {
    return [
      `एंजेल नंबर रिपोर्ट – ${r.name}`, `जन्म तिथि: ${r.dob} · मूलांक ${r.moolank} · भाग्यांक ${r.bhagyankMaster ? `${r.bhagyankMaster}/${r.bhagyank}` : r.bhagyank} · नामांक ${r.nameNumber.compound}/${r.nameNumber.single}`, '',
      `सबसे शुभ एंजेल नंबर: ${top.n} (${top.label}) – अनुकूलता ${top.score}%`, '',
      ...r.list.map((x) => `• ${x.label}: ${x.n} – ${DIGITS[Number(x.n[0])].hiWord}; भाग्यांक से ${HI_REL[x.relB]}, मूलांक से ${HI_REL[x.relM]} (${x.score}%)`), '',
      `व्यक्तिगत वर्ष ${r.personalYear.value} (${r.personalYear.period})`, '',
      'जब ये अंक घड़ी, टिकट, बिल या गाड़ी नंबर पर बार-बार दिखें, तो रुककर अपने विचार पर ध्यान दें – यही संदेश है।', '', preparedBy,
    ].join('\n');
  }
  return [
    `ANGEL NUMBER REPORT – ${r.name}`, `DOB ${r.dob} · Mulank ${r.moolank} · Bhagyank ${r.bhagyankMaster ? `${r.bhagyankMaster}/${r.bhagyank}` : r.bhagyank} · Name number ${r.nameNumber.compound}/${r.nameNumber.single}`, '',
    `Strongest angel number: ${top.n} (${top.label}) – ${top.theme}, ${top.score}% aligned`, '',
    ...r.list.map((x) => `• ${x.label}: ${x.n} – ${x.theme}. ${x.why} Alignment ${x.score}% (${x.verdict}).`), '',
    `Current Personal Year ${r.personalYear.value} (${r.personalYear.period}).`, '',
    'When these numbers keep appearing on clocks, tickets, bills or number plates, pause and notice what you were thinking – that is the message.', '', preparedBy,
  ].join('\n');
}

export function luckySummary(r: LuckyFinderResult, lang: 'en' | 'hi', preparedBy = SIGN): string {
  const n = r.nameNumber;
  if (lang === 'hi') {
    return [
      `शुभ अंक रिपोर्ट – ${r.name}`, `जन्म तिथि: ${r.dob}`, '',
      `मूलांक (मुख्य शुभ अंक): ${r.primary.number} – ${r.primary.planetHindi}`,
      `भाग्यांक: ${r.destiny.master ? `${r.destiny.master}/${r.destiny.number}` : r.destiny.number} – ${r.destiny.planetHindi}`,
      `नामांक: ${n.compound}/${n.single} – भाग्यांक से ${HI_REL[n.relationWithBhagyank]}, मूलांक से ${HI_REL[n.relationWithMoolank]} (स्कोर ${n.score}/100)${n.needsCorrection && n.suggestion ? `; सुझाई गई स्पेलिंग: ${n.suggestion.spelling} (${n.suggestion.compound}/${n.suggestion.single})` : ''}`, '',
      `शुभ अंक: ${r.luckyNumbers.join(', ')}`, `सम अंक: ${r.neutralNumbers.join(', ') || '–'}`, `बचें: ${r.avoidNumbers.join(', ') || '–'}`,
      `शुभ तारीखें: ${r.luckyDates.join(', ')}`, `शुभ दिन: ${r.luckyDays.map((x) => HI_DAY[x] ?? x).join(', ')}`,
      `शुभ रंग: ${r.luckyColours.map(hiColour).join(', ')}${r.avoidColours.length ? ` · बचें: ${r.avoidColours.map(hiColour).join(', ')}` : ''}`,
      `शुभ दिशा (कुआ ${r.kua}): ${r.directions.success}`, `मोबाइल नंबर का शुभ योग: ${r.mobile.idealTotals.join(', ')}`,
      `व्यक्तिगत वर्ष ${r.personalYear.value} (${r.personalYear.period})`, '', preparedBy,
    ].join('\n');
  }
  return [
    `LUCKY NUMBER REPORT – ${r.name}`, `DOB ${r.dob}`, '',
    `Primary lucky number (Mulank): ${r.primary.number} – ${r.primary.planet}`,
    `Destiny number (Bhagyank): ${r.destiny.master ? `${r.destiny.master}/${r.destiny.number}` : r.destiny.number} – ${r.destiny.planet}`,
    `Name number: ${n.compound}/${n.single} (${n.category}) – ${n.relationWithBhagyank} to Bhagyank, ${n.relationWithMoolank} to Mulank, score ${n.score}/100${n.needsCorrection && n.suggestion ? `. Suggested spelling: ${n.suggestion.spelling} (${n.suggestion.compound}/${n.suggestion.single}, score ${n.suggestion.score})` : ''}`, '',
    `Lucky numbers: ${r.luckyNumbers.join(', ')}`, `Neutral numbers: ${r.neutralNumbers.join(', ') || '–'}`, `Numbers to avoid: ${r.avoidNumbers.join(', ') || '–'}`,
    `Lucky dates: ${r.luckyDates.join(', ')}`, `Lucky days: ${r.luckyDays.join(', ')}`,
    `Lucky colours: ${r.luckyColours.join(', ')}${r.avoidColours.length ? ` · avoid: ${r.avoidColours.join(', ')}` : ''}`,
    `Best direction (Kua ${r.kua}): ${r.directions.success}`, `Mobile number totals that suit you: ${r.mobile.idealTotals.join(', ')}`,
    `Gemstone (${r.gemstone.planet}): ${r.gemstone.name} (${r.gemstone.hindi}) – ${r.gemstone.caution}`,
    `Current Personal Year ${r.personalYear.value} (${r.personalYear.period})`, '', preparedBy,
  ].join('\n');
}
