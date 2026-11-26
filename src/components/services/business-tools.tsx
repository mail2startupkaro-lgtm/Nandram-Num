'use client';
/**
 * Public tools on /business-compatibility-numerology:
 *  - BusinessQuickCheck: free teaser – best sectors, top 3 matches and a verdict for one business the visitor is considering.
 *  - BusinessDirectory: searchable list of every business category the report covers (rendered on the server too, for SEO).
 * Both run the same deterministic engine as the paid report, in the browser; nothing is sent or stored.
 */
import * as React from 'react';
import { trackCalculatorUse } from '@/lib/client/analytics';
import { Lock, MessageCircle, Search, Sparkles } from 'lucide-react';
import { Bi } from '@/components/i18n/bi';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { BUSINESSES, SECTORS } from '@/lib/business/catalogue';
import { businessAnalytics, type BizAnalytics } from '@/lib/business/engine';
import { parseDate, todayIST, toIso } from '@/lib/numerology';
import { cn } from '@/lib/utils';

const SECTOR_HI: Record<string, string> = {
  'Trade & Retail': 'व्यापार और खुदरा', 'Technology & Media': 'तकनीक और मीडिया', 'Lifestyle & Beauty': 'लाइफ़स्टाइल और सौंदर्य', 'Food & Hospitality': 'भोजन और आतिथ्य',
  'Property & Industry': 'संपत्ति और उद्योग', 'Finance & Legal': 'वित्त और क़ानून', 'Education & Consulting': 'शिक्षा और परामर्श', 'Health & Wellness': 'स्वास्थ्य और वेलनेस',
  'Agriculture & Logistics': 'कृषि और लॉजिस्टिक्स', 'Public Service & Defence': 'जनसेवा और सुरक्षा',
};
export const sectorHi = (s: string) => SECTOR_HI[s] ?? s;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tone = (v: number) => (v >= 75 ? 'from-emerald-600 to-emerald-400' : v >= 62 ? 'from-[hsl(43_75%_42%)] to-[hsl(43_85%_58%)]' : v >= 48 ? 'from-amber-700 to-amber-500' : 'from-rose-700 to-rose-500');
const fmt = (n: number) => n.toLocaleString('en-IN');

function Meter({ label, value }: { label: React.ReactNode; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate">{label}</span><span className="tabular-nums font-semibold text-gold">{value}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', tone(value))} style={{ width: `${Math.max(3, value)}%` }} /></div>
    </div>
  );
}

/** Type-ahead over the business categories. */
function CategoryPicker({ value, onChange, id }: { value: string | null; onChange: (id: string | null) => void; id: string }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const picked = value ? BUSINESSES.find((b) => b.id === value) : null;
  const hits = React.useMemo(() => { const n = norm(q.trim()); return n.length < 2 ? [] : BUSINESSES.filter((b) => norm(b.label).includes(n) || norm(b.group).includes(n)).slice(0, 8); }, [q]);
  if (picked) return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-sm"><span>{picked.label}</span><button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { onChange(null); setQ(''); }}><Bi en="Change" hi="बदलें" /></button></div>
  );
  return (
    <div className="relative">
      <Input id={id} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="e.g. café, boutique, pharmacy" autoComplete="off" role="combobox" aria-expanded={open && hits.length > 0} aria-controls={`${id}-list`} />
      {open && hits.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-background shadow-xl">
          {hits.map((h) => <li key={h.id} role="option" aria-selected={false}><button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gold/10" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(h.id); setOpen(false); }}>{h.label}<span className="block text-[11px] text-muted-foreground">{h.group}</span></button></li>)}
        </ul>
      )}
    </div>
  );
}

export function BusinessQuickCheck({ whatsapp, bookHref = '#book' }: { whatsapp: string; bookHref?: string }) {
  const [name, setName] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [consider, setConsider] = React.useState<string | null>(null);
  const [res, setRes] = React.useState<BizAnalytics | null>(null);
  const [err, setErr] = React.useState('');

  function run(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!/[A-Za-z]{2}/.test(name)) { setErr('Please enter your name in English letters. / कृपया नाम अंग्रेज़ी अक्षरों में लिखें।'); return; }
    try {
      setRes(businessAnalytics({ fullName: name.trim(), dob: parseDate(dob), gender: 'male', birthPlace: '', mode: 'business', capital: 3, risk: 'medium', interests: [], asOf: todayIST(), shortlist: consider ? [consider] : [] }));
      trackCalculatorUse('business');
      setTimeout(() => document.getElementById('bqc-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    } catch { setErr('Please check the date of birth. / कृपया जन्म तिथि जाँचें।'); }
  }

  const checked = res?.checked[0];
  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Namaste Acharya ji, I want the Business Compatibility Report. Name: ${name}, DOB: ${dob}${checked ? `, considering: ${checked.label}` : ''}`)}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={run} className="glass space-y-4 rounded-2xl border border-gold/30 p-5 sm:p-6">
        <Field label="Your name / आपका नाम" htmlFor="bqc-n" required><Input id="bqc-n" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" /></Field>
        <Field label="Date of birth / जन्म तिथि" htmlFor="bqc-d" required><Input id="bqc-d" type="date" min="1900-01-01" max={toIso(todayIST())} value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
        <Field label="A business you are considering (optional) / विचाराधीन व्यवसाय (वैकल्पिक)" htmlFor="bqc-b"><CategoryPicker id="bqc-b" value={consider} onChange={setConsider} /></Field>
        <Button type="submit" variant="gold" className="w-full" disabled={!name.trim() || !dob}><Sparkles className="h-4 w-4" /><Bi en="Check my business compatibility" hi="मेरी व्यवसाय अनुकूलता देखें" /></Button>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <p className="text-[11px] text-muted-foreground"><Bi en="Free and instant. Your details stay in your browser." hi="मुफ़्त और तुरंत। आपकी जानकारी आपके ब्राउज़र में ही रहती है।" /></p>
      </form>

      <div id="bqc-result" className="scroll-mt-24" aria-live="polite">
        {!res ? (
          <div className="glass flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-gold/30 p-6 text-center">
            <p className="gold-text font-cinzel text-5xl font-bold">{fmt(BUSINESSES.length)}</p>
            <p className="mt-1 text-sm text-muted-foreground"><Bi en="business categories checked against your date of birth" hi="व्यवसाय श्रेणियाँ आपकी जन्म तिथि से जाँची जाती हैं" /></p>
          </div>
        ) : (
          <div className="glass mk-rise space-y-5 rounded-2xl border border-gold/40 p-5 sm:p-6">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Moolank', 'मूलांक', res.person.moolank], ['Bhagyank', 'भाग्यांक', res.person.bhagyankMaster ? `${res.person.bhagyankMaster}/${res.person.bhagyank}` : res.person.bhagyank], ['Name no.', 'नामांक', res.person.nameNumber]].map(([en, hi, v]) => (
                <div key={String(en)} className="rounded-lg border border-gold/30 bg-gold/5 p-2"><p className="text-[10px] uppercase tracking-widest text-muted-foreground"><Bi en={String(en)} hi={String(hi)} /></p><p className="gold-text font-serif text-2xl font-bold">{v}</p></div>))}
            </div>
            {checked && (
              <div className={cn('rounded-xl border p-4', checked.score >= 62 ? 'border-emerald-400/50 bg-emerald-500/10' : checked.score >= 48 ? 'border-amber-400/50 bg-amber-500/10' : 'border-rose-400/50 bg-rose-500/10')}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground"><Bi en="Your choice" hi="आपका चयन" /></p>
                <p className="font-serif text-lg font-semibold">{checked.label}</p>
                <p className="text-sm"><b><Bi en={checked.verdict.en} hi={checked.verdict.hi} /></b> · <Bi en={`rank ${fmt(checked.rank)} of ${fmt(res.totals.analysed)}`} hi={`${fmt(res.totals.analysed)} में ${fmt(checked.rank)}वाँ स्थान`} /></p>
              </div>
            )}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold"><Bi en="Your strongest sectors" hi="आपके सबसे मज़बूत क्षेत्र" /></p>
              {res.sectorScores.slice(0, 3).map((s) => <Meter key={s.sector} label={<Bi en={s.sector} hi={sectorHi(s.sector)} />} value={s.score} />)}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold"><Bi en="Top business matches" hi="शीर्ष व्यवसाय मेल" /></p>
              <ol className="space-y-1.5">
                {res.top.slice(0, 3).map((x, i) => <li key={x.id} className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-3 py-2 text-sm"><span><span className="gold-text mr-2 font-bold">{i + 1}.</span>{x.label}</span><span className="font-semibold text-gold">{x.score}</span></li>)}
                {res.top.slice(3, 8).map((x, i) => <li key={x.id} aria-hidden className="flex select-none items-center justify-between gap-2 rounded-md bg-background/40 px-3 py-2 text-sm blur-[5px]"><span><span className="mr-2 font-bold">{i + 4}.</span>{'█'.repeat(10 + (i * 3) % 7)}</span><span>██</span></li>)}
              </ol>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5 text-gold" /><Bi en={`Your full ranking of all ${fmt(res.totals.analysed)} businesses, best years to launch, name check and remedies are in the report.`} hi={`सभी ${fmt(res.totals.analysed)} व्यवसायों की पूरी रैंकिंग, शुरुआत के शुभ वर्ष, नाम जाँच और उपाय रिपोर्ट में हैं।`} /></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={bookHref} className={buttonVariants({ variant: 'gold', className: 'flex-1' })}><Sparkles className="h-4 w-4" /><Bi en="Get the full report" hi="पूरी रिपोर्ट पाएँ" /></a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', className: 'flex-1' })}><MessageCircle className="h-4 w-4 text-success" />WhatsApp</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Every category the report covers, grouped by sector; the search box filters them. */
export function BusinessDirectory() {
  const [q, setQ] = React.useState('');
  const n = norm(q.trim());
  const bySector = React.useMemo(() => SECTORS.map((s) => {
    const groups = new Map<string, string[]>();
    for (const b of BUSINESSES) if (b.sector === s) (groups.get(b.group) ?? groups.set(b.group, []).get(b.group)!).push(b.label);
    return { sector: s, count: [...groups.values()].reduce((a, x) => a + x.length, 0), groups: [...groups.entries()] };
  }), []);
  const hits = n.length >= 2 ? BUSINESSES.filter((b) => norm(b.label).includes(n) || norm(b.group).includes(n)) : null;
  return (
    <div className="space-y-4">
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your business – e.g. bakery, solar, coaching" aria-label="Search business categories" className="pl-9" />
      </div>
      {hits ? (
        <div className="glass rounded-xl p-4">
          <p className="mb-2 text-sm text-muted-foreground">{hits.length ? <Bi en={`${hits.length} matching categories – all are covered in the report`} hi={`${hits.length} मिलती श्रेणियाँ – सभी रिपोर्ट में शामिल हैं`} /> : <Bi en="Not in the list? Write it in the booking form – it will be added to your report." hi="सूची में नहीं है? बुकिंग फ़ॉर्म में लिखें – इसे आपकी रिपोर्ट में जोड़ा जाएगा।" />}</p>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">{hits.slice(0, 90).map((b) => <li key={b.id}>{b.label} <span className="text-[11px] text-muted-foreground">· {b.group}</span></li>)}</ul>
        </div>
      ) : (
        <div className="grid items-start gap-3 md:grid-cols-2">
          {bySector.map((s) => (
            <details key={s.sector} className="glass group rounded-xl border border-gold/20 p-4 open:border-gold/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-serif text-lg font-semibold"><Bi en={s.sector} hi={sectorHi(s.sector)} /><span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">{s.count}</span></summary>
              <div className="mt-3 space-y-3">{s.groups.map(([gname, items]) => (
                <div key={gname}><p className="text-xs font-semibold uppercase tracking-wider text-gold">{gname}</p><p className="mt-1 text-sm text-muted-foreground">{items.join(' · ')}</p></div>))}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
