/**
 * Business / Profession Compatibility – analytical engine. Pure and deterministic.
 * Scores every business and profession against the person's Bhagyank, Moolank, name number and Lo Shu grid,
 * then adds practical filters (capital, risk appetite, interests), timing, place and business-name checks.
 */
import { analyseDob, analyseNameSystem, type DateParts } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { relationOf, RELATION_TABLE, type Relation } from '@/lib/numerology/data/relations';
import { compoundCategory } from '@/lib/numerology/data/tables';
import { ITEMS, YEAR_TIMING, type BizItem, type Kind } from './catalogue';

export interface BizInput {
  fullName: string; commonName?: string; dob: DateParts; gender: 'male' | 'female' | 'other';
  birthPlace: string; currentCity?: string; businessName?: string;
  mode: 'business' | 'profession' | 'both'; capital: 1 | 2 | 3; risk: 'low' | 'medium' | 'high';
  interests: string[]; asOf: DateParts;
}

const REL_SCORE: Record<Relation, number> = { friend: 100, neutral: 60, enemy: 15 };
const W = [1, 0.7, 0.5];

function placeNumber(text: string, b: number, m: number) {
  try {
    const r = analyseNameSystem(text, 'chaldean');
    const n = r.nameNumber.single;
    return { text: r.name, compound: r.nameNumber.compound, single: n, toBhagyank: relationOf(b, n), toMoolank: relationOf(m, n), score: Math.round(0.6 * REL_SCORE[relationOf(b, n)] + 0.4 * REL_SCORE[relationOf(m, n)]) };
  } catch { return null; }
}

/** Favourable compound totals (10–52) for each friendly number – used for business-name suggestions. */
function goodTotals(friendly: number[]) {
  const out: { single: number; compounds: number[] }[] = [];
  for (const f of friendly) {
    const c: number[] = [];
    for (let x = 10; x <= 52 && c.length < 3; x++) { let r = x; while (r > 9) r = String(r).split('').reduce((a, d) => a + +d, 0); if (r === f && compoundCategory(x) === 'favourable') c.push(x); }
    out.push({ single: f, compounds: c });
  }
  return out;
}

export function businessAnalytics(i: BizInput) {
  const dob = analyseDob({ dob: i.dob, gender: i.gender }, { asOf: i.asOf });
  const m = dob.moolank.value, b = dob.bhagyank.value;
  const name = analyseNameSystem(i.commonName?.trim() || i.fullName, 'chaldean');
  const nn = name.nameNumber.single;
  const counts = dob.loShu.counts;
  const gridScore = (k: number) => (counts[k] === 0 ? 30 : counts[k] >= 3 ? 70 : 100);

  const numberStrength = Array.from({ length: 9 }, (_, x) => x + 1).map((k) => {
    const s = 0.4 * (k === b ? 100 : REL_SCORE[relationOf(b, k)]) + 0.25 * (k === m ? 100 : REL_SCORE[relationOf(m, k)]) + 0.15 * (k === nn ? 100 : REL_SCORE[relationOf(nn, k)]) + 0.2 * gridScore(k);
    return { n: k, planet: planetOf(k).name, score: Math.round(s), inGrid: counts[k] };
  });
  const strengthOf = (k: number) => numberStrength[k - 1].score;

  const scoreItem = (it: BizItem) => {
    const num = it.numbers.reduce((a, k, j) => a + W[j] * strengthOf(k), 0) / W.slice(0, it.numbers.length).reduce((a, x) => a + x, 0);
    const factors: string[] = [];
    let adj = 0;
    if (it.numbers.includes(b)) { adj += 5; factors.push(`Bhagyank ${b} is a key number`); }
    if (it.numbers.includes(m)) { adj += 3; factors.push(`Moolank ${m} is a key number`); }
    if (relationOf(b, it.numbers[0]) === 'enemy') { adj -= 8; factors.push(`Main number ${it.numbers[0]} is unfriendly to Bhagyank ${b}`); }
    if (counts[it.numbers[0]] === 0) factors.push(`Number ${it.numbers[0]} is missing in the Lo Shu grid`);
    if (it.kind === 'business') {
      const gap = it.capital - i.capital; if (gap > 0) { adj -= 8 * gap; factors.push('Needs more capital than planned'); }
      if (i.risk === 'low' && it.capital === 3) { adj -= 5; factors.push('High-investment, higher-risk model'); }
      if (i.risk === 'high' && it.capital === 3) adj += 2;
    }
    if (i.interests.includes(it.sector)) { adj += 5; factors.push('Matches stated interest'); }
    const score = Math.max(5, Math.min(97, Math.round(8 + 0.82 * num + adj)));
    return { id: it.id, label: it.label, sector: it.sector, kind: it.kind as Kind, numbers: it.numbers, capital: it.capital, numerologyFit: Math.round(num), score, factors };
  };

  const pool = ITEMS.filter((it) => i.mode === 'both' || it.kind === i.mode);
  const ranked = pool.map(scoreItem).sort((x, y) => y.score - x.score || y.numerologyFit - x.numerologyFit || x.capital - y.capital);
  const sectorScores = Object.entries(ranked.reduce<Record<string, number[]>>((acc, r) => { (acc[r.sector] ??= []).push(r.score); return acc; }, {}))
    .map(([sector, xs]) => ({ sector, score: Math.round(xs.sort((a, c) => c - a).slice(0, 2).reduce((a, c) => a + c, 0) / Math.min(2, xs.length)) })).sort((x, y) => y.score - x.score);

  const timing = dob.personalCycles.timeline.slice(0, 9).map((t) => ({ year: t.year, personalYear: t.personalYear, ...YEAR_TIMING[t.personalYear] }));
  const bizName = i.businessName?.trim() ? (() => {
    try {
      const r = analyseNameSystem(i.businessName!, 'chaldean'); const s = r.nameNumber.single;
      const cat = compoundCategory(r.nameNumber.compound);
      const score = Math.round(0.5 * REL_SCORE[relationOf(b, s)] + 0.3 * REL_SCORE[relationOf(m, s)] + 0.2 * (cat === 'favourable' ? 100 : cat === 'mixed' ? 60 : 20));
      return { text: r.name, compound: r.nameNumber.compound, single: s, category: cat, toBhagyank: relationOf(b, s), toMoolank: relationOf(m, s), score };
    } catch { return null; }
  })() : null;
  const pl = planetOf(b);

  return {
    person: {
      moolank: m, bhagyank: b, bhagyankMaster: dob.bhagyank.master, nameNumber: nn, nameCompound: name.nameNumber.compound, nameUsed: name.name,
      nameToBhagyank: relationOf(b, nn), moolankBhagyank: dob.moolankBhagyankRelation, kua: dob.kua.value,
      planet: { name: pl.name, weekday: pl.weekday, colours: pl.colours, careers: pl.careers },
      friendly: RELATION_TABLE[b].friend, avoid: RELATION_TABLE[b].enemy,
    },
    grid: { counts, missing: dob.loShu.missing, repeated: dob.loShu.repeated, yogs: dob.loShu.yogs.map((y) => y.name), strengths: dob.loShu.arrowsOfStrength.map((a) => a.name), weaknesses: dob.loShu.arrowsOfWeakness.map((a) => a.name) },
    lifeAreas: dob.lifeAreaScores,
    numberStrength,
    top: ranked.slice(0, 10),
    avoid: ranked.slice(-5).reverse(),
    all: ranked,
    sectorScores,
    timing,
    currentYear: { personalYear: dob.personalCycles.current.personalYear, ...YEAR_TIMING[dob.personalCycles.current.personalYear] },
    places: { birth: placeNumber(i.birthPlace, b, m), current: i.currentCity?.trim() ? placeNumber(i.currentCity, b, m) : null },
    businessName: bizName,
    nameTargets: goodTotals(RELATION_TABLE[b].friend.filter((x) => (x !== 4 && x !== 8) || x === b)),
    directions: { success: dob.kua.favourable.success, growth: dob.kua.favourable.personalGrowth, avoid: dob.kua.unfavourable.totalLoss, group: dob.kua.group },
    overall: Math.round(0.6 * ranked[0].score + 0.4 * (ranked.slice(0, 5).reduce((a, r) => a + r.score, 0) / 5)),
  };
}
export type BizAnalytics = ReturnType<typeof businessAnalytics>;
