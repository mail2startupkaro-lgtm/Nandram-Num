/**
 * Celebrity Numerology blog post: types, validation, SEO helpers and the offline writer
 * (used when no Gemini key is set – the admin then adds the background before publishing).
 */
import { z } from 'zod';
import { mulankFor } from '@/lib/mulank-data';
import { bhagyankFor } from '@/lib/bhagyank-data';
import { fmtDob } from '@/lib/report/blocks';
import { relWord, type CelebNumbers } from './numbers';

export type Lang = 'en' | 'hi';

const str = (max: number) => z.string().trim().min(1).max(max * 2).transform((s) => s.slice(0, max));
const para = z.string().trim().min(1).max(4000);

export const ContentSchema = z.object({
  seoTitle: str(70),
  metaDescription: str(170),
  h1: str(110),
  excerpt: str(300),
  focusKeyword: str(80),
  keywords: z.array(z.string().trim().min(1).max(60)).min(1).max(14),
  intro: z.array(para).min(1).max(4),
  sections: z.array(z.object({
    id: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
    h2: str(120),
    paras: z.array(para).min(1).max(8),
    bullets: z.array(z.string().trim().min(1).max(400)).max(10).optional(),
  })).min(3).max(12),
  faqs: z.array(z.object({ q: str(200), a: z.string().trim().min(1).max(1200) })).min(2).max(8),
  conclusion: z.string().trim().max(2000).optional(),
});
export type CelebContent = z.infer<typeof ContentSchema>;

export const ProfileSchema = z.object({
  identified: z.boolean(),
  profession: z.string().trim().max(120).default(''),
  knownFor: z.string().trim().max(300).default(''),
  nationality: z.string().trim().max(60).default(''),
});
export type CelebProfile = z.infer<typeof ProfileSchema>;

export interface CelebSource { title: string; uri: string }

export interface CelebPost {
  slug: string;
  name: string;
  dob: string;
  profile: CelebProfile;
  numbers: CelebNumbers;
  en: CelebContent;
  hi?: CelebContent;
  sources: CelebSource[];
  writer: 'ai' | 'template';
  model?: string;
  generatedAt: string;
}

/** Full saved post (admin list / public page). */
export const PostSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{3,120}$/, 'Slug: lowercase letters, numbers and hyphens only'),
  name: z.string().trim().min(2).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  profile: ProfileSchema,
  numbers: z.any(),
  en: ContentSchema,
  hi: ContentSchema.optional(),
  sources: z.array(z.object({ title: z.string().max(300), uri: z.string().max(2000) })).max(30).default([]),
  writer: z.enum(['ai', 'template']),
  model: z.string().max(80).optional(),
  generatedAt: z.string().max(40),
});

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
export function contentText(c: CelebContent): string {
  return [c.h1, ...c.intro, ...c.sections.flatMap((s) => [s.h2, ...s.paras, ...(s.bullets ?? [])]), ...c.faqs.flatMap((f) => [f.q, f.a]), c.conclusion ?? ''].join(' ');
}
export const wordCount = (c: CelebContent) => words(contentText(c));
export const readMinutes = (c: CelebContent) => Math.max(3, Math.round(wordCount(c) / 200));

/** SEO checks shown to the admin before publishing. */
export function seoChecks(c: CelebContent, slug: string) {
  const kw = c.focusKeyword.toLowerCase();
  const first = (c.intro[0] ?? '').toLowerCase();
  const wc = wordCount(c);
  return [
    { ok: c.seoTitle.length >= 30 && c.seoTitle.length <= 62, label: `SEO title length ${c.seoTitle.length} (aim 30–62)` },
    { ok: c.metaDescription.length >= 120 && c.metaDescription.length <= 160, label: `Meta description length ${c.metaDescription.length} (aim 120–160)` },
    { ok: c.seoTitle.toLowerCase().includes(kw.split(' ')[0] ?? ''), label: 'Title contains the focus keyword' },
    { ok: first.includes(kw) || first.includes(kw.split(' ')[0] ?? '~'), label: 'Focus keyword in the first paragraph' },
    { ok: c.sections.some((s) => s.h2.toLowerCase().includes(kw.split(' ')[0] ?? '~')), label: 'Focus keyword in a sub-heading' },
    { ok: wc >= 900, label: `${wc} words (aim 900+)` },
    { ok: c.faqs.length >= 3, label: `${c.faqs.length} FAQs (FAQ rich result)` },
    { ok: /^[a-z0-9-]{3,90}$/.test(slug), label: `Clean URL /blog/celebrity/${slug}` },
  ];
}

// ───────────────────────── offline writer (no AI key)

const HI_REL = (n: CelebNumbers) => relWord(n.moolankBhagyank, 'hi');
export function templateContent(n: CelebNumbers, lang: Lang): CelebContent {
  const m = mulankFor(n.moolank.value, lang)!, b = bhagyankFor(n.bhagyank.value, lang)!;
  const date = fmtDob(n.dob, lang);
  const hi = lang === 'hi';
  const nm = n.name;
  const missing = n.loShu.missing.join(', ');
  if (hi) {
    return {
      seoTitle: `${nm} अंक ज्योतिष: मूलांक ${n.moolank.value}, भाग्यांक ${n.bhagyank.value}`.slice(0, 70),
      metaDescription: `${nm} (जन्म ${date}) का अंक ज्योतिष विश्लेषण: मूलांक ${n.moolank.value}, भाग्यांक ${n.bhagyank.value}, नामांक ${n.chaldean.compound}/${n.chaldean.single}, लो शू ग्रिड और व्यक्तिगत वर्ष ${n.personalYear.value}।`.slice(0, 170),
      h1: `${nm} की अंक ज्योतिष: मूलांक ${n.moolank.value}, भाग्यांक ${n.bhagyank.value} और नामांक`,
      excerpt: `${nm} की जन्म तिथि और नाम के अंक उनके स्वभाव, करियर और सफलता के बारे में क्या बताते हैं।`,
      focusKeyword: `${nm} अंक ज्योतिष`,
      keywords: [`${nm} अंक ज्योतिष`, `${nm} मूलांक`, `${nm} भाग्यांक`, `मूलांक ${n.moolank.value}`, `भाग्यांक ${n.bhagyank.value}`, 'सेलिब्रिटी अंक ज्योतिष'],
      intro: [`${nm} अंक ज्योतिष का यह विश्लेषण उनकी जन्म तिथि ${date} (${n.weekday.hi}) और नाम पर आधारित है। इसमें उनका मूलांक ${n.moolank.value}, भाग्यांक ${n.bhagyank.value}, कैल्डियन नामांक ${n.chaldean.compound}/${n.chaldean.single} और लो शू ग्रिड सरल भाषा में समझाया गया है।`],
      sections: [
        { id: 'background', h2: `${nm} कौन हैं?`, paras: [`${nm} का जन्म ${date} को हुआ। [यहाँ उनकी पृष्ठभूमि, करियर और प्रमुख उपलब्धियाँ जोड़ें।]`] },
        { id: 'moolank', h2: `${nm} का मूलांक ${n.moolank.value}: ${m.title}`, paras: [m.intro, m.career], bullets: m.strengths.slice(0, 5) },
        { id: 'bhagyank', h2: `${nm} का भाग्यांक ${n.bhagyank.value}`, paras: [b.intro ?? '', `मूलांक ${n.moolank.value} और भाग्यांक ${n.bhagyank.value} का संबंध ${HI_REL(n)} है।`].filter(Boolean) },
        { id: 'name-number', h2: `${nm} का नामांक ${n.chaldean.compound}/${n.chaldean.single}`, paras: [`कैल्डियन पद्धति से "${nm}" का नामांक ${n.chaldean.compound}/${n.chaldean.single} है, जिसके स्वामी ${n.chaldean.planetHi} हैं। ${n.chaldean.meaning.hi}`, `भाग्यांक के साथ नाम की अनुकूलता ${n.nameScore}/100 है।`] },
        { id: 'lo-shu', h2: `${nm} का लो शू ग्रिड`, paras: [`ग्रिड में उपस्थित अंक: ${n.loShu.present.join(', ')}। अनुपस्थित अंक: ${missing || 'कोई नहीं'}।`] },
        { id: 'personal-year', h2: `${nm} का वर्तमान व्यक्तिगत वर्ष ${n.personalYear.value}`, paras: [`${n.personalYear.from} से ${n.personalYear.to} तक ${nm} व्यक्तिगत वर्ष ${n.personalYear.value} में हैं।`] },
      ],
      faqs: [
        { q: `${nm} का मूलांक क्या है?`, a: `${nm} का जन्म ${date} को हुआ, इसलिए उनका मूलांक ${n.moolank.value} है, जिसके स्वामी ${n.moolank.planetHi} हैं।` },
        { q: `${nm} का भाग्यांक क्या है?`, a: `पूरी जन्म तिथि का योग ${n.bhagyank.compound} है, इसलिए भाग्यांक ${n.bhagyank.value} है।` },
        { q: `${nm} का नामांक क्या है?`, a: `कैल्डियन पद्धति से नामांक ${n.chaldean.compound}/${n.chaldean.single} है।` },
      ],
      conclusion: `अपना मूलांक, भाग्यांक और नामांक जानने के लिए आचार्य नंदराम से व्यक्तिगत रिपोर्ट लें।`,
    };
  }
  return {
    seoTitle: `${nm} Numerology: Mulank ${n.moolank.value}, Bhagyank ${n.bhagyank.value} & Name`.slice(0, 70),
    metaDescription: `${nm} numerology (born ${date}): Mulank ${n.moolank.value}, Bhagyank ${n.bhagyank.value}, Chaldean name number ${n.chaldean.compound}/${n.chaldean.single}, Lo Shu grid and personal year ${n.personalYear.value} explained.`.slice(0, 170),
    h1: `${nm} Numerology: Mulank ${n.moolank.value}, Bhagyank ${n.bhagyank.value} and Name Number`,
    excerpt: `What ${nm}'s date of birth and name numbers reveal about personality, career and success.`,
    focusKeyword: `${nm} numerology`,
    keywords: [`${nm} numerology`, `${nm} mulank`, `${nm} bhagyank`, `${nm} name number`, `${nm} date of birth`, `mulank ${n.moolank.value} celebrities`, 'celebrity numerology'],
    intro: [`This ${nm} numerology reading is based on the date of birth ${date} (${n.weekday.en}) and the name. It explains Mulank ${n.moolank.value}, Bhagyank ${n.bhagyank.value}, the Chaldean name number ${n.chaldean.compound}/${n.chaldean.single} and the Lo Shu grid in simple language.`],
    sections: [
      { id: 'background', h2: `Who is ${nm}?`, paras: [`${nm} was born on ${date}. [Add the background, career and main achievements here.]`] },
      { id: 'moolank', h2: `${nm}'s Mulank ${n.moolank.value}: ${m.title}`, paras: [m.intro, m.career], bullets: m.strengths.slice(0, 5) },
      { id: 'bhagyank', h2: `${nm}'s Bhagyank (Destiny Number) ${n.bhagyank.value}`, paras: [b.intro ?? '', `The relation between Mulank ${n.moolank.value} and Bhagyank ${n.bhagyank.value} is ${relWord(n.moolankBhagyank, 'en')}.`].filter(Boolean) },
      { id: 'name-number', h2: `${nm} Name Numerology: ${n.chaldean.compound}/${n.chaldean.single}`, paras: [`In Chaldean numerology the name "${nm}" totals ${n.chaldean.compound}/${n.chaldean.single}, ruled by ${n.chaldean.planet}. ${n.chaldean.meaning.en}`, `Its compatibility with the Bhagyank is ${n.nameScore}/100.`] },
      { id: 'lo-shu', h2: `${nm}'s Lo Shu Grid`, paras: [`Numbers present: ${n.loShu.present.join(', ')}. Missing numbers: ${missing || 'none'}.`] },
      { id: 'personal-year', h2: `${nm}'s Current Personal Year ${n.personalYear.value}`, paras: [`From ${n.personalYear.from} to ${n.personalYear.to}, ${nm} is in personal year ${n.personalYear.value}.`] },
    ],
    faqs: [
      { q: `What is ${nm}'s Mulank?`, a: `${nm} was born on ${date}, so the Mulank (root number) is ${n.moolank.value}, ruled by ${n.moolank.planet}.` },
      { q: `What is ${nm}'s Bhagyank?`, a: `The digits of the full date of birth add up to ${n.bhagyank.compound}, so the Bhagyank (destiny number) is ${n.bhagyank.value}.` },
      { q: `What is ${nm}'s name number?`, a: `In Chaldean numerology the name number is ${n.chaldean.compound}/${n.chaldean.single}.` },
    ],
    conclusion: `Want to know your own Mulank, Bhagyank and name number? Get a personal reading from Acharya Nandram.`,
  };
}

/** True when the post still holds the "[Add …]" placeholder of the offline writer. */
export const hasPlaceholder = (c: CelebContent) => /\[(Add|यहाँ)[^\]]*\]/.test(contentText(c));
