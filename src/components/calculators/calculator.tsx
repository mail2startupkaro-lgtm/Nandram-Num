'use client';
import * as React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { analyseDob, analyseMobile, analyseNameSystem, bhagyank, kuaNumber, moolank, todayIST, toIso } from '@/lib/numerology';
import { KUA_DIRECTIONS } from '@/lib/numerology/data/tables';
import { planetOf } from '@/lib/numerology/data/planets';
import { RELATION_TABLE } from '@/lib/numerology/data/relations';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { getMulank } from '@/lib/mulank-data';
import type { CalcKind } from '@/lib/seo/calculators';
import { NumberGrid } from '@/components/results/grid';
import { Field, Input, ChipGroup } from '@/components/ui/form';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const parseIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? { year: +m[1], month: +m[2], day: +m[3] } : null; };
const pretty = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

function Big({ label, n, sub }: { label: string; n: number | string; sub?: string }) {
  return <div className="rounded-lg border border-gold/40 bg-gold/5 p-4 text-center"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="num-badge gold-text text-6xl font-bold">{n}</p>{sub && <p className="text-sm">{sub}</p>}</div>;
}
/** A titled detail block inside the results. */
function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={cn('mk-rise rounded-lg border border-gold/20 bg-background/40 p-4', className)}><h3 className="mb-2 font-serif text-base font-semibold text-gold">{title}</h3><div className="space-y-2 text-sm">{children}</div></section>;
}
const Facts = ({ items }: { items: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">{items.map(([k, v]) => <div key={k}><dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
);
const Chips = ({ items, tone }: { items: React.ReactNode[]; tone?: 'good' | 'warn' | 'bad' | 'gold' }) => <div className="flex flex-wrap gap-1.5">{items.map((x, i) => <Badge key={i} tone={tone}>{x}</Badge>)}</div>;
const Bullets = ({ items }: { items: string[] }) => <ul className="space-y-1 text-muted-foreground">{items.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul>;
function Meter({ label, value, max = 100, text }: { label: string; value: number; max?: number; text?: string }) {
  return <div><div className="flex justify-between text-xs"><span>{label}</span><span className="tabular-nums text-muted-foreground">{text ?? Math.round(value)}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-maroon to-gold transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%` }} /></div></div>;
}
const Grid2 = ({ children }: { children: React.ReactNode }) => <div className="grid gap-4 md:grid-cols-2">{children}</div>;
const REL_TEXT = { friend: 'friendly', neutral: 'neutral', enemy: 'challenging' } as const;
const PLANET_TIPS = (n: number) => { const p = planetOf(n); return `${p.name}: ${p.weekday}, ${p.colours.slice(0, 2).join('/')}, donate ${p.daan.slice(0, 2).join(' or ')}`; };

const KUA_MEANING = {
  success: 'Sheng Chi – success, money and recognition', health: 'Tien Yi – health, healing and support', relationships: 'Nien Yen – love, family and harmony', personalGrowth: 'Fu Wei – calm, stability and self-growth',
  mishaps: 'Huo Hai – mishaps and obstacles', fiveGhosts: 'Wu Kwei – conflict and loss of energy', sixKillings: 'Liu Sha – quarrels and delays', totalLoss: 'Chueh Ming – the weakest direction overall',
} as const;
const KUA_ELEMENT: Record<number, string> = { 1: 'Water', 2: 'Earth', 3: 'Wood', 4: 'Wood', 6: 'Metal', 7: 'Metal', 8: 'Earth', 9: 'Fire' };
const COMPASS: [string, string][][] = [[['NW', 'North-West'], ['N', 'North'], ['NE', 'North-East']], [['W', 'West'], ['', ''], ['E', 'East']], [['SW', 'South-West'], ['S', 'South'], ['SE', 'South-East']]];

export function Calculator({ kind }: { kind: CalcKind }) {
  const [dob, setDob] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const d = parseIso(dob);
  const traits = NUMBER_TRAITS.en;
  let out: React.ReactNode = null;

  try {
    if (kind === 'moolank' && d) {
      const m = moolank(d.day).value, p = planetOf(m), prof = getMulank(m);
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Big label="Your Moolank" n={m} sub={`${p.name} (${p.hindiName})`} />
            <div className="space-y-2 text-sm">
              {prof && <p className="font-serif text-xl font-semibold gold-text">{prof.title} · <span className="text-base font-normal italic text-muted-foreground">{prof.tagline}</span></p>}
              <p>{prof?.intro ?? `${traits[m].keyword} – ${traits[m].plus}.`}</p>
              <p className="text-muted-foreground">Watch for: {traits[m].minus}.</p>
            </div>
          </div>
          <Panel title="Your lucky details"><Facts items={[['Ruling planet', `${p.name} (${p.devanagari})`], ['Element', p.element], ['Lucky day', p.weekday], ['Lucky colours', p.colours.join(', ')], ['Lucky numbers', prof?.luckyNumbers.join(', ') ?? '—'], ['Direction', prof?.direction ?? '—'], ['Gemstone', `${p.gemstone.name} (${p.gemstone.hindi})`], ['Metal & finger', `${p.gemstone.metal}, ${p.gemstone.finger}`], ['Fasting day', p.fastingDay]]} /><p className="text-xs text-muted-foreground">{p.gemstone.caution}</p></Panel>
          {prof && <Grid2><Panel title="Strengths"><Bullets items={prof.strengths} /></Panel><Panel title="Challenges"><Bullets items={prof.challenges} /></Panel></Grid2>}
          {prof && <Grid2><Panel title="Career"><p className="text-muted-foreground">{prof.career}</p></Panel><Panel title="Relationships"><p className="text-muted-foreground">{prof.relationships}</p></Panel><Panel title="Health"><p className="text-muted-foreground">{prof.health}</p></Panel><Panel title="Money"><p className="text-muted-foreground">{prof.money}</p></Panel></Grid2>}
          <Grid2>
            <Panel title="Remedies"><Bullets items={[...(prof?.remedies ?? []), `Mantra: ${p.mantra.beej} (${p.mantra.dailyCount} times daily)`, `Deity: ${p.deity}`, `Daan: ${p.daan.join(', ')}`, `Rudraksha: ${p.rudraksha}`]} /></Panel>
            <Panel title="Compatibility"><p>Harmonious with: <b>{(prof?.compatible ?? RELATION_TABLE[m].friend).join(', ')}</b></p><p>Needs care with: <b>{(prof?.avoid ?? RELATION_TABLE[m].enemy).join(', ') || 'none'}</b></p><Link href={`/mulank/${m}`} className="inline-block text-gold underline">Read the full Mulank {m} profile →</Link></Panel>
          </Grid2>
        </div>
      );
    }
    if (kind === 'bhagyank' && d) {
      const b = bhagyank(d), p = planetOf(b.value), mo = moolank(d.day).value;
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const rel = mo === b.value ? 'friend' : RELATION_TABLE[mo].friend.includes(b.value) ? 'friend' : RELATION_TABLE[mo].enemy.includes(b.value) ? 'enemy' : 'neutral';
      const cur = r.pinnacles.find((x) => x.current), py = r.personalCycles.current.personalYear;
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Big label="Your Bhagyank" n={b.value} sub={`Total ${b.compound}${b.master ? ` · master ${b.master}` : ''} · ${p.name}`} />
            <div className="space-y-2 text-sm">
              <p className="font-serif text-xl font-semibold gold-text">{traits[b.value].keyword}</p>
              <p>Your Bhagyank (destiny number) shows the direction life tends to take you. With {p.name} as its ruler, your path is about <b>{traits[b.value].plus.toLowerCase()}</b>.</p>
              <p className="text-muted-foreground">Watch for: {traits[b.value].minus}.</p>
              {b.master && <p className="text-gold">Master number {b.master} is present in your date of birth – a sign of higher potential and higher responsibility.</p>}
            </div>
          </div>
          <Grid2>
            <Panel title="How it is calculated"><p className="text-muted-foreground">All digits of {toIso(d)} are added and reduced: {Array.isArray(b.chain) ? b.chain.join(' → ') : b.compound} → <b className="text-foreground">{b.value}</b>.</p></Panel>
            <Panel title={`Moolank ${mo} + Bhagyank ${b.value}`}><p className="text-muted-foreground">Your nature (Moolank {mo}, {planetOf(mo).name}) and your destiny ({p.name}) are <b className="text-foreground">{REL_TEXT[rel]}</b> to each other. {rel === 'friend' ? 'Your character supports your life path, so effort tends to turn into results.' : rel === 'enemy' ? 'You may feel a pull between what you are and where life takes you; balance and the remedies below help.' : 'They neither help nor block each other strongly; conscious effort decides the outcome.'}</p></Panel>
          </Grid2>
          <Panel title="Career & life direction"><Chips items={p.careers} tone="gold" /><p className="text-muted-foreground">{p.signatureTip}</p></Panel>
          <Grid2>
            <Panel title="Lucky details"><Facts items={[['Planet', `${p.name} (${p.devanagari})`], ['Element', p.element], ['Lucky day', p.weekday], ['Colours', p.colours.slice(0, 3).join(', ')], ['Gemstone', p.gemstone.name], ['Fasting day', p.fastingDay]]} /></Panel>
            <Panel title="Remedies"><Bullets items={[`Mantra: ${p.mantra.beej}`, `Deity: ${p.deity}`, `Daan: ${p.daan.join(', ')}`, `Rudraksha: ${p.rudraksha}`]} /></Panel>
          </Grid2>
          <Panel title="Your life timeline"><p className="text-muted-foreground">You are {r.age} years old and in <b className="text-foreground">Personal Year {py}</b> ({traits[py].keyword.toLowerCase()}).{cur ? ` Your current pinnacle is ${cur.number} (${traits[cur.number].keyword.toLowerCase()}), covering ages ${cur.fromAge}–${cur.toAge ?? 'onwards'}.` : ''}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{r.pinnacles.map((x) => <div key={x.index} className={cn('rounded-md border p-2 text-center', x.current ? 'border-gold bg-gold/10' : 'border-border')}><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pinnacle {x.index}</p><p className="gold-text font-serif text-2xl font-bold">{x.number}</p><p className="text-xs text-muted-foreground">Age {x.fromAge}–{x.toAge ?? '+'}</p></div>)}</div></Panel>
        </div>
      );
    }
    if (kind === 'loshu' && d) {
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const mp = planetOf(r.moolank.value), bp = planetOf(r.bhagyank.value);
      out = (
        <div className="space-y-4">
          <div className="grid items-start gap-6 sm:grid-cols-2">
            <NumberGrid cells={r.loShu.cells} label="Lo Shu Grid" />
            <div className="space-y-2 text-sm">
              <p>Moolank <b>{r.moolank.value}</b> ({mp.name}) · Bhagyank <b>{r.bhagyank.value}</b> ({bp.name}) · Kua <b>{r.kua.value}</b></p>
              <p>Present numbers: <b>{r.loShu.present.join(', ')}</b></p>
              <p>Missing numbers: <b>{r.loShu.missing.join(', ') || 'none'}</b></p>
              <p>Repeated: {r.loShu.repeated.map((x) => `${x.number}×${x.count}`).join(', ') || 'none'}</p>
              <div className="flex flex-wrap gap-1">{r.loShu.yogs.map((y) => <Badge key={y.name} tone="good">{y.name}</Badge>)}{r.loShu.arrowsOfStrength.map((a) => <Badge key={a.lineId} tone="gold">{a.name}</Badge>)}{r.loShu.arrowsOfWeakness.map((a) => <Badge key={a.name} tone="warn">{a.name}</Badge>)}</div>
            </div>
          </div>
          <Panel title="Life area strength">
            <div className="grid gap-3 sm:grid-cols-2">{Object.entries(r.lifeAreaScores).map(([k, v]) => <Meter key={k} label={pretty(k)} value={v} />)}</div>
          </Panel>
          <Grid2>
            <Panel title="Strengths in your grid">{r.loShu.yogs.length + r.loShu.arrowsOfStrength.length === 0 ? <p className="text-muted-foreground">No complete line yet. Your strength comes from the individual numbers you carry.</p> : <Bullets items={[...r.loShu.yogs.map((y) => `${y.name} (${y.numbers.join('-')}) – a combination that supports success`), ...r.loShu.arrowsOfStrength.map((a) => `${a.name} (${a.numbers.join('-')}) – a natural strength`)]} />}</Panel>
            <Panel title="Areas to work on">{r.loShu.arrowsOfWeakness.length === 0 ? <p className="text-muted-foreground">No fully empty line. Your grid is well balanced.</p> : <Bullets items={r.loShu.arrowsOfWeakness.map((a) => `${a.name} (${a.numbers.join('-')}) – build this through habits and remedies`)} />}</Panel>
          </Grid2>
          {r.loShu.missing.length > 0 && <Panel title="What your missing numbers mean"><div className="grid gap-3 sm:grid-cols-2">{r.loShu.missing.map((n) => <div key={n} className="rounded-md border border-border p-3"><p><b className="gold-text text-lg">{n}</b> · {traits[n].keyword}</p><p className="text-muted-foreground">Develop: {traits[n].plus.toLowerCase()}.</p><p className="text-xs text-muted-foreground">Remedy – {PLANET_TIPS(n)}</p></div>)}</div></Panel>}
          {r.loShu.repeated.length > 0 && <Panel title="Repeated numbers"><Bullets items={r.loShu.repeated.map((x) => `${x.number} appears ${x.count} times: ${traits[x.number].keyword.toLowerCase()} is strong${x.count >= 3 ? ` – balance the excess (${traits[x.number].minus.toLowerCase()})` : ''}.`)} /></Panel>}
          <Panel title="Your current cycle"><p className="text-muted-foreground">You are in <b className="text-foreground">Personal Year {r.personalCycles.current.personalYear}</b> ({traits[r.personalCycles.current.personalYear].keyword.toLowerCase()}) and Personal Month {r.personalCycles.current.personalMonth}.</p></Panel>
        </div>
      );
    }
    if (kind === 'name' && name.replace(/[^A-Za-z]/g, '').length >= 2) {
      const c = analyseNameSystem(name, 'chaldean'), py = analyseNameSystem(name, 'pythagorean');
      const n = c.nameNumber.single, pl = planetOf(n);
      const cat = c.nameNumber.category;
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3"><Big label="Chaldean name number" n={n} sub={`Compound ${c.nameNumber.compound} · ${cat}`} /><Big label="Soul urge" n={c.soulUrge.single} sub="from vowels" /><Big label="Personality" n={c.personality.single} sub="from consonants" /></div>
          <Grid2>
            <Panel title={`What name number ${n} says`}><p><b>{traits[n].keyword}</b> – {traits[n].plus}.</p><p className="text-muted-foreground">Watch for: {traits[n].minus}.</p><p className="text-muted-foreground">Ruled by {pl.name}. Lucky day {pl.weekday}, colours {pl.colours.slice(0, 2).join(' & ')}.</p></Panel>
            <Panel title={`Compound ${c.nameNumber.compound}: ${cat}`}><p className="text-muted-foreground">{cat === 'favourable' ? 'In the Chaldean system this compound number is traditionally considered supportive.' : cat === 'unfavourable' ? 'This compound number is traditionally considered challenging. A small spelling adjustment is sometimes suggested after checking it against your date of birth.' : 'This compound number gives mixed results; its effect depends on how it relates to your birth numbers.'}</p><p className="text-xs text-muted-foreground">A name should always be judged together with your Moolank and Bhagyank, which is what the complete report does.</p></Panel>
          </Grid2>
          <Panel title="Letter values (Chaldean)"><div className="flex flex-wrap gap-1.5">{c.letters.map((l, i) => <div key={i} className={cn('w-9 rounded-md border p-1 text-center', l.vowel ? 'border-gold/60 bg-gold/10' : 'border-border')}><p className="text-sm font-semibold">{l.letter}</p><p className="text-xs text-muted-foreground">{l.value}</p></div>)}</div><p className="text-xs text-muted-foreground">Highlighted letters are vowels (soul urge). The rest form your personality number.</p></Panel>
          <Grid2>
            <Panel title="Each word of your name"><table className="w-full text-left"><thead><tr className="text-xs text-muted-foreground"><th>Word</th><th>Compound</th><th>Single</th></tr></thead><tbody>{c.words.map((w) => <tr key={w.word} className="border-t border-border/50"><td>{w.word}</td><td>{w.compound}</td><td className="font-semibold">{w.single}</td></tr>)}</tbody></table></Panel>
            <Panel title="Two systems compared"><Facts items={[['Chaldean', `${c.nameNumber.compound} → ${c.nameNumber.single}`], ['Pythagorean', `${py.nameNumber.compound} → ${py.nameNumber.single}`], ['Pythagorean soul urge', py.soulUrge.single], ['Pythagorean personality', py.personality.single]]} /><p className="text-xs text-muted-foreground">Indian numerology mostly uses Chaldean values; Pythagorean is shown for comparison.</p></Panel>
          </Grid2>
        </div>
      );
    }
    if (kind === 'mobile' && d && mobile.replace(/\D/g, '').length >= 10) {
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const m = analyseMobile(mobile, { moolank: r.moolank.value, bhagyank: r.bhagyank.value, missingNumbers: r.loShu.missing });
      const kindTone = { malefic: 'bad', conflict: 'warn', supportive: 'good', neutral: undefined } as const;
      const LABEL: Record<string, string> = { base: 'Starting score', bhagyankRelation: 'Total vs your Bhagyank', moolankRelation: 'Total vs your Moolank', compound: 'Compound number quality', heavy48: 'Heavy 4/8 total', maleficPairs: 'Difficult digit pairs', zeros: 'Too many zeros', repeatedEnemyDigits: 'Repeated unfriendly digits', missingFilled: 'Fills your missing numbers', last4: 'Last four digits' };
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]"><Big label="Compatibility score" n={m.score} sub={m.verdict} />
            <div className="space-y-2 text-sm"><Meter label={`${m.masked} – out of 100`} value={m.score} text={`${m.score}/100`} />
              <p>Total <b>{m.total.compound} → {m.total.single}</b> ({m.total.category}). It is <b>{REL_TEXT[m.relationWithBhagyank]}</b> to your Bhagyank {r.bhagyank.value} and <b>{REL_TEXT[m.relationWithMoolank]}</b> to your Moolank {r.moolank.value}.</p></div></div>
          <Grid2>
            <Panel title="Digit pairs"><div className="flex flex-wrap gap-1.5">{m.pairs.map((p) => <Badge key={p.position} tone={kindTone[p.kind as keyof typeof kindTone]}>{p.pair}</Badge>)}</div><p className="text-xs text-muted-foreground">Green: supportive · Orange: conflicting · Red: difficult · Plain: neutral.</p>
              <p>Difficult pairs: <b>{m.maleficPairs.join(', ') || 'none'}</b> · Conflicting: <b>{m.conflictPairs.join(', ') || 'none'}</b></p></Panel>
            <Panel title="Digit frequency"><div className="space-y-1.5">{Object.entries(m.digitFrequency).map(([dg, n]) => <Meter key={dg} label={`Digit ${dg}`} value={n} max={Math.max(3, ...Object.values(m.digitFrequency))} text={`${n}×`} />)}</div></Panel>
          </Grid2>
          <Grid2>
            <Panel title="Last four digits"><p><b>{m.last4.digits}</b> → total {m.last4.compound} → {m.last4.single}, which is <b>{REL_TEXT[m.last4.relationWithBhagyank]}</b> to your Bhagyank.</p><p className="text-muted-foreground">The last four digits are traditionally given extra weight.</p>{m.missingNumbersFilled.length > 0 && <p>This number fills your missing {m.missingNumbersFilled.join(', ')}.</p>}{m.repeatingDigits.length > 0 && <p className="text-muted-foreground">Repeating digits: {m.repeatingDigits.map((x) => `${x.digit}×${x.count}`).join(', ')}.</p>}</Panel>
            <Panel title="How the score is built"><table className="w-full">{<tbody>{Object.entries(m.scoreBreakdown).filter(([, v]) => v !== 0).map(([k, v]) => <tr key={k} className="border-t border-border/50 first:border-0"><td className="py-1">{LABEL[k] ?? pretty(k)}</td><td className={cn('text-right tabular-nums', v > 0 ? 'text-success' : 'text-danger')}>{v > 0 ? '+' : ''}{Math.round(v)}</td></tr>)}</tbody>}</table></Panel>
          </Grid2>
          <Panel title="What would suit you better"><Facts items={[['Ideal totals', m.suggestion.idealTotals.join(', ') || '—'], ['Favourable compounds', m.suggestion.idealCompounds.slice(0, 8).join(', ') || '—'], ['Good digit pairs', m.suggestion.favourableDigitPairs.slice(0, 8).join(', ') || '—'], ['Digits to avoid', m.suggestion.avoidDigits.join(', ') || 'none'], ['Pairs to avoid', m.suggestion.avoidPairs.join(', ')]]} /></Panel>
        </div>
      );
    }
    if (kind === 'kua' && d) {
      const k = kuaNumber(d.year, gender), dirs = KUA_DIRECTIONS[k];
      const dirMap = new Map<string, { label: string; good: boolean }>();
      (Object.entries(dirs.favourable) as [keyof typeof KUA_MEANING, string][]).forEach(([key, dir]) => dirMap.set(dir, { label: pretty(key), good: true }));
      (Object.entries(dirs.unfavourable) as [keyof typeof KUA_MEANING, string][]).forEach(([key, dir]) => dirMap.set(dir, { label: pretty(key), good: false }));
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]"><Big label="Your Kua number" n={k} sub={`${dirs.group} group · ${KUA_ELEMENT[k] ?? ''}`} />
            <div className="space-y-2 text-sm"><p>You belong to the <b>{dirs.group} group</b>. Your best direction is <b className="text-gold">{dirs.favourable.success}</b> (success) and your best direction for health is <b className="text-gold">{dirs.favourable.health}</b>.</p><p className="text-muted-foreground">Kua numbers guide the placement of your bed, desk and main seating according to the Eight Mansions system.</p></div></div>
          <Panel title="Your direction compass"><div className="mx-auto grid max-w-md grid-cols-3 gap-2">{COMPASS.flat().map(([abbr, full], i) => { const info = dirMap.get(full); return abbr ? (
            <div key={i} className={cn('mk-rise rounded-lg border p-2 text-center', info?.good ? 'border-gold bg-gold/10' : 'border-border bg-muted/30')} style={{ animationDelay: `${i * 50}ms` }}><p className="font-serif text-lg font-bold">{abbr}</p><p className={cn('text-[11px]', info?.good ? 'text-gold' : 'text-muted-foreground')}>{info?.label}</p></div>
          ) : <div key={i} className="mk-pulse flex items-center justify-center rounded-full border border-gold/60 bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-serif text-3xl font-bold">{k}</span></div>; })}</div><p className="text-center text-xs text-muted-foreground">Gold = favourable directions for you.</p></Panel>
          <Grid2>
            <Panel title="Favourable directions">{(Object.entries(dirs.favourable) as [keyof typeof KUA_MEANING, string][]).map(([key, dir]) => <p key={key}><b className="text-gold">{dir}</b> – {KUA_MEANING[key]}</p>)}</Panel>
            <Panel title="Directions to avoid">{(Object.entries(dirs.unfavourable) as [keyof typeof KUA_MEANING, string][]).map(([key, dir]) => <p key={key}><b>{dir}</b> – <span className="text-muted-foreground">{KUA_MEANING[key]}</span></p>)}</Panel>
          </Grid2>
          <Panel title="How to use this"><Bullets items={[`Sleep with your head towards ${dirs.favourable.health} or ${dirs.favourable.success}.`, `Face ${dirs.favourable.success} when you work, study or take important decisions.`, `Keep the main seating and your office chair facing a favourable direction (${Object.values(dirs.favourable).join(', ')}).`, `Avoid facing ${dirs.unfavourable.totalLoss} and ${dirs.unfavourable.mishaps} for long stretches.`]} /></Panel>
        </div>
      );
    }
  } catch { out = <p className="text-sm text-danger">Please check the details you entered.</p>; }

  const needsDob = kind !== 'name';
  return (
    <div className="glass space-y-5 rounded-lg p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        {needsDob && <Field label="Date of birth" htmlFor="c-dob"><Input id="c-dob" type="date" max={toIso(todayIST())} min="1900-01-01" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>}
        {(kind === 'loshu' || kind === 'kua' || kind === 'mobile' || kind === 'bhagyank') && <Field label={kind === 'bhagyank' ? 'Gender (optional)' : 'Gender (for Kua)'}><ChipGroup options={[{ value: 'male' as const, label: 'Male' }, { value: 'female' as const, label: 'Female' }]} value={[gender]} onChange={(v) => setGender(v[0] ?? 'male')} /></Field>}
        {kind === 'name' && <Field label="Name you use" htmlFor="c-name" className="sm:col-span-2"><Input id="c-name" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} /></Field>}
        {kind === 'mobile' && <Field label="Mobile number" htmlFor="c-mob"><Input id="c-mob" type="tel" inputMode="numeric" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>}
      </div>
      <div aria-live="polite">{out}</div>
      {out && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">This is a free summary from traditional Vedic and Chaldean rules. Acharya Nandram combines every number in your chart in the complete report, with personal remedies.</p>
          <div className="flex flex-wrap gap-2"><Link href="/reading" className={buttonVariants({ variant: 'gold' })}><Sparkles /> Get your complete reading</Link><Link href="/pricing" className={buttonVariants({ variant: 'outline' })}>See full report options</Link></div>
        </div>
      )}
    </div>
  );
}
