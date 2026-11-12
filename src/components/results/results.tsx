'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Compass, Feather, Download, FileJson, Flower2, Gem, Grid3x3, Heart, IdCard, Pencil, Printer, RotateCcw, Save, Smartphone, Type } from 'lucide-react';
import type { NumerologyResult } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { useApp } from '@/components/layout/providers';
import { Button } from '@/components/ui/button';
import { Badge, Callout, Section, Tabs } from '@/components/ui/misc';
import { NUMBER_TRAITS, PY_THEMES } from '@/lib/i18n/numberMeanings';
import { tr } from '@/lib/i18n/hi-terms';
import { cn, downloadJson } from '@/lib/utils';
import { Gauge, LifeRadar, Ring, YearBars } from './charts';
import { NarrativePanel } from './narrative';
import { PdfButton } from './pdf-button';
import { ReportRequestPanel, useQueued } from './report-queue';
import type { Narrative } from '@/lib/narrative/service';
import { GridLegend, NumberGrid } from './grid';

type R = NumerologyResult['results'];

const AREA_LABELS = {
  en: { career: 'Career', money: 'Money', love: 'Love', health: 'Health', family: 'Family', spirituality: 'Spirituality', communication: 'Communication', finance: 'Finance', stability: 'Stability' },
  hi: { career: 'करियर', money: 'धन', love: 'प्रेम', health: 'स्वास्थ्य', family: 'परिवार', spirituality: 'आध्यात्म', communication: 'संवाद', finance: 'वित्त', stability: 'स्थिरता' },
} as const;

const relTone = (r: string) => (r === 'friend' ? 'good' : r === 'enemy' ? 'bad' : 'default') as 'good' | 'bad' | 'default';

export function Results({ result, narrative, onNarrative, onEdit, onNew, onSave, saved, savedNote, reportId }: {
  result: NumerologyResult; narrative: Narrative | null; onNarrative: (n: Narrative | null) => void; onEdit: () => void; onNew: () => void; onSave: () => void; saved: boolean;
  savedNote?: React.ReactNode;
  /** Saved report id (general clients submit it for their complete report). */
  reportId?: string;
}) {
  const queued = useQueued();
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const { dob, name, mobile, aadhaar, couple, remedies } = result.results;
  const client = result.client;
  const T = (x: string | null | undefined) => tr(lang, x);
  const rel = (r: string) => (r === 'friend' ? t.r.friendly : r === 'enemy' ? t.r.enemy : t.r.neutral);
  const fileName = `${(client.commonName || client.fullName).replace(/\s+/g, '-').toLowerCase()}-numerology.json`;

  const nav = [
    { id: 'report', label: t.n.title, icon: Feather },
    { id: 'dob', label: t.r.loShu, icon: Grid3x3 },
    name && { id: 'name', label: t.r.name, icon: Type },
    mobile && { id: 'mobile', label: t.r.mobile, icon: Smartphone },
    aadhaar && { id: 'aadhaar', label: t.r.aadhaar, icon: IdCard },
    couple && { id: 'couple', label: t.r.couple, icon: Heart },
    { id: 'remedies', label: t.r.remedies, icon: Flower2 },
  ].filter(Boolean) as { id: string; label: string; icon: typeof Grid3x3 }[];

  return (
    <div className="container space-y-6 py-8 sm:py-12">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gold">{t.r.title}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{client.commonName || client.fullName}</h1>
            {client.hindiName && <p className="font-deva text-lg text-muted-foreground">{client.hindiName}</p>}
            <p className="mt-1 text-sm text-muted-foreground">
              {dob.dob.iso.split('-').reverse().join('-')} · {t.r.age} {dob.age} · {[client.city, client.state].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            {!queued && <PdfButton result={result} narrative={narrative} />}
            {!queued && <Button variant="outline" onClick={() => window.print()} className="no-print"><Printer /> {hi ? 'प्रिंट / PDF सहेजें' : 'Print / Save PDF'}</Button>}
            <Button variant="outline" onClick={onSave}>{saved ? <Check /> : <Save />} {saved ? t.btn.saved : t.btn.save}</Button>
            <Button variant="outline" onClick={() => downloadJson(fileName, narrative ? { ...result, narrative } : result)}><FileJson /> {t.btn.exportJson}</Button>
            <Button variant="ghost" onClick={onEdit}><Pencil /> {t.btn.edit}</Button>
            <Button variant="ghost" onClick={onNew}><RotateCcw /> {t.btn.newReading}</Button>
          </div>
          {savedNote && <div className="w-full text-right text-sm print:hidden">{savedNote}</div>}
        </div>
        <CoreNumbers r={result.results} />
      </motion.div>

      <nav className="sticky top-16 z-30 -mx-4 overflow-x-auto bg-background/80 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:px-2 print:hidden">
        <ul className="flex gap-1">
          {nav.map((n) => (
            <li key={n.id}><a href={`#${n.id}`} className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm hover:bg-gold/15"><n.icon className="h-4 w-4 text-gold" />{n.label}</a></li>
          ))}
        </ul>
      </nav>

      {queued ? <ReportRequestPanel reportId={reportId} saved={saved} onSave={onSave} /> : <NarrativePanel result={result} narrative={narrative} onChange={onNarrative} />}

      <DobSection r={result.results} />

      {name && (
        <Section id="name" title={t.r.name} subtitle={`${name.analysedName} · ${name.chaldean.nameNumber.compound}/${name.chaldean.nameNumber.single}`} icon={<Type className="h-5 w-5" />}>
          <div className="grid gap-6 md:grid-cols-[1fr_220px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium" /><th className="py-2 font-medium">{t.r.chaldean}</th><th className="py-2 font-medium">{t.r.pythagorean}</th></tr></thead>
                <tbody>
                  {(['nameNumber', 'soulUrge', 'personality', 'expression'] as const).map((k) => (
                    <tr key={k} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{t.r[k]}</td>
                      <td className="num-badge py-2 text-lg font-semibold">{name.chaldean[k].compound}/<span className="text-gold">{name.chaldean[k].single}</span></td>
                      <td className="num-badge py-2 text-lg">{name.pythagorean[k].compound}/{name.pythagorean[k].single}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge tone="gold">{name.chaldean.nameNumber.compound}: {T(name.chaldean.nameNumber.category)}</Badge>
                <Badge tone={relTone(name.relationWithMoolank)}>{t.preview.moolank} {dob.moolank.value}: {rel(name.relationWithMoolank)}</Badge>
                <Badge tone={relTone(name.relationWithBhagyank)}>{t.preview.bhagyank} {dob.bhagyank.value}: {rel(name.relationWithBhagyank)}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {name.chaldean.letters.map((l, i) => (
                  <span key={i} className="grid w-8 rounded border border-border text-center text-xs"><b>{l.letter}</b><span className="text-gold">{l.value}</span></span>
                ))}
              </div>
            </div>
            <Gauge value={name.compatibilityScore} label={t.r.compat} sub={`${t.preview.moolank} ${dob.moolank.value} · ${t.preview.bhagyank} ${dob.bhagyank.value}`} />
          </div>
          <h4 className="mb-2 mt-6 font-serif text-lg font-semibold">{t.r.corrections}</h4>
          {name.corrections.length === 0 || !name.needsCorrection ? <p className="text-sm text-muted-foreground">{t.r.noCorrections}</p> : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {name.corrections.map((c) => (
                <div key={c.spelling} className="rounded-md border border-gold/30 bg-gold/5 p-3">
                  <div className="flex items-center justify-between"><p className="font-serif text-lg font-semibold">{c.fullName}</p><Badge tone="good">{c.score}</Badge></div>
                  <p className="text-xs text-muted-foreground">{c.compound}/{c.single} · {c.changes.map(T).join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {mobile && (
        <Section id="mobile" title={t.r.mobile} subtitle={`${mobile.masked} · ${T(mobile.verdict)}`} icon={<Smartphone className="h-5 w-5" />}>
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <Gauge value={mobile.score} label={T(mobile.verdict)} sub={`${t.preview.mobileTotal} ${mobile.total.compound}/${mobile.total.single}`} />
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge tone={relTone(mobile.relationWithMoolank)}>{t.preview.moolank}: {rel(mobile.relationWithMoolank)}</Badge>
                <Badge tone={relTone(mobile.relationWithBhagyank)}>{t.preview.bhagyank}: {rel(mobile.relationWithBhagyank)}</Badge>
                <Badge>{t.r.last4}: {mobile.last4.digits} → {mobile.last4.single}</Badge>
                {mobile.zeroCount > 0 && <Badge tone={mobile.zeroCount >= 3 ? 'bad' : 'default'}>0 × {mobile.zeroCount}</Badge>}
              </div>
              <div>
                <p className="mb-1 text-muted-foreground">{t.r.pairs}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mobile.pairs.map((p) => (
                    <span key={p.position} title={T(p.kind)} className={cn('num-badge rounded px-2 py-1 text-sm font-semibold',
                      p.kind === 'malefic' ? 'bg-danger/20 text-danger' : p.kind === 'conflict' ? 'bg-warning/20 text-warning' : p.kind === 'supportive' ? 'bg-success/20 text-success' : 'bg-muted')}>{p.pair}</span>
                  ))}
                </div>
              </div>
              {mobile.missingNumbersFilled.length > 0 && <p>{t.r.fills}: <b>{mobile.missingNumbersFilled.join(', ')}</b></p>}
              <Callout kind="advice" title={t.r.idealTotals}>
                <p><b>{mobile.suggestion.idealTotals.join(', ')}</b> · {mobile.suggestion.idealCompounds.slice(0, 8).join(', ')}</p>
                <p className="mt-1 text-muted-foreground">✓ {mobile.suggestion.favourableDigitPairs.slice(0, 10).join(' ')} · ✗ {mobile.suggestion.avoidPairs.join(' ')}</p>
              </Callout>
            </div>
          </div>
        </Section>
      )}

      {aadhaar && (
        <Section id="aadhaar" title={t.r.aadhaar} subtitle={aadhaar.masked} icon={<IdCard className="h-5 w-5" />}>
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <Gauge value={aadhaar.score} label={T(aadhaar.verdict)} sub={`${aadhaar.total.compound}/${aadhaar.total.single}`} />
            <div className="space-y-3 text-sm">
              <p className="num-badge text-2xl tracking-widest">{aadhaar.masked}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone={relTone(aadhaar.relationWithMoolank)}>{t.preview.moolank}: {rel(aadhaar.relationWithMoolank)}</Badge>
                <Badge tone={relTone(aadhaar.relationWithBhagyank)}>{t.preview.bhagyank}: {rel(aadhaar.relationWithBhagyank)}</Badge>
              </div>
              {aadhaar.gridEffect.missingNumbersFilled.length > 0 && <p>{t.r.fills}: <b>{aadhaar.gridEffect.missingNumbersFilled.join(', ')}</b></p>}
              <p className="text-muted-foreground">{T(aadhaar.note)}</p>
            </div>
          </div>
        </Section>
      )}

      {couple && <CoupleSection c={couple} />}

      <RemediesSection rm={remedies} />

    </div>
  );
}

function CoreNumbers({ r }: { r: R }) {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const traits = NUMBER_TRAITS[lang];
  const T = (x: string | null | undefined) => tr(lang, x);
  const cards = [
    { k: t.preview.moolank, n: r.dob.moolank.value, sub: `${r.dob.moolank.compound}` },
    { k: t.preview.bhagyank, n: r.dob.bhagyank.value, sub: `${r.dob.bhagyank.compound}${r.dob.bhagyank.master ? ` · ${lang === 'hi' ? 'मास्टर' : 'master'} ${r.dob.bhagyank.master}` : ''}` },
    { k: t.preview.kua, n: r.dob.kua.value, sub: T(r.dob.kua.group) },
    r.name && { k: t.preview.nameNo, n: r.name.chaldean.nameNumber.single, sub: `${r.name.chaldean.nameNumber.compound}` },
    { k: t.preview.py, n: r.dob.personalCycles.current.personalYear, sub: PY_THEMES[lang][r.dob.personalCycles.current.personalYear] },
  ].filter(Boolean) as { k: string; n: number; sub: string }[];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => (
        <motion.div key={c.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
          className="rounded-lg border border-gold/30 bg-gradient-to-b from-gold/10 to-transparent p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.k}</p>
          <p className="num-badge gold-text text-5xl font-bold">{c.n}</p>
          <p className="text-xs font-medium">{lang === 'hi' ? T(planetOf(c.n).hindiName) : `${planetOf(c.n).name} · ${planetOf(c.n).hindiName}`}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{traits[c.n].keyword} · {c.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

function DobSection({ r }: { r: R }) {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const d = r.dob;
  const [tab, setTab] = React.useState('loshu');
  const [sel, setSel] = React.useState<number | null>(null);
  const [line, setLine] = React.useState<string | null>(null);
  const lines = [...d.loShu.planes, ...d.loShu.diagonals];
  const hl = lines.find((l) => l.id === line)?.numbers ?? [];
  const cells = tab === 'loshu' ? d.loShu.cells : d.vedicGrid.cells;
  const selCell = sel ? d.loShu.cells.find((c) => c.number === sel) : null;
  const loShuRemedy = sel ? r.remedies.loShuRemedies.find((x) => x.number === sel) : undefined;
  const labels = AREA_LABELS[lang];
  const T = (x: string | null | undefined) => tr(lang, x);
  const strengthsText = [...d.loShu.yogs.map((y) => T(y.name)), ...d.loShu.arrowsOfStrength.map((a) => T(a.name)), d.moolankBhagyankRelation === 'friend' ? `${t.preview.moolank}–${t.preview.bhagyank}: ${t.r.friendly}` : null].filter(Boolean);
  const watchText = [...d.loShu.arrowsOfWeakness.map((a) => T(a.name)), d.loShu.missing.length ? `${t.r.missing}: ${d.loShu.missing.join(', ')}` : null, ...d.loShu.repeated.filter((x) => x.count >= 3).map((x) => `${x.number} × ${x.count}`)].filter(Boolean);

  return (
    <Section id="dob" title={`${t.r.loShu} ${lang === 'hi' ? 'और' : '&'} ${t.r.vedic}`} subtitle={`${t.preview.moolank} ${d.moolank.value} · ${t.preview.bhagyank} ${d.bhagyank.value} · ${t.preview.kua} ${d.kua.value}`} icon={<Grid3x3 className="h-5 w-5" />}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="space-y-3">
          <Tabs tabs={[{ value: 'loshu', label: t.r.loShu }, { value: 'vedic', label: t.r.vedic }]} value={tab} onChange={(v) => { setTab(v); setLine(null); }} />
          <NumberGrid cells={cells} highlight={tab === 'loshu' ? hl : []} selected={sel} onSelect={(n) => setSel(sel === n ? null : n)} showPlanet={tab === 'vedic'} label={tab === 'loshu' ? t.r.loShu : t.r.vedic} />
          <GridLegend labels={{ present: t.r.present, missing: t.r.missing, repeated: t.r.repeated }} />
        </div>
        <div className="space-y-4">
          {selCell ? (
            <motion.div key={sel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md border border-gold/40 bg-gold/5 p-4 text-sm">
              <p className="font-serif text-xl font-semibold">{selCell.number} · {lang === 'hi' ? T(planetOf(selCell.number).hindiName) : `${planetOf(selCell.number).name} (${planetOf(selCell.number).hindiName})`} <Badge className="ml-1" tone={selCell.status === 'missing' ? 'warn' : selCell.status === 'repeated' ? 'gold' : 'good'}>{t.r[selCell.status]}{selCell.count > 1 ? ` ×${selCell.count}` : ''}</Badge></p>
              <p className="mt-1"><b>{NUMBER_TRAITS[lang][selCell.number].keyword}</b> · {NUMBER_TRAITS[lang][selCell.number].plus}</p>
              <p className="text-muted-foreground">{NUMBER_TRAITS[lang][selCell.number].minus}</p>
              {loShuRemedy && <p className="mt-2"><b>{t.r.yourRemedy}:</b> {T(loShuRemedy.placement)} · {T(loShuRemedy.wristband)} · {T(loShuRemedy.colour)}</p>}
            </motion.div>
          ) : <p className="text-sm text-muted-foreground">{t.r.tapHint}</p>}
          {tab === 'loshu' && (
            <div>
              <p className="mb-2 text-sm font-semibold">{t.r.planes}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {lines.map((l) => (
                  <button key={l.id} onClick={() => setLine(line === l.id ? null : l.id)}
                    className={cn('flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors', line === l.id ? 'border-gold bg-gold/10' : 'border-border hover:border-gold/50')}>
                    <span><span className="font-medium">{T(l.name)}</span> <span className="text-muted-foreground">{l.numbers.join('-')}</span>{l.arrow && <span className="block text-xs text-muted-foreground">{T(l.arrow)}{l.yog ? ` · ${T(l.yog)}` : ''}</span>}</span>
                    <Badge tone={l.status === 'complete' ? 'good' : l.status === 'empty' ? 'bad' : 'default'}>{l.presentCount}/3</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Callout kind="strength" title={t.r.strengths}>{strengthsText.length ? strengthsText.join(' · ') : '–'}</Callout>
        <Callout kind="watch" title={t.r.watch}>{watchText.length ? watchText.join(' · ') : '–'}</Callout>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold">{t.r.relations}</p>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const k = d.numberRelations.combined.friendly.includes(n) ? 'good' : d.numberRelations.combined.enemy.includes(n) ? 'bad' : 'default';
            return <Badge key={n} tone={k} className="num-badge px-3 text-sm">{n}</Badge>;
          })}
          <span className="ml-2 self-center text-xs text-muted-foreground"><span className="text-success">■</span> {t.r.friendly} <span className="text-danger">■</span> {t.r.enemy}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">{t.r.lifeAreas}</p>
          <LifeRadar data={Object.entries(d.lifeAreaScores).map(([k, v]) => ({ area: labels[k as keyof typeof labels] ?? k, value: v }))} />
        </div>
        <div>
          <p className="text-sm font-semibold">{t.r.pyTimeline}</p>
          <YearBars data={d.personalCycles.timeline} currentYear={d.personalCycles.timeline[0].year} themeOf={(n) => PY_THEMES[lang][n]} />
          {d.personalCycles.current.label && <p className="text-xs">{t.preview.py} {d.personalCycles.current.personalYear}: <b>{T(d.personalCycles.current.label)}</b></p>}
          <p className="text-xs text-muted-foreground">{d.personalCycles.timeline.slice(0, 4).map((y) => `${y.year}: ${PY_THEMES[lang][y.personalYear]}`).join(' · ')}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <p className="mb-2 text-sm font-semibold">{t.r.cycles}</p>
        <table className="w-full min-w-[480px] text-sm">
          <tbody>
            {([[t.r.pinnacle, d.pinnacles], [t.r.challenge, d.challenges], [t.r.cycle, d.lifeCycles]] as const).map(([label, rows]) => (
              <tr key={label} className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">{label}</td>
                {rows.map((p) => (
                  <td key={p.index} className={cn('px-1 py-2')}>
                    <span className={cn('block rounded-md px-2 py-1 text-center', p.current && 'bg-gold/15 ring-1 ring-gold')}>
                      <b className="num-badge text-base">{p.number}</b>
                      <span className="block text-[11px] text-muted-foreground">{p.fromAge}–{p.toAge ?? '+'}</span>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function CoupleSection({ c }: { c: NonNullable<R['couple']> }) {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const labels = AREA_LABELS[lang];
  return (
    <Section id="couple" title={t.r.couple} subtitle={`${c.partnerA.name} ♥ ${c.partnerB.name}`} icon={<Heart className="h-5 w-5" />}>
      <div className="grid items-center gap-6 md:grid-cols-[180px_1fr]">
        <div className="flex justify-center"><Ring value={c.overall} label={t.r.overall} /></div>
        <LifeRadar data={Object.entries(c.areaScores).map(([k, v]) => ({ area: labels[k as keyof typeof labels] ?? k, value: v }))} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {(['moolank', 'bhagyank', 'nameNumber'] as const).map((k) => (
          <div key={k} className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{k === 'nameNumber' ? t.preview.nameNo : t.preview[k]}</p>
            <p className="num-badge text-lg font-semibold">{c.partnerA[k]} ↔ {c.partnerB[k]}</p>
            <p className="text-xs">{c.relations[k].harmony}/100</p>
          </div>
        ))}
      </div>
      <h4 className="mb-2 mt-6 font-serif text-lg font-semibold">{t.r.combinedGrid}</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-center text-sm">
          <thead><tr className="text-muted-foreground"><th className="py-1 text-left font-medium" />{c.combinedGrid.overlay.map((o) => <th key={o.number} className="num-badge py-1 font-semibold text-foreground">{o.number}</th>)}</tr></thead>
          <tbody>
            {(['partnerA', 'partnerB'] as const).map((p) => (
              <tr key={p} className="border-t border-border/50">
                <td className="py-2 pr-2 text-left text-xs">{c[p].name.split(' ')[0]}</td>
                {c.combinedGrid.overlay.map((o) => {
                  const brings = p === 'partnerA' ? o.aBringsToB : o.bBringsToA;
                  return <td key={o.number} className="py-1"><span className={cn('inline-grid h-8 w-8 place-items-center rounded', o[p] ? (brings ? 'bg-success/25 font-semibold' : 'bg-gold/15') : 'text-muted-foreground/40')}>{o[p] || '·'}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-muted-foreground"><span className="text-success">■</span> = {t.r.bringsA} · {t.r.missing} ({lang === 'hi' ? 'दोनों में' : 'both'}): {c.combinedGrid.bothMissing.join(', ') || t.r.none}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Callout kind="advice" title={t.r.marriageDates}>{c.marriage.favourableDateNumbers.join(', ')} → {c.marriage.favourableDatesOfMonth.join(', ')}</Callout>
        <Callout kind="remedy" title={t.r.auspiciousYears}>{c.marriage.auspiciousYears.length ? c.marriage.auspiciousYears.map((y) => `${y.year} (${y.personalYearA}/${y.personalYearB})`).join(', ') : c.marriage.yearTable.filter((y) => y.score >= 2).map((y) => y.year).join(', ')}</Callout>
      </div>
    </Section>
  );
}

function RemediesSection({ rm }: { rm: R['remedies'] }) {
  const { t, lang } = useApp();
  const hi = lang === 'hi';
  const T = (x: string | null | undefined) => tr(lang, x);
  const rows: [string, string][] = [
    [t.r.numbers, rm.lucky.numbers.join(', ')],
    [t.r.dates, rm.lucky.dates.join(', ')],
    [t.r.days, rm.lucky.days.map(T).join(', ')],
    [t.r.colours, rm.lucky.colours.map(T).join(', ')],
    [t.r.avoid, rm.lucky.avoidColours.map(T).join(', ') || '–'],
    [t.r.directions, Object.values(rm.lucky.directions).map((x) => T(x as string)).join(', ')],
  ];
  return (
    <Section id="remedies" title={t.r.remedies} subtitle={hi ? `${T(rm.rulingPlanet.hindi)} · ${T(rm.destinyPlanet.name)}` : `${rm.rulingPlanet.name} (${rm.rulingPlanet.hindi}) · ${rm.destinyPlanet.name}`} icon={<Flower2 className="h-5 w-5" />}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-gold/30 p-4">
          <p className="mb-2 flex items-center gap-2 font-semibold"><Compass className="h-4 w-4 text-gold" />{t.r.lucky}</p>
          <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-sm">{rows.map(([k, v]) => <React.Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
        </div>
        <div className="rounded-md border border-gold/30 p-4">
          <p className="mb-2 flex items-center gap-2 font-semibold"><Gem className="h-4 w-4 text-gold" />{t.r.gem}</p>
          {rm.gemstones.map((g) => (
            <div key={g.for} className="mb-2 text-sm">
              <p><b>{hi ? T(g.hindi) : g.name}</b>{hi ? '' : ` (${g.hindi})`} · {T(g.for)}</p>
              <p className="text-xs text-muted-foreground">{T(g.metal)} · {T(g.finger)} · {hi ? 'रुद्राक्ष' : 'Rudraksha'} {T(g.rudraksha)} · {hi ? 'विकल्प' : 'alt'}: {g.alternatives.map(T).join(', ')}</p>
            </div>
          ))}
          <p className="text-xs text-warning">{T(rm.gemstones[0].caution)}</p>
        </div>
        <div className="rounded-md border border-gold/30 p-4 text-sm">
          <p className="mb-2 font-semibold">{t.r.mantra}</p>
          <p className="font-serif text-base italic">“{T(rm.mantra.mantra)}”</p>
          <p className="mt-1 text-muted-foreground">{rm.mantra.dailyCount}× · {T(rm.mantra.day)} · {T(rm.mantra.deity)}</p>
          <p className="mt-3"><b>{t.r.daan}:</b> {rm.daan.map(T).join(', ')}</p>
          <p><b>{t.r.fasting}:</b> {T(rm.fastingDay)}</p>
        </div>
      </div>

      {rm.loShuRemedies.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rm.loShuRemedies.map((x) => (
            <Callout key={x.number} kind="remedy" title={`${t.r.missing} ${x.number} · ${T(x.element)} · ${T(x.direction)}`}>
              <p>{T(x.placement)}</p><p className="text-muted-foreground">{T(x.wristband)} · {T(x.colour)}</p>
            </Callout>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="text-sm">
          <p className="mb-1 font-semibold">{t.r.habits}</p>
          <ul className="list-disc space-y-1 pl-5">{rm.dailyHabits.map((h) => <li key={h}>{T(h)}</li>)}</ul>
          <p className="mb-1 mt-3 font-semibold">{t.r.signature}</p>
          <ul className="list-disc space-y-1 pl-5">{rm.signature.map((h) => <li key={h}>{T(h)}</li>)}</ul>
        </div>
        <div className="text-sm">
          <p className="mb-1 font-semibold">{t.r.favYears}</p>
          <table className="w-full">
            <tbody>
              {Object.entries(rm.favourableYears).map(([ev, ys]) => (
                <tr key={ev} className="border-b border-border/50">
                  <td className="py-1.5 pr-2 text-muted-foreground">{t.r.events[ev as keyof typeof t.r.events] ?? ev}</td>
                  <td className="py-1.5">{ys.map((y) => y.year).join(', ') || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3"><b>{t.r.career}:</b> {rm.career.suitableFields.map(T).join(', ')}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{T(rm.disclaimer)}</p>
    </Section>
  );
}

