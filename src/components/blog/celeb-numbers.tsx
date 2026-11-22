/** Numbers panel of a celebrity numerology post – no hooks, so it renders on the public page and in the admin preview. */
import type { CelebNumbers } from '@/lib/celebrity/numbers';
import { relWord } from '@/lib/celebrity/numbers';
import { fmtDob } from '@/lib/report/blocks';

type Lang = 'en' | 'hi';
const LAYOUT = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

const L = {
  en: { title: (n: string) => `${n}'s numbers at a glance`, born: 'Date of birth', m: 'Mulank (root number)', b: 'Bhagyank (destiny number)', name: 'Name number (Chaldean)', py: 'Personal year now', rel: 'Mulank–Bhagyank', score: 'Name compatibility', pyth: 'Pythagorean expression · soul urge · personality', grid: 'Lo Shu grid', missing: 'Missing', none: 'none', arrows: 'Arrows of strength', ruled: 'ruled by' },
  hi: { title: (n: string) => `${n} के अंक एक नज़र में`, born: 'जन्म तिथि', m: 'मूलांक', b: 'भाग्यांक', name: 'नामांक (कैल्डियन)', py: 'वर्तमान व्यक्तिगत वर्ष', rel: 'मूलांक–भाग्यांक', score: 'नाम अनुकूलता', pyth: 'पाइथागोरस: अभिव्यक्ति · आत्मा · व्यक्तित्व', grid: 'लो शू ग्रिड', missing: 'अनुपस्थित', none: 'कोई नहीं', arrows: 'शक्ति के तीर', ruled: 'स्वामी' },
};

export function CelebNumbersPanel({ n, lang }: { n: CelebNumbers; lang: Lang }) {
  const t = L[lang], hi = lang === 'hi';
  const tiles: [string, string, string][] = [
    [t.m, String(n.moolank.value), `${t.ruled} ${hi ? n.moolank.planetHi : n.moolank.planet}`],
    [t.b, n.bhagyank.master ? `${n.bhagyank.value} (${n.bhagyank.master})` : String(n.bhagyank.value), `${t.ruled} ${hi ? n.bhagyank.planetHi : n.bhagyank.planet}`],
    [t.name, `${n.chaldean.compound}/${n.chaldean.single}`, `${t.ruled} ${hi ? n.chaldean.planetHi : n.chaldean.planet}`],
    [t.py, String(n.personalYear.value), `${n.personalYear.from.slice(0, 4)}–${n.personalYear.to.slice(0, 4)}`],
  ];
  return (
    <section aria-label={t.title(n.name)} className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card/70 to-maroon/20 p-5">
      <h2 className="font-serif text-xl font-bold sm:text-2xl">{t.title(n.name)}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.born}: {fmtDob(n.dob, lang)} ({hi ? n.weekday.hi : n.weekday.en})</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border border-gold/30 bg-background/50 p-3 text-center">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="gold-text font-cinzel text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <figure className="mx-auto">
          <table className="border-collapse" aria-label={t.grid}>
            <tbody>
              {LAYOUT.map((row, i) => (
                <tr key={i}>{row.map((x) => { const c = n.loShu.counts[x] ?? 0; return (
                  <td key={x} className={`h-14 w-14 border border-gold/40 text-center font-cinzel text-lg font-bold ${c ? 'text-gold' : 'text-muted-foreground/40'}`}>{c ? String(x).repeat(Math.min(c, 4)) : '·'}</td>
                ); })}</tr>
              ))}
            </tbody>
          </table>
          <figcaption className="mt-1 text-center text-xs text-muted-foreground">{t.grid}</figcaption>
        </figure>
        <ul className="space-y-1 text-sm">
          <li><b>{t.rel}:</b> {relWord(n.moolankBhagyank, lang)}</li>
          <li><b>{t.score}:</b> {n.nameScore}/100</li>
          <li><b>{t.pyth}:</b> {n.pythagorean.expression} · {n.pythagorean.soulUrge} · {n.pythagorean.personality}</li>
          <li><b>{t.missing}:</b> {n.loShu.missing.join(', ') || t.none}</li>
          <li><b>{t.arrows}:</b> {n.loShu.strengths.join(', ') || t.none}</li>
        </ul>
      </div>
    </section>
  );
}
