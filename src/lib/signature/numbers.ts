/** Deterministic numerology facts that ground the signature analysis (never invented by the AI). */
import { analyseNameSystem, bhagyank, moolank, type DateParts } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { mutualHarmony, relationOf, RELATION_TABLE, type Relation } from '@/lib/numerology/data/relations';
import { CHALDEAN } from '@/lib/numerology/data/tables';
import { PROFESSIONS } from './catalogue';

export interface SignatureNumbers {
  moolank: number; bhagyank: number; bhagyankMaster: number | null;
  fullName: { text: string; compound: number; single: number };
  signName: { text: string; compound: number; single: number };
  firstLetter: { letter: string; value: number };
  nameToBhagyank: Relation; nameToMoolank: Relation; signToBhagyank: Relation;
  friendly: number[]; avoid: number[];
  profession: { label: string; numbers: number[]; fitScore: number; note: string };
  planet: { name: string; weekday: string; colours: string[]; signatureTip: string; careers: string[] };
  numerologyScore: number;
}

const rel = (r: Relation) => (r === 'friend' ? 100 : r === 'neutral' ? 60 : 20);

export function signatureNumbers(input: { fullName: string; signatureName?: string; dob: DateParts; professionId: string; professionText?: string }): SignatureNumbers {
  const m = moolank(input.dob.day).value; const b = bhagyank(input.dob);
  const full = analyseNameSystem(input.fullName, 'chaldean');
  const sign = analyseNameSystem(input.signatureName?.trim() || input.fullName, 'chaldean');
  const first = sign.name.replace(/[^A-Z]/g, '')[0] ?? 'A';
  const nameToBhagyank = relationOf(b.value, full.nameNumber.single);
  const nameToMoolank = relationOf(m, full.nameNumber.single);
  const signToBhagyank = relationOf(b.value, sign.nameNumber.single);
  const prof = PROFESSIONS.find((p) => p.id === input.professionId) ?? PROFESSIONS[PROFESSIONS.length - 1];
  const pn = prof.numbers;
  const fit = pn.length
    ? Math.round(Math.max(...pn.map((n) => Math.max(mutualHarmony(b.value, n), sign.nameNumber.single === n ? 100 : 0, m === n ? 95 : 0))))
    : 60;
  const p = planetOf(b.value);
  const row = RELATION_TABLE[b.value];
  return {
    moolank: m, bhagyank: b.value, bhagyankMaster: b.master,
    fullName: { text: full.name, compound: full.nameNumber.compound, single: full.nameNumber.single },
    signName: { text: sign.name, compound: sign.nameNumber.compound, single: sign.nameNumber.single },
    firstLetter: { letter: first, value: CHALDEAN[first] ?? 0 },
    nameToBhagyank, nameToMoolank, signToBhagyank,
    friendly: row.friend, avoid: row.enemy,
    profession: { label: prof.id === 'other' ? (input.professionText || 'Other') : prof.label, numbers: pn, fitScore: fit,
      note: pn.length ? `${prof.label} is traditionally supported by numbers ${pn.join(', ')}.` : 'No fixed number mapping for this profession; judged from Bhagyank and name harmony.' },
    planet: { name: p.name, weekday: p.weekday, colours: p.colours, signatureTip: p.signatureTip, careers: p.careers },
    numerologyScore: Math.round(0.4 * rel(signToBhagyank) + 0.25 * rel(nameToBhagyank) + 0.15 * rel(nameToMoolank) + 0.2 * fit),
  };
}
