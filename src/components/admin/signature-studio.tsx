'use client';
import * as React from 'react';
import { Bot, Brush, Copy, Eraser, ImageUp, Loader2, PenLine, Printer, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { FEATURES, GOALS, PROFESSIONS } from '@/lib/signature/catalogue';
import type { SignatureAnalysis } from '@/lib/signature/agent';
import type { SignatureNumbers } from '@/lib/signature/numbers';
import { cn } from '@/lib/utils';

interface Result { numbers: SignatureNumbers; analysis: SignatureAnalysis; source: 'ai' | 'rules'; model?: string; note?: string; generatedAt: string }
const IMPACT = { positive: ['Supports', 'good'], neutral: ['Neutral', 'default'], watch: ['Needs attention', 'warn'] } as const;
const REL = { friend: 'Friendly', neutral: 'Neutral', enemy: 'Not friendly' } as const;
const MAX_SIDE = 1400;

/** Reads an image file, downsizes it and returns a data URL small enough to upload. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.9);
  } finally { URL.revokeObjectURL(url); }
}

function DrawPad({ onDone }: { onDone: (dataUrl: string) => void }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => { const c = ref.current!; const x = c.getContext('2d')!; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }, []);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [(e.clientX - r.left) * (ref.current!.width / r.width), (e.clientY - r.top) * (ref.current!.height / r.height)]; };
  const down = (e: React.PointerEvent) => { drawing.current = true; ref.current!.setPointerCapture(e.pointerId); const [x, y] = pos(e); const c = ref.current!.getContext('2d')!; c.beginPath(); c.moveTo(x, y); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const [x, y] = pos(e); const c = ref.current!.getContext('2d')!; c.lineWidth = 3.2; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1a237e'; c.lineTo(x, y); c.stroke(); setDirty(true); };
  const clear = () => { const c = ref.current!; const x = c.getContext('2d')!; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); setDirty(false); };
  return (
    <div className="space-y-2">
      <canvas ref={ref} width={900} height={300} onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)}
        className="h-40 w-full touch-none rounded-lg border border-gold/40 bg-white sm:h-48" aria-label="Signature drawing pad" />
      <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={clear}><Eraser className="mr-1 h-4 w-4" />Clear</Button>
        <Button type="button" size="sm" disabled={!dirty} onClick={() => onDone(ref.current!.toDataURL('image/png'))}><Brush className="mr-1 h-4 w-4" />Use this drawing</Button></div>
    </div>
  );
}

function ScoreRing({ value, label, size = 'lg' }: { value: number; label: string; size?: 'lg' | 'sm' }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className={cn('relative shrink-0', size === 'lg' ? 'h-36 w-36' : 'h-24 w-24')}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(43 85% 55%)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset 900ms ease' }} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={cn('gold-text font-serif font-bold', size === 'lg' ? 'text-4xl' : 'text-2xl')}>{value}</span><span className={cn('px-3 text-center uppercase leading-tight text-muted-foreground', size === 'lg' ? 'text-[9px] tracking-widest' : 'text-[7.5px] tracking-wider')}>{label}</span></div>
    </div>
  );
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function reportText(name: string, r: Result) {
  const a = r.analysis, n = r.numbers;
  return [`SIGNATURE ANALYSIS – ${name}`, `Score: ${a.overallScore}/100 · Numerology ${n.numerologyScore}/100 · Profession fit ${n.profession.fitScore}/100`, '', a.headline, a.summary, '',
    'OBSERVATIONS', ...a.observations.map((o) => `• ${o.feature}: ${o.observed} – ${o.meaning}`), '', 'PERSONALITY', ...a.personality.map((x) => `• ${x}`), '',
    'CAREER', a.career.fit, a.career.advice, '', 'STRENGTHS', ...a.strengths.map((x) => `• ${x}`), '', 'WATCH-OUTS', ...a.watchouts.map((x) => `• ${x}`), '',
    'CORRECTIONS', ...a.corrections.map((c, i) => `${i + 1}. ${c.title} – ${c.detail}`), '', 'IDEAL SIGNATURE', ...a.idealSignature.steps.map((x) => `• ${x}`),
    `Start day: ${a.idealSignature.startDay}`, `Ink: ${a.idealSignature.inkColour}`, `Practice: ${a.idealSignature.practice}`, '', a.closing, '', 'Prepared by Acharya Nandram · myNumerologist.com'].join('\n');
}

function printReport(name: string, r: Result, image: string | null, preparedBy: string) {
  const a = r.analysis, n = r.numbers;
  const li = (xs: string[]) => xs.map((x) => `<li>${esc(x)}</li>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signature Analysis – ${esc(name)}</title><style>
body{font-family:Georgia,serif;color:#2a1a10;max-width:820px;margin:32px auto;padding:0 20px;line-height:1.55}h1{color:#7a1f2b;margin:0}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:28px}
.top{display:flex;gap:24px;align-items:center;border:2px solid #c9a227;border-radius:12px;padding:18px}.score{font-size:44px;font-weight:bold;color:#b8860b}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cell{border:1px solid #e5d3a1;border-radius:8px;padding:8px}.cell b{display:block;font-size:20px;color:#7a1f2b}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #e5d3a1;padding:6px;text-align:left;vertical-align:top;font-size:14px}.sig{max-width:320px;max-height:140px;border:1px solid #ddd;border-radius:8px}small{color:#7a6a55}</style></head><body>
<h1>Signature Analysis Report</h1><p><b>${esc(name)}</b> · ${new Date(r.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}<br><small>Prepared by ${esc(preparedBy)}</small></p>
<div class="top"><div class="score">${a.overallScore}<small>/100</small></div><div><b>${esc(a.headline)}</b><p>${esc(a.summary)}</p></div>${image ? `<img class="sig" src="${image}" alt="signature">` : ''}</div>
<h2>Numbers</h2><div class="grid"><div class="cell">Moolank<b>${n.moolank}</b></div><div class="cell">Bhagyank<b>${n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank}</b></div><div class="cell">Signature name<b>${n.signName.compound}/${n.signName.single}</b></div><div class="cell">Full name<b>${n.fullName.compound}/${n.fullName.single}</b></div><div class="cell">Numerology score<b>${n.numerologyScore}</b></div><div class="cell">Profession fit<b>${n.profession.fitScore}</b></div></div>
<h2>Observations</h2><table><tr><th>Feature</th><th>Observed</th><th>Meaning</th></tr>${a.observations.map((o) => `<tr><td>${esc(o.feature)}</td><td>${esc(o.observed)}</td><td>${esc(o.meaning)}</td></tr>`).join('')}</table>
<h2>Personality</h2><ul>${li(a.personality)}</ul><h2>Career – ${esc(n.profession.label)}</h2><p>${esc(a.career.fit)}</p><p>${esc(a.career.advice)}</p>
<h2>Strengths</h2><ul>${li(a.strengths)}</ul><h2>Watch-outs</h2><ul>${li(a.watchouts)}</ul>
<h2>Recommended Corrections</h2><ol>${a.corrections.map((c) => `<li><b>${esc(c.title)}</b> – ${esc(c.detail)}</li>`).join('')}</ol>
<h2>Your Ideal Signature</h2><ul>${li(a.idealSignature.steps)}</ul><p><b>Start day:</b> ${esc(a.idealSignature.startDay)}<br><b>Ink:</b> ${esc(a.idealSignature.inkColour)}<br><b>Practice:</b> ${esc(a.idealSignature.practice)}</p>
<p><i>${esc(a.closing)}</i></p><p><small>Signature analysis offers guidance based on graphology and numerology traditions. It is not a substitute for medical, psychological, legal or financial advice.</small></p></body></html>`;
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400);
}

export function SignatureStudio() {
  const [f, setF] = React.useState({ fullName: '', signatureName: '', dob: '', gender: '', hand: 'right', professionId: 'business', professionText: '', experienceYears: '', concerns: '', language: 'en' as 'en' | 'hi' | 'hinglish', preparedBy: 'Acharya Nandram' });
  const [goals, setGoals] = React.useState<string[]>([]);
  const [obs, setObs] = React.useState<Record<string, string>>({});
  const [image, setImage] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'upload' | 'draw'>('upload');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [res, setRes] = React.useState<Result | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setErr('Please choose a PNG, JPG or WEBP image.'); return; }
    if (file.size > 15 * 1024 * 1024) { setErr('Image is larger than 15 MB.'); return; }
    setErr(''); setImage(await shrink(file));
  }

  async function analyse(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true); setRes(null);
    try {
      const r = await api<Result>('/api/admin/signature', { method: 'POST', json: {
        fullName: f.fullName, signatureName: f.signatureName || undefined, dob: f.dob, gender: f.gender || undefined, hand: f.hand || undefined,
        professionId: f.professionId, professionText: f.professionText || undefined, experienceYears: f.experienceYears ? Number(f.experienceYears) : undefined,
        goals, concerns: f.concerns || undefined, language: f.language, image: image ?? undefined, observations: obs } });
      setRes(r);
      setTimeout(() => document.getElementById('sig-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) {
      setErr(x instanceof ApiError ? (x.body.error === 'RATE_LIMITED' ? 'Too many analyses – please wait a few minutes.' : x.message) : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  const a = res?.analysis, n = res?.numbers;
  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><PenLine className="h-6 w-6 text-gold" />Signature Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">AI Signature Analysis Agent: reads the signature image with the client&apos;s name, date of birth, profession and goals, and suggests corrections. Numerology numbers come from the engine. Nothing is saved; the image is sent only to the configured AI provider.</p>
      </div>

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
          <h3 className="font-serif text-lg font-semibold text-gold">2. Profession &amp; other parameters</h3>
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
          <h3 className="font-serif text-lg font-semibold text-gold">3. Signature</h3>
          <div className="flex gap-2">{(['upload', 'draw'] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm', mode === m ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{m === 'upload' ? <ImageUp className="h-4 w-4" /> : <Brush className="h-4 w-4" />}{m === 'upload' ? 'Upload photo / scan' : 'Draw signature'}</button>)}</div>
          {image ? (
            <div className="flex flex-wrap items-start gap-3"><img src={image} alt="Signature to analyse" className="max-h-40 rounded-lg border border-gold/40 bg-white p-1" />
              <Button type="button" variant="outline" size="sm" onClick={() => setImage(null)}><X className="mr-1 h-4 w-4" />Remove</Button></div>
          ) : mode === 'upload' ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gold/40 p-8 text-center text-sm hover:bg-gold/5">
              <ImageUp className="h-8 w-8 text-gold" /><span>Click to upload a clear photo of the signature on plain white paper</span><span className="text-xs text-muted-foreground">PNG, JPG or WEBP · ideally 3–5 signatures, signed naturally</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} />
            </label>
          ) : <DrawPad onDone={setImage} />}
        </section>

        <details className="rounded-lg border border-gold/25 p-4">
          <summary className="cursor-pointer font-serif text-lg font-semibold text-gold">4. Expert observations (optional)</summary>
          <p className="mt-2 text-xs text-muted-foreground">Leave blank to let the AI read the image. Anything you mark here overrides the AI and is also used by the offline analyst when AI is not configured.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((ft) => <Field key={ft.id} label={ft.label} htmlFor={`ob-${ft.id}`}><Select id={`ob-${ft.id}`} value={obs[ft.id] ?? ''} onChange={(e) => { const v = e.target.value; const o = { ...obs }; if (v) o[ft.id] = v; else delete o[ft.id]; setObs(o); }}>
              <option value="">– Let AI decide –</option>{ft.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>)}
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !f.fullName || !f.dob}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{busy ? 'Agent is analysing…' : 'Analyse signature'}</Button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">Prepared by<Input id="sg-by" value={f.preparedBy} onChange={set('preparedBy')} className="w-52" /></label>
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        </div>
      </form>

      {res && a && n && (
        <div id="sig-result" className="mk-rise space-y-5 scroll-mt-24" lang={f.language === 'hi' ? 'hi' : 'en'}>
          <div className="glass rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge tone={res.source === 'ai' ? 'gold' : 'default'}><Bot className="mr-1 inline h-3 w-3" />{res.source === 'ai' ? `AI agent${res.model ? ` · ${res.model}` : ''}` : 'Rule-based analyst'}</Badge>
              {res.note && <span className="text-muted-foreground">{res.note}</span>}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(reportText(f.fullName, res))}><Copy className="mr-1 h-4 w-4" />Copy text</Button>
                <Button type="button" size="sm" onClick={() => printReport(f.fullName, res, image, f.preparedBy || 'Acharya Nandram')}><Printer className="mr-1 h-4 w-4" />Print / Save PDF</Button>
              </div>
            </div>
            <div className="mt-4 grid items-center gap-6 md:grid-cols-[auto_1fr]">
              <div className="flex gap-3"><ScoreRing value={a.overallScore} label="Signature score" /><div className="flex flex-col gap-2"><ScoreRing size="sm" value={n.numerologyScore} label="Numerology" /><ScoreRing size="sm" value={n.profession.fitScore} label="Profession fit" /></div></div>
              <div><h3 className="font-cinzel text-2xl font-bold gold-text">{a.headline}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.summary}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[['Moolank', n.moolank], ['Bhagyank', n.bhagyankMaster ? `${n.bhagyankMaster}/${n.bhagyank}` : n.bhagyank], ['Full name', `${n.fullName.compound}/${n.fullName.single}`], ['Signed name', `${n.signName.compound}/${n.signName.single}`], ['First letter', `${n.firstLetter.letter} = ${n.firstLetter.value}`], ['Planet', n.planet.name]].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p><p className="gold-text font-serif text-2xl font-bold">{v}</p></div>))}
          </div>
          <p className="text-xs text-muted-foreground">Signed name is <b>{REL[n.signToBhagyank]}</b> to Bhagyank · full name is <b>{REL[n.nameToBhagyank]}</b> to Bhagyank and <b>{REL[n.nameToMoolank]}</b> to Moolank · friendly numbers {n.friendly.join(', ')}{n.avoid.length ? ` · avoid ${n.avoid.join(', ')}` : ''}.</p>

          <section className="glass rounded-lg p-5"><h3 className="mb-3 font-serif text-lg font-semibold text-gold">Signature observations</h3>
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-gold/20 text-left"><th className="p-2">Feature</th><th className="p-2">Observed</th><th className="p-2">Meaning</th><th className="p-2">Impact</th></tr></thead>
              <tbody>{a.observations.map((o, i) => <tr key={i} className="border-b border-border/50 align-top last:border-0"><td className="p-2 font-medium">{o.feature}</td><td className="p-2">{o.observed}</td><td className="p-2 text-muted-foreground">{o.meaning}</td><td className="p-2"><Badge tone={IMPACT[o.impact][1]}>{IMPACT[o.impact][0]}</Badge></td></tr>)}</tbody></table></div></section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="glass rounded-lg p-5"><h3 className="mb-2 font-serif text-lg font-semibold text-gold">Personality</h3><ul className="space-y-1.5 text-sm">{a.personality.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul></section>
            <section className="glass rounded-lg p-5"><h3 className="mb-2 font-serif text-lg font-semibold text-gold">Career – {n.profession.label}</h3><p className="text-sm">{a.career.fit}</p><p className="mt-2 text-sm text-muted-foreground">{a.career.advice}</p></section>
            <section className="glass rounded-lg p-5"><h3 className="mb-2 font-serif text-lg font-semibold text-gold">Strengths</h3><ul className="space-y-1.5 text-sm">{(a.strengths.length ? a.strengths : ['—']).map((x) => <li key={x} className="flex gap-2"><span className="text-emerald-400">✓</span>{x}</li>)}</ul></section>
            <section className="glass rounded-lg p-5"><h3 className="mb-2 font-serif text-lg font-semibold text-gold">Watch-outs</h3><ul className="space-y-1.5 text-sm">{(a.watchouts.length ? a.watchouts : ['None significant']).map((x) => <li key={x} className="flex gap-2"><span className="text-amber-400">!</span>{x}</li>)}</ul></section>
          </div>

          <section className="glass rounded-lg p-5"><h3 className="mb-3 font-serif text-lg font-semibold text-gold">Recommended corrections</h3>
            <ol className="grid gap-3 sm:grid-cols-2">{a.corrections.map((c, i) => <li key={i} className="rounded-lg border border-gold/25 bg-background/40 p-4"><span className="gold-text font-serif text-2xl font-bold">{i + 1}</span><p className="font-semibold">{c.title}</p><p className="text-sm text-muted-foreground">{c.detail}</p></li>)}</ol></section>

          <section className="rounded-lg border border-gold/50 bg-gradient-to-br from-gold/15 via-card/70 to-maroon/25 p-5"><h3 className="mb-2 font-cinzel text-xl font-bold">Ideal signature plan</h3>
            <ul className="space-y-1.5 text-sm">{a.idealSignature.steps.map((x) => <li key={x} className="flex gap-2"><PenLine className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{x}</li>)}</ul>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-[10px] uppercase tracking-widest text-gold">Start day</dt><dd>{a.idealSignature.startDay}</dd></div><div><dt className="text-[10px] uppercase tracking-widest text-gold">Ink</dt><dd>{a.idealSignature.inkColour}</dd></div><div><dt className="text-[10px] uppercase tracking-widest text-gold">Practice</dt><dd>{a.idealSignature.practice}</dd></div></dl>
            <p className="mt-3 text-sm italic">{a.closing}</p></section>
          <p className="text-xs text-muted-foreground">Guidance based on graphology and numerology traditions; not a substitute for medical, psychological, legal or financial advice. Review before sharing with the client.</p>
        </div>
      )}
    </div>
  );
}
