'use client';
/** Admin: Angel Number Finder and Lucky Number Finder (Name + DOB). Runs in the browser; nothing is saved. */
import * as React from 'react';
import { Check, Clover, Copy, Printer, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { todayIST, type Gender, type Relation } from '@/lib/numerology';
import { angelSummary, findAngelNumbers, findLuckyNumbers, hiColour, HI_DAY, HI_REL, luckySummary, type AngelFinderResult, type LuckyFinderResult } from '@/lib/finders';
import { DIGITS } from '@/lib/angel/digits';
import { tr } from '@/lib/i18n/hi-terms';

const HI_ANGEL_LABEL: Record<string, string> = { life: 'जीवन-पथ एंजेल नंबर', mulank: 'मूलांक एंजेल नंबर', birthday: 'जन्मदिन एंजेल नंबर', year: 'व्यक्तिगत वर्ष एंजेल नंबर', name: 'नाम एंजेल नंबर', soul: 'आत्मा (सोल अर्ज) एंजेल नंबर', destiny: 'नाम + भाग्य एंजेल नंबर' };
import { cn } from '@/lib/utils';

const REL: Record<Relation, { label: string; tone: 'good' | 'default' | 'bad' }> = {
  friend: { label: 'Friendly', tone: 'good' }, neutral: { label: 'Neutral', tone: 'default' }, enemy: { label: 'Challenging', tone: 'bad' },
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const iso = (p: { year: number; month: number; day: number }) => `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;

interface Form { fullName: string; commonName: string; dob: string; gender: Gender; asOf: string; preparedBy: string }

function useFinderForm() {
  const today = iso(todayIST());
  const [f, setF] = React.useState<Form>({ fullName: '', commonName: '', dob: '', gender: 'male', asOf: today, preparedBy: 'Acharya Nandram · myNumerologist.com' });
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return { f, set, today };
}

function errorText(e: unknown): string {
  const issues = (e as { issues?: { message: string }[] })?.issues;
  if (issues?.length) return issues[0].message;
  const msg = e instanceof Error ? e.message : String(e);
  if (/Latin letter/.test(msg)) return 'Write the name in English letters (A–Z) – numerology values come from the English spelling.';
  return msg || 'Please check the details.';
}

function ClientFields({ f, set, today, idp }: ReturnType<typeof useFinderForm> & { idp: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Full name" htmlFor={`${idp}-name`} required hint="As in documents (English letters)"><Input id={`${idp}-name`} value={f.fullName} onChange={set('fullName')} required autoComplete="off" /></Field>
      <Field label="Name in daily use" htmlFor={`${idp}-cname`} hint="Signature / everyday name – leave blank if same"><Input id={`${idp}-cname`} value={f.commonName} onChange={set('commonName')} autoComplete="off" /></Field>
      <Field label="Date of birth" htmlFor={`${idp}-dob`} required><Input id={`${idp}-dob`} type="date" min="1900-01-01" max={f.asOf || today} value={f.dob} onChange={set('dob')} required /></Field>
      <Field label="Gender (for Kua)" htmlFor={`${idp}-g`}><Select id={`${idp}-g`} value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option><option value="other">Other (male formula)</option></Select></Field>
      <Field label="Calculate as of" htmlFor={`${idp}-asof`} hint="Sets the current personal year"><Input id={`${idp}-asof`} type="date" value={f.asOf} onChange={set('asOf')} /></Field>
      <Field label="Prepared by (print / copy)" htmlFor={`${idp}-by`}><Input id={`${idp}-by`} value={f.preparedBy} onChange={set('preparedBy')} /></Field>
    </div>
  );
}

function parseIso(s: string) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? { year: +m[1], month: +m[2], day: +m[3] } : null; }

function ShareBar({ text, onPrint, lang, setLang }: { text: string; onPrint: () => void; lang: 'en' | 'hi'; setLang: (l: 'en' | 'hi') => void }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text }); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-md border border-border text-sm" role="group" aria-label="Report language">
        {(['en', 'hi'] as const).map((l) => <button key={l} type="button" onClick={() => setLang(l)} className={cn('px-3 py-1.5', lang === l ? 'bg-gold/25 font-semibold' : 'hover:bg-muted')}>{l === 'en' ? 'English' : 'हिंदी'}</button>)}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}{copied ? 'Copied' : 'Copy for WhatsApp / email'}</Button>
      <Button type="button" size="sm" onClick={onPrint}><Printer className="mr-1 h-4 w-4" />Print / Save PDF</Button>
    </div>
  );
}

function printHtml(title: string, body: string, lang: 'en' | 'hi' = 'en') {
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
body{font-family:Georgia,'Noto Sans Devanagari',serif;color:#2a1a10;max-width:820px;margin:28px auto;padding:0 20px;line-height:1.55}
h1{color:#7a1f2b;margin:0 0 4px}h2{color:#7a1f2b;border-bottom:2px solid #c9a227;padding-bottom:3px;margin-top:24px;font-size:18px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.cell{border:1px solid #e5d3a1;border-radius:10px;padding:10px}.cell small{color:#7a6a55;display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
.big{font-size:30px;font-weight:bold;color:#b8860b}.top{border:2px solid #c9a227;border-radius:12px;padding:14px;margin-top:14px}
table{width:100%;border-collapse:collapse;margin-top:6px}td,th{border:1px solid #e5d3a1;padding:6px 8px;text-align:left;vertical-align:top;font-size:13.5px}th{background:#fbf5e6}
.muted{color:#7a6a55;font-size:12px}@media print{body{margin:0 auto}}</style></head><body>${body}</body></html>`;
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400);
}

// ---------------------------------------------------------------- Angel

export function AngelFinderTab() {
  const form = useFinderForm();
  const { f } = form;
  const [res, setRes] = React.useState<AngelFinderResult | null>(null);
  const [err, setErr] = React.useState('');
  const [lang, setLang] = React.useState<'en' | 'hi'>('en');

  function run(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setRes(null);
    try {
      const asOf = parseIso(f.asOf) ?? todayIST();
      setRes(findAngelNumbers({ fullName: f.fullName, commonName: f.commonName || undefined, dob: f.dob, gender: f.gender, asOf }));
      setTimeout(() => document.getElementById('af-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) { setErr(errorText(x)); }
  }

  function print(r: AngelFinderResult) {
    const hi = lang === 'hi';
    const top = r.list.find((x) => x.key === r.strongest)!;
    const date = new Date().toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const lab = (x: { key: string; label: string }) => (hi ? HI_ANGEL_LABEL[x.key] ?? x.label : x.label);
    const meaning = (x: (typeof r.list)[number]) => (hi ? `${DIGITS[Number(x.n[0])].hiWord} – ${DIGITS[Number(x.n[0])].hiCore}` : `${esc(x.theme)}<br><span class="muted">${esc(x.why)}</span>`);
    const align = (x: (typeof r.list)[number]) => (hi ? `${x.score}%<br><span class="muted">भाग्यांक से ${HI_REL[x.relB]}, मूलांक से ${HI_REL[x.relM]}</span>` : `${x.score}%<br><span class="muted">${esc(x.verdict)}</span>`);
    const rows = (g: 'dob' | 'name') => r.list.filter((x) => x.group === g).map((x) => `<tr><td><b>${esc(lab(x))}</b></td><td class="big" style="font-size:22px">${x.n}</td><td>${meaning(x)}</td><td>${align(x)}</td></tr>`).join('');
    const H = hi
      ? { title: 'एंजेल नंबर रिपोर्ट', dob: 'जन्म तिथि', by: 'द्वारा तैयार:', m: 'मूलांक', b: 'भाग्यांक', nn: 'नामांक', strongest: 'सबसे शुभ एंजेल नंबर', aligned: 'अनुकूलता', fromDob: 'जन्म तिथि से', fromName: 'नाम से', th: ['एंजेल नंबर', '', 'अर्थ', 'अनुकूलता'], py: 'वर्तमान व्यक्तिगत वर्ष', note: 'अनुकूलता हर एंजेल नंबर की मूलांक और भाग्यांक से मित्र-अंक तालिका के अनुसार तुलना है। जब ये अंक घड़ी, टिकट, बिल या गाड़ी नंबर पर बार-बार दिखें, तो रुककर अपने विचार पर ध्यान दें – यही संदेश है। केवल मार्गदर्शन हेतु।' }
      : { title: 'Angel Number Report', dob: 'DOB', by: 'Prepared by', m: 'Mulank', b: 'Bhagyank', nn: 'Name number', strongest: 'STRONGEST ANGEL NUMBER', aligned: 'aligned', fromDob: 'From the date of birth', fromName: 'From the name', th: ['Angel number', '', 'Meaning', 'Alignment'], py: 'Current Personal Year', note: 'Alignment compares each angel number with the Mulank and Bhagyank using the friendly-number table. When these numbers keep appearing on clocks, tickets or bills, pause and notice what you were thinking – that is the message. Guidance only.' };
    const head = `<tr>${H.th.map((x) => `<th>${x}</th>`).join('')}</tr>`;
    printHtml(`${H.title} – ${r.name}`, `<h1>${H.title}</h1><p><b>${esc(r.name)}</b> · ${H.dob} ${r.dob.split('-').reverse().join('-')}<br><span class="muted">${H.by} ${esc(f.preparedBy)} · ${date}</span></p>
<div class="grid"><div class="cell"><small>${H.m}</small><span class="big">${r.moolank}</span></div><div class="cell"><small>${H.b}</small><span class="big">${r.bhagyankMaster ? `${r.bhagyankMaster}/${r.bhagyank}` : r.bhagyank}</span></div><div class="cell"><small>${H.nn}</small><span class="big">${r.nameNumber.compound}/${r.nameNumber.single}</span></div></div>
<div class="top"><small class="muted">${H.strongest}</small><div class="big" style="font-size:44px">${top.n}</div><b>${esc(lab(top))}${hi ? ` – ${DIGITS[Number(top.n[0])].hiWord}` : ` – ${esc(top.theme)}`}</b> (${top.score}% ${H.aligned})<p>${hi ? DIGITS[Number(top.n[0])].hiCore : esc(top.summary)}</p></div>
<h2>${H.fromDob}</h2><table>${head}${rows('dob')}</table>
<h2>${H.fromName}</h2><table>${head}${rows('name')}</table>
<p>${H.py} <b>${r.personalYear.value}</b> (${esc(tr(lang, r.personalYear.period))}).</p>
<p class="muted">${H.note}</p>`, lang);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Sparkles className="h-6 w-6 text-gold" />Angel Number Finder</h2>
        <p className="mt-1 text-sm text-muted-foreground">From name and date of birth: four angel numbers from the DOB (Life Path, Mulank, Birthday, Personal Year) and three from the name (Name, Soul Urge, Name + Destiny), each checked against the client&apos;s Mulank and Bhagyank. Nothing is saved.</p>
      </div>
      <form onSubmit={run} className="glass space-y-4 rounded-lg p-5">
        <ClientFields {...form} idp="af" />
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <Button type="submit" variant="gold" disabled={!f.fullName.trim() || !f.dob}><Sparkles className="mr-1 h-4 w-4" />Find angel numbers</Button>
      </form>

      {res && (() => { const top = res.list.find((x) => x.key === res.strongest)!; return (
        <div id="af-result" className="space-y-5">
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <p className="text-sm"><b>{res.name}</b> · DOB {res.dob} · Mulank <b className="text-gold">{res.moolank}</b> · Bhagyank <b className="text-gold">{res.bhagyankMaster ? `${res.bhagyankMaster}/${res.bhagyank}` : res.bhagyank}</b> · Name <b className="text-gold">{res.nameNumber.compound}/{res.nameNumber.single}</b> · PY <b className="text-gold">{res.personalYear.value}</b> <span className="text-muted-foreground">({res.personalYear.period})</span></p>
            <ShareBar text={angelSummary(res, lang, f.preparedBy)} onPrint={() => print(res)} lang={lang} setLang={setLang} />
          </div>
          <div className="glass rounded-lg border border-gold/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold"><Star className="mr-1 inline h-3 w-3" />Strongest angel number</p>
            <p className="gold-text font-cinzel text-5xl font-bold">{top.n}</p>
            <p className="font-medium">{top.label} – {top.theme} · {top.score}% aligned</p>
            <p className="mt-1 text-sm text-muted-foreground">{top.summary}</p>
          </div>
          {(['dob', 'name'] as const).map((g) => (
            <section key={g} className="space-y-2">
              <h3 className="font-serif text-lg font-semibold text-gold">{g === 'dob' ? 'From the date of birth' : 'From the name'}</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {res.list.filter((x) => x.group === g).map((x) => (
                  <div key={x.key} className={cn('rounded-xl border bg-background/40 p-4', x.key === res.strongest ? 'border-gold' : 'border-gold/30')}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">{x.label}</p>
                    <p className="gold-text font-cinzel text-4xl font-bold">{x.n}</p>
                    <p className="text-sm font-medium">{x.theme}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.why}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                      <Badge tone={x.score >= 62 ? 'good' : x.score >= 42 ? 'default' : 'bad'}>{x.score}% · {x.verdict}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Bhagyank: {REL[x.relB].label} · Mulank: {REL[x.relM].label}</p>
                    <a href={`/angel-numbers/${x.n}`} target="_blank" rel="noopener" className="mt-2 inline-block text-xs text-gold hover:underline">Full meaning →</a>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ); })()}
    </div>
  );
}

// ---------------------------------------------------------------- Lucky

export function LuckyFinderTab() {
  const form = useFinderForm();
  const { f } = form;
  const [res, setRes] = React.useState<LuckyFinderResult | null>(null);
  const [err, setErr] = React.useState('');
  const [lang, setLang] = React.useState<'en' | 'hi'>('en');

  function run(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setRes(null);
    try {
      const asOf = parseIso(f.asOf) ?? todayIST();
      setRes(findLuckyNumbers({ fullName: f.fullName, commonName: f.commonName || undefined, dob: f.dob, gender: f.gender, asOf }));
      setTimeout(() => document.getElementById('lf-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (x) { setErr(errorText(x)); }
  }

  function print(r: LuckyFinderResult) {
    const hi = lang === 'hi';
    const n = r.nameNumber;
    const date = new Date().toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const row = (k: string, v: string) => `<tr><th style="width:34%">${esc(k)}</th><td>${esc(v)}</td></tr>`;
    const rel = (x: string) => (hi ? HI_REL[x as keyof typeof HI_REL] ?? x : x);
    const H = hi
      ? { title: 'शुभ अंक रिपोर्ट', dob: 'जन्म तिथि', by: 'द्वारा तैयार:', primary: 'मुख्य शुभ अंक (मूलांक)', destiny: 'भाग्य अंक (भाग्यांक)', nameNo: 'नामांक', profile: 'शुभ प्रोफ़ाइल', lucky: 'शुभ अंक', neutral: 'सम अंक', avoid: 'बचने योग्य अंक', dates: 'शुभ तारीखें', days: 'शुभ दिन', colours: 'शुभ रंग', avoidColours: 'बचने योग्य रंग', dir: 'शुभ दिशा', mobile: 'मोबाइल नंबर का शुभ योग', gem: 'रत्न', py: 'व्यक्तिगत वर्ष', nameCheck: 'नाम की जाँच', years: 'शुभ वर्ष',
          nameLine: `नामांक ${n.compound}/${n.single} (${tr('hi', n.category)}) भाग्यांक से <b>${rel(n.relationWithBhagyank)}</b> और मूलांक से <b>${rel(n.relationWithMoolank)}</b> है – स्कोर ${n.score}/100।${n.needsCorrection && n.suggestion ? ` सुझाई गई वर्तनी: <b>${esc(n.suggestion.spelling)}</b> (${n.suggestion.compound}/${n.suggestion.single}, स्कोर ${n.suggestion.score})।` : ''}`,
          note: 'शुभ अंक वे हैं जो मूलांक और भाग्यांक दोनों के मित्र हैं; 4 और 8 केवल तभी शामिल हैं जब वे व्यक्ति के अपने अंक हों। व्यक्तिगत वर्ष जन्मदिन से जन्मदिन तक चलता है। रत्न पहनने से पहले विशेषज्ञ से परामर्श करें।' }
      : { title: 'Lucky Number Report', dob: 'DOB', by: 'Prepared by', primary: 'Primary lucky number (Mulank)', destiny: 'Destiny number (Bhagyank)', nameNo: 'Name number', profile: 'Lucky profile', lucky: 'Lucky numbers', neutral: 'Neutral numbers', avoid: 'Numbers to avoid', dates: 'Lucky dates', days: 'Lucky days', colours: 'Lucky colours', avoidColours: 'Colours to avoid', dir: 'Best direction', mobile: 'Mobile number totals', gem: 'Gemstone', py: 'Personal year', nameCheck: 'Name check', years: 'Favourable years',
          nameLine: `Name number ${n.compound}/${n.single} (${esc(n.category)}) is <b>${n.relationWithBhagyank}</b> to the Bhagyank and <b>${n.relationWithMoolank}</b> to the Mulank – score ${n.score}/100.${n.needsCorrection && n.suggestion ? ` Suggested spelling: <b>${esc(n.suggestion.spelling)}</b> (${n.suggestion.compound}/${n.suggestion.single}, score ${n.suggestion.score}).` : ''}`,
          note: "Lucky numbers are friendly to both the Mulank and the Bhagyank (house friendship table); 4 and 8 are included only when they are the person's own numbers. Personal years run from birthday to birthday. Consult an expert before wearing a gemstone." };
    const day = (x: string) => (hi ? HI_DAY[x] ?? x : x); const col = (x: string) => (hi ? hiColour(x) : x);
    const YR: Record<string, [string, string]> = { marriage: ['Marriage', 'विवाह'], jobChange: ['Job change', 'नौकरी बदलना'], businessStart: ['Start a business', 'व्यवसाय शुरू करना'], propertyPurchase: ['Buy property', 'संपत्ति ख़रीदना'] };
    printHtml(`${H.title} – ${r.name}`, `<h1>${H.title}</h1><p><b>${esc(r.name)}</b> · ${H.dob} ${r.dob.split('-').reverse().join('-')}<br><span class="muted">${H.by} ${esc(f.preparedBy)} · ${date}</span></p>
<div class="grid"><div class="cell"><small>${H.primary}</small><span class="big">${r.primary.number}</span><br>${esc(hi ? tr('hi', r.primary.planet) : r.primary.planet)}</div><div class="cell"><small>${H.destiny}</small><span class="big">${r.destiny.master ? `${r.destiny.master}/${r.destiny.number}` : r.destiny.number}</span><br>${esc(hi ? tr('hi', r.destiny.planet) : r.destiny.planet)}</div><div class="cell"><small>${H.nameNo}</small><span class="big">${n.compound}/${n.single}</span><br>${n.score}/100</div></div>
<h2>${H.profile}</h2><table>${row(H.lucky, r.luckyNumbers.join(', '))}${row(H.neutral, r.neutralNumbers.join(', ') || '–')}${row(H.avoid, r.avoidNumbers.join(', ') || '–')}${row(H.dates, r.luckyDates.join(', '))}${row(H.days, r.luckyDays.map(day).join(', '))}${row(H.colours, r.luckyColours.map(col).join(', '))}${r.avoidColours.length ? row(H.avoidColours, r.avoidColours.map(col).join(', ')) : ''}${row(`${H.dir} (${hi ? 'कुआ' : 'Kua'} ${r.kua})`, tr(lang, r.directions.success))}${row(H.mobile, r.mobile.idealTotals.join(', '))}${row(H.gem, hi ? `${r.gemstone.hindi} (${r.gemstone.name})` : `${r.gemstone.name} (${r.gemstone.hindi}) – ${r.gemstone.caution}`)}${row(H.py, `${r.personalYear.value} (${tr(lang, r.personalYear.period)})`)}</table>
<h2>${H.nameCheck}</h2><p>${H.nameLine}</p>
<h2>${H.years}</h2><table>${Object.entries(r.favourableYears).map(([k, ys]) => row((YR[k] ?? [k, k])[hi ? 1 : 0], ys.map((y) => `${y.year} (${hi ? 'व्यक्तिगत वर्ष' : 'PY'} ${y.personalYear})`).join(', ') || '–')).join('')}</table>
<p class="muted">${H.note}</p>`, lang);
  }

  const Chips = ({ xs, tone }: { xs: (number | string)[]; tone: 'good' | 'default' | 'bad' | 'gold' }) => (
    <div className="flex flex-wrap gap-1.5">{xs.length ? xs.map((x) => <Badge key={String(x)} tone={tone}>{x}</Badge>) : <span className="text-sm text-muted-foreground">–</span>}</div>
  );

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Clover className="h-6 w-6 text-gold" />Lucky Number Finder</h2>
        <p className="mt-1 text-sm text-muted-foreground">From name and date of birth: Mulank, Bhagyank and name-number fit, lucky / neutral / avoid numbers, lucky dates, days, colours, direction, mobile totals and favourable years – the same rules the reports use. Nothing is saved.</p>
      </div>
      <form onSubmit={run} className="glass space-y-4 rounded-lg p-5">
        <ClientFields {...form} idp="lf" />
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <Button type="submit" variant="gold" disabled={!f.fullName.trim() || !f.dob}><Clover className="mr-1 h-4 w-4" />Find lucky numbers</Button>
      </form>

      {res && (
        <div id="lf-result" className="space-y-5">
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <p className="text-sm"><b>{res.name}</b> · DOB {res.dob} · PY <b className="text-gold">{res.personalYear.value}</b> <span className="text-muted-foreground">({res.personalYear.period})</span></p>
            <ShareBar text={luckySummary(res, lang, f.preparedBy)} onPrint={() => print(res)} lang={lang} setLang={setLang} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { k: 'Primary lucky number (Mulank)', v: String(res.primary.number), s: `${res.primary.planet} (${res.primary.planetHindi})` },
              { k: 'Destiny number (Bhagyank)', v: res.destiny.master ? `${res.destiny.master}/${res.destiny.number}` : String(res.destiny.number), s: `${res.destiny.planet} (${res.destiny.planetHindi})` },
              { k: 'Name number', v: `${res.nameNumber.compound}/${res.nameNumber.single}`, s: `Score ${res.nameNumber.score}/100 · ${res.nameNumber.category}` },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{x.k}</p>
                <p className="gold-text font-cinzel text-5xl font-bold">{x.v}</p>
                <p className="text-sm">{x.s}</p>
              </div>
            ))}
          </div>
          <div className={cn('glass rounded-lg p-4 text-sm', res.nameNumber.needsCorrection ? 'border border-warning/50' : 'border border-success/40')}>
            Name number is <b>{REL[res.nameNumber.relationWithBhagyank].label.toLowerCase()}</b> to the Bhagyank and <b>{REL[res.nameNumber.relationWithMoolank].label.toLowerCase()}</b> to the Mulank.{' '}
            {res.nameNumber.needsCorrection
              ? res.nameNumber.suggestion ? <>Suggested spelling: <b className="text-gold">{res.nameNumber.suggestion.spelling}</b> ({res.nameNumber.suggestion.compound}/{res.nameNumber.suggestion.single}, score {res.nameNumber.suggestion.score}).</> : 'A spelling correction is advised – no simple one-letter option scored higher.'
              : 'No name change needed.'}
          </div>
          <div className="glass grid gap-4 rounded-lg p-5 md:grid-cols-2">
            <div><p className="mb-1 text-sm font-semibold">Lucky numbers</p><Chips xs={res.luckyNumbers} tone="good" /></div>
            <div><p className="mb-1 text-sm font-semibold">Numbers to avoid</p><Chips xs={res.avoidNumbers} tone="bad" /></div>
            <div><p className="mb-1 text-sm font-semibold">Neutral numbers</p><Chips xs={res.neutralNumbers} tone="default" /></div>
            <div><p className="mb-1 text-sm font-semibold">Lucky dates of the month</p><Chips xs={res.luckyDates} tone="gold" /></div>
            <div><p className="mb-1 text-sm font-semibold">Lucky days</p><Chips xs={res.luckyDays} tone="gold" /></div>
            <div><p className="mb-1 text-sm font-semibold">Lucky colours</p><Chips xs={res.luckyColours} tone="good" />{res.avoidColours.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Avoid: {res.avoidColours.join(', ')}</p>}</div>
            <div><p className="mb-1 text-sm font-semibold">Mobile number totals that suit</p><Chips xs={res.mobile.idealTotals} tone="good" /><p className="mt-1 text-xs text-muted-foreground">Compounds: {res.mobile.idealCompounds.join(', ')}</p></div>
            <div><p className="mb-1 text-sm font-semibold">Direction (Kua {res.kua})</p><p className="text-sm">Success <b>{res.directions.success}</b> · Health <b>{res.directions.health}</b> · Relationships <b>{res.directions.relationships}</b></p></div>
            <div><p className="mb-1 text-sm font-semibold">Gemstone</p><p className="text-sm">{res.gemstone.name} ({res.gemstone.hindi}) – {res.gemstone.metal}, {res.gemstone.finger}</p><p className="text-xs text-muted-foreground">{res.gemstone.caution}</p></div>
            <div><p className="mb-1 text-sm font-semibold">Favourable years</p>
              <ul className="space-y-0.5 text-sm">{Object.entries(res.favourableYears).map(([k, ys]) => <li key={k}><span className="text-muted-foreground">{({ marriage: 'Marriage', jobChange: 'Job change', businessStart: 'Business start', propertyPurchase: 'Property' } as Record<string, string>)[k] ?? k}:</span> {ys.map((y) => y.year).join(', ') || '–'}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
