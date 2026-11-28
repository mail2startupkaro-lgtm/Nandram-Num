'use client';
import { ClientQuestionsField, fetchAnswers, orderQuestions } from '@/components/admin/client-questions-field';
import { withTitleCase } from '@/lib/report/title-case';
import * as React from 'react';
import { ClipboardList, Landmark, Loader2, Plus, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { api, ApiError } from '@/lib/client/api';
import { SITE_NAME } from '@/lib/seo/site';
import { fmtDate, parsePartners, splitNames, type Blk, type BizSection, type CompleteBizData } from '@/lib/business/complete';
import type { Order } from '@/components/admin/services-admin';
import type { CoverWithExtras } from '@/lib/report/print-extras';
import { bizCoverRequest, bizReportHtml } from '@/lib/report/print-html';

type Written = { title: string; subtitle: string; summary: string; sections: BizSection[] };
interface Result { data: CompleteBizData; report: { en: Written; hi: Written }; generatedAt: string }

const BLANK = { ownerName: '', dob: '', gender: 'male', names: '', businessType: '', launchDate: '', tagline: '', brandColours: '', businessMobile: '', lang: 'en' as 'en' | 'hi', preparedBy: 'Acharya Nandram' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/* ---------- screen rendering ---------- */
function BlockView({ b }: { b: Blk }) {
  switch (b.k) {
    case 'p': return <p className="text-sm leading-relaxed">{b.t}</p>;
    case 'tip': return <p className="rounded-md border-l-4 border-gold bg-gold/10 p-3 text-sm">{b.t}</p>;
    case 'list': return <ul className="list-disc space-y-1 pl-5 text-sm">{b.items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
    case 'tiles': return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{b.items.map((x) => <div key={x.label} className="rounded-lg border border-gold/30 bg-background/40 p-2 text-center"><p className="text-[11px] text-muted-foreground">{x.label}</p><p className="font-serif text-xl font-bold text-gold">{x.value}</p></div>)}</div>;
    case 'bars': return <div className="space-y-1.5">{b.items.map((x) => <div key={x.label} className="text-sm"><div className="flex justify-between gap-2"><span className="truncate">{x.label}</span><b>{x.value}</b></div><div className="h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-gold" style={{ width: `${Math.max(2, Math.min(100, x.value))}%` }} /></div></div>)}</div>;
    case 'table': return <div className="overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-sm"><thead><tr>{b.head.map((h) => <th key={h} className="border border-border bg-muted/40 px-2 py-1 text-left">{h}</th>)}</tr></thead><tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border border-border px-2 py-1 align-top">{c}</td>)}</tr>)}</tbody></table></div>;
  }
}

/* ---------- print / PDF ---------- */

async function printReport(r: Result, lang: 'en' | 'hi', by: string, questions = '') {
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<p style="font-family:Georgia,serif;padding:40px;color:#7a1f2b">${lang === 'hi' ? 'रिपोर्ट तैयार हो रही है…' : 'Preparing the report…'}</p>`);
  const [cover, qa] = await Promise.all([api<CoverWithExtras>('/api/admin/report-cover', { method: 'POST', json: bizCoverRequest(r, lang, by) }).catch(() => null), fetchAnswers({ questions, name: r.data.owner.name, dob: r.data.owner.dob, gender: r.data.owner.gender, lang })]);
  const html = bizReportHtml(r, lang, by, cover, qa);
  w.document.open(); w.document.write(withTitleCase(html)); w.document.close(); setTimeout(() => w.print(), 800);
}

export function BusinessReportStudio({ preloadedOrder, onClearPreloadedOrder }: { preloadedOrder?: Order | null; onClearPreloadedOrder?: () => void } = {}) {
  const [f, setF] = React.useState(BLANK);
  const [partners, setPartners] = React.useState<{ name: string; dob: string }[]>([]);
  const [cq, setCq] = React.useState('');
  const [fromOrder, setFromOrder] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [res, setRes] = React.useState<Result | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  React.useEffect(() => {
    if (!preloadedOrder) return;
    const dt = preloadedOrder.details ?? {};
    const brand = dt.brand ?? '';
    setF({ ...BLANK, ownerName: dt.clientName ?? '', dob: dt.dob ?? '', gender: dt.gender ?? 'male', names: splitNames(dt.businessName ?? dt.currentName ?? '').join('\n'), businessType: dt.businesses ?? '',
      launchDate: dt.launchDate ?? '', brandColours: brand, businessMobile: dt.mobile ?? '' });
    setPartners(parsePartners(dt.partners ?? '')); setCq(orderQuestions(dt));
    setFromOrder(`${dt.clientName ?? 'Client'} · ordered ${new Date(preloadedOrder.createdAt).toLocaleDateString('en-IN')}${dt.partners ? ` · partners as typed: ${dt.partners.replace(/\n/g, '; ')}` : ''}${dt.questions ? ` · notes: ${dt.questions}` : ''}`);
    setRes(null); onClearPreloadedOrder?.();
  }, [preloadedOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setRes(null);
    try {
      const r = await api<Result>('/api/admin/business-report', { method: 'POST', json: {
        ownerName: f.ownerName, dob: f.dob, gender: f.gender, names: splitNames(f.names), businessType: f.businessType || undefined, launchDate: f.launchDate || undefined,
        partners: partners.filter((p) => p.name.trim() && p.dob), tagline: f.tagline || undefined, brandColours: f.brandColours || undefined, businessMobile: f.businessMobile || undefined, lang: f.lang } });
      setRes(r); setTimeout(() => document.getElementById('bzr-result')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (x) {
      setErr(x instanceof ApiError ? (x.body.error === 'RATE_LIMITED' ? 'Too many reports – please wait a few minutes.' : (x.body.issues as { message: string }[] | undefined)?.map((i) => i.message).join(' · ') || x.message) : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  const R = res?.report[f.lang];
  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Landmark className="h-6 w-6 text-gold" />Complete Business Numerology Report</h2>
        <p className="mt-1 text-sm text-muted-foreground">One report with Business Name Analysis, Business Name Correction, Brand &amp; Logo Numerology, Business Partner Compatibility, a 9-year Business growth cycle forecast and the CEO Numerology Report – from the same engine as every other report. Print / Save PDF gives the branded client report with cover, in English or Hindi. Nothing is saved.</p>
        <p className="mt-2 text-xs text-muted-foreground">Paid orders for this service open here from Services → Orders → Generate Report.</p>
      </div>
      {fromOrder && <div className="glass flex flex-wrap items-center gap-2 rounded-lg border border-gold/50 p-3 text-sm"><ClipboardList className="h-4 w-4 text-gold" /><span>Loaded from service order: {fromOrder}. Check the details, then generate.</span><button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setFromOrder(null)}>Dismiss</button></div>}

      <form onSubmit={run} className="glass space-y-6 rounded-lg p-5">
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">1. Owner / CEO</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Owner's full name" htmlFor="bzr-n" required><Input id="bzr-n" value={f.ownerName} onChange={set('ownerName')} required /></Field>
            <Field label="Date of birth" htmlFor="bzr-d" required><Input id="bzr-d" type="date" value={f.dob} onChange={set('dob')} required /></Field>
            <Field label="Gender" htmlFor="bzr-g" hint="For the Kua direction"><Select id="bzr-g" value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
            <Field label="Report language" htmlFor="bzr-l"><Select id="bzr-l" value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value as 'en' | 'hi' })}><option value="en">English</option><option value="hi">हिंदी</option></Select></Field>
          </div>
        </section>
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">2. Business</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business / brand names (up to 5, one per line)" htmlFor="bzr-names" required hint="The first one is treated as the current name for corrections"><textarea id="bzr-names" rows={4} value={f.names} onChange={set('names')} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={'Sharma Interiors\nNest Design Studio'} /></Field>
            <div className="grid gap-4">
              <Field label="Type of business" htmlFor="bzr-t" hint="Matched to the 1000+ category catalogue"><Input id="bzr-t" value={f.businessType} onChange={set('businessType')} placeholder="e.g. interior design, café, CA practice" /></Field>
              <Field label="Opening date (done or planned)" htmlFor="bzr-ld" hint="Gives the business its own growth cycle"><Input id="bzr-ld" type="date" value={f.launchDate} onChange={set('launchDate')} /></Field>
            </div>
            <Field label="Tagline" htmlFor="bzr-tag"><Input id="bzr-tag" value={f.tagline} onChange={set('tagline')} maxLength={160} /></Field>
            <Field label="Current brand colours" htmlFor="bzr-c"><Input id="bzr-c" value={f.brandColours} onChange={set('brandColours')} maxLength={200} placeholder="e.g. green and gold" /></Field>
            <Field label="Business mobile number" htmlFor="bzr-m"><Input id="bzr-m" value={f.businessMobile} onChange={set('businessMobile')} inputMode="numeric" maxLength={20} /></Field>
            <Field label="Prepared by" htmlFor="bzr-by"><Input id="bzr-by" value={f.preparedBy} onChange={set('preparedBy')} /></Field>
            <div className="sm:col-span-2"><ClientQuestionsField id="bzr-cq" value={cq} onChange={setCq} /></div>
          </div>
        </section>
        <section className="space-y-3"><h3 className="font-serif text-lg font-semibold text-gold">3. Business partners</h3>
          {partners.map((p, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_200px_auto]">
              <Field label={`Partner ${i + 1} name`} htmlFor={`bzr-pn${i}`}><Input id={`bzr-pn${i}`} value={p.name} onChange={(e) => setPartners(partners.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
              <Field label="Date of birth" htmlFor={`bzr-pd${i}`}><Input id={`bzr-pd${i}`} type="date" value={p.dob} onChange={(e) => setPartners(partners.map((x, j) => (j === i ? { ...x, dob: e.target.value } : x)))} /></Field>
              <Button type="button" variant="ghost" size="sm" aria-label={`Remove partner ${i + 1}`} onClick={() => setPartners(partners.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {partners.length < 6 && <Button type="button" variant="outline" size="sm" onClick={() => setPartners([...partners, { name: '', dob: '' }])}><Plus className="mr-1 h-4 w-4" />Add partner</Button>}
        </section>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <Button type="submit" variant="gold" size="lg" disabled={busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : 'Generate report'}</Button>
      </form>

      {res && R && (
        <div id="bzr-result" className="glass space-y-6 rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-serif text-2xl font-semibold">{R.title}</h3><p className="text-sm text-muted-foreground">{res.data.owner.name} · {R.subtitle}</p></div>
            <div className="flex gap-2">
              <Select aria-label="Report language" value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value as 'en' | 'hi' })} className="w-32"><option value="en">English</option><option value="hi">हिंदी</option></Select>
              <Button type="button" size="sm" onClick={() => printReport(res, f.lang, f.preparedBy || 'Acharya Nandram', cq)}><Printer className="mr-1 h-4 w-4" />Print / Save PDF</Button>
            </div>
          </div>
          {R.sections.map((s, i) => (
            <section key={s.id} className="space-y-3"><h4 className="border-b border-gold/40 pb-1 font-serif text-lg font-semibold text-gold">{i + 1}. {s.title}</h4>{s.blocks.map((b, j) => <BlockView key={j} b={b} />)}</section>
          ))}
        </div>
      )}
    </div>
  );
}
