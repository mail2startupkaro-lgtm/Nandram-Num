import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CelebrityPostView } from '@/components/blog/celebrity-post';
import { publishedCelebPost, publishedCelebPosts } from '@/lib/celebrity/public';

// Posts are published from Admin → Celebrity numerology; pages render on first visit and are cached (cleared on publish/edit).
export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return (await publishedCelebPosts()).slice(0, 200).map((p) => ({ slug: p.slug })); }

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const row = await publishedCelebPost(slug);
  if (!row) return { title: 'Not found', robots: { index: false } };
  const c = row.post.en;
  return {
    title: { absolute: c.seoTitle }, description: c.metaDescription, keywords: c.keywords, authors: [{ name: 'Acharya Nandram' }],
    alternates: { canonical: `/blog/celebrity/${row.slug}` },
    openGraph: { title: c.seoTitle, description: c.metaDescription, url: `/blog/celebrity/${row.slug}`, siteName: 'myNumerologist.com', locale: 'en_IN', type: 'article', publishedTime: row.publishedAt ?? row.createdAt, modifiedTime: row.updatedAt, authors: ['Acharya Nandram'], section: 'Celebrity numerology', tags: c.keywords.slice(0, 6) },
    twitter: { card: 'summary_large_image', title: c.seoTitle, description: c.metaDescription },
  };
}

export default async function CelebrityPost(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const row = await publishedCelebPost(slug);
  if (!row) notFound();
  const all = await publishedCelebPosts();
  const others = all.filter((p) => p.slug !== row.slug);
  // Same Mulank or Bhagyank first, then the newest.
  const related = [...others.filter((p) => p.moolank === row.post.numbers.moolank.value || p.bhagyank === row.post.numbers.bhagyank.value), ...others].filter((p, i, a) => a.findIndex((x) => x.slug === p.slug) === i).slice(0, 6);
  return <CelebrityPostView row={row} related={related} />;
}
