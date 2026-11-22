import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { BlogCta } from '@/components/blog/blog-parts';
import { Bi } from '@/components/i18n/bi';
import { SITE_URL, jsonLd as toLd } from '@/lib/seo/site';
import { publishedCelebPosts } from '@/lib/celebrity/public';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'Celebrity Numerology: Mulank & Bhagyank of Famous People | myNumerologist' },
  description: 'Celebrity numerology by Acharya Nandram: the Mulank, Bhagyank, Chaldean name number and Lo Shu grid of famous people, and what their numbers say about success.',
  alternates: { canonical: '/blog/celebrity' },
  openGraph: { title: 'Celebrity Numerology – Famous People’s Numbers Explained', description: 'Mulank, Bhagyank, name number and Lo Shu grid of famous people, explained by Acharya Nandram.', url: '/blog/celebrity', type: 'website' },
};

export default async function CelebrityIndex() {
  const posts = await publishedCelebPosts();
  const byM = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => ({ m, list: posts.filter((p) => p.moolank === m) })).filter((x) => x.list.length);
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Celebrity Numerology', url: `${SITE_URL}/blog/celebrity`,
    mainEntity: { '@type': 'ItemList', itemListElement: posts.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/blog/celebrity/${p.slug}`, name: p.title })) } };
  return (
    <div className="container max-w-6xl space-y-10 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toLd(ld) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground"><Bi en="Home" hi="होम" /></Link> / <Link href="/blog" className="hover:text-foreground"><Bi en="Blog" hi="ब्लॉग" /></Link> / <Bi en="Celebrity numerology" hi="सेलिब्रिटी अंक ज्योतिष" /></nav>
      <header className="mk-rise space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold"><Bi en={`${posts.length} celebrity readings`} hi={`${posts.length} सेलिब्रिटी रीडिंग`} /></p>
        <h1 className="font-cinzel text-4xl font-bold sm:text-5xl"><span className="gold-text"><Bi en="Celebrity Numerology" hi="सेलिब्रिटी अंक ज्योतिष" /></span></h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground"><Bi en="The Mulank, Bhagyank, name number and Lo Shu grid of famous people, read by Acharya Nandram – and what you can learn from people who share your numbers." hi="प्रसिद्ध लोगों का मूलांक, भाग्यांक, नामांक और लो शू ग्रिड, आचार्य नंदराम द्वारा – और अपने जैसे अंक वाले लोगों से क्या सीखें।" /></p>
      </header>
      {posts.length === 0 ? <p className="text-center text-muted-foreground"><Bi en="New celebrity readings are coming soon." hi="नई सेलिब्रिटी रीडिंग जल्द आ रही हैं।" /></p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/celebrity/${p.slug}`} className="mk-card group glass flex flex-col rounded-2xl border border-gold/30 p-5">
                <div className="flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e1b] to-[#24130a] font-cinzel text-xl font-bold gold-text">{p.moolank}</span>
                  <span><span className="block font-semibold group-hover:text-gold">{p.name}</span><span className="block text-xs text-muted-foreground">{p.profession || 'Celebrity'} · Mulank {p.moolank} · Bhagyank {p.bhagyank}</span></span></div>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
              </Link>
            ))}
          </div>
          {byM.length > 1 && <section className="space-y-3"><h2 className="font-serif text-2xl font-bold"><Bi en="Celebrities by Mulank" hi="मूलांक के अनुसार सेलिब्रिटी" /></h2>
            {byM.map(({ m, list }) => <div key={m} className="flex flex-wrap items-center gap-2"><Link href={`/mulank/${m}`} className="inline-flex items-center gap-1 font-semibold text-gold hover:underline"><Star className="h-4 w-4" /><Bi en={`Mulank ${m}`} hi={`मूलांक ${m}`} /></Link>{list.map((p) => <Link key={p.slug} href={`/blog/celebrity/${p.slug}`} className="rounded-full border border-gold/30 px-3 py-1 text-sm hover:bg-gold/10">{p.name}</Link>)}</div>)}</section>}
        </>
      )}
      <BlogCta topic={{ en: 'Celebrity numerology', hi: 'सेलिब्रिटी अंक ज्योतिष' }} variant="big" />
    </div>
  );
}
