'use client';
import * as React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { analyseDob, analyseMobile, analyseNameSystem, bhagyank, kuaNumber, moolank, todayIST, toIso } from '@/lib/numerology';
import { KUA_DIRECTIONS } from '@/lib/numerology/data/tables';
import { planetOf } from '@/lib/numerology/data/planets';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import type { CalcKind } from '@/lib/seo/calculators';
import { NumberGrid } from '@/components/results/grid';
import { Field, Input, ChipGroup } from '@/components/ui/form';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';

const parseIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? { year: +m[1], month: +m[2], day: +m[3] } : null; };

function Big({ label, n, sub }: { label: string; n: number | string; sub?: string }) {
  return <div className="rounded-lg border border-gold/40 bg-gold/5 p-4 text-center"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="num-badge gold-text text-6xl font-bold">{n}</p>{sub && <p className="text-sm">{sub}</p>}</div>;
}

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
      const m = moolank(d.day).value, p = planetOf(m);
      out = <div className="grid gap-4 sm:grid-cols-2"><Big label="Your Moolank" n={m} sub={`${p.name} (${p.hindiName})`} /><div className="space-y-1 text-sm"><p><b>{traits[m].keyword}</b> – {traits[m].plus}.</p><p className="text-muted-foreground">Watch for: {traits[m].minus}.</p><p>Lucky day: <b>{p.weekday}</b> · Colours: {p.colours.slice(0, 3).join(', ')}</p></div></div>;
    }
    if (kind === 'bhagyank' && d) {
      const b = bhagyank(d), p = planetOf(b.value);
      out = <div className="grid gap-4 sm:grid-cols-2"><Big label="Your Bhagyank" n={b.value} sub={`Total ${b.compound}${b.master ? ` · master ${b.master}` : ''} · ${p.name}`} /><div className="space-y-1 text-sm"><p><b>{traits[b.value].keyword}</b> – {traits[b.value].plus}.</p><p className="text-muted-foreground">Watch for: {traits[b.value].minus}.</p></div></div>;
    }
    if (kind === 'loshu' && d) {
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      out = <div className="grid items-start gap-6 sm:grid-cols-2"><NumberGrid cells={r.loShu.cells} label="Lo Shu Grid" /><div className="space-y-2 text-sm"><p>Moolank <b>{r.moolank.value}</b> · Bhagyank <b>{r.bhagyank.value}</b> · Kua <b>{r.kua.value}</b></p><p>Missing numbers: <b>{r.loShu.missing.join(', ') || 'none'}</b></p><p>Repeated: {r.loShu.repeated.map((x) => `${x.number}×${x.count}`).join(', ') || 'none'}</p><div className="flex flex-wrap gap-1">{r.loShu.yogs.map((y) => <Badge key={y.name} tone="good">{y.name}</Badge>)}{r.loShu.arrowsOfWeakness.map((a) => <Badge key={a.name} tone="warn">{a.name}</Badge>)}</div></div></div>;
    }
    if (kind === 'name' && name.replace(/[^A-Za-z]/g, '').length >= 2) {
      const c = analyseNameSystem(name, 'chaldean'), py = analyseNameSystem(name, 'pythagorean');
      out = <div className="grid gap-4 sm:grid-cols-3"><Big label="Chaldean name number" n={c.nameNumber.single} sub={`Compound ${c.nameNumber.compound} · ${c.nameNumber.category}`} /><Big label="Soul urge" n={c.soulUrge.single} /><Big label="Pythagorean" n={py.nameNumber.single} sub={`Compound ${py.nameNumber.compound}`} /></div>;
    }
    if (kind === 'mobile' && d && mobile.replace(/\D/g, '').length >= 10) {
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const m = analyseMobile(mobile, { moolank: r.moolank.value, bhagyank: r.bhagyank.value, missingNumbers: r.loShu.missing });
      out = <div className="grid gap-4 sm:grid-cols-2"><Big label="Compatibility score" n={m.score} sub={m.verdict} /><div className="space-y-1 text-sm"><p>Total: <b>{m.total.compound} → {m.total.single}</b></p><p>Difficult pairs: {m.maleficPairs.join(', ') || 'none'}</p><p>Ideal totals for you: <b>{m.suggestion.idealTotals.join(', ')}</b></p></div></div>;
    }
    if (kind === 'kua' && d) {
      const k = kuaNumber(d.year, gender), dirs = KUA_DIRECTIONS[k];
      out = <div className="grid gap-4 sm:grid-cols-2"><Big label="Your Kua number" n={k} sub={`${dirs.group} group`} /><ul className="space-y-1 text-sm"><li>Success: <b>{dirs.favourable.success}</b></li><li>Health: <b>{dirs.favourable.health}</b></li><li>Relationships: <b>{dirs.favourable.relationships}</b></li><li>Personal growth: <b>{dirs.favourable.personalGrowth}</b></li><li className="text-muted-foreground">Avoid facing: {dirs.unfavourable.totalLoss}</li></ul></div>;
    }
  } catch { out = <p className="text-sm text-danger">Please check the details you entered.</p>; }

  const needsDob = kind !== 'name';
  return (
    <div className="glass space-y-5 rounded-lg p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        {needsDob && <Field label="Date of birth" htmlFor="c-dob"><Input id="c-dob" type="date" max={toIso(todayIST())} min="1900-01-01" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>}
        {(kind === 'loshu' || kind === 'kua' || kind === 'mobile') && <Field label="Gender (for Kua)"><ChipGroup options={[{ value: 'male' as const, label: 'Male' }, { value: 'female' as const, label: 'Female' }]} value={[gender]} onChange={(v) => setGender(v[0] ?? 'male')} /></Field>}
        {kind === 'name' && <Field label="Name you use" htmlFor="c-name" className="sm:col-span-2"><Input id="c-name" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} /></Field>}
        {kind === 'mobile' && <Field label="Mobile number" htmlFor="c-mob"><Input id="c-mob" type="tel" inputMode="numeric" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>}
      </div>
      <div aria-live="polite">{out}</div>
      {out && <div className="flex flex-wrap gap-2 border-t border-border pt-4"><Link href="/reading" className={buttonVariants({ variant: 'gold' })}><Sparkles /> Get your complete reading</Link><Link href="/pricing" className={buttonVariants({ variant: 'outline' })}>See full report options</Link></div>}
    </div>
  );
}
