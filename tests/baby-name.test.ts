import { describe, expect, it } from 'vitest';
import { analyseBabyName, letterClass } from '@/lib/baby-name/analysis';
import { buildBabyCoverHtml, buildBabyReportHtml } from '@/lib/baby-name/report';
import { NAME_BANK, parseLetters, startsWithAny } from '@/lib/baby-name/names';
import { shortForms } from '@/lib/baby-name/nicknames';
import { DEFAULT_BRANDING, resolveTheme } from '@/lib/pdf/themes';

// Hand-checked: 14-10-2026 → Moolank 1+4 = 5, Bhagyank 1+4+1+0+2+0+2+6 = 16 → 7.
// Chaldean: ABHINAV = 1+2+5+1+5+1+6 = 21 → 3; SHARMA = 3+5+1+2+4+1 = 16; ABHINAV SHARMA = 37 → 1 (friend of 7).
const base = { dob: '2026-10-14', gender: 'boy' as const, surname: 'Sharma', fatherName: 'Rahul Sharma', motherName: 'Priya Sharma', letters: 'A, Sh', candidates: ['Aarav', 'Shaurya', 'Vivaan'], asOf: '2026-11-26' };

describe('baby name analysis', () => {
  const r = analyseBabyName(base);
  it('birth numbers and lucky totals', () => {
    expect(r.core.moolank.value).toBe(5);
    expect(r.core.bhagyank.value).toBe(7);
    expect(r.lucky.singles).toEqual([1, 7]); // friends of 7 = 1,2,4,7; 2 is against Moolank 5; 4 is heavy
    expect(r.grid.missing).toEqual([3, 8, 9]);
  });
  it('scores names with the Chaldean chart', () => {
    const a = r.ranked.find((x) => x.first === 'Abhinav')!;
    expect(a.firstNum).toMatchObject({ compound: 21, single: 3 });
    expect(a.fullNum).toMatchObject({ compound: 37, single: 1 });
    expect(a.relB).toBe('friend');
    expect(a.fillsMissing).toBe(true);
    const aarav = r.family.find((x) => x.first === 'Aarav')!;
    expect(aarav.fullNum).toMatchObject({ compound: 27, single: 9 }); // 9 is against Bhagyank 7
    expect(aarav.score).toBeLessThanOrEqual(55);
    expect(aarav.tweaks.every((t) => t.score > aarav.score)).toBe(true);
  });
  it('ranks names in the preferred letters first and keeps family names', () => {
    expect(r.family.map((x) => x.first)).toEqual(['Aarav', 'Shaurya', 'Vivaan']);
    expect(r.top).toHaveLength(3);
    expect(r.top.every((x) => x.score >= 65 && startsWithAny(x.first, ['A', 'SH']))).toBe(true);
    const band = (x: (typeof r.ranked)[number]) => (x.score >= 65 && (x.source === 'family' || x.matchesLetters) ? 0 : 1);
    for (let i = 1; i < r.ranked.length; i++) {
      expect(band(r.ranked[i - 1])).toBeLessThanOrEqual(band(r.ranked[i]));
      if (band(r.ranked[i - 1]) === band(r.ranked[i])) expect(r.ranked[i - 1].score).toBeGreaterThanOrEqual(r.ranked[i].score);
    }
  });
  it('letters and ceremony dates', () => {
    expect(letterClass(1, 5, 7)).toBe('lucky'); // A
    expect(letterClass(2, 5, 7)).toBe('avoid'); // B – 2 is against Moolank 5
    expect(r.ceremony.length).toBeGreaterThan(0);
    expect(r.ceremony[0].iso >= '2026-11-26').toBe(true);
    expect(r.ceremony.every((d) => [1, 7].includes(d.dateNumber))).toBe(true);
  });
  it('works without surname, parents or candidates', () => {
    const x = analyseBabyName({ dob: '2025-03-09', gender: 'girl', asOf: '2026-01-01' });
    expect(x.family).toHaveLength(0);
    expect(x.ranked.every((e) => e.fullNum === null && e.parts.family === null)).toBe(true);
    expect(x.suggestions.every((e) => e.bank && e.bank.g !== 'b')).toBe(true);
  });
  it('rejects an empty request', () => {
    expect(() => analyseBabyName({ dob: '2025-03-09', suggest: false })).toThrow();
  });
  it('report HTML: cover, fresh-page sections, CTA', () => {
    const t = resolveTheme('royal-gold-maroon');
    for (const lang of ['en', 'hi'] as const) {
      const html = buildBabyReportHtml(r, t, DEFAULT_BRANDING, { lang, preparedBy: 'Acharya Nandram' });
      // 9 earlier sections + formal & nickname page (default "both") + remedies page.
      expect((html.match(/<section class="page">/g) ?? []).length).toBe(11);
      expect(html).toContain('class="cta"');
      const cover = buildBabyCoverHtml(r, t, DEFAULT_BRANDING, { lang, preparedBy: 'Acharya Nandram' });
      expect(cover).toContain(r.top[0].full);
    }
  });
});

describe('formal name, nickname, correction and remedies', () => {
  const r = analyseBabyName({ ...base, candidates: [], currentName: 'Aarav', currentNickname: 'Golu' });
  it('checks the current name and recommends a corrected spelling with the same sound', () => {
    expect(r.current?.first).toBe('Aarav');
    expect(r.current?.score).toBeLessThanOrEqual(55); // 27/9 – against Bhagyank 7
    expect(r.correction?.advice).toBe('spelling');
    expect(r.correction?.recommended.first.startsWith('Aarav')).toBe(true);
    expect(r.correction!.recommended.score).toBeGreaterThanOrEqual(65);
    expect(r.top[0]).toBe(r.correction?.recommended); // the corrected name leads the report
  });
  it('does not keep a nickname that clashes with the formal name', () => {
    const n = r.nickname!;
    expect(n.current?.name).toBe('Golu');
    expect(n.current?.relFormal).toBe('enemy');
    expect(n.advice).toBe('change');
    expect(n.recommended?.name).not.toBe('Golu');
    expect(n.suggestions.length).toBeGreaterThan(2);
    expect(n.suggestions.every((x) => x.relFormal !== 'enemy' && x.relB !== 'enemy')).toBe(true);
  });
  it('makes natural short forms', () => {
    expect(shortForms('Abhinav')).toContain('Abhi');
    expect(shortForms('Aarav')).toContain('Aaru');
    expect(shortForms('Abhinav')).not.toContain('Abu');
  });
  it('remedies follow the birth numbers; formal-only has no nickname page', () => {
    expect(r.remedies.missing.map((x) => x.n)).toEqual([3, 8, 9]);
    expect(r.remedies.planets.map((x) => x.n)).toEqual([5, 7]);
    const f = analyseBabyName({ ...base, nameFor: 'formal' });
    expect(f.nickname).toBeNull();
    const html = buildBabyReportHtml(r, resolveTheme('royal-gold-maroon'), DEFAULT_BRANDING, { lang: 'en', preparedBy: 'Acharya Nandram' });
    expect((html.match(/<section class="page">/g) ?? []).length).toBe(12); // + current name page
    expect(html).toContain('No gemstones');
  });
});

describe('name bank', () => {
  it('has unique, valid entries', () => {
    expect(NAME_BANK.length).toBeGreaterThan(180);
    expect(new Set(NAME_BANK.map((x) => x.n)).size).toBe(NAME_BANK.length);
    expect(NAME_BANK.every((x) => /^[A-Z][a-z]+$/.test(x.n) && x.hi && x.en && x.hm)).toBe(true);
  });
  it('parses letters', () => {
    expect(parseLetters('a, Sh / k;  a')).toEqual(['A', 'SH', 'K']);
  });
});

describe('baby names for families abroad (as per country)', () => {
  it('maps countries to naming cultures (name or code; unknown → English)', async () => {
    const { nameStyleForCountry } = await import('@/lib/baby-name/world-names');
    expect(nameStyleForCountry('India')).toBe('indian');
    expect(nameStyleForCountry('')).toBe('indian');
    expect(nameStyleForCountry('United States')).toBe('english');
    expect(nameStyleForCountry('UK')).toBe('english');
    expect(nameStyleForCountry('United Arab Emirates')).toBe('arabic');
    expect(nameStyleForCountry('Spain')).toBe('spanish');
    expect(nameStyleForCountry('BR')).toBe('portuguese');
    expect(nameStyleForCountry('Germany')).toBe('german');
    expect(nameStyleForCountry('Malaysia')).toBe('malay');
    expect(nameStyleForCountry('Japan')).toBe('english');
  });

  it('every bank has boys and girls, unique spellings and Hindi meanings', async () => {
    const { WORLD_BANKS } = await import('@/lib/baby-name/world-names');
    for (const [style, bank] of Object.entries(WORLD_BANKS)) {
      expect(bank.filter((x) => x.g !== 'g').length, style).toBeGreaterThanOrEqual(10);
      expect(bank.filter((x) => x.g !== 'b').length, style).toBeGreaterThanOrEqual(10);
      expect(new Set(bank.map((x) => x.n.toUpperCase())).size, style).toBe(bank.length);
      expect(bank.every((x) => x.hi && x.en && x.hm), style).toBe(true);
    }
  });

  it('suggests names from the selected country and scores accented spellings correctly', async () => {
    const { WORLD_BANKS } = await import('@/lib/baby-name/world-names');
    const us = analyseBabyName({ dob: '2026-10-14', gender: 'girl', country: 'United States', asOf: '2026-11-26' });
    expect(us.nameStyle).toEqual({ style: 'english', mix: false });
    expect(us.suggestions.length).toBeGreaterThan(0);
    expect(us.suggestions.every((x) => WORLD_BANKS.english.some((b) => b.n === x.first))).toBe(true);
    expect(us.suggestions.every((x) => x.bank?.g !== 'b')).toBe(true);

    const es = analyseBabyName({ dob: '2026-10-14', gender: 'girl', country: 'Spain', candidates: ['Lucía'], suggest: false, asOf: '2026-11-26' });
    const lucia = es.family[0];
    expect(lucia.bank?.en).toBe('Light'); // meaning found in the Spanish bank
    // L3 U6 C3 I1 A1 = 14 → 5 (accent ignored)
    expect(lucia.firstNum).toMatchObject({ compound: 14, single: 5 });

    const mix = analyseBabyName({ dob: '2026-10-14', gender: 'boy', country: 'Canada', nameStyle: 'mix', asOf: '2026-11-26' });
    expect(mix.nameStyle.mix).toBe(true);
    const pool = new Set([...WORLD_BANKS.english, ...WORLD_BANKS.indian].map((b) => b.n));
    expect(mix.suggestions.every((x) => pool.has(x.first))).toBe(true);

    const india = analyseBabyName({ ...base, country: 'India' });
    expect(india.nameStyle.style).toBe('indian');
    expect(india.suggestions.map((x) => x.first)).toEqual(r0.suggestions.map((x) => x.first)); // unchanged for Indian families
  });

  it('English report for a family abroad: culture named, no Devanagari, registration tip instead of mantra', () => {
    const us = analyseBabyName({ dob: '2026-10-14', gender: 'girl', surname: 'Miller', country: 'United States', asOf: '2026-11-26' });
    const html = buildBabyReportHtml(us, resolveTheme('royal-gold-maroon'), DEFAULT_BRANDING, { lang: 'en', preparedBy: 'Acharya Nandram' });
    expect(html).toContain('English (international) names (for United States)');
    expect(html).toContain('Spelling and registration');
    expect(html).not.toMatch(/[ऀ-ॿ]/); // no Devanagari anywhere in the English report
    const hi = buildBabyReportHtml(us, resolveTheme('royal-gold-maroon'), DEFAULT_BRANDING, { lang: 'hi', preparedBy: 'Acharya Nandram' });
    expect(hi).toContain('United States के लिए');
  });
});
const r0 = analyseBabyName(base);
