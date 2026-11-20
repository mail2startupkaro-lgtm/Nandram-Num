/**
 * Registry of all topic articles (pillar guides + data-driven families), with category labels for the blog index.
 */
import { COMPAT_POSTS } from './topic-compat';
import { HOUSE_POSTS, KUA_POSTS, MOBILE_POSTS, NAME_POSTS } from './topic-identity';
import { LOSHU_POSTS, PY_POSTS } from './topic-loshu-year';
import { PILLAR_POSTS } from './topic-pillars';
import type { Lang, TopicCat, TopicPost, TopicRef } from './topic-kit';

export const TOPIC_PUBLISHED = '2026-11-20';

export const TOPIC_POSTS: TopicRef[] = [...PILLAR_POSTS, ...COMPAT_POSTS, ...LOSHU_POSTS, ...PY_POSTS, ...NAME_POSTS, ...MOBILE_POSTS, ...HOUSE_POSTS, ...KUA_POSTS];
const BY_SLUG = new Map(TOPIC_POSTS.map((t) => [t.slug, t]));
export const topicBySlug = (slug: string) => BY_SLUG.get(slug);

const cache = new Map<string, TopicPost>();
export function buildTopic(slug: string, lang: Lang): TopicPost | undefined {
  const k = `${slug}|${lang}`;
  if (!cache.has(k)) { const r = BY_SLUG.get(slug); if (!r) return undefined; cache.set(k, r.build(lang)); }
  return cache.get(k);
}

export const TOPIC_CATS: { id: TopicCat; en: string; hi: string; enSub: string; hiSub: string }[] = [
  { id: 'guide', en: 'Numerology Guides', hi: 'अंक ज्योतिष मार्गदर्शिकाएँ', enSub: 'Beginner guides, methods, remedies and the Acharya Nandram profile.', hiSub: 'शुरुआती मार्गदर्शिकाएँ, विधियाँ, उपाय और आचार्य नंदराम की प्रोफ़ाइल।' },
  { id: 'compatibility', en: 'Mulank Compatibility (45 pairs)', hi: 'मूलांक अनुकूलता (45 जोड़ियाँ)', enSub: 'Love, marriage, wedding dates and remedies for every Mulank pair.', hiSub: 'हर मूलांक जोड़ी के लिए प्रेम, विवाह, शुभ तिथियाँ और उपाय।' },
  { id: 'loshu', en: 'Lo Shu Missing Numbers', hi: 'लो शू अनुपस्थित अंक', enSub: 'Effects and remedies for each missing number 1–9.', hiSub: 'हर अनुपस्थित अंक 1–9 के प्रभाव और उपाय।' },
  { id: 'personal-year', en: 'Personal Year 1–9', hi: 'व्यक्तिगत वर्ष 1–9', enSub: 'Career, love and money for each personal year.', hiSub: 'हर व्यक्तिगत वर्ष में करियर, प्रेम और धन।' },
  { id: 'name', en: 'Name Numbers 1–9', hi: 'नामांक 1–9', enSub: 'Chaldean name number meanings and correction tips.', hiSub: 'कैल्डियन नामांक का अर्थ और नाम सुधार के सुझाव।' },
  { id: 'mobile', en: 'Mobile Number Totals 1–9', hi: 'मोबाइल नंबर योग 1–9', enSub: 'What each mobile total means and who it suits.', hiSub: 'हर मोबाइल योग का अर्थ और किसके लिए शुभ।' },
  { id: 'house', en: 'House Numbers 1–9', hi: 'मकान नंबर 1–9', enSub: 'Meaning of every house number with remedies.', hiSub: 'हर मकान नंबर का अर्थ और उपाय।' },
  { id: 'kua', en: 'Kua Numbers', hi: 'कुआ नंबर', enSub: 'Lucky directions for home, sleep and work.', hiSub: 'घर, नींद और काम के लिए शुभ दिशाएँ।' },
];

export type { TopicPost, TopicCat, TopicRef } from './topic-kit';
