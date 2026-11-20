import { describe, expect, it } from 'vitest';
import { TOPIC_POSTS, buildTopic } from '@/lib/blog/topics';
import { postText } from '@/lib/blog/topic-kit';
import { NUMBER_POSTS } from '@/lib/blog/numbers';
import { CITIES, postSlug } from '@/lib/blog/cities';

/** Words allowed in Hindi text: PDF, and all-caps Latin used for Chaldean letters / example names. */
const ALLOW = /^(PDF|DD-MM-YYYY|[A-Z]{1,12}-?)$/;

describe('Topic articles (100+)', () => {
  it('has 100+ unique slugs that do not clash with other blog posts', () => {
    expect(TOPIC_POSTS.length).toBeGreaterThanOrEqual(100);
    const all = [...TOPIC_POSTS.map((t) => t.slug), ...NUMBER_POSTS.map((p) => p.slug), ...CITIES.map(postSlug)];
    expect(new Set(all).size).toBe(all.length);
  });
  for (const { slug } of TOPIC_POSTS) {
    it(`${slug}: SEO basics, parallel Hindi, images, CTA`, () => {
      const en = buildTopic(slug, 'en')!, hi = buildTopic(slug, 'hi')!;
      expect(en.title.length).toBeLessThanOrEqual(75);
      expect(en.description.length).toBeLessThanOrEqual(160);
      expect(en.description.length).toBeGreaterThan(90);
      expect(en.keywords.length).toBeGreaterThanOrEqual(5);
      expect(en.faqs.length).toBeGreaterThanOrEqual(5);
      expect(hi.faqs.length).toBe(en.faqs.length);
      expect(en.wordCount).toBeGreaterThan(450);
      expect(hi.sections.map((s) => s.id)).toEqual(en.sections.map((s) => s.id));
      expect(en.sections.some((s) => s.cta)).toBe(true);
      expect(en.sections.some((s) => s.blocks.some((b) => b.kind === 'figure'))).toBe(true);
      expect(new Set(en.sections.map((s) => s.id)).size).toBe(en.sections.length);
      const latin = postText(hi).flatMap((t) => (t.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).filter((w) => !ALLOW.test(w)));
      expect(latin).toEqual([]);
    });
  }
});
