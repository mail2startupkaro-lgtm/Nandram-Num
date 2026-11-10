import Link from 'next/link';
import type { Block } from '@/lib/blog/generate';
import { MULANK, mulankFor } from '@/lib/mulank-data';

/** Renders the article building blocks shared by every blog post (city guides and number guides). */
export function Blocks({ blocks, lang = 'en' }: { blocks: Block[]; lang?: 'en' | 'hi' }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'p': return <p key={i} className="leading-relaxed text-muted-foreground">{b.text}</p>;
          case 'list': return <ul key={i} className="space-y-2">{b.items.map((x) => <li key={x} className="flex gap-2 text-muted-foreground"><span className="mt-1 text-gold">✦</span><span>{x}</span></li>)}</ul>;
          case 'cards': return <div key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((x) => <Link key={x.title} href={x.href ?? '/reading'} className="mk-card rounded-lg border border-gold/25 bg-background/40 p-4"><p className="font-serif text-lg font-semibold text-gold">{x.title}</p><p className="mt-1 text-sm text-muted-foreground">{x.text}</p><span className="mt-2 inline-block text-sm text-gold">{lang === 'hi' ? 'और जानें →' : 'Learn more →'}</span></Link>)}</div>;
          case 'steps': return <ol key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((x, n) => <li key={x.title} className="rounded-lg border border-gold/20 bg-background/40 p-4"><span className="gold-text font-serif text-3xl font-bold">{n + 1}</span><p className="font-semibold">{x.title}</p><p className="text-sm text-muted-foreground">{x.text}</p></li>)}</ol>;
          case 'table': return <div key={i} className="overflow-x-auto rounded-lg border border-gold/20"><table className="w-full min-w-[460px] text-sm"><thead><tr className="border-b border-gold/20 bg-gold/5 text-left">{b.head.map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead><tbody>{b.rows.map((r) => <tr key={r[0]} className="border-b border-border/50 last:border-0 hover:bg-gold/5">{r.map((c, n) => <td key={n} className={n === 0 ? 'p-3 font-serif text-lg font-bold text-gold' : 'p-3 text-muted-foreground'}>{c}</td>)}</tr>)}</tbody></table></div>;
          case 'mulank': return <div key={i} className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">{MULANK.map((x) => mulankFor(x.n, lang)!).map((m) => <Link key={m.n} href={`/mulank/${m.n}`} className="mk-card rounded-lg border border-gold/25 p-2 text-center"><span className="gold-text font-cinzel text-2xl font-bold">{m.n}</span><span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{m.planet.split(' ')[0]}</span></Link>)}</div>;
        }
      })}
    </>
  );
}

