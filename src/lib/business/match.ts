/**
 * Maps free text ("cafe, cloth shop and CA practice") to catalogue ids – used to pre-fill the admin
 * report generator from a customer's booking form. Unmatched phrases are returned so nothing is lost.
 */
import { ITEMS, type BizItem } from './catalogue';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set(['and', 'the', 'shop', 'store', 'business', 'services', 'service', 'company', 'centre', 'center', 'unit', 'for', 'own', 'my', 'new', 'small', 'firm', 'agency', 'online', 'of', 'a']);
const SYN: Record<string, string> = { clothes: 'garments', clothing: 'garments', kapda: 'cloth', dukaan: 'shop', medical: 'medical', chemist: 'chemist', hotel: 'hotel', dhaba: 'dhaba', parlour: 'parlour', parlor: 'parlour', salon: 'salon', grocery: 'grocery', kirana: 'kirana', ca: 'ca', property: 'property', software: 'software', it: 'it', gym: 'gym', school: 'school', coaching: 'coaching', tuition: 'tuition', restaurant: 'restaurant', cafe: 'cafe', bakery: 'bakery', transport: 'transport', petrol: 'petrol', dairy: 'dairy', jewellery: 'jewellery', jewelry: 'jewellery' };
const words = (s: string) => norm(s).split(' ').filter((w) => w && w !== 'and').map((w) => SYN[w] ?? w);
const pos = new Map<string, number>();
const INDEX = ITEMS.map((it) => { const p = pos.get(it.group) ?? 0; pos.set(it.group, p + 1); return { it, w: new Set(words(it.label)), g: new Set(words(it.group)), n: norm(it.label), p }; });

export function matchCategory(phrase: string): BizItem | null {
  const n = norm(phrase); if (n.length < 2) return null;
  const exact = INDEX.find((x) => x.n === n); if (exact) return exact.it;
  const all = words(phrase);
  const qw = all.filter((w) => !STOP.has(w) && (w.length >= 3 || w === 'ca' || w === 'it'));
  const sw = all.filter((w) => STOP.has(w) && w.length >= 3);
  if (!qw.length) return null;
  let best: { it: BizItem; s: number; p: number; k: number } | null = null;
  for (const x of INDEX) {
    const hit = qw.filter((w) => x.w.has(w) || [...x.w].some((lw) => lw.length >= 4 && (lw.startsWith(w) || w.startsWith(lw)))).length;
    if (!hit) continue;
    const s = hit / qw.length + (sw.length ? 0.1 * sw.filter((w) => x.w.has(w)).length / sw.length : 0)
      + (qw.some((w) => x.g.has(w)) ? 0.08 : 0) + (x.it.kind === 'business' ? 0.02 : 0) + (x.n.startsWith(qw[0]) ? 0.03 : 0);
    const tie = best && Math.abs(s - best.s) < 1e-9;
    if (!best || s > best.s + 1e-9 || (tie && (x.w.size < best.k || (x.w.size === best.k && x.p < best.p)))) best = { it: x.it, s, p: x.p, k: x.w.size };
  }
  return best && best.s >= 0.5 ? best.it : null;
}

/** Splits a customer's text into phrases and maps each to a category. */
export function matchCategories(text: string, max = 20): { ids: string[]; unmatched: string[] } {
  const ids: string[] = []; const unmatched: string[] = [];
  for (const raw of text.split(/[,;\n/|]+|\s+(?:and|or|aur|ya)\s+/i)) {
    const p = raw.trim(); if (!p) continue;
    const m = matchCategory(p);
    if (m) { if (!ids.includes(m.id) && ids.length < max) ids.push(m.id); } else unmatched.push(p);
  }
  return { ids, unmatched };
}
