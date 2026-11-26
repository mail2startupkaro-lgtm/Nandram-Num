'use client';
/**
 * Admin → Signature analysis.
 * 1. Client details · 2. Profession & goals · 3. Up to three signature samples (upload or draw) – each is MEASURED in the
 * browser (baseline, slant, first letter, underline / strike-through, ending, dots, gaps …) and annotated ·
 * 4. Expert observations (override measurements) → AI agent / rule-based analyst → structured result + branded PDF.
 */
import * as React from 'react';
import { Bot, Brush, CalendarDays, Copy, Download, Gauge, ImageUp, Loader2, PenLine, Ruler, ScanLine, Sparkles, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { FEATURES, GOALS, PROFESSIONS, featureLabel } from '@/lib/signature/catalogue';
import type { AgentResult, SignatureAnalysis } from '@/lib/signature/agent';
import { classifyMetrics, combineSamples, consistencyScore, type MeasuredFeatures, type SignatureMetrics } from '@/lib/signature/measure';
import { analyseSample, shrink } from '@/lib/client/signature-image';
import { DrawPad } from '@/components/signature/draw-pad';
import type { SignatureNumbers } from '@/lib/signature/numbers';
import { cn } from '@/lib/utils';
import type { Order } from './services-admin';

interface Result extends AgentResult { numbers: SignatureNumbers; generatedAt: string }
interface Sample { id: string; dataUrl: string; source: 'photo' | 'drawn'; metrics: SignatureMetrics | null; annotated: string | null; width: number; height: number }
const IMPACT = { positive: ['Supports', 'good'], neutral: ['Neutral', 'default'], watch: ['Needs attention', 'warn'] } as const;
const REL = { friend: 'Friendly', neutral: 'Neutral', enemy: 'Not friendly' } as const;
const REL_TONE = { friend: 'good', neutral: 'default', enemy: 'warn' } as const;
const CAT_TONE = { favourable: 'good', mixed: 'default', unfavourable: 'warn' } as const;
const PRI = { high: ['High priority', 'border-l-maroon'], medium: ['Medium', 'border-l-gold'], low: ['Low', 'border-l-border'] } as const;
const MAX_SAMPLES = 3;

function ScoreRing({ value, label, size = 'lg' }: { value: number; label: string; size?: 'lg' | 'sm' }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className={cn('relative shrink-0', size === 'lg' ? 'h-40 w-40' : 'h-24 w-24')}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(43 85% 55%)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset 900ms ease' }} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={cn('gold-text font-serif font-bold', size === 'lg' ? 'text-5xl' : 'text-2xl')}>{value}</span><span className="px-3 text-center text-[9px] uppercase leading-tight tracking-widest text-muted-foreground">{label}</span></div>
    </div>
  );
}
const tone = (v: number) => (v >= 80 ? 'bg-emerald-500' : v >= 65 ? 'bg-gold' : v >= 45 ? 'bg-amber-500' : 'bg-red-500');
const ScoreBar = ({ label, value, hint }: { label: string; value: number | null; hint?: string }) => value === null ? null : (
  <div className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-sm" title={hint}>
    <span className="text-muted-foreground">{label}</span>
    <span className="h-2.5 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', tone(value))} style={{ width: `${Math.max(3, value)}%` }} /></span>
    <span className="text-right font-serif font-bold tabular-nums">{value}</span>
  </div>
);
const ConfDots = ({ c }: { c?: string }) => { const n = c === 'high' ? 3 : c === 'medium' ? 2 : c === 'low' ? 1 : 0; return n ? <span className="inline-flex gap-0.5" title={`${c} certainty`}>{[1, 2, 3].map((k) => <span key={k} className={cn('h-1.5 w-1.5 rounded-full', k <= n ? 'bg-gold' : 'bg-muted')} />)}</span> : null; };
const Section = ({ id, title, icon, children, className }: { id: string; title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section id={id} className={cn('glass scroll-mt-24 rounded-lg p-5', className)}><h3 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-gold">{icon}{title}</h3>{children}</section>
);

function reportText(name: string, r: Result) {
  const a = r.analysis, n = r.numbers;
  return [`SIGNATURE ANALYSIS – ${name}`, `Score: ${a.overallScore}/100 · Graphology ${r.scores.graphology ?? '—'} · Name vibration ${r.scores.nameVibration} · Profession fit ${r.scores.professionFit}`, '', a.headline, a.summary, '',
    'OBSERVATIONS', ...a.observations.map((o) => `• ${o.feature}: ${o.observed} – ${o.meaning}`), '',
    'NUMBERS', `Moolank ${n.moolank} · Bhagyank ${n.bhagyank} · Signed name ${n.signName.compound}/${n.signName.single} · Full name ${n.fullName.compound}/${n.fullName.single} · First letter ${n.firstLetter.letter}=${n.firstLetter.value}`,
    n.bestOption ? `Recommended name form: ${n.bestOption.text} (${n.bestOption.compound}/${n.bestOption.single})` : '', '',
    'PERSONALITY', ...a.personality.map((x) => `• ${x}`), '', 'CAREER', a.career.fit, a.career.advice, a.finance ? `\nWEALTH\n${a.finance}` : '', a.relationships ? `\nRELATIONSHIPS\n${a.relationships}` : '', '',
    'STRENGTHS', ...a.strengths.map((x) => `• ${x}`), '', 'WATCH-OUTS', ...a.watchouts.map((x) => `• ${x}`), '',
    'CORRECTIONS', ...a.corrections.map((c, i) => `${i + 1}. ${c.title} – ${c.detail}`), '', 'IDEAL SIGNATURE', ...a.idealSignature.steps.map((x) => `• ${x}`),
    `Start: ${a.idealSignature.startDay}`, `Ink: ${a.idealSignature.inkColour}`, `Practice: ${a.idealSignature.practice}`, '', a.closing, '', 'Prepared by Acharya Nandram · myNumerologist.com'].filter((x) => x !== undefined).join('\n');
}

export function SignatureStudio({ preloadedOrder, onClearPreloadedOrder }: { preloadedOrder?: Order | null; onClearPreloadedOrder?: () => void } = {}) {
  const [fromOrder, setFromOrder] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ fullName: '', signatureName: '', dob: '', gender: '', hand: 'right', professionId: 'business', professionText: '', experienceYears: '', concerns: '', language: 'en' as 'en' | 'hi' | 'hinglish', preparedBy: 'Acharya Nandram', theme: 'royal-gold-maroon', expertNote: '' });
  const [goals, setGoals] = React.useState<string[]>([]);
  const [obs, setObs] = React.useState<Record<string, string>>({});
  const [samples, setSamples] = React.useState<Sample[]>([]);
  const [mode, setMode] = React.useState<'upload' | 'draw'>('upload');
  const [showMarks, setShowMarks] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [res, setRes] = React.useState<Result | null>(null);
  // Client details exactly as they were when the analysis ran – the PDF must match the numbers, even if the form is edited afterwards.
  const analysedWith = React.useRef<{ f: typeof f; goals: string[] } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  // Opened from Admin → Services & orders → "Generate Report": fill in the client's booking details.
  React.useEffect(() => {
    if (!preloadedOrder) return;
    const d = preloadedOrder.details ?? {};
    const dob = /^\d{4}-\d{2}-\d{2}$/.test(d.dob ?? '') ? d.dob : /^(\d{2})[-/.](\d{2})[-/.](\d{4})$/.test(d.dob ?? '') ? d.dob.replace(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/, '$3-$2-$1') : '';
    const q = d.questions ?? '';
    const lang = /hinglish/i.test(q) ? 'hinglish' : /hindi|हिंदी/i.test(q) ? 'hi' : 'en';
    setF((x) => ({ ...x, fullName: d.clientName ?? '', signatureName: d.currentName ?? '', dob: dob ?? '', gender: ['male', 'female', 'other'].includes(d.gender ?? '') ? d.gender : '', concerns: q.slice(0, 1000), language: lang }));
    setSamples([]); setObs({}); setRes(null);
    const when = `${d.clientName ?? 'Client'} · ordered ${new Date(preloadedOrder.createdAt).toLocaleDateString('en-IN')}`;
    setFromOrder(preloadedOrder.hasSignatureImage ? `${when} – loading the signature photo the client uploaded…` : `${when} – add the signature photos the client sent on WhatsApp`);
    // The client's uploaded signature photo is added as the first sample and measured like any other.
    if (preloadedOrder.hasSignatureImage) {
      const orderId = preloadedOrder.id;
      api<{ image: string }>(`/api/admin/service-orders?image=${encodeURIComponent(orderId)}`).then(async ({ image }) => {
        const id = `order-${orderId}`;
        setSamples((s) => (s.some((x) => x.id === id) ? s : [{ id, dataUrl: image, source: 'photo' as const, metrics: null, annotated: null, width: 0, height: 0 }, ...s].slice(0, MAX_SAMPLES)));
        setFromOrder(`${when} – the client's uploaded signature photo is added below; add more samples if they sent any on WhatsApp`);
        try { const m = await analyseSample(image, 'photo'); setSamples((s) => s.map((x) => (x.id === id ? { ...x, ...m } : x))); } catch { /* shown unmeasured */ }
      }).catch(() => setFromOrder(`${when} – the uploaded signature photo could not be loaded; download it from the order card`));
    }
    onClearPreloadedOrder?.();
  }, [preloadedOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const letters = (f.signatureName || f.fullName).replace(/[^A-Za-z]/g, '').length;
  const measured: MeasuredFeatures = React.useMemo(() => combineSamples(samples.filter((s) => s.metrics?.strokeWidth).map((s) => classifyMetrics(s.metrics!, letters))), [samples, letters]);
  const consistency = React.useMemo(() => consistencyScore(samples.map((s) => s.metrics).filter((m): m is SignatureMetrics => !!m)), [samples]);

  async function addSample(dataUrl: string, source: 'photo' | 'drawn') {
    if (samples.length >= MAX_SAMPLES) { setErr(`Up to ${MAX_SAMPLES} samples.`); return; }
    setErr('');
    const id = Math.random().toString(36).slice(2);
    setSamples((s) => [...s, { id, dataUrl, source, metrics: null, annotated: null, width: 0, height: 0 }]);
    try { const m = await analyseSample(dataUrl, source); setSamples((s) => s.map((x) => (x.id === id ? { ...x, ...m } : x))); }
    catch { setSamples((s) => s.map((x) => (x.id === id ? { ...x, metrics: null } : x))); }
  }
  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, MAX_SAMPLES - samples.length); e.target.value = '';
    for (const file of files) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setErr('Please choose PNG, JPG or WEBP images.'); continue; }
      if (file.size > 15 * 1024 * 1024) { setErr('Image is larger than 15 MB.'); continue; }
      await addSample(await shrink(file), 'photo');
    }
  }

  async function analyse(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true); setRes(null);
    try {
      const r = await api<Result>('/api/admin/signature', { method: 'POST', json: {
        fullName: f.fullName, signatureName: f.signatureName || undefined, dob: f.dob, gender: f.gender || undefined, hand: f.hand || undefined,
        professionId: f.professionId, professionText: f.professionText || undefined, experienceYears: f.experienceYears ? Number(f.experienceYears) : undefined,
        goals, concerns: f.concerns || undefined, language: f.language, images: samples.map((s) => s.dataUrl), measured, consistency, observations: obs } });
      analysedWith.current = { f: { ...f }, goals: [...goals] };
      setRes(r);
      setTimeout(() => document.getElementById('sig-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) {
      setErr(x instanceof ApiError ? (x.body.error === 'RATE_LIMITED' ? 'Too many analyses – please wait a few minutes.' : x.status === 413 ? 'Images are too large – remove a sample and try again.' : x.message) : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  async function downloadPdf() {
    if (!res) return;
    setPdfBusy(true); setErr('');
    try {
      const c = analysedWith.current?.f ?? f, g = analysedWith.current?.goals ?? goals;
      const prof = PROFESSIONS.find((p) => p.id === c.professionId) ?? PROFESSIONS[PROFESSIONS.length - 1];
      const body = {
        client: { fullName: c.fullName, signatureName: c.signatureName || undefined, dob: c.dob, gender: c.gender || undefined, profession: prof.id === 'other' ? c.professionText || 'Other' : `${prof.label}${c.professionText ? `, ${c.professionText}` : ''}`, goals: g, language: c.language },
        preparedBy: f.preparedBy || 'Acharya Nandram', theme: f.theme, expertNote: f.expertNote || undefined, generatedAt: res.generatedAt, numbers: res.numbers,
        result: { analysis: res.analysis, source: res.source, scores: res.scores, features: res.features },
        annotated: samples[0]?.annotated ?? samples[0]?.dataUrl, samples: samples.length > 1 ? samples.map((s) => s.dataUrl) : undefined,
      };
      const r = await fetch('/api/admin/signature/pdf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.status === 503 ? 'PDF engine is not available on this server.' : r.status === 413 ? 'The signature images are too large for the PDF. Remove one sample and try again.' : r.status === 400 ? 'Some report details are invalid. Run the analysis again, then download.' : `PDF failed (${r.status})`);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a'); a.href = url; a.download = `signature-analysis-${(c.fullName.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()) || 'client'}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (x) { setErr(x instanceof Error ? x.message : 'PDF failed'); }
    finally { setPdfBusy(false); }
  }

  const a: SignatureAnalysis | undefined = res?.analysis, n = res?.numbers;
  const pri = (p?: string) => (p === 'high' || p === 'low' ? p : 'medium') as keyof typeof PRI;
  const issues = [...new Set(samples.flatMap((s) => s.metrics?.issues ?? []))];
  const mainImg = samples[0] ? (showMarks && samples[0].annotated ? samples[0].annotated : samples[0].dataUrl) : null;

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><PenLine className="h-6 w-6 text-gold" />Signature Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">Each sample is measured from its pixels (baseline angle, slant, first-letter size, cutting strokes, ending, dots, gaps) and checked across samples; the AI agent then reads the images with those measurements, the client&apos;s numbers, profession and goals. Numbers always come from the engine. Nothing is saved.</p>
      </div>

      {fromOrder && <p className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm" role="status">From order: {fromOrder}</p>}
      <form onSubmit={analyse} className="glass space-y-6 rounded-lg p-5">
        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-gold">1. Client details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" htmlFor="sg-name" required><Input id="sg-name" value={f.fullName} onChange={set('fullName')} placeholder="As in documents" required /></Field>
            <Field label="Name as signed" htmlFor="sg-sname" hint="e.g. N. Sharma – leave blank if same"><Input id="sg-sname" value={f.signatureName} onChange={set('signatureName')} /></Field>
            <Field label="Date of birth" htmlFor="sg-dob" required><Input id="sg-dob" type="date" value={f.dob} onChange={set('dob')} required /></Field>
            <Field label="Gender" htmlFor="sg-g"><Select id="sg-g" value={f.gender} onChange={set('gender')}><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
            <Field label="Writing hand" htmlFor="sg-h"><Select id="sg-h" value={f.hand} onChange={set('hand')}><option value="right">Right</option><option value="left">Left</option></Select></Field>
            <Field label="Report language" htmlFor="sg-l"><Select id="sg-l" value={f.language} onChange={set('language')}><option value="en">English</option><option value="hi">हिंदी</option><option value="hinglish">Hinglish</option></Select></Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-gold">2. Profession &amp; goals</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Profession" htmlFor="sg-p" required><Select id="sg-p" value={f.professionId} onChange={set('professionId')}>{PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select></Field>
            <Field label="Role / details" htmlFor="sg-pt" hint="e.g. Pharma distributor, Senior manager"><Input id="sg-pt" value={f.professionText} onChange={set('professionText')} /></Field>
            <Field label="Years of experience" htmlFor="sg-y"><Input id="sg-y" type="number" min={0} max={70} value={f.experienceYears} onChange={set('experienceYears')} /></Field>
          </div>
          <div><p className="mb-2 text-sm font-medium">Goals</p><div className="flex flex-wrap gap-2">{GOALS.map((g) => <button key={g} type="button" aria-pressed={goals.includes(g)} onClick={() => setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g])}
            className={cn('rounded-full border px-3 py-1.5 text-xs', goals.includes(g) ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{g}</button>)}</div></div>
          <Field label="Concerns / notes for the agent" htmlFor="sg-c"><textarea id="sg-c" value={f.concerns} onChange={set('concerns')} rows={3} maxLength={1000} placeholder="e.g. Business slow since 2 years, wants promotion, frequent delays in payments…" className="w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" /></Field>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-serif text-lg font-semibold text-gold">3. Signature samples</h3><p className="text-xs text-muted-foreground">{samples.length}/{MAX_SAMPLES} added – 2 or 3 natural signatures give the most accurate reading</p></div>
            {samples.some((s) => s.annotated) && <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showMarks} onChange={(e) => setShowMarks(e.target.checked)} className="accent-[hsl(var(--primary))]" />Show measurement marks</label>}
          </div>
          {samples.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((s, i) => (
                <div key={s.id} className="rounded-lg border border-gold/30 bg-background/40 p-2">
                  <div className="relative">
                    <img src={showMarks && s.annotated ? s.annotated : s.dataUrl} alt={`Signature sample ${i + 1}`} className="h-32 w-full rounded bg-white object-contain" />
                    <button type="button" onClick={() => setSamples(samples.filter((x) => x.id !== s.id))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Remove sample"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                    {!s.metrics ? <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Measuring…</span>
                      : !s.metrics.strokeWidth ? <Badge tone="warn">No ink found</Badge>
                        : <><Badge>Baseline {s.metrics.baseline.angle > 0 ? '+' : ''}{s.metrics.baseline.angle}°</Badge><Badge>Slant {s.metrics.slant.relative > 0 ? '+' : ''}{s.metrics.slant.relative}°</Badge><Badge>First letter {s.metrics.firstLetter.ratio}×</Badge>{s.metrics.lines.length > 0 && <Badge tone={s.metrics.lines.some((l) => l.kind === 'through') ? 'warn' : 'default'}>{s.metrics.lines.map((l) => l.kind).join(' + ')}</Badge>}{s.metrics.dots.end > 0 && <Badge tone="warn">full stop</Badge>}</>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {samples.length < MAX_SAMPLES && (
            <>
              <div className="flex gap-2">{(['upload', 'draw'] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm', mode === m ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{m === 'upload' ? <ImageUp className="h-4 w-4" /> : <Brush className="h-4 w-4" />}{m === 'upload' ? 'Upload photo / scan' : 'Draw signature'}</button>)}</div>
              {mode === 'upload' ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 p-8 text-center text-sm hover:bg-gold/5">
                  <ImageUp className="h-8 w-8 text-gold" /><span>Click to upload clear photos of the signature on plain white, unruled paper</span><span className="text-xs text-muted-foreground">PNG, JPG or WEBP · photograph straight from above, good light, no shadow · select up to {MAX_SAMPLES - samples.length} file(s)</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={onFiles} />
                </label>
              ) : <DrawPad onDone={(d) => addSample(d, 'drawn')} label="Add this sample" />}
            </>
          )}
          {issues.length > 0 && <ul className="space-y-1 text-xs text-warning">{issues.map((x) => <li key={x}>⚠ {x}</li>)}</ul>}
          {Object.keys(measured).length > 0 && (
            <div className="rounded-lg border border-gold/25 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Ruler className="h-4 w-4 text-gold" />Measured from the image{consistency != null && <Badge tone={consistency >= 70 ? 'good' : 'warn'} className="ml-1">Consistency {consistency}/100</Badge>}</p>
              <div className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                {FEATURES.filter((ft) => measured[ft.id]).map((ft) => { const m = measured[ft.id]; const l = featureLabel(ft.id, m.option); return (
                  <div key={ft.id} className={cn('grid grid-cols-[120px_1fr_44px] items-center gap-2', obs[ft.id] && 'opacity-50 line-through')}>
                    <span className="text-muted-foreground">{ft.label}</span><span><b>{l?.label}</b> <span className="text-muted-foreground">· {m.value}</span></span>
                    <span className="h-1.5 rounded-full bg-muted" title={`confidence ${Math.round(m.confidence * 100)}%`}><span className="block h-full rounded-full bg-gold" style={{ width: `${m.confidence * 100}%` }} /></span>
                  </div>); })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Bar = measurement certainty. Size, pressure and legibility are estimates from a photo – confirm or correct them below.</p>
            </div>
          )}
        </section>

        <details className="rounded-lg border border-gold/25 p-4">
          <summary className="cursor-pointer font-serif text-lg font-semibold text-gold">4. Expert observations (optional – override the measurements)</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((ft) => { const m = measured[ft.id]; const ml = m ? featureLabel(ft.id, m.option)?.label : null; return (
              <Field key={ft.id} label={ft.label} htmlFor={`ob-${ft.id}`} hint={ml ? `Measured: ${ml}` : undefined}><Select id={`ob-${ft.id}`} value={obs[ft.id] ?? ''} onChange={(e) => { const v = e.target.value; const o = { ...obs }; if (v) o[ft.id] = v; else delete o[ft.id]; setObs(o); }}>
                <option value="">{ml ? `– Use measurement (${ml}) –` : '– Let AI decide –'}</option>{ft.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>); })}
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !f.fullName || !f.dob}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{busy ? 'Agent is analysing…' : 'Analyse signature'}</Button>
          {!samples.length && <span className="text-xs text-muted-foreground">Without a sample the report is based on numerology and your observations only.</span>}
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        </div>
      </form>

      {res && a && n && (
        <div id="sig-result" className="mk-rise space-y-5 scroll-mt-24" lang={f.language === 'hi' ? 'hi' : 'en'}>
          {/* Report actions */}
          <div className="glass flex flex-wrap items-end gap-3 rounded-lg p-4">
            <Badge tone={res.source === 'ai' ? 'gold' : 'default'} className="mb-2"><Bot className="mr-1 inline h-3 w-3" />{res.source === 'ai' ? `AI agent${res.model ? ` · ${res.model}` : ''} + measurements` : 'Measurements + numerology (no AI)'}</Badge>
            <Field label="Prepared by"><Input value={f.preparedBy} onChange={set('preparedBy')} className="w-48" /></Field>
            <Field label="PDF theme"><Select value={f.theme} onChange={set('theme')} className="w-44"><option value="royal-gold-maroon">Royal Gold &amp; Maroon</option><option value="cosmic-blue">Cosmic Blue</option><option value="saffron-cream">Saffron &amp; Cream</option><option value="minimal-white">Minimal White</option></Select></Field>
            <Field label="Personal note in the PDF (optional)" className="min-w-[220px] flex-1"><Input value={f.expertNote} onChange={set('expertNote')} maxLength={1200} placeholder="e.g. Start the new signature on Sunday after Surya arghya" /></Field>
            <div className="mb-0.5 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(reportText(f.fullName, res))}><Copy className="mr-1 h-4 w-4" />Copy text</Button>
              <Button type="button" size="sm" disabled={pdfBusy} onClick={downloadPdf}>{pdfBusy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}Download PDF report</Button>
            </div>
            {res.note && <p className="w-full text-xs text-muted-foreground">{res.note}</p>}
          </div>

          {/* Dashboard */}
          <div className="glass rounded-lg p-5">
            <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr_minmax(260px,340px)]">
              <ScoreRing value={a.overallScore} label="Signature score" />
              <div><h3 className="font-cinzel text-2xl font-bold gold-text">{a.headline}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.summary}</p></div>
              <div className="space-y-2">
                <ScoreBar label="Graphology" value={res.scores.graphology} hint="From the measured / observed features" />
                <ScoreBar label="Name vibration" value={res.scores.nameVibration} hint="Signed name number vs Moolank & Bhagyank" />
                <ScoreBar label="First letter" value={res.scores.firstLetter} />
                <ScoreBar label="Profession fit" value={res.scores.professionFit} />
                <ScoreBar label="Consistency" value={res.scores.consistency} />
                {res.scores.ai !== null && <p className="text-[11px] text-muted-foreground">AI judgement {res.scores.ai} · engine {res.scores.engine} → blended {res.scores.overall}</p>}
              </div>
            </div>
            {mainImg && <div className="mt-5 flex justify-center rounded-lg border border-gold/30 bg-white p-3"><img src={mainImg} alt="Analysed signature" className="max-h-56 object-contain" /></div>}
            {mainImg && showMarks && samples[0]?.annotated && <p className="mt-1 text-center text-[11px] text-muted-foreground"><span className="text-amber-500">━</span> baseline · <span className="text-blue-500">▢</span> first letter · <span className="text-red-500">━</span> stroke through the name · <span className="text-emerald-500">━</span> underline · <span className="text-purple-500">➜</span> ending · <span className="text-red-500">◯</span> dot</p>}
          </div>

          <nav className="flex flex-wrap gap-2 text-xs">{[['sig-obs', 'Observations'], ['sig-num', 'Numerology'], ['sig-life', 'Personality & life'], ['sig-fix', 'Corrections'], ['sig-plan', 'Ideal signature']].map(([id, l]) => <a key={id} href={`#${id}`} className="rounded-full border border-gold/30 px-3 py-1 hover:bg-gold/10">{l}</a>)}</nav>

          <Section id="sig-obs" title="What the signature shows" icon={<ScanLine className="h-5 w-5" />}>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-gold/20 text-left text-muted-foreground"><th className="p-2">Feature</th><th className="p-2">Observed</th><th className="p-2">What it indicates</th><th className="p-2">Effect</th><th className="p-2">Certainty</th></tr></thead>
              <tbody>{a.observations.map((o, i) => { const src = o.featureId ? res.features.find((x) => x.id === o.featureId) : undefined; return (
                <tr key={i} className="border-b border-border/50 align-top last:border-0"><td className="p-2 font-medium">{o.feature}</td><td className="p-2">{o.observed}</td><td className="p-2 text-muted-foreground">{o.meaning}</td><td className="p-2"><Badge tone={IMPACT[o.impact][1]}>{IMPACT[o.impact][0]}</Badge></td>
                  <td className="p-2"><ConfDots c={o.confidence} />{src && <span className="block text-[10px] text-muted-foreground">{src.by === 'expert' ? 'Expert' : 'Measured'}</span>}</td></tr>); })}</tbody></table></div>
          </Section>

          <Section id="sig-num" title="Numerology of the signature" icon={<Gauge className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[['Moolank', n.moolank, n.moolankPlanet.name], ['Bhagyank', n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank, n.planet.name], ['Full name', `${n.fullName.compound}/${n.fullName.single}`, REL[n.nameToBhagyank]], ['Signed name', `${n.signName.compound}/${n.signName.single}`, REL[n.signToBhagyank]], ['First letter', `${n.firstLetter.letter}=${n.firstLetter.value}`, n.firstLetter.planet], ['Start day', n.planet.weekday.slice(0, 3), n.planet.name]].map(([k, v, s]) => (
                <div key={String(k)} className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p><p className="gold-text font-serif text-2xl font-bold">{v}</p><p className="text-[11px] text-muted-foreground">{s}</p></div>))}
            </div>
            <p className="mt-3 text-sm"><b>Signed name {n.signName.compound}:</b> <Badge tone={CAT_TONE[n.signName.category]}>{n.signName.category}</Badge> {n.signName.meaning}. <b className="ml-2">Full name {n.fullName.compound}:</b> <Badge tone={CAT_TONE[n.fullName.category]}>{n.fullName.category}</Badge> {n.fullName.meaning}.</p>
            <p className="mt-1 text-xs text-muted-foreground">Friendly numbers {n.friendly.join(', ')}{n.avoid.length ? ` · avoid ${n.avoid.join(', ')}` : ''} · {n.profession.note}</p>
            <h4 className="mb-2 mt-5 flex items-center gap-2 font-semibold"><Wand2 className="h-4 w-4 text-gold" />Ways to sign the name – ranked</h4>
            {n.bestOption ? <p className="mb-2 rounded-md border border-gold/40 bg-gold/10 p-2 text-sm">Recommended: sign as <b>{n.bestOption.text}</b> ({n.bestOption.compound}/{n.bestOption.single}, {REL[n.bestOption.toBhagyank].toLowerCase()} to Bhagyank) instead of the current form.</p> : <p className="mb-2 text-sm text-muted-foreground">The current name form is already among the best for these numbers.</p>}
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-gold/20 text-left text-muted-foreground"><th className="p-2">Name form</th><th className="p-2">Number</th><th className="p-2">With Bhagyank</th><th className="p-2">With Moolank</th><th className="p-2">Nature</th><th className="p-2 text-right">Score</th></tr></thead>
              <tbody>{n.nameOptions.map((o) => (
                <tr key={o.text} className={cn('border-b border-border/50 last:border-0', n.bestOption?.text === o.text && 'bg-gold/10')}>
                  <td className="p-2"><b>{o.text}</b> {o.current && <Badge className="ml-1">Current</Badge>}{n.bestOption?.text === o.text && <Badge tone="gold" className="ml-1">Recommended</Badge>}<span className="block text-[11px] text-muted-foreground">{o.label}</span></td>
                  <td className="p-2 font-serif font-bold">{o.compound}/{o.single}</td><td className="p-2"><Badge tone={REL_TONE[o.toBhagyank]}>{REL[o.toBhagyank]}</Badge></td><td className="p-2"><Badge tone={REL_TONE[o.toMoolank]}>{REL[o.toMoolank]}</Badge></td>
                  <td className="p-2"><Badge tone={CAT_TONE[o.category]}>{o.category}</Badge><span className="block text-[11px] text-muted-foreground">{o.meaning}</span></td><td className="p-2 text-right font-serif text-lg font-bold">{o.score}</td>
                </tr>))}</tbody></table></div>
          </Section>

          <div id="sig-life" className="grid scroll-mt-24 gap-4 md:grid-cols-2">
            <Section id="sig-pers" title="Personality"><ul className="space-y-1.5 text-sm">{a.personality.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul></Section>
            <Section id="sig-career" title={`Career – ${n.profession.label}`}><p className="text-sm">{a.career.fit}</p><p className="mt-2 text-sm text-muted-foreground">{a.career.advice}</p></Section>
            {a.finance && <Section id="sig-fin" title="Wealth & finance"><p className="text-sm">{a.finance}</p></Section>}
            {a.relationships && <Section id="sig-rel" title="Relationships"><p className="text-sm">{a.relationships}</p></Section>}
            <Section id="sig-str" title="Strengths"><ul className="space-y-1.5 text-sm">{(a.strengths.length ? a.strengths : ['—']).map((x) => <li key={x} className="flex gap-2"><span className="text-emerald-400">✓</span>{x}</li>)}</ul></Section>
            <Section id="sig-watch" title="Watch-outs"><ul className="space-y-1.5 text-sm">{(a.watchouts.length ? a.watchouts : ['None significant']).map((x) => <li key={x} className="flex gap-2"><span className="text-amber-400">!</span>{x}</li>)}</ul></Section>
          </div>

          <Section id="sig-fix" title="Recommended corrections" icon={<PenLine className="h-5 w-5" />}>
            <ol className="grid gap-3 sm:grid-cols-2">{[...a.corrections].sort((x, y) => ['high', 'medium', 'low'].indexOf(pri(x.priority)) - ['high', 'medium', 'low'].indexOf(pri(y.priority))).map((c, i) => (
              <li key={i} className={cn('rounded-lg border border-l-4 border-gold/25 bg-background/40 p-4', PRI[pri(c.priority)][1])}>
                <div className="flex items-center justify-between gap-2"><span className="gold-text font-serif text-2xl font-bold">{i + 1}</span><Badge tone={pri(c.priority) === 'high' ? 'warn' : 'default'}>{PRI[pri(c.priority)][0]}</Badge></div>
                <p className="font-semibold">{c.title}</p><p className="text-sm text-muted-foreground">{c.detail}</p></li>))}</ol>
          </Section>

          <section id="sig-plan" className="scroll-mt-24 rounded-lg border border-gold/50 bg-gradient-to-br from-gold/15 via-card/70 to-maroon/25 p-5">
            <h3 className="mb-3 font-cinzel text-xl font-bold">Ideal signature blueprint</h3>
            <ol className="space-y-2 text-sm">{a.idealSignature.steps.map((x, i) => <li key={x} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon text-xs font-bold text-white">{i + 1}</span>{x}</li>)}</ol>
            {(a.idealSignature.do?.length || a.idealSignature.dont?.length) ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">Do</p><ul className="space-y-1 text-sm">{(a.idealSignature.do ?? []).map((x) => <li key={x}>✓ {x}</li>)}</ul></div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3"><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-400">Avoid</p><ul className="space-y-1 text-sm">{(a.idealSignature.dont ?? []).map((x) => <li key={x}>✕ {x}</li>)}</ul></div>
              </div>) : null}
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-[10px] uppercase tracking-widest text-gold">Start</dt><dd>{a.idealSignature.startDay}</dd></div><div><dt className="text-[10px] uppercase tracking-widest text-gold">Ink</dt><dd>{a.idealSignature.inkColour}</dd></div><div><dt className="text-[10px] uppercase tracking-widest text-gold">Practice</dt><dd>{a.idealSignature.practice}</dd></div></dl>
            {n.startDates.length > 0 && <div className="mt-4"><p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold"><CalendarDays className="h-3.5 w-3.5" />Suggested start dates</p>
              <ul className="space-y-1 text-sm">{n.startDates.map((d) => <li key={d.iso}><b>{new Date(`${d.iso}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</b> <span className="text-muted-foreground">– {d.reason}</span></li>)}</ul></div>}
            <p className="mt-4 text-sm italic">{a.closing}</p>
          </section>
          <p className="text-xs text-muted-foreground">Guidance based on graphology and numerology traditions; not a substitute for medical, psychological, legal or financial advice. Review before sharing with the client.</p>
        </div>
      )}
    </div>
  );
}
