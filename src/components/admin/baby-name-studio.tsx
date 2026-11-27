'use client';
/**
 * Admin → Advanced Baby Name Analysis.
 * Baby's date of birth + surname, parents' names, preferred letters and the family's shortlist → every name scored on the shared
 * engine in the browser (plus suitable names from the curated bank) → branded PDF: cover, each section on a fresh page,
 * expert profile + services CTA at the end. Nothing is saved.
 */
import * as React from 'react';
import { Baby, Check, Download, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { todayIST } from '@/lib/numerology';
import { analyseBabyName, type BabyNameResult } from '@/lib/baby-name/analysis';
import { NAME_STYLES, nameStyleForCountry, styleLabel, type NameStyleChoice } from '@/lib/baby-name/world-names';
import { ALL_COUNTRIES } from '@/lib/countries';
import { checkText, L } from '@/lib/baby-name/text';
import { cn } from '@/lib/utils';
import type { Order } from './services-admin';

const iso = (p: { year: number; month: number; day: number }) => `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
const THEMES = [['royal-gold-maroon', 'Royal Gold & Maroon'], ['cosmic-blue', 'Cosmic Blue'], ['saffron-cream', 'Saffron & Cream'], ['minimal-white', 'Minimal White']] as const;
const VTONE = { excellent: 'good', good: 'gold', average: 'warn', weak: 'bad' } as const;
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

export function BabyNameStudio({ preloadedOrder, onClearPreloadedOrder }: { preloadedOrder?: Order | null; onClearPreloadedOrder?: () => void }) {
  const today = iso(todayIST());
  const [f, setF] = React.useState({ dob: '', gender: 'any', country: 'India', nameStyle: 'auto' as NameStyleChoice, surname: '', timeOfBirth: '', placeOfBirth: '', fatherName: '', motherName: '', letters: '', nameFor: 'both' as 'formal' | 'nickname' | 'both', currentName: '', currentNickname: '', asOf: today, language: 'en' as 'en' | 'hi', theme: 'royal-gold-maroon', preparedBy: 'Acharya Nandram', expertNote: '' });
  const [names, setNames] = React.useState<string[]>(['']);
  const [suggest, setSuggest] = React.useState(true);
  const [res, setRes] = React.useState<BabyNameResult | null>(null);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [fromOrder, setFromOrder] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  React.useEffect(() => {
    if (!preloadedOrder) return;
    const dt = preloadedOrder.details ?? {};
    // "Rahul Sharma & Priya Sharma" → father, mother; surname from the first parent's last word.
    const parents = (dt.parents ?? '').split(/\s*(?:&|,|\/|\band\b)\s*/i).map((x) => x.trim()).filter(Boolean);
    const father = dt.fatherName?.trim() || parents[0] || '';
    const mother = dt.motherName?.trim() || parents[1] || '';
    const surname = dt.surname?.trim() || (father.split(/\s+/).length > 1 ? father.split(/\s+/).pop() ?? '' : '');
    const g = (dt.gender ?? '').toLowerCase();
    // Baby's current name from the order: a nickname, a formal name, or "Formal / Nickname" when both were typed.
    const nt = dt.nameType === 'formal' || dt.nameType === 'nickname' ? dt.nameType : 'both';
    const bn = (dt.babyName ?? '').trim();
    const [p1, p2] = bn.split(/\s*(?:\/|,|\(|\)|\balias\b|\bnickname\b)\s*/i).filter(Boolean);
    const cur = nt === 'nickname' ? { currentName: '', currentNickname: p1 ?? '' } : { currentName: p1 ?? '', currentNickname: nt === 'both' ? p2 ?? '' : '' };
    setF((x) => ({ ...x, nameFor: nt, ...cur, country: dt.country || 'India', nameStyle: 'auto', dob: dt.dob ? toIsoDob(dt.dob) : '', gender: g === 'male' || g === 'boy' ? 'boy' : g === 'female' || g === 'girl' ? 'girl' : 'any', timeOfBirth: dt.tob ?? '', placeOfBirth: dt.pob ?? '', fatherName: father, motherName: mother, surname, letters: dt.letters ?? '' }));
    const preNames = (dt.consideredNames ?? '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    setNames(preNames.length ? preNames : ['']); setRes(null);
    setFromOrder(`ordered ${new Date(preloadedOrder.createdAt).toLocaleDateString('en-IN')}${dt.parents ? ` · parents: ${dt.parents}` : ''}${dt.questions ? ` · questions: ${dt.questions}` : ''} – check father / mother / surname below`);
    onClearPreloadedOrder?.();
  }, [preloadedOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const payload = () => ({
    dob: f.dob, gender: f.gender as 'boy' | 'girl' | 'any', surname: f.surname, timeOfBirth: f.timeOfBirth, placeOfBirth: f.placeOfBirth, fatherName: f.fatherName, motherName: f.motherName,
    letters: f.letters, candidates: names.map((n) => n.trim()).filter(Boolean), suggest, asOf: f.asOf || undefined, country: f.country, nameStyle: f.nameStyle,
    nameFor: f.nameFor, currentName: f.currentName.trim() || undefined, currentNickname: f.nameFor === 'formal' ? undefined : f.currentNickname.trim() || undefined,
  });

  function analyse(e?: React.FormEvent) {
    e?.preventDefault(); setErr('');
    try {
      setRes(analyseBabyName(payload()));
      setTimeout(() => document.getElementById('bn-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) { setRes(null); setErr(x instanceof Error ? x.message : 'Please check the details.'); }
  }

  async function downloadPdf() {
    setBusy(true); setErr('');
    try {
      const body = { ...payload(), language: f.language, theme: f.theme, preparedBy: f.preparedBy || 'Acharya Nandram', expertNote: f.expertNote.trim() || undefined };
      const r = await fetch('/api/admin/baby-name/pdf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        const j = await r.json().catch(() => null) as { issues?: { message: string }[] } | null;
        throw new Error(r.status === 503 ? 'PDF engine is not available on this server.' : r.status === 422 ? j?.issues?.[0]?.message ?? 'Some details are invalid.' : r.status === 429 ? 'Too many PDFs in a short time – wait a few minutes.' : `PDF failed (${r.status})`);
      }
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a'); a.href = url; a.download = `baby-name-report-${(f.surname || res?.top[0]?.first || 'baby').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (x) { setErr(x instanceof Error ? x.message : 'PDF failed'); }
    finally { setBusy(false); }
  }

  const best = res?.top[0];
  const l = L.en;
  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Baby className="h-6 w-6 text-gold" />Advanced Baby Name Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">Scores every name the family is considering against the baby&apos;s date of birth: first name and full name with surname (Chaldean), compound number, first letter, soul urge, Lo Shu grid and harmony with the parents&apos; names. Checks the baby&apos;s current name and nickname (keep / correct spelling / new name), suggests nicknames that suit both the birth numbers and the formal name, adds remedies for the child&apos;s development, adds well-suited names from a list of meaningful names (in the letters you give), suggests spelling tweaks that keep the sound, lucky letters and numbers, and good naming-ceremony dates. Download a branded PDF with cover page, every section on a fresh page, and your profile and services at the end. Nothing is saved.</p>
      </div>

      {fromOrder && <p className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm" role="status">From order: {fromOrder}</p>}
      <form onSubmit={analyse} className="glass space-y-5 rounded-lg p-5">
        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-gold">1. Baby&apos;s details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date of birth" htmlFor="bn-dob" required><Input id="bn-dob" type="date" min="1900-01-01" max={today} value={f.dob} onChange={set('dob')} required /></Field>
            <Field label="Gender" htmlFor="bn-g" hint="Filters suggested names; sets Kua"><Select id="bn-g" value={f.gender} onChange={set('gender')}><option value="boy">Boy</option><option value="girl">Girl</option><option value="any">Not decided</option></Select></Field>
            <Field label="Time of birth" htmlFor="bn-tob" hint="Printed in the report"><Input id="bn-tob" value={f.timeOfBirth} onChange={set('timeOfBirth')} placeholder="06:42 AM" autoComplete="off" /></Field>
            <Field label="Place of birth" htmlFor="bn-pob"><Input id="bn-pob" value={f.placeOfBirth} onChange={set('placeOfBirth')} placeholder={f.country === 'India' ? 'Jaipur' : 'London'} autoComplete="off" /></Field>
            <Field label="Country" htmlFor="bn-cty" hint="Families abroad get names from their country">
              <Select id="bn-cty" value={f.country} onChange={set('country')}>
                {!ALL_COUNTRIES.some((c) => c.name === f.country) && <option value={f.country}>{f.country}</option>}
                {ALL_COUNTRIES.map((c, i) => <option key={`${c.code}-${i}`} value={c.name}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Names to suggest" htmlFor="bn-sty" hint={f.nameStyle === 'auto' ? `From country: ${styleLabel(nameStyleForCountry(f.country), 'en')} names` : f.nameStyle === 'mix' ? `${styleLabel(nameStyleForCountry(f.country), 'en')} + Indian names` : undefined}>
              <Select id="bn-sty" value={f.nameStyle} onChange={set('nameStyle')}>
                <option value="auto">As per country (automatic)</option>
                <option value="mix">Country names + Indian names (NRI family)</option>
                {NAME_STYLES.map((x) => <option key={x.id} value={x.id}>{x.en} names</option>)}
              </Select>
            </Field>
            <Field label="Surname (for documents)" htmlFor="bn-sur" hint="Full name = first name + surname"><Input id="bn-sur" value={f.surname} onChange={set('surname')} placeholder="Sharma" autoComplete="off" /></Field>
            <Field label="Father's name" htmlFor="bn-fa"><Input id="bn-fa" value={f.fatherName} onChange={set('fatherName')} autoComplete="off" /></Field>
            <Field label="Mother's name" htmlFor="bn-mo"><Input id="bn-mo" value={f.motherName} onChange={set('motherName')} autoComplete="off" /></Field>
            <Field label="Preferred starting letters" htmlFor="bn-let" hint="e.g. A, Sh, K (rashi letters)"><Input id="bn-let" value={f.letters} onChange={set('letters')} placeholder="A, Sh" autoComplete="off" /></Field>
            <Field label="Name wanted" htmlFor="bn-for" hint="Nickname page is added for Nickname / Both">
              <Select id="bn-for" value={f.nameFor} onChange={set('nameFor')}><option value="both">Formal name &amp; nickname</option><option value="formal">Formal name only</option><option value="nickname">Nickname only</option></Select>
            </Field>
            <Field label="Current formal name (if already named)" htmlFor="bn-cur" hint="Checked and corrected; first name only"><Input id="bn-cur" value={f.currentName} onChange={set('currentName')} placeholder="e.g. Aarav" autoComplete="off" /></Field>
            {f.nameFor !== 'formal' && <Field label="Current nickname (if any)" htmlFor="bn-nick" hint="Checked with the formal name"><Input id="bn-nick" value={f.currentNickname} onChange={set('currentNickname')} placeholder="e.g. Golu" autoComplete="off" /></Field>}
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-gold">2. Names the family is considering <span className="text-sm font-normal text-muted-foreground">(first names, up to 12)</span></h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {names.map((v, i) => (
              <div key={i} className="flex gap-1.5">
                <Input aria-label={`Name ${i + 1}`} placeholder="e.g. Aarav" value={v} autoComplete="off" onChange={(e) => setNames((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} />
                {names.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove name" onClick={() => setNames((xs) => xs.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>}
              </div>
            ))}
          </div>
          {names.length < 12 && <Button type="button" variant="outline" size="sm" onClick={() => setNames((xs) => [...xs, ''])}><Plus className="mr-1 h-4 w-4" />Add name</Button>}
          <Checkbox id="bn-sug" checked={suggest} onChange={setSuggest} label="Also suggest names from the name bank that suit the date of birth (in the preferred letters first)" />
        </section>
        <section className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-gold">3. Report settings</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Language" htmlFor="bn-l"><Select id="bn-l" value={f.language} onChange={set('language')}><option value="en">English</option><option value="hi">हिंदी</option></Select></Field>
            <Field label="PDF theme" htmlFor="bn-t"><Select id="bn-t" value={f.theme} onChange={set('theme')}>{THEMES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</Select></Field>
            <Field label="Report date" htmlFor="bn-asof" hint="Naming dates start from here"><Input id="bn-asof" type="date" value={f.asOf} onChange={set('asOf')} /></Field>
            <Field label="Prepared by" htmlFor="bn-by"><Input id="bn-by" value={f.preparedBy} onChange={set('preparedBy')} /></Field>
          </div>
          <Field label="Note from the numerologist (printed in the report)" htmlFor="bn-note"><textarea id="bn-note" value={f.expertNote} onChange={set('expertNote')} maxLength={1200} rows={2} className="w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" /></Field>
        </section>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="gold" disabled={!f.dob || (!suggest && !names.some((n) => n.trim()) && !f.currentName.trim())}><Baby className="mr-1 h-4 w-4" />Analyse names</Button>
          {res && <Button type="button" onClick={downloadPdf} disabled={busy}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}Download PDF report</Button>}
        </div>
      </form>

      {res && best && (
        <div id="bn-result" className="space-y-5">
          <div className="glass flex flex-col gap-5 rounded-lg p-5 md:flex-row md:items-center">
            <Ring value={best.score} label="Best name" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2"><Badge tone={VTONE[best.verdict]}>{l.verdict[best.verdict]}</Badge><span className="font-serif text-2xl font-bold">{best.full}</span>{best.bank && <span className="text-muted-foreground">{best.bank.hi} · {best.bank.en}</span>}</div>
              <div className="flex flex-wrap items-center gap-1">
                {best.letters.map((x, i) => <span key={i} className={cn('grid h-11 w-9 place-items-center rounded-md border font-serif text-lg font-bold leading-none', x.vowel ? 'border-gold/70' : 'border-gold/40 bg-gold/10')}><span>{x.letter}<span className="block text-center text-[10px] text-gold">{x.ch}</span></span></span>)}
              </div>
              <p className="text-sm">Moolank <b>{res.core.moolank.value}</b> · Bhagyank <b>{res.core.bhagyank.value}</b> · Kua <b>{res.core.kua.value}</b> · Missing <b>{res.grid.missing.join(', ') || '–'}</b> · Lucky name numbers <b className="text-gold">{res.lucky.singles.join(', ')}</b> · Best totals {res.lucky.compounds.join(', ')}</p>
              <p className="text-sm text-muted-foreground">Lucky first letters: <b className="text-foreground">{res.letterGroups.lucky.join(' ')}</b> · Avoid: {res.letterGroups.avoid.join(' ') || '–'}{res.prefCheck.length ? ` · Your letters: ${res.prefCheck.map((p) => `${p.prefix} (${l.cls[p.cls]})`).join(', ')}` : ''}</p>
            </div>
          </div>

          <div className="glass rounded-lg p-5">
            <h3 className="mb-3 font-serif text-lg font-semibold text-gold">Names ranked</h3>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">#</th><th className="pr-3">Name</th><th className="pr-3">Meaning</th><th className="pr-3">First</th><th className="pr-3">Full</th><th className="pr-3">Letter</th><th className="pr-3">Score</th><th className="pr-3">Verdict</th><th>Spelling tweaks</th></tr></thead>
              <tbody>{res.ranked.map((x, i) => (
                <tr key={x.first} className={cn('border-b border-border/50', i === 0 && 'bg-gold/10')}>
                  <td className="py-2 pr-3">{i + 1}</td>
                  <td className="pr-3 font-semibold">{x.first} {x.bank && (res.nameStyle.style === 'indian' || res.nameStyle.mix) && <span className="font-normal text-muted-foreground">{x.bank.hi}</span>} {x.source === 'family' && <Badge>family</Badge>} {i === 0 && <Badge tone="gold"><Check className="mr-0.5 h-3 w-3" />best</Badge>}</td>
                  <td className="pr-3 text-muted-foreground">{x.bank?.en ?? '–'}</td>
                  <td className="pr-3">{x.firstNum.compound}/{x.firstNum.single}</td>
                  <td className="pr-3">{x.fullNum ? `${x.fullNum.compound}/${x.fullNum.single}` : '–'}</td>
                  <td className="pr-3">{x.initial.letter} <span className="text-xs text-muted-foreground">({l.cls[x.initial.cls]})</span></td>
                  <td className="pr-3 font-serif text-base font-bold">{x.score}</td>
                  <td className="pr-3"><Badge tone={VTONE[x.verdict]}>{l.verdict[x.verdict]}</Badge></td>
                  <td className="text-xs">{x.tweaks.map((t) => `${t.first} (${t.score})`).join(', ') || '–'}</td>
                </tr>))}</tbody>
            </table></div>
            {res.invalid.length > 0 && <p className="mt-2 text-xs text-danger">Not checked (write in English letters): {res.invalid.join(', ')}</p>}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="glass rounded-lg p-5">
              <h3 className="mb-3 font-serif text-lg font-semibold text-gold">Checklist – {best.full}</h3>
              <ul className="space-y-2">{best.checks.map((c) => { const t = checkText(c, l, 'en'); return (
                <li key={c.id} className="flex items-start gap-2 text-sm"><Badge tone={STONE[c.status]} className="mt-0.5 w-14 justify-center">{l[c.status]}</Badge><span><b>{t.title}</b> – <span className="text-muted-foreground">{t.detail}</span></span></li>); })}</ul>
            </div>
            <div className="glass space-y-3 rounded-lg p-5">
              <h3 className="font-serif text-lg font-semibold text-gold">Naming ceremony dates</h3>
              <div className="flex flex-wrap gap-1.5">{res.ceremony.length ? res.ceremony.map((d) => <span key={d.iso} className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-sm">{d.iso.split('-').reverse().join('-')} · {d.weekday.slice(0, 3)}</span>) : <span className="text-sm text-muted-foreground">No suitable date in the next 60 days.</span>}</div>
              {res.parents.father || res.parents.mother ? <p className="text-sm">Parents: {[res.parents.father && `${res.parents.father.name} ${res.parents.father.compound}/${res.parents.father.single}`, res.parents.mother && `${res.parents.mother.name} ${res.parents.mother.compound}/${res.parents.mother.single}`].filter(Boolean).join(' · ')}</p> : <p className="text-sm text-muted-foreground">Add the parents&apos; names to include the family harmony page.</p>}
            </div>
          </div>
          {(res.correction || res.nickname) && (
            <div className="grid gap-5 lg:grid-cols-2">
              {res.current && res.correction && (
                <div className="glass space-y-2 rounded-lg p-5">
                  <h3 className="font-serif text-lg font-semibold text-gold">Current name – {res.current.full}</h3>
                  <p className="text-sm">Score <b>{res.current.score}</b> · <Badge tone={res.correction.advice === 'keep' ? 'good' : res.correction.advice === 'spelling' ? 'gold' : 'bad'}>{res.correction.advice === 'keep' ? 'Keep' : res.correction.advice === 'spelling' ? 'Correct spelling' : 'New name better'}</Badge>{res.correction.advice !== 'keep' && <> → <b>{res.correction.recommended.full}</b> ({res.correction.recommended.score})</>}</p>
                  {res.correction.sameLetter.length > 0 && <p className="text-sm text-muted-foreground">Same starting sound: {res.correction.sameLetter.map((x) => `${x.first} (${x.score})`).join(', ')}</p>}
                </div>
              )}
              {res.nickname && (
                <div className="glass space-y-2 rounded-lg p-5">
                  <h3 className="font-serif text-lg font-semibold text-gold">Nickname</h3>
                  {res.nickname.current && <p className="text-sm">Current <b>{res.nickname.current.name}</b> {res.nickname.current.num.compound}/{res.nickname.current.num.single} · score <b>{res.nickname.current.score}</b> · with formal: {l.rel[res.nickname.current.relFormal]} · <Badge tone={res.nickname.advice === 'keep' ? 'good' : res.nickname.advice === 'spelling' ? 'gold' : 'bad'}>{res.nickname.advice === 'keep' ? 'Keep' : res.nickname.advice === 'spelling' ? 'Correct spelling' : 'New nickname better'}</Badge></p>}
                  <p className="text-sm">Recommended: <b className="text-gold">{res.nickname.recommended?.name ?? '–'}</b> · Suggestions: {res.nickname.suggestions.map((x) => `${x.name} (${x.score})`).join(', ') || '–'}</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">PDF: cover (recommended name as letter tiles) · summary with top-3 · birth numbers & Lo Shu · lucky name blueprint · all names compared · recommended name in depth{res.top.length > 1 ? ' · second and third choices' : ''}{res.parents.father || res.parents.mother ? ' · family harmony' : ''}{res.suggestions.length ? ' · more suitable names' : ''} {res.current || res.nickname?.current ? ' · current name check & correction' : ''}{res.nickname ? ' · formal name & nickname' : ''} · remedies for child development · naming ceremony & guidance · about the numerologist, services, WhatsApp/website QR codes. Each section starts on a new page.</p>
        </div>
      )}
    </div>
  );
}
