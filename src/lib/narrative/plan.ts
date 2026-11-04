/**
 * Report plan: which sections a report contains, the facts each section may use (a slice of the
 * engine JSON), the knowledge-base keys to attach, and a short brief for the writer.
 */
import type { NumerologyResult } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';

export type NarrativeLanguage = 'en' | 'hi' | 'hinglish';

export type SectionId =
  | 'intro' | 'moolank' | 'bhagyank' | 'combination' | 'loshu' | 'missing' | 'kua' | 'forecast' | 'lifePeriods'
  | 'career' | 'relationships' | 'wellbeing' | 'name' | 'mobile' | 'aadhaar' | 'couple' | 'remedies' | 'closing';

export interface SectionPlan {
  id: SectionId;
  title: { en: string; hi: string };
  facts: Record<string, unknown>;
  kbKeys: string[];
  brief: string;
  targetWords: [number, number];
}

export type AgeStage = 'student' | 'youngProfessional' | 'settling' | 'midLife' | 'senior';

export function ageStage(age: number): AgeStage {
  if (age < 22) return 'student';
  if (age < 30) return 'youngProfessional';
  if (age < 45) return 'settling';
  if (age < 60) return 'midLife';
  return 'senior';
}

export interface ClientContext {
  address: string; // "Rahul ji"
  firstName: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  stage: AgeStage;
  profession?: string;
  maritalStatus?: string;
  city?: string;
  concerns: string[];
  language: NarrativeLanguage;
  currentYear: number;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

export function clientContext(r: NumerologyResult, language?: NarrativeLanguage): ClientContext {
  const c = r.client;
  const firstName = titleCase((c.commonName || c.fullName).trim().split(/\s+/)[0]);
  return {
    address: `${firstName} ji`,
    firstName,
    fullName: c.commonName || c.fullName,
    gender: c.gender,
    age: r.results.dob.age,
    stage: ageStage(r.results.dob.age),
    profession: c.profession,
    maritalStatus: c.maritalStatus,
    city: c.city,
    concerns: c.concerns ?? [],
    language: language ?? c.language ?? 'en',
    currentYear: Number(r.asOf.slice(0, 4)),
  };
}

const keyify = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

export function buildPlan(r: NumerologyResult, ctx: ClientContext): SectionPlan[] {
  const { dob, name, mobile, aadhaar, couple, remedies } = r.results;
  const m = dob.moolank.value, b = dob.bhagyank.value;
  const py = dob.personalCycles;
  const sections: SectionPlan[] = [];
  const add = (s: SectionPlan) => sections.push(s);

  add({
    id: 'intro', title: { en: 'Your Numerology at a Glance', hi: 'आपका अंक ज्योतिष एक नज़र में' },
    facts: {
      age: ctx.age, profession: ctx.profession, maritalStatus: ctx.maritalStatus, city: ctx.city, concerns: ctx.concerns,
      moolank: m, moolankPlanet: planetOf(m).name, bhagyank: b, bhagyankPlanet: planetOf(b).name, kua: dob.kua.value,
      nameNumber: name?.chaldean.nameNumber.single ?? null, personalYear: py.current.personalYear, currentYear: ctx.currentYear,
    },
    kbKeys: [`NUMBER_${m}`],
    brief: 'Greet the client warmly by name, introduce their core numbers in one flowing overview, and say which of their concerns this report focuses on.',
    targetWords: [90, 150],
  });

  add({
    id: 'moolank', title: { en: 'Moolank – Your Inner Nature', hi: 'मूलांक – आपका स्वभाव' },
    facts: { moolank: m, birthDay: dob.moolank.compound, planet: planetOf(m).name, planetHindi: planetOf(m).hindiName },
    kbKeys: [`NUMBER_${m}`, `MOOLANK_${m}`],
    brief: 'Explain how the Moolank shapes daily personality, habits and first impressions. Strengths first, then the shadow side, then one practical tip.',
    targetWords: [120, 200],
  });

  add({
    id: 'bhagyank', title: { en: 'Bhagyank – Your Path of Destiny', hi: 'भाग्यांक – आपका भाग्य पथ' },
    facts: { bhagyank: b, compound: dob.bhagyank.compound, master: dob.bhagyank.master, planet: planetOf(b).name, planetHindi: planetOf(b).hindiName },
    kbKeys: [`NUMBER_${b}`, `BHAGYANK_${b}`, ...(dob.bhagyank.master ? [`MASTER_${dob.bhagyank.master}`] : [])],
    brief: 'Explain the life path shown by the Bhagyank, where fortune tends to come from, and how the client can work with it.',
    targetWords: [120, 200],
  });

  add({
    id: 'combination', title: { en: 'How Your Numbers Work Together', hi: 'आपके अंकों का मेल' },
    facts: {
      moolank: m, bhagyank: b, relation: dob.moolankBhagyankRelation,
      friendlyNumbers: dob.numberRelations.combined.friendly, enemyNumbers: dob.numberRelations.combined.enemy, luckyNumbers: remedies.lucky.numbers,
    },
    kbKeys: [dob.moolankBhagyankRelation === 'friend' ? 'MOOLANK_BHAGYANK_FRIENDLY' : dob.moolankBhagyankRelation === 'enemy' ? 'MOOLANK_BHAGYANK_CONFLICT' : ''],
    brief: 'Describe whether personality and destiny support each other, and which numbers are friendly or challenging for this client.',
    targetWords: [80, 140],
  });

  const repeated = dob.loShu.repeated;
  add({
    id: 'loshu', title: { en: 'Your Lo Shu Grid', hi: 'आपका लो शू ग्रिड' },
    facts: {
      present: dob.loShu.present, repeated, yogs: dob.loShu.yogs.map((y) => y.name),
      strengthArrows: dob.loShu.arrowsOfStrength.map((a) => a.name),
      completePlanes: [...dob.loShu.planes, ...dob.loShu.diagonals].filter((l) => l.status === 'complete').map((l) => l.name),
    },
    kbKeys: [...repeated.map((x) => `EXCESS_${x.number}`), ...dob.loShu.yogs.map((y) => `YOG_${keyify(y.name)}`), ...dob.loShu.arrowsOfStrength.map((a) => `ARROW_STRENGTH_${a.lineId.toUpperCase()}`)],
    brief: 'Interpret the numbers present in the grid, what repeated numbers mean, and any yogs or arrows of strength.',
    targetWords: [130, 220],
  });

  add({
    id: 'missing', title: { en: 'Missing Numbers & Areas to Strengthen', hi: 'अनुपस्थित अंक और सुधार के क्षेत्र' },
    facts: { missing: dob.loShu.missing, weaknessArrows: dob.loShu.arrowsOfWeakness.map((a) => a.name) },
    kbKeys: [...dob.loShu.missing.map((n) => `MISSING_${n}`), ...dob.loShu.arrowsOfWeakness.map((a) => `ARROW_WEAKNESS_${a.lineId.toUpperCase()}`)],
    brief: 'Explain gently what each missing number asks the client to develop. Never frighten; frame each as a skill to build.',
    targetWords: [120, 220],
  });

  add({
    id: 'kua', title: { en: 'Kua Number & Lucky Directions', hi: 'कुआ अंक और शुभ दिशाएँ' },
    facts: { kua: dob.kua.value, group: dob.kua.group, favourable: dob.kua.favourable, unfavourable: dob.kua.unfavourable },
    kbKeys: [`KUA_${dob.kua.group.toUpperCase()}`],
    brief: 'Explain the Kua group and give practical advice on desk, bed and entrance directions.',
    targetWords: [80, 140],
  });

  add({
    id: 'forecast', title: { en: 'Year-by-Year Forecast', hi: 'वार्षिक भविष्यफल' },
    facts: {
      currentYear: ctx.currentYear, currentPersonalYear: py.current.personalYear, currentPersonalMonth: py.current.personalMonth,
      years: py.timeline.slice(0, 4).map((t) => ({ year: t.year, personalYear: t.personalYear })),
    },
    kbKeys: py.timeline.slice(0, 4).map((t) => `PY_${t.personalYear}`),
    brief: 'Give a specific forecast for the current year and the next three, one short paragraph per year, tied to the client concerns.',
    targetWords: [180, 300],
  });

  const curP = dob.pinnacles.find((p) => p.current);
  add({
    id: 'lifePeriods', title: { en: 'Life Cycles & Pinnacles', hi: 'जीवन चक्र और शिखर' },
    facts: {
      age: ctx.age,
      pinnacles: dob.pinnacles.map((p) => ({ number: p.number, fromAge: p.fromAge, toAge: p.toAge, current: p.current })),
      challenges: dob.challenges.map((c) => ({ number: c.number, fromAge: c.fromAge, toAge: c.toAge, current: c.current })),
    },
    kbKeys: curP ? [`NUMBER_${curP.number}`] : [],
    brief: 'Describe the current pinnacle and challenge with their age ranges, and what the next period brings.',
    targetWords: [110, 190],
  });

  add({
    id: 'career', title: { en: 'Career, Business & Money', hi: 'करियर, व्यवसाय और धन' },
    facts: {
      profession: ctx.profession, stage: ctx.stage, concerns: ctx.concerns, suitableFields: remedies.career.suitableFields,
      careerScore: dob.lifeAreaScores.career, moneyScore: dob.lifeAreaScores.money,
      jobChangeYears: remedies.favourableYears.jobChange?.map((y) => y.year), businessYears: remedies.favourableYears.businessStart?.map((y) => y.year),
    },
    kbKeys: [`BHAGYANK_${b}`],
    brief: 'Give practical career and money guidance for an Indian context (govt vs private job, family business, competitive exams for students) based on the numbers and stated profession.',
    targetWords: [140, 230],
  });

  add({
    id: 'relationships', title: { en: 'Love, Marriage & Family', hi: 'प्रेम, विवाह और परिवार' },
    facts: {
      maritalStatus: ctx.maritalStatus, compatiblePartnerNumbers: remedies.relationship.compatiblePartnerNumbers,
      challengingPartnerNumbers: remedies.relationship.challengingPartnerNumbers,
      marriageYears: remedies.favourableYears.marriage?.map((y) => y.year), loveScore: dob.lifeAreaScores.love, familyScore: dob.lifeAreaScores.family,
    },
    kbKeys: [`RELATION_${m}`],
    brief: 'Discuss relationship style, family life (joint family, in-laws where relevant) and favourable marriage timing based on marital status.',
    targetWords: [120, 200],
  });

  add({
    id: 'wellbeing', title: { en: 'Health & Wellbeing', hi: 'स्वास्थ्य और कल्याण' },
    facts: { healthScore: dob.lifeAreaScores.health, planet: planetOf(m).name },
    kbKeys: [`WELLBEING_${m}`],
    brief: 'Lifestyle and routine advice only. Never predict illness, never name diseases. Remind to consult a doctor for medical matters.',
    targetWords: [70, 120],
  });

  if (name) {
    add({
      id: 'name', title: { en: 'Name Numerology', hi: 'नाम अंक ज्योतिष' },
      facts: {
        name: titleCase(name.analysedName), compound: name.chaldean.nameNumber.compound, nameNumber: name.chaldean.nameNumber.single, category: name.chaldean.nameNumber.category,
        pythagorean: name.pythagorean.nameNumber.single, soulUrge: name.chaldean.soulUrge.single, personality: name.chaldean.personality.single,
        score: name.compatibilityScore, relationWithMoolank: name.relationWithMoolank, relationWithBhagyank: name.relationWithBhagyank,
        needsCorrection: name.needsCorrection,
        corrections: name.needsCorrection ? name.corrections.slice(0, 3).map((c) => ({ spelling: c.fullName, compound: c.compound, nameNumber: c.single, score: c.score })) : [],
      },
      kbKeys: [`NAME_COMPOUND_${name.chaldean.nameNumber.category.toUpperCase()}`, ...(name.needsCorrection ? ['NAME_CORRECTION_HOW'] : [])],
      brief: 'Explain the name vibration, how well it matches the Moolank and Bhagyank, and present correction options if needed.',
      targetWords: [130, 220],
    });
  }

  if (mobile) {
    add({
      id: 'mobile', title: { en: 'Mobile Number Analysis', hi: 'मोबाइल नंबर विश्लेषण' },
      facts: {
        masked: mobile.masked, compound: mobile.total.compound, total: mobile.total.single, score: mobile.score, verdict: mobile.verdict,
        relationWithMoolank: mobile.relationWithMoolank, relationWithBhagyank: mobile.relationWithBhagyank,
        maleficPairs: mobile.maleficPairs, missingNumbersFilled: mobile.missingNumbersFilled, idealTotals: mobile.suggestion.idealTotals,
      },
      kbKeys: [`MOBILE_${keyify(mobile.verdict)}`],
      brief: 'Explain the vibration of the mobile number, any difficult digit pairs, and what to look for if changing it.',
      targetWords: [100, 170],
    });
  }

  if (aadhaar) {
    add({
      id: 'aadhaar', title: { en: 'Aadhaar Number Vibration', hi: 'आधार नंबर कंपन' },
      facts: { masked: aadhaar.masked, total: aadhaar.total.single, compound: aadhaar.total.compound, verdict: aadhaar.verdict, relationWithBhagyank: aadhaar.relationWithBhagyank, missingNumbersFilled: aadhaar.gridEffect.missingNumbersFilled },
      kbKeys: ['AADHAAR_NOTE'],
      brief: 'Brief, reassuring note on the Aadhaar vibration. Only ever refer to it in masked form.',
      targetWords: [60, 110],
    });
  }

  if (couple) {
    add({
      id: 'couple', title: { en: 'Couple Compatibility', hi: 'दंपति मिलान' },
      facts: {
        partnerName: titleCase(couple.partnerB.name), overall: couple.overall, areaScores: couple.areaScores,
        moolankHarmony: couple.relations.moolank.harmony, bhagyankHarmony: couple.relations.bhagyank.harmony,
        partnerMoolank: couple.partnerB.moolank, partnerBhagyank: couple.partnerB.bhagyank,
        bothMissing: couple.combinedGrid.bothMissing, marriageDateNumbers: couple.marriage.favourableDateNumbers,
        auspiciousYears: couple.marriage.auspiciousYears.map((y) => y.year),
      },
      kbKeys: ['COUPLE_GENERAL', `RELATION_${couple.partnerB.moolank}`],
      brief: 'Discuss the strongest and weakest areas of compatibility, what each partner brings, and favourable marriage dates and years.',
      targetWords: [150, 250],
    });
  }

  add({
    id: 'remedies', title: { en: 'Your Remedies (Upay)', hi: 'आपके उपाय' },
    facts: {
      luckyNumbers: remedies.lucky.numbers, luckyDays: remedies.lucky.days, luckyColours: remedies.lucky.colours, avoidColours: remedies.lucky.avoidColours,
      gemstone: remedies.gemstones[0].name, gemstoneHindi: remedies.gemstones[0].hindi, rudraksha: remedies.gemstones[0].rudraksha,
      mantra: remedies.mantra.mantra, mantraCount: remedies.mantra.dailyCount, mantraDay: remedies.mantra.day, deity: remedies.mantra.deity,
      daan: remedies.daan, fastingDay: remedies.fastingDay,
      gridRemedies: remedies.loShuRemedies.map((x) => ({ number: x.number, placement: x.placement, wristband: x.wristband })),
      habits: remedies.dailyHabits,
    },
    kbKeys: ['REMEDY_GEM_NOTE'],
    brief: 'Present the remedies as a simple, doable plan: daily, weekly and home changes. Include the gemstone caution.',
    targetWords: [160, 260],
  });

  add({
    id: 'closing', title: { en: 'A Closing Word', hi: 'अंतिम शब्द' },
    facts: { currentYear: ctx.currentYear, personalYear: py.current.personalYear, nextYear: ctx.currentYear + 1, nextPersonalYear: py.timeline[1]?.personalYear },
    kbKeys: ['CLOSING'],
    brief: 'End warmly and personally, encouraging the client to act on the remedies.',
    targetWords: [60, 110],
  });

  return sections.map((s) => ({ ...s, kbKeys: s.kbKeys.filter(Boolean) }));
}
