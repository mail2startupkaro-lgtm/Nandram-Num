'use client';
/**
 * Admin → Advanced Mobile Number Analysis with DOB.
 * Client details + current number + up to 5 shortlisted numbers → instant analysis on the shared engine (in the browser)
 * → branded PDF (signature-style cover, every section on a fresh page, CTA + expert profile at the end). Nothing is saved.
 */
import { ClientQuestionsField, orderQuestions } from '@/components/admin/client-questions-field';
import * as React from 'react';
import { Check, Download, Loader2, Plus, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { todayIST } from '@/lib/numerology';
import { analyseMobileAdvanced, type MobileAdvancedResult } from '@/lib/mobile-advanced/analysis';
import { checkText, L, relText } from '@/lib/mobile-advanced/text';
import { cn } from '@/lib/utils';
import type { Order } from './services-admin';

const iso = (p: { year: number; month: number; day: number }) => `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
const THEMES = [['royal-gold-maroon', 'Royal Gold & Maroon'], ['cosmic-blue', 'Cosmic Blue'], ['saffron-cream', 'Saffron & Cream'], ['minimal-white', 'Minimal White']] as const;
const VTONE = { excellent: 'good', good: 'gold', neutral: 'warn', change: 'bad' } as const;
const STONE = { pass: 'good', warn: 'warn', fail: 'bad' } as const;
const toIsoDob = (s: string) => { const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s.trim()); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s.trim(); };

function Ring({ value, label }: { value: number; label: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(43 85% 55%)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset 900ms ease' }} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="gold-text font-serif text-4xl font-bold">{value}</span><span className="px-3 text-center text-[9px] uppercase leading-tight tracking-widest text-muted-foreground">{label}</span></div>
    </div>
  );
}

export function MobileAdvancedStudio({ preloadedOrder, onClearPreloadedOrder }: { preloadedOrder?: Order | null; onClearPreloadedOrder?: () => void }) {
  const today = iso(todayIST());
  const [f, setF] = React.useState({ fullName: '', dob: '', gender: 'male', mobile: '', asOf: today, language: 'en' as 'en' | 'hi', theme: 'royal-gold-maroon', preparedBy: 'Acharya Nandram', expertNote: '' });
  const [cq, setCq] = React.useState('');
  const [alts, setAlts] = React.useState<string[]>(['']);
  const [showFull, setShowFull] = React.useState(true);
  const [res, setRes] = React.useState<MobileAdvancedResult | null>(null);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [fromOrder, setFromOrder] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const l = L[f.language];

  React.useEffect(() => {
    if (!preloadedOrder) return;
    const dt = preloadedOrder.details ?? {};
    // Numbers in the order (mobile field and any 10-digit numbers in the questions) – first is the current number.
    const found = [dt.mobile ?? '', ...((dt.questions ?? '').match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g) ?? [])].map((x) => x.trim()).filter(Boolean);
    setF((x) => ({ ...x, fullName: dt.clientName ?? dt.currentName ?? '', dob: dt.dob ? toIsoDob(dt.dob) : '', gender: dt.gender || 'male', mobile: found[0] ?? '' }));
    setAlts(found.length > 1 ? [...found.slice(1, 6), ''] : ['']);
    setCq(orderQuestions(dt));
    setFromOrder(`${dt.clientName ?? 'Client'} · ordered ${new Date(preloadedOrder.createdAt).toLocaleDateString('en-IN')}${dt.questions ? ` · questions: ${dt.questions}` : ''}`);
    setRes(null); onClearPreloadedOrder?.();
  }, [preloadedOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const payload = () => ({ fullName: f.fullName, dob: f.dob, gender: f.gender as 'male' | 'female' | 'other', mobile: f.mobile, alternates: alts.map((a) => a.trim()).filter(Boolean), asOf: f.asOf || undefined });

  function analyse(e?: React.FormEvent) {
    e?.preventDefault(); setErr('');
    try {
      setRes(analyseMobileAdvanced(payload()));
      setTimeout(() => document.getElementById('ma-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) { setRes(null); setErr(x instanceof Error ? x.message : 'Please check the details.'); }
  }

  async function downloadPdf() {
    setBusy(true); setErr('');
    try {
      const body = { ...payload(), language: f.language, theme: f.theme, preparedBy: f.preparedBy || 'Acharya Nandram', showFullNumber: showFull, expertNote: f.expertNote.trim() || undefined, clientQuestions: cq.trim() || undefined };
      const r = await fetch('/api/admin/mobile-advanced/pdf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        const j = await r.json().catch(() => null) as { issues?: { message: string }[] } | null;
        throw new Error(r.status === 503 ? 'PDF engine is not available on this server.' : r.status === 422 ? j?.issues?.[0]?.message ?? 'Some details are invalid.' : r.status === 429 ? 'Too many PDFs in a short time – wait a few minutes.' : `PDF failed (${r.status})`);
      }
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a'); a.href = url; a.download = `mobile-number-analysis-${(f.fullName.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()) || 'client'}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (x) { setErr(x instanceof Error ? x.message : 'PDF failed'); }
    finally { setBusy(false); }
  }

  const mo = res?.mobile;
  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Smartphone className="h-6 w-6 text-gold" />Advanced Mobile Number Analysis with DOB</h2>
        <p className="mt-1 text-sm text-muted-foreground">Checks a mobile number digit by digit against the client&apos;s date of birth: total and compound, every digit and pair with its planet, Lo Shu grid before and after, life-area impact, a 10-rule score card, the lucky-number blueprint, remedies and the best months to activate a new number. Add shortlisted numbers to compare them. Download a branded PDF with the signature-report cover. Nothing is saved.</p>
      </div>

      {fromOrder && <p className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm" role="status">From order: {fromOrder}</p>}
      <form onSubmit={analyse} className="glass space-y-5 rounded-lg p-5">
        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-gold">1. Client details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Full name" htmlFor="ma-name" required><Input id="ma-name" value={f.fullName} onChange={set('fullName')} required autoComplete="off" /></Field>
            <Field label="Date of birth" htmlFor="ma-dob" required><Input id="ma-dob" type="date" min="1900-01-01" max={today} value={f.dob} onChange={set('dob')} required /></Field>
            <Field label="Gender" htmlFor="ma-g" hint="Used for the Kua number"><Select id="ma-g" value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
            <Field label="Mobile number" htmlFor="ma-mob" required hint="10 digits, +91 optional"><Input id="ma-mob" inputMode="tel" value={f.mobile} onChange={set('mobile')} required placeholder="98765 43210" autoComplete="off" /></Field>
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-gold">2. Numbers to compare <span className="text-sm font-normal text-muted-foreground">(optional, up to 5)</span></h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alts.map((v, i) => (
              <div key={i} className="flex gap-1.5">
                <Input aria-label={`Number ${i + 1}`} inputMode="tel" placeholder="Another number the client can get" value={v} autoComplete="off" onChange={(e) => setAlts((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} />
                {alts.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove number" onClick={() => setAlts((xs) => xs.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>}
              </div>
            ))}
          </div>
          {alts.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setAlts((xs) => [...xs, ''])}><Plus className="mr-1 h-4 w-4" />Add number</Button>}
        </section>
        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-gold">3. Report settings</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Language" htmlFor="ma-l"><Select id="ma-l" value={f.language} onChange={set('language')}><option value="en">English</option><option value="hi">हिंदी</option></Select></Field>
            <Field label="PDF theme" htmlFor="ma-t"><Select id="ma-t" value={f.theme} onChange={set('theme')}>{THEMES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</Select></Field>
            <Field label="Report date" htmlFor="ma-asof" hint="For Personal Year and months"><Input id="ma-asof" type="date" value={f.asOf} onChange={set('asOf')} /></Field>
            <Field label="Prepared by" htmlFor="ma-by"><Input id="ma-by" value={f.preparedBy} onChange={set('preparedBy')} /></Field>
          </div>
          <ClientQuestionsField id="ma-cq" value={cq} onChange={setCq} />
          <Field label="Note from the numerologist (printed in the report)" htmlFor="ma-note"><textarea id="ma-note" value={f.expertNote} onChange={set('expertNote')} maxLength={1200} rows={2} className="w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" /></Field>
          <Checkbox id="ma-full" checked={showFull} onChange={setShowFull} label="Print the full mobile number (untick to mask it as 98XXXXXX10)" />
        </section>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="gold" disabled={!f.fullName.trim() || !f.dob || !f.mobile.trim()}><Smartphone className="mr-1 h-4 w-4" />Analyse</Button>
          {res && <Button type="button" onClick={downloadPdf} disabled={busy}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}Download PDF report</Button>}
        </div>
      </form>

      {res && mo && (
        <div id="ma-result" className="space-y-5">
          <div className="glass flex flex-col gap-5 rounded-lg p-5 md:flex-row md:items-center">
            <Ring value={res.score} label="Mobile score" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2"><Badge tone={VTONE[res.verdict]}>{L.en.verdict[res.verdict]}</Badge><span className="text-sm text-muted-foreground">{L.en.headline[res.verdict]}</span></div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-sm text-muted-foreground">+91</span>
                {mo.digits.map((d, i) => <span key={i} className={cn('grid h-10 w-8 place-items-center rounded-md border border-gold/40 bg-gold/10 font-serif text-lg font-bold', i === 5 && 'ml-2')}>{d}</span>)}
              </div>
              <p className="text-sm">Total <b className="text-gold">{mo.total.compound}/{mo.total.single}</b> ({mo.planet}, {mo.total.category}) · Moolank <b>{res.core.moolank.value}</b> · Bhagyank <b>{res.core.bhagyank.value}</b> · Kua <b>{res.core.kua.value}</b> · Personal Year <b>{res.core.personalYear.number}</b> · Last 4 <b>{mo.last4.digits}</b> = {mo.last4.single}</p>
              <p className="text-sm text-muted-foreground">{L.en.advice[res.advice]}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="glass rounded-lg p-5">
              <h3 className="mb-3 font-serif text-lg font-semibold text-gold">10-rule checklist</h3>
              <ul className="space-y-2">{res.checks.map((c) => { const t = checkText(c, L.en, 'en'); return (
                <li key={c.id} className="flex items-start gap-2 text-sm"><Badge tone={STONE[c.status]} className="mt-0.5 w-14 justify-center">{L.en[c.status]}</Badge><span><b>{t.title}</b> – <span className="text-muted-foreground">{t.detail}</span></span></li>); })}</ul>
            </div>
            <div className="glass space-y-4 rounded-lg p-5">
              <h3 className="font-serif text-lg font-semibold text-gold">Digit pairs</h3>
              <div className="flex flex-wrap gap-1.5">{mo.pairs.map((p) => <span key={p.position} title={`${p.planetA || '0'} + ${p.planetB || '0'}`} className={cn('rounded-md border px-2 py-1 font-mono text-sm', p.kind === 'malefic' ? 'border-red-500/60 bg-red-500/10' : p.kind === 'conflict' ? 'border-amber-500/60 bg-amber-500/10' : p.kind === 'supportive' ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-border')}>{p.pair}</span>)}</div>
              <p className="text-xs text-muted-foreground">Green helpful · amber clashing · red heavy (48, 84, 44, 88, 00)</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Fills missing</p><p className="font-semibold">{res.grid.newlyFilled.join(', ') || '–'}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Still missing</p><p className="font-semibold">{res.grid.missing.join(', ') || '–'}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Best totals</p><p className="font-semibold text-gold">{res.blueprint.idealTotals.join(', ')}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Good months to start</p><p className="font-semibold">{res.months.filter((m) => m.good).map((m) => `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.month - 1]} ${String(m.year).slice(2)}`).join(', ') || '–'}</p></div>
              </div>
            </div>
          </div>

          {res.comparison.length > 1 && (
            <div className="glass rounded-lg p-5">
              <h3 className="mb-3 font-serif text-lg font-semibold text-gold">Numbers compared</h3>
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Number</th><th className="pr-3">Total</th><th className="pr-3">With Bhagyank</th><th className="pr-3">Pair issues</th><th className="pr-3">Score</th><th>Verdict</th></tr></thead>
                <tbody>{res.comparison.map((x) => (
                  <tr key={x.number} className={cn('border-b border-border/50', x.best && 'bg-gold/10')}>
                    <td className="py-2 pr-3 font-mono font-semibold">{x.number} {x.current && <Badge>current</Badge>} {x.best && <Badge tone="gold"><Check className="mr-0.5 h-3 w-3" />best</Badge>}</td>
                    <td className="pr-3">{x.compound}/{x.single}</td><td className="pr-3">{relText(x.relB, L.en)}</td><td className="pr-3">{x.malefic}</td>
                    <td className="pr-3 font-serif text-base font-bold">{x.score}</td><td><Badge tone={VTONE[x.verdict]}>{L.en.verdict[x.verdict]}</Badge></td>
                  </tr>))}</tbody>
              </table></div>
              {res.invalidAlternates.length > 0 && <p className="mt-2 text-xs text-danger">Not checked (invalid number): {res.invalidAlternates.join(', ')}</p>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">PDF: cover (signature-report design) · summary · 1 birth numbers · 2 number decoded · 3 pairs & patterns · 4 Lo Shu before/after · 5 score card · 6 lucky blueprint{res.comparison.length > 1 ? ' + comparison' : ''} · 7 remedies & activation months · 8 about the numerologist, services, WhatsApp/website QR codes. Each section starts on a new page.</p>
        </div>
      )}
    </div>
  );
}
