'use client';
import * as React from 'react';
import { Bot, Briefcase, Copy, Loader2, Printer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { SECTORS } from '@/lib/business/catalogue';
import type { BizAnalytics } from '@/lib/business/engine';
import type { BizReport } from '@/lib/business/agent';
import { cn } from '@/lib/utils';

interface Result { data: BizAnalytics; report: BizReport; source: 'ai' | 'rules'; model?: string; note?: string; generatedAt: string }
const LOSHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const REL = { friend: 'Friendly', neutral: 'Neutral', enemy: 'Not friendly' } as const;
const tone = (v: number) => (v >= 75 ? 'from-emerald-600 to-emerald-400' : v >= 55 ? 'from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)]' : 'from-rose-700 to-rose-500');

function Bar({ label, value, sub, onClick, active }: { label: React.ReactNode; value: number; sub?: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn('block w-full rounded-md px-2 py-1.5 text-left', onClick && 'hover:bg-muted', active && 'bg-gold/10')}>
      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate">{label}</span><span className="tabular-nums font-semibold text-gold">{value}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', tone(value))} style={{ width: `${Math.max(3, value)}%` }} /></div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </button>
  );
}
const Card = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => <section className={cn('glass rounded-lg p-5', className)}><h3 className="mb-3 font-serif text-lg font-semibold text-gold">{title}</h3>{children}</section>;
const Kpi = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="gold-text font-serif text-3xl font-bold">{value}</p>{sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}</div>;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function label(d: BizAnalytics, id: string) { return d.all.find((x) => x.id === id)?.label ?? id; }
function score(d: BizAnalytics, id: string) { return d.all.find((x) => x.id === id)?.score ?? 0; }

function asText(name: string, r: Result) {
  const d = r.data, p = r.report;
  return [`BUSINESS / PROFESSION COMPATIBILITY – ${name}`, `Moolank ${d.person.moolank} · Bhagyank ${d.person.bhagyank} · Name number ${d.person.nameNumber}`, '', p.headline, p.summary, '',
    'TOP MATCHES', ...p.topPicks.map((t, i) => `${i + 1}. ${label(d, t.id)} (${score(d, t.id)}/100) – ${t.why} Start: ${t.howToStart} Watch: ${t.watch}`), '',
    'RANKING', ...d.top.map((x, i) => `${i + 1}. ${x.label} – ${x.score}`), '', `Least suited: ${p.avoidNote}`, '', `Partnership: ${p.partnership}`, `Name: ${p.nameAdvice}`, `Place: ${p.placeAdvice}`, `Timing: ${p.timingAdvice}`, '',
    'REMEDIES', ...p.remedies.map((x) => `• ${x}`), '', 'ACTION PLAN', ...p.actionPlan.map((x, i) => `${i + 1}. ${x}`), '', p.closing].join('\n');
}

function printReport(name: string, r: Result, by: string) {
  const d = r.data, p = r.report;
  const bars = (xs: { l: string; v: number }[]) => xs.map((x) => `<div class="bar"><span>${esc(x.l)}</span><b>${x.v}</b><i style="width:${x.v}%"></i></div>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Business Compatibility – ${esc(name)}</title><style>
body{font-family:Georgia,serif;color:#2a1a10;max-width:840px;margin:32px auto;padding:0 20px;line-height:1.55}h1{color:#7a1f2b;margin:0}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:26px}
.k{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.k div{border:1px solid #e5d3a1;border-radius:8px;padding:8px;text-align:center}.k b{display:block;font-size:22px;color:#7a1f2b}
.bar{position:relative;display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:5px 0;font-size:14px}.bar i{position:absolute;left:0;bottom:-1px;height:3px;background:#c9a227}
.pick{border:1px solid #e5d3a1;border-radius:10px;padding:10px 14px;margin:8px 0}small{color:#7a6a55}</style></head><body>
<h1>Business / Profession Compatibility Report</h1><p><b>${esc(name)}</b> · ${new Date(r.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}<br><small>Prepared by ${esc(by)}</small></p>
<div class="k"><div>Moolank<b>${d.person.moolank}</b></div><div>Bhagyank<b>${d.person.bhagyankMaster ? `${d.person.bhagyankMaster}/${d.person.bhagyank}` : d.person.bhagyank}</b></div><div>Name no.<b>${d.person.nameCompound}/${d.person.nameNumber}</b></div><div>Personal year<b>${d.currentYear.personalYear}</b></div><div>Best match<b>${d.top[0].score}</b></div></div>
<h2>${esc(p.headline)}</h2><p>${esc(p.summary)}</p><ul>${p.businessPersonality.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Top Recommendations</h2>${p.topPicks.map((t, i) => `<div class="pick"><b>${i + 1}. ${esc(label(d, t.id))} – ${score(d, t.id)}/100</b><p>${esc(t.why)}</p><p><b>How to start:</b> ${esc(t.howToStart)}</p><p><b>Watch:</b> ${esc(t.watch)}</p></div>`).join('')}
<h2>Compatibility Ranking</h2>${bars(d.top.map((x) => ({ l: x.label, v: x.score })))}<p><b>Least suited:</b> ${esc(p.avoidNote)}</p>
<h2>Sector Analysis</h2>${bars(d.sectorScores.map((x) => ({ l: x.sector, v: x.score })))}
<h2>Partnership, Name, Place & Timing</h2><p><b>Partnership:</b> ${esc(p.partnership)}</p><p><b>Business name:</b> ${esc(p.nameAdvice)}</p><p><b>Place & direction:</b> ${esc(p.placeAdvice)}</p><p><b>Timing:</b> ${esc(p.timingAdvice)}</p>
${bars(d.timing.map((t) => ({ l: `${t.year} – personal year ${t.personalYear}: ${t.theme}`, v: t.score })))}
<h2>Remedies</h2><ul>${p.remedies.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h2>Action Plan</h2><ol>${p.actionPlan.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p><i>${esc(p.closing)}</i></p>
<p><small>Numerology offers guidance based on traditional methods. It is not financial, investment, tax or legal advice.</small></p></body></html>`;
  const w = window.open('', '_blank'); if (!w) return; w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400);
}

export function BusinessStudio() {
  const [f, setF] = React.useState({ fullName: '', commonName: '', dob: '', gender: 'male', birthPlace: '', currentCity: '', businessName: '', mode: 'both', capital: '2', risk: 'medium', education: '', currentWork: '', goals: '', language: 'en', preparedBy: 'Acharya Nandram' });
  const [interests, setInterests] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [res, setRes] = React.useState<Result | null>(null);
  const [sel, setSel] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function run(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setRes(null); setSel(null);
    try {
      const r = await api<Result>('/api/admin/business', { method: 'POST', json: { ...f, preparedBy: undefined, capital: Number(f.capital), interests,
        commonName: f.commonName || undefined, currentCity: f.currentCity || undefined, businessName: f.businessName || undefined, education: f.education || undefined, currentWork: f.currentWork || undefined, goals: f.goals || undefined } });
      setRes(r); setTimeout(() => document.getElementById('biz-result')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (x) { setErr(x instanceof ApiError ? (x.body.error === 'RATE_LIMITED' ? 'Too many reports – please wait a few minutes.' : x.message) : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  const d = res?.data, p = res?.report;
  const selItem = d && sel ? d.all.find((x) => x.id === sel) : null;
  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Briefcase className="h-6 w-6 text-gold" />Business / Profession Compatibility</h2>
        <p className="mt-1 text-sm text-muted-foreground">The numerology engine scores {`50+`} businesses and professions against the client&apos;s Moolank, Bhagyank, name number and Lo Shu grid, then the AI agent writes the consultation from that data. Nothing is saved.</p>
      </div>

      <form onSubmit={run} className="glass space-y-6 rounded-lg p-5">
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">1. Client</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" htmlFor="bz-n" required><Input id="bz-n" value={f.fullName} onChange={set('fullName')} required /></Field>
            <Field label="Name commonly used" htmlFor="bz-cn" hint="Used for the name number; blank = full name"><Input id="bz-cn" value={f.commonName} onChange={set('commonName')} /></Field>
            <Field label="Date of birth" htmlFor="bz-d" required><Input id="bz-d" type="date" value={f.dob} onChange={set('dob')} required /></Field>
            <Field label="Gender" htmlFor="bz-g" hint="Used for the Kua direction"><Select id="bz-g" value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
            <Field label="Birth place" htmlFor="bz-bp" required><Input id="bz-bp" value={f.birthPlace} onChange={set('birthPlace')} placeholder="City, e.g. Jaipur" required /></Field>
            <Field label="Business / work city" htmlFor="bz-cc"><Input id="bz-cc" value={f.currentCity} onChange={set('currentCity')} placeholder="Where they work or plan to" /></Field>
          </div>
        </section>
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">2. Business parameters</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Looking for" htmlFor="bz-m"><Select id="bz-m" value={f.mode} onChange={set('mode')}><option value="both">Business or profession</option><option value="business">Own business</option><option value="profession">Job / profession</option></Select></Field>
            <Field label="Capital available" htmlFor="bz-c"><Select id="bz-c" value={f.capital} onChange={set('capital')}><option value="1">Low (up to ₹5 lakh)</option><option value="2">Medium (₹5–50 lakh)</option><option value="3">High (above ₹50 lakh)</option></Select></Field>
            <Field label="Risk appetite" htmlFor="bz-r"><Select id="bz-r" value={f.risk} onChange={set('risk')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
            <Field label="Report language" htmlFor="bz-l"><Select id="bz-l" value={f.language} onChange={set('language')}><option value="en">English</option><option value="hi">हिंदी</option><option value="hinglish">Hinglish</option></Select></Field>
            <Field label="Existing / planned business name" htmlFor="bz-bn" className="sm:col-span-2"><Input id="bz-bn" value={f.businessName} onChange={set('businessName')} placeholder="Optional – checked against the owner's numbers" /></Field>
            <Field label="Education" htmlFor="bz-e"><Input id="bz-e" value={f.education} onChange={set('education')} placeholder="e.g. B.Com, MBA" /></Field>
            <Field label="Current work" htmlFor="bz-w"><Input id="bz-w" value={f.currentWork} onChange={set('currentWork')} placeholder="e.g. Sales manager, 8 yrs" /></Field>
          </div>
          <div><p className="mb-2 text-sm font-medium">Interested sectors</p><div className="flex flex-wrap gap-2">{SECTORS.map((s) => <button key={s} type="button" aria-pressed={interests.includes(s)} onClick={() => setInterests(interests.includes(s) ? interests.filter((x) => x !== s) : [...interests, s])} className={cn('rounded-full border px-3 py-1.5 text-xs', interests.includes(s) ? 'border-gold bg-gold/20 font-semibold' : 'border-border hover:bg-muted')}>{s}</button>)}</div></div>
          <Field label="Goals / notes for the agent" htmlFor="bz-gl"><textarea id="bz-gl" rows={3} maxLength={1000} value={f.goals} onChange={set('goals')} placeholder="e.g. Wants to leave job in 2 years, family has a cloth shop, prefers low-risk…" className="w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" /></Field>
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !f.fullName || !f.dob || !f.birthPlace}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{busy ? 'Agent is analysing…' : 'Generate compatibility report'}</Button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">Prepared by<Input value={f.preparedBy} onChange={set('preparedBy')} className="w-52" /></label>
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        </div>
      </form>

      {res && d && p && (
        <div id="biz-result" className="mk-rise scroll-mt-24 space-y-5" lang={f.language === 'hi' ? 'hi' : 'en'}>
          <div className="glass flex flex-wrap items-center gap-2 rounded-lg p-4 text-xs">
            <Badge tone={res.source === 'ai' ? 'gold' : 'default'}><Bot className="mr-1 inline h-3 w-3" />{res.source === 'ai' ? `AI agent${res.model ? ` · ${res.model}` : ''}` : 'Built-in analyst'}</Badge>
            {res.note && <span className="text-muted-foreground">{res.note}</span>}
            <div className="ml-auto flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(asText(f.fullName, res))}><Copy className="mr-1 h-4 w-4" />Copy text</Button>
              <Button type="button" size="sm" onClick={() => printReport(f.fullName, res, f.preparedBy || 'Acharya Nandram')}><Printer className="mr-1 h-4 w-4" />Print / Save PDF</Button></div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Moolank" value={d.person.moolank} sub={undefined} />
            <Kpi label="Bhagyank" value={d.person.bhagyankMaster ? `${d.person.bhagyankMaster}/${d.person.bhagyank}` : d.person.bhagyank} sub={d.person.planet.name} />
            <Kpi label="Name number" value={`${d.person.nameCompound}/${d.person.nameNumber}`} sub={REL[d.person.nameToBhagyank]} />
            <Kpi label="Best match" value={d.top[0].score} sub={d.top[0].label} />
            <Kpi label="Personal year" value={d.currentYear.personalYear} sub={`Launch score ${d.currentYear.score}`} />
            <Kpi label="Birth place" value={d.places.birth ? d.places.birth.single : '–'} sub={d.places.birth ? REL[d.places.birth.toBhagyank] : ''} />
          </div>

          <Card title={p.headline}><p className="text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
            <ul className="mt-3 space-y-1.5 text-sm">{p.businessPersonality.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul></Card>

          <Card title="Top recommendations">
            <div className="grid gap-3 md:grid-cols-2">{p.topPicks.map((t, i) => (
              <div key={t.id} className="mk-card rounded-xl border border-gold/30 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-2"><p className="font-serif text-lg font-semibold"><span className="gold-text mr-1">{i + 1}.</span>{label(d, t.id)}</p><span className="rounded-full bg-gold/20 px-2 py-0.5 text-sm font-bold text-gold">{score(d, t.id)}</span></div>
                <p className="mt-1 text-sm">{t.why}</p><p className="mt-2 text-sm text-muted-foreground"><b className="text-foreground">How to start:</b> {t.howToStart}</p><p className="mt-1 text-xs text-amber-300/90"><b>Watch:</b> {t.watch}</p>
              </div>))}</div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Compatibility ranking (tap for details)">
              {d.top.map((x) => <Bar key={x.id} label={<>{x.label} <span className="text-[10px] uppercase text-muted-foreground">· {x.kind === 'business' ? 'business' : 'profession'}</span></>} value={x.score} onClick={() => setSel(sel === x.id ? null : x.id)} active={sel === x.id}
                sub={sel === x.id ? <>Numbers {x.numbers.join(', ')} · numerology fit {x.numerologyFit}{x.factors.length ? ` · ${x.factors.join(' · ')}` : ''}</> : undefined} />)}
              <p className="mt-3 text-xs text-muted-foreground">Least suited: {d.avoid.map((x) => `${x.label} (${x.score})`).join(', ')}</p>
              {selItem && <span className="sr-only" aria-live="polite">{selItem.label} selected</span>}
            </Card>
            <Card title="Sector analysis">{d.sectorScores.map((s) => <Bar key={s.sector} label={s.sector} value={s.score} />)}</Card>
            <Card title="Number strength 1–9">
              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <div><div className="grid grid-cols-3 gap-1">{LOSHU.flat().map((n) => <div key={n} className={cn('flex h-14 w-14 flex-col items-center justify-center rounded-md border text-sm', d.grid.counts[n] ? 'border-gold/50 bg-gold/10' : 'border-dashed border-border text-muted-foreground')}><span className="font-serif text-lg font-bold">{d.grid.counts[n] ? String(n).repeat(d.grid.counts[n]) : '–'}</span></div>)}</div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Lo Shu grid · missing {d.grid.missing.join(', ') || 'none'}{d.grid.yogs.length ? ` · ${d.grid.yogs.join(', ')}` : ''}</p></div>
                <div>{d.numberStrength.map((x) => <Bar key={x.n} label={`${x.n} · ${x.planet}`} value={x.score} />)}</div>
              </div>
            </Card>
            <Card title="Life-area scores">{Object.entries(d.lifeAreas).map(([k, v]) => <Bar key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} value={v} />)}</Card>
          </div>

          <Card title="Timing – best years to launch or expand">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">{d.timing.map((t) => (
              <div key={t.year} title={t.theme} className={cn('rounded-lg border p-2 text-center', t.score >= 80 ? 'border-emerald-400/60 bg-emerald-500/10' : t.score >= 55 ? 'border-gold/40 bg-gold/5' : 'border-rose-400/40 bg-rose-500/5')}>
                <p className="text-xs text-muted-foreground">{t.year}</p><p className="gold-text font-serif text-2xl font-bold">{t.personalYear}</p><p className="text-[10px]">{t.score}</p></div>))}</div>
            <p className="mt-3 text-sm">{p.timingAdvice}</p>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Business name"><p className="text-sm">{p.nameAdvice}</p>{d.businessName && <p className="mt-2 text-xs text-muted-foreground">&quot;{d.businessName.text}&quot; = {d.businessName.compound}/{d.businessName.single} · {d.businessName.category} · harmony {d.businessName.score}</p>}
              <p className="mt-2 text-xs text-muted-foreground">Good totals: {d.nameTargets.map((t) => `${t.single} (${t.compounds.join(', ')})`).join(' · ')}</p></Card>
            <Card title="Place & direction"><p className="text-sm">{p.placeAdvice}</p><p className="mt-2 text-xs text-muted-foreground">Kua {d.person.kua} · success {d.directions.success} · growth {d.directions.growth} · avoid {d.directions.avoid}</p></Card>
            <Card title="Partnership"><p className="text-sm">{p.partnership}</p></Card>
            <Card title="Least suited"><p className="text-sm">{p.avoidNote}</p></Card>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Remedies"><ul className="space-y-1.5 text-sm">{p.remedies.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul></Card>
            <Card title="Action plan"><ol className="space-y-1.5 text-sm">{p.actionPlan.map((x, i) => <li key={x} className="flex gap-2"><span className="gold-text font-bold">{i + 1}.</span>{x}</li>)}</ol></Card>
          </div>
          <p className="text-sm italic">{p.closing}</p>
          <p className="text-xs text-muted-foreground">Numerology guidance only – not financial, investment, tax or legal advice. Review before sharing with the client.</p>
        </div>
      )}
    </div>
  );
}
