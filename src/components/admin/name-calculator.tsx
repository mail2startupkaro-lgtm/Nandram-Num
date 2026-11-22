'use client';
/** Admin: Name Numerology Calculator. Runs in the browser on the shared engine; nothing is saved. */
import * as React from 'react';
import { CaseSensitive, Check, Copy, Plus, Printer, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { todayIST } from '@/lib/numerology';
import { calculateName, catText, nameCalcSummary, relText, VERDICT, type NameCalcResult, type NameCard } from '@/lib/name-calculator';
import type { Relation } from '@/lib/numerology/data/relations';
import type { CompoundCategory } from '@/lib/numerology/data/tables';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'hi';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const title = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
const iso = (p: { year: number; month: number; day: number }) => `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
const relTone = (r: Relation) => (r === 'friend' ? 'good' : r === 'enemy' ? 'bad' : 'default') as 'good' | 'bad' | 'default';
const catTone = (c: CompoundCategory) => (c === 'favourable' ? 'good' : c === 'unfavourable' ? 'bad' : 'default') as 'good' | 'bad' | 'default';
const scoreTone = (s: number) => (s >= 65 ? 'good' : s >= 50 ? 'default' : 'bad') as 'good' | 'bad' | 'default';

const T = {
  en: { nn: 'Name number', ch: 'Chaldean', py: 'Pythagorean', soul: 'Soul urge', soulH: 'vowels – inner desire', pers: 'Personality', persH: 'consonants – how others see you', planet: 'Planet', m: 'Moolank', b: 'Bhagyank', comp: 'Compatibility', withB: 'with Bhagyank', withM: 'with Moolank', letters: 'Letter-by-letter calculation', word: 'Word', total: 'Total', lucky: 'Lucky name numbers', luckyH: 'Totals that suit this date of birth', best: 'Best compound totals', corr: 'Suggested spellings', corrH: 'Same pronunciation, better number (Chaldean)', change: 'Change', cmp: 'Spelling comparison', spelling: 'Spelling', meaning: 'Meaning', current: 'current', bestTag: 'best', none: 'This spelling is already among the best for this date of birth – no change needed.', doc: 'Full name (documents)', daily: 'Name in daily use', full: 'Full name', title: 'Name Numerology', dob: 'DOB', by: 'Prepared by', note: 'Chaldean values are used for the name number and compatibility (Indian practice); Pythagorean is shown for comparison. Master numbers 11, 22, 33 are kept in the compound.' },
  hi: { nn: 'नामांक', ch: 'कैल्डियन', py: 'पाइथागोरियन', soul: 'सोल अर्ज', soulH: 'स्वर – भीतरी इच्छा', pers: 'पर्सनैलिटी', persH: 'व्यंजन – लोग आपको कैसे देखते हैं', planet: 'ग्रह', m: 'मूलांक', b: 'भाग्यांक', comp: 'अनुकूलता', withB: 'भाग्यांक से', withM: 'मूलांक से', letters: 'अक्षर-दर-अक्षर गणना', word: 'शब्द', total: 'कुल', lucky: 'शुभ नामांक', luckyH: 'इस जन्म तिथि के अनुकूल कुल', best: 'सबसे शुभ कुल', corr: 'सुझाई गई स्पेलिंग', corrH: 'उच्चारण वही, अंक बेहतर (कैल्डियन)', change: 'बदलाव', cmp: 'स्पेलिंग तुलना', spelling: 'स्पेलिंग', meaning: 'अर्थ', current: 'अभी', bestTag: 'सर्वश्रेष्ठ', none: 'यह स्पेलिंग इस जन्म तिथि के लिए पहले से सबसे अच्छी है – बदलाव की ज़रूरत नहीं।', doc: 'पूरा नाम (दस्तावेज़)', daily: 'रोज़ का नाम', full: 'पूरा नाम', title: 'नाम अंक ज्योतिष', dob: 'जन्म तिथि', by: 'द्वारा तैयार:', note: 'नामांक और अनुकूलता के लिए कैल्डियन मान लिए गए हैं (भारतीय पद्धति); तुलना के लिए पाइथागोरियन दिखाया गया है। मास्टर अंक 11, 22, 33 कंपाउंड में रखे गए हैं।' },
};
const cardLabel = (c: NameCard, t: (typeof T)['en']) => (c.label === 'Name in daily use' ? t.daily : c.label === 'Full name (documents)' ? t.doc : t.full);

export function NameCalculatorTab() {
  const today = iso(todayIST());
  const [f, setF] = React.useState({ fullName: '', commonName: '', dob: '', preparedBy: 'Acharya Nandram · myNumerologist.com' });
  const [variants, setVariants] = React.useState<string[]>(['']);
  const [res, setRes] = React.useState<NameCalcResult | null>(null);
  const [err, setErr] = React.useState('');
  const [lang, setLang] = React.useState<Lang>('en');
  const [copied, setCopied] = React.useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const t = T[lang];

  function run(e?: React.FormEvent, extra?: string[]) {
    e?.preventDefault(); setErr('');
    try {
      const r = calculateName({ fullName: f.fullName, commonName: f.commonName, dob: f.dob || undefined, variants: extra ?? variants });
      setRes(r);
      if (e) setTimeout(() => document.getElementById('nc-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) { setRes(null); setErr(x instanceof Error ? x.message : 'Please check the details.'); }
  }

  /** Put a suggested spelling into the comparison list. */
  function compareSuggestion(spelling: string) {
    const next = [...variants.filter((v) => v.trim()), spelling];
    setVariants([...next, '']); run(undefined, next);
  }

  async function copy() {
    if (!res) return;
    const text = nameCalcSummary(res, lang, f.preparedBy);
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text }); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><CaseSensitive className="h-6 w-6 text-gold" />Name Numerology Calculator</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chaldean and Pythagorean name number, soul urge and personality with the full letter-by-letter working. Add the date of birth to see compatibility with Moolank and Bhagyank, lucky name numbers and spelling corrections. Compare any number of spellings side by side. Runs in the browser – nothing is saved.</p>
      </div>

      <form onSubmit={run} className="glass space-y-4 rounded-lg p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Full name" htmlFor="nc-name" required hint="English letters, as in documents"><Input id="nc-name" value={f.fullName} onChange={set('fullName')} required autoComplete="off" /></Field>
          <Field label="Name in daily use" htmlFor="nc-cname" hint="Optional – analysed as the main name"><Input id="nc-cname" value={f.commonName} onChange={set('commonName')} autoComplete="off" /></Field>
          <Field label="Date of birth" htmlFor="nc-dob" hint="Optional – for compatibility & corrections"><Input id="nc-dob" type="date" min="1900-01-01" max={today} value={f.dob} onChange={set('dob')} /></Field>
          <Field label="Prepared by (print / copy)" htmlFor="nc-by"><Input id="nc-by" value={f.preparedBy} onChange={set('preparedBy')} /></Field>
        </div>
        <div>
          <p className="text-sm font-medium">Other spellings to compare <span className="font-normal text-muted-foreground">(optional)</span></p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {variants.map((v, i) => (
              <div key={i} className="flex gap-1.5">
                <Input aria-label={`Spelling ${i + 1}`} id={`nc-v-${i}`} placeholder={i === 0 ? 'e.g. Rahull Sharma' : 'Another spelling'} value={v} autoComplete="off"
                  onChange={(e) => setVariants((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} />
                {variants.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove spelling" onClick={() => setVariants((xs) => xs.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>}
              </div>
            ))}
          </div>
          {variants.length < 12 && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setVariants((xs) => [...xs, ''])}><Plus className="mr-1 h-4 w-4" />Add spelling</Button>}
        </div>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <Button type="submit" variant="gold" disabled={!f.fullName.trim()}><CaseSensitive className="mr-1 h-4 w-4" />Calculate</Button>
      </form>

      {res && (
        <div id="nc-result" className="space-y-5">
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <p className="text-sm"><b>{title(res.main.chaldean.name)}</b>{res.compat && <> · {t.dob} {res.compat.dob.split('-').reverse().join('-')} · {t.m} <b className="text-gold">{res.compat.moolank}</b> · {t.b} <b className="text-gold">{res.compat.bhagyankMaster ? `${res.compat.bhagyankMaster}/${res.compat.bhagyank}` : res.compat.bhagyank}</b></>}</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-md border border-border text-sm" role="group" aria-label="Language">
                {(['en', 'hi'] as const).map((l) => <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn('px-3 py-1.5', lang === l ? 'bg-gold/25 font-semibold' : 'hover:bg-muted')}>{l === 'en' ? 'English' : 'हिंदी'}</button>)}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}{copied ? 'Copied' : 'Copy for WhatsApp / email'}</Button>
              <Button type="button" size="sm" onClick={() => printResult(res, lang, f.preparedBy)}><Printer className="mr-1 h-4 w-4" />Print / Save PDF</Button>
            </div>
          </div>

          <NameCardView c={res.main} lang={lang} />
          {res.official && <NameCardView c={res.official} lang={lang} compact />}

          {res.lucky ? (
            <div className="glass rounded-lg p-5">
              <h3 className="text-lg font-semibold">{t.lucky}</h3>
              <p className="text-xs text-muted-foreground">{t.luckyH}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">{res.lucky.singles.map((n) => <span key={n} className={cn('grid h-10 w-10 place-items-center rounded-full border-2 text-lg font-bold', n === res.main.chaldean.nameNumber.single ? 'border-gold bg-gold/20 text-gold' : 'border-gold/40')}>{n}</span>)}</div>
              <p className="mt-3 text-sm"><span className="text-muted-foreground">{t.best}:</span> {res.lucky.compounds.join(', ') || '–'}</p>
            </div>
          ) : (
            <p className="glass rounded-lg p-4 text-sm text-muted-foreground">Add the date of birth to see compatibility with Moolank and Bhagyank, lucky name numbers and spelling corrections.</p>
          )}

          {res.compat && (
            <div className="glass rounded-lg p-5">
              <h3 className="text-lg font-semibold">{t.corr}</h3>
              <p className="text-xs text-muted-foreground">{t.corrH}</p>
              {res.corrections.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">{t.spelling}</th><th className="pr-3">{t.nn}</th><th className="pr-3">{t.comp}</th><th className="pr-3">{t.change}</th><th /></tr></thead>
                    <tbody>{res.corrections.map((c) => (
                      <tr key={c.fullName} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-semibold">{c.fullName}</td>
                        <td className="pr-3">{c.compound}/{c.single} <Badge tone={catTone(c.category)}>{catText(c.category, lang)}</Badge></td>
                        <td className="pr-3"><Badge tone={scoreTone(c.score)}>{c.score}%</Badge></td>
                        <td className="pr-3 text-xs text-muted-foreground">{c.changes.join(', ')}</td>
                        <td className="py-1 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => compareSuggestion(c.fullName)}>Compare</Button></td>
                      </tr>))}</tbody>
                  </table>
                </div>
              ) : <p className="mt-3 text-sm">{t.none}</p>}
            </div>
          )}

          {res.variants.length > 1 && (
            <div className="glass rounded-lg p-5">
              <h3 className="text-lg font-semibold">{t.cmp}</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">{t.spelling}</th><th className="pr-3">{t.nn}</th><th className="pr-3">{t.meaning}</th>{res.compat && <><th className="pr-3">{t.withB}</th><th className="pr-3">{t.withM}</th><th>{t.comp}</th></>}</tr></thead>
                  <tbody>{res.variants.map((v) => (
                    <tr key={v.spelling} className={cn('border-b border-border/50', v.best && 'bg-gold/10')}>
                      <td className="py-2 pr-3 font-semibold">{v.best && <Star className="mr-1 inline h-3.5 w-3.5 fill-gold text-gold" />}{v.spelling}{v.current && <span className="ml-1 text-xs font-normal text-muted-foreground">({t.current})</span>}</td>
                      <td className="pr-3">{v.compound}/{v.single} <Badge tone={catTone(v.category)}>{catText(v.category, lang)}</Badge></td>
                      <td className="pr-3 text-xs">{lang === 'hi' ? v.meaning.hi : v.meaning.en}</td>
                      {res.compat && <><td className="pr-3"><Badge tone={relTone(v.relB!)}>{relText(v.relB!, lang)}</Badge></td><td className="pr-3"><Badge tone={relTone(v.relM!)}>{relText(v.relM!, lang)}</Badge></td><td><Badge tone={scoreTone(v.score!)}>{v.score}%</Badge></td></>}
                    </tr>))}</tbody>
                </table>
              </div>
              {res.skipped.length > 0 && <p className="mt-2 text-xs text-danger">Skipped (no English letters): {res.skipped.join(', ')}</p>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t.note}</p>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, hint, children, wide }: { label: string; value: React.ReactNode; hint?: string; children?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('rounded-lg border border-gold/25 bg-card/40 p-3', wide && 'col-span-2 lg:col-span-1')}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-gold">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const fmt = (x: { compound: number; single: number }) => (x.compound === x.single ? `${x.single}` : `${x.compound}/${x.single}`);

function NameCardView({ c, lang, compact }: { c: NameCard; lang: Lang; compact?: boolean }) {
  const t = T[lang]; const ch = c.chaldean; const py = c.pythagorean;
  return (
    <div className="glass space-y-4 rounded-lg p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{cardLabel(c, t)}: <span className="text-gold">{title(ch.name)}</span></h3>
        {c.score != null && c.verdict && <Badge tone={VERDICT[c.verdict].tone}>{t.comp} {c.score}% · {lang === 'hi' ? VERDICT[c.verdict].hi : VERDICT[c.verdict].en}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile wide label={`${t.nn} · ${t.ch}`} value={fmt(ch.nameNumber)}>
          <div className="mt-1 flex flex-wrap gap-1"><Badge tone={catTone(ch.nameNumber.category)}>{catText(ch.nameNumber.category, lang)}</Badge>{ch.nameNumber.master && <Badge tone="gold">Master {ch.nameNumber.master}</Badge>}</div>
          <p className="mt-1 text-xs">{lang === 'hi' ? c.meaning.hi : c.meaning.en}</p>
        </Tile>
        <Tile label={`${t.nn} · ${t.py}`} value={fmt(py.nameNumber)}>{py.nameNumber.master && <Badge tone="gold" className="mt-1">Master {py.nameNumber.master}</Badge>}</Tile>
        <Tile label={t.soul} value={fmt(ch.soulUrge)} hint={`${t.soulH} · ${t.py} ${fmt(py.soulUrge)}`} />
        <Tile label={t.pers} value={fmt(ch.personality)} hint={`${t.persH} · ${t.py} ${fmt(py.personality)}`} />
        <Tile label={t.planet} value={lang === 'hi' ? c.planet.hi : c.planet.en}>
          {c.relB && c.relM && <div className="mt-1 space-y-1 text-xs"><p>{t.withB} <Badge tone={relTone(c.relB)}>{relText(c.relB, lang)}</Badge></p><p>{t.withM} <Badge tone={relTone(c.relM)}>{relText(c.relM, lang)}</Badge></p></div>}
        </Tile>
      </div>
      {!compact && (
        <div>
          <p className="text-sm font-semibold">{t.letters}</p>
          <div className="mt-2 space-y-3">
            {ch.words.map((w, wi) => {
              const letters = w.word.split('');
              const pw = py.words[wi];
              return (
                <div key={wi} className="overflow-x-auto rounded-lg border border-border/60 p-3">
                  <div className="flex min-w-max items-end gap-1">
                    {letters.map((l, i) => {
                      const vowel = 'AEIOU'.includes(l);
                      const chv = ch.letters[offset(ch.words, wi) + i].value;
                      const pyv = py.letters[offset(py.words, wi) + i].value;
                      return (
                        <div key={i} className={cn('w-9 rounded-md border text-center', vowel ? 'border-gold/60 bg-gold/10' : 'border-border')} title={vowel ? 'Vowel' : 'Consonant'}>
                          <p className="pt-1 text-base font-bold">{l}</p>
                          <p className="text-sm font-semibold text-gold">{chv}</p>
                          <p className="pb-1 text-[10px] text-muted-foreground">{pyv}</p>
                        </div>
                      );
                    })}
                    <div className="ml-2 pl-2 text-xs leading-5">
                      <p>= <b className="text-gold">{fmt(w)}</b> <span className="text-muted-foreground">{t.ch}</span></p>
                      <p>= <b>{fmt(pw)}</b> <span className="text-muted-foreground">{t.py}</span></p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t.total}: {ch.words.map((w) => w.compound).join(' + ')} = <b className="text-foreground">{ch.nameNumber.compound}</b> → <b className="text-gold">{ch.nameNumber.single}</b> ({t.ch}) · {py.words.map((w) => w.compound).join(' + ')} = <b className="text-foreground">{py.nameNumber.compound}</b> → <b>{py.nameNumber.single}</b> ({t.py}). <span className="ml-1 inline-block rounded border border-gold/60 bg-gold/10 px-1">A E I O U</span> = vowels.</p>
        </div>
      )}
    </div>
  );
}

/** Index of a word's first letter in the flat letter list. */
function offset(words: { word: string }[], wi: number) { let n = 0; for (let i = 0; i < wi; i++) n += words[i].word.length; return n; }

function printResult(r: NameCalcResult, lang: Lang, preparedBy: string) {
  const t = T[lang]; const hi = lang === 'hi';
  const date = new Date().toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const block = (c: NameCard) => {
    const ch = c.chaldean; const py = c.pythagorean;
    const letters = ch.words.map((w, wi) => {
      const off = offset(ch.words, wi);
      const cells = w.word.split('').map((l, i) => `<td class="${'AEIOU'.includes(l) ? 'v' : ''}"><b>${l}</b><br><span class="g">${ch.letters[off + i].value}</span><br><small>${py.letters[off + i].value}</small></td>`).join('');
      return `<table class="lt"><tr>${cells}<td class="tot">= <b class="g">${fmt(w)}</b> ${t.ch}<br>= ${fmt(py.words[wi])} ${t.py}</td></tr></table>`;
    }).join('');
    return `<h2>${esc(cardLabel(c, t))}: ${esc(title(ch.name))}</h2>
<div class="grid"><div class="cell"><small>${t.nn} · ${t.ch}</small><span class="big">${fmt(ch.nameNumber)}</span><br>${esc(catText(ch.nameNumber.category, lang))} – ${esc(hi ? c.meaning.hi : c.meaning.en)}</div>
<div class="cell"><small>${t.nn} · ${t.py}</small><span class="big">${fmt(py.nameNumber)}</span></div>
<div class="cell"><small>${t.planet}</small><span class="big" style="font-size:22px">${esc(hi ? c.planet.hi : c.planet.en)}</span></div>
<div class="cell"><small>${t.soul}</small><span class="big">${fmt(ch.soulUrge)}</span><br><span class="muted">${t.soulH}</span></div>
<div class="cell"><small>${t.pers}</small><span class="big">${fmt(ch.personality)}</span><br><span class="muted">${t.persH}</span></div>
${c.score != null && c.verdict && c.relB && c.relM ? `<div class="cell"><small>${t.comp}</small><span class="big">${c.score}%</span><br>${esc(hi ? VERDICT[c.verdict].hi : VERDICT[c.verdict].en)}<br><span class="muted">${t.withB} ${relText(c.relB, lang)} · ${t.withM} ${relText(c.relM, lang)}</span></div>` : '<div></div>'}</div>
<h3>${t.letters}</h3>${letters}
<p class="muted">${t.total}: ${ch.words.map((w) => w.compound).join(' + ')} = ${ch.nameNumber.compound} → ${ch.nameNumber.single} (${t.ch}) · ${py.words.map((w) => w.compound).join(' + ')} = ${py.nameNumber.compound} → ${py.nameNumber.single} (${t.py})</p>`;
  };
  const corr = r.compat ? (r.corrections.length
    ? `<h2>${t.corr}</h2><p class="muted">${t.corrH}</p><table><tr><th>${t.spelling}</th><th>${t.nn}</th><th>${t.comp}</th></tr>${r.corrections.map((c) => `<tr><td><b>${esc(c.fullName)}</b></td><td>${c.compound}/${c.single} · ${catText(c.category, lang)}</td><td>${c.score}%</td></tr>`).join('')}</table>`
    : `<h2>${t.corr}</h2><p>${t.none}</p>`) : '';
  const cmp = r.variants.length > 1 ? `<h2>${t.cmp}</h2><table><tr><th>${t.spelling}</th><th>${t.nn}</th><th>${t.meaning}</th>${r.compat ? `<th>${t.comp}</th>` : ''}</tr>${r.variants.map((v) => `<tr${v.best ? ' class="best"' : ''}><td><b>${v.best ? '★ ' : ''}${esc(v.spelling)}</b>${v.current ? ` (${t.current})` : ''}</td><td>${v.compound}/${v.single} · ${catText(v.category, lang)}</td><td>${esc(hi ? v.meaning.hi : v.meaning.en)}</td>${r.compat ? `<td>${v.score}%</td>` : ''}</tr>`).join('')}</table>` : '';
  const lucky = r.lucky ? `<h2>${t.lucky}</h2><p><span class="big" style="font-size:24px">${r.lucky.singles.join(' · ')}</span><br><span class="muted">${t.best}: ${r.lucky.compounds.join(', ')}</span></p>` : '';
  const head = `<h1>${t.title}</h1><p><b>${esc(title(r.main.chaldean.name))}</b>${r.compat ? ` · ${t.dob} ${r.compat.dob.split('-').reverse().join('-')} · ${t.m} ${r.compat.moolank} · ${t.b} ${r.compat.bhagyank}` : ''}<br><span class="muted">${t.by} ${esc(preparedBy)} · ${date}</span></p>`;
  const body = head + block(r.main) + (r.official ? block(r.official) : '') + lucky + corr + cmp + `<p class="muted" style="margin-top:20px">${t.note}</p>`;
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(t.title)} – ${esc(title(r.main.chaldean.name))}</title><style>
body{font-family:Georgia,'Noto Sans Devanagari',serif;color:#2a1a10;max-width:820px;margin:28px auto;padding:0 20px;line-height:1.5}
h1{color:#7a1f2b;margin:0 0 4px}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:3px;margin-top:22px;font-size:18px}h3{font-size:14px;margin:14px 0 4px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cell{border:1px solid #e5d3a1;border-radius:10px;padding:8px 10px;font-size:13px}.cell small{color:#7a6a55;display:block;font-size:10.5px;text-transform:uppercase}
.big{font-size:28px;font-weight:bold;color:#b8860b}.g{color:#b8860b;font-weight:bold}.muted{color:#7a6a55;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:6px}td,th{border:1px solid #e5d3a1;padding:5px 7px;text-align:left;vertical-align:top;font-size:13px}th{background:#fbf5e6}
table.lt{width:auto;margin:4px 0}table.lt td{text-align:center;min-width:24px;padding:3px 5px}table.lt td.v{background:#fbf0cf}table.lt td.tot{text-align:left;border:none;padding-left:10px;font-size:12px}
tr.best td{background:#fbf0cf}@media print{body{margin:0 auto}h2{break-after:avoid}table{break-inside:avoid}}</style></head><body>${body}</body></html>`;
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400);
}
