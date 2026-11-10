import { describe, expect, it } from 'vitest';
import { NUMBER_POSTS, buildNumberPost } from '@/lib/blog/numbers';
import { generateNumerology } from '@/lib/numerology';

const ALLOW = /^(PDF|GST|DD-MM-YYYY|HR|IT|NGO|Aa)$/;
const flat = (p: ReturnType<typeof buildNumberPost>) => [p.h1, p.title, ...p.sections.flatMap((s) => [s.title, ...s.blocks.flatMap((b) => b.kind === 'p' ? [b.text] : b.kind === 'list' ? b.items : b.kind === 'table' ? [...b.head, ...b.rows.flat()] : b.kind === 'cards' || b.kind === 'steps' ? b.items.flatMap((x) => [x.title, x.text]) : [])]), ...p.faqs.flatMap((f) => [f.q, f.a])];

describe('Mulank & Bhagyank blog posts', () => {
  it('has 18 unique posts', () => {
    expect(NUMBER_POSTS).toHaveLength(18);
    expect(new Set(NUMBER_POSTS.map((p) => p.slug)).size).toBe(18);
  });
  for (const { kind, n } of NUMBER_POSTS) {
    it(`${kind} ${n}: SEO basics, parallel Hindi, Devanagari only`, () => {
      const en = buildNumberPost(kind, n, 'en'), hi = buildNumberPost(kind, n, 'hi');
      expect(en.description.length).toBeLessThanOrEqual(160);
      expect(en.title.length).toBeLessThanOrEqual(75);
      expect(en.wordCount).toBeGreaterThan(1000);
      expect(en.faqs.length).toBeGreaterThanOrEqual(6);
      expect(hi.sections.map((s) => s.id)).toEqual(en.sections.map((s) => s.id));
      expect(en.sections.map((s) => s.id)).toContain('calculators');
      const latin = flat(hi).flatMap((t) => (t.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).filter((w) => !ALLOW.test(w)));
      expect(latin).toEqual([]);
    });
  }
  it('Bhagyank calculation examples are correct (checked with the engine)', () => {
    for (let n = 1; n <= 9; n++) {
      const steps = buildNumberPost('bhagyank', n, 'en').sections.find((s) => s.id === 'calculate')!.blocks.find((b) => b.kind === 'steps');
      expect(steps && steps.kind === 'steps' && steps.items.length).toBe(3);
      for (const x of (steps as { items: { title: string }[] }).items) {
        const [d, m, y] = x.title.split('-');
        const r = generateNumerology({ fullName: 'Test Name', dob: `${y}-${m}-${d}`, gender: 'male' }, { asOf: '2026-11-10', modules: ['dob'] });
        expect(r.results.dob.bhagyank.value).toBe(n);
      }
    }
  });
});
