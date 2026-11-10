'use client';
import * as React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { analyseDob, analyseMobile, analyseNameSystem, bhagyank, kuaNumber, moolank, todayIST, toIso } from '@/lib/numerology';
import { KUA_DIRECTIONS } from '@/lib/numerology/data/tables';
import { planetOf } from '@/lib/numerology/data/planets';
import { RELATION_TABLE } from '@/lib/numerology/data/relations';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import { mulankFor } from '@/lib/mulank-data';
import { useApp } from '@/components/layout/providers';
import { tr } from '@/lib/i18n/hi-terms';
import { KUA_MEANING_HI } from '@/lib/i18n/kua-hi';
import type { CalcKind } from '@/lib/seo/calculators';
import { NumberGrid } from '@/components/results/grid';
import { Field, Input, ChipGroup } from '@/components/ui/form';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const parseIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? { year: +m[1], month: +m[2], day: +m[3] } : null; };
const pretty = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

function Big({ label, n, sub }: { label: string; n: number | string; sub?: string }) {
  return <div className="rounded-lg border border-gold/40 bg-gold/5 p-4 text-center"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="num-badge gold-text text-6xl font-bold">{n}</p>{sub && <p className="text-sm">{sub}</p>}</div>;
}
/** A titled detail block inside the results. */
function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={cn('mk-rise rounded-lg border border-gold/20 bg-background/40 p-4', className)}><h3 className="mb-2 font-serif text-base font-semibold text-gold">{title}</h3><div className="space-y-2 text-sm">{children}</div></section>;
}
const Facts = ({ items }: { items: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">{items.map(([k, v]) => <div key={k}><dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
);
const Chips = ({ items, tone }: { items: React.ReactNode[]; tone?: 'good' | 'warn' | 'bad' | 'gold' }) => <div className="flex flex-wrap gap-1.5">{items.map((x, i) => <Badge key={i} tone={tone}>{x}</Badge>)}</div>;
const Bullets = ({ items }: { items: string[] }) => <ul className="space-y-1 text-muted-foreground">{items.map((x) => <li key={x} className="flex gap-2"><span className="text-gold">✦</span>{x}</li>)}</ul>;
function Meter({ label, value, max = 100, text }: { label: string; value: number; max?: number; text?: string }) {
  return <div><div className="flex justify-between text-xs"><span>{label}</span><span className="tabular-nums text-muted-foreground">{text ?? Math.round(value)}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-maroon to-gold transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%` }} /></div></div>;
}
const Grid2 = ({ children }: { children: React.ReactNode }) => <div className="grid gap-4 md:grid-cols-2">{children}</div>;
const REL_TEXT = { friend: 'friendly', neutral: 'neutral', enemy: 'challenging' } as const;
const REL_HI = { friend: 'मित्र', neutral: 'सम', enemy: 'चुनौतीपूर्ण' } as const;
const PLANET_TIPS = (n: number, l: 'en' | 'hi') => { const p = planetOf(n); return l === 'hi' ? `${tr(l, p.name)}: ${tr(l, p.weekday)}, ${p.colours.slice(0, 2).map((c) => tr(l, c)).join('/')}, दान करें – ${p.daan.slice(0, 2).map((x) => tr(l, x)).join(' या ')}` : `${p.name}: ${p.weekday}, ${p.colours.slice(0, 2).join('/')}, donate ${p.daan.slice(0, 2).join(' or ')}`; };

const KUA_MEANING = {
  success: 'Sheng Chi – success, money and recognition', health: 'Tien Yi – health, healing and support', relationships: 'Nien Yen – love, family and harmony', personalGrowth: 'Fu Wei – calm, stability and self-growth',
  mishaps: 'Huo Hai – mishaps and obstacles', fiveGhosts: 'Wu Kwei – conflict and loss of energy', sixKillings: 'Liu Sha – quarrels and delays', totalLoss: 'Chueh Ming – the weakest direction overall',
} as const;
const KUA_ELEMENT: Record<number, string> = { 1: 'Water', 2: 'Earth', 3: 'Wood', 4: 'Wood', 6: 'Metal', 7: 'Metal', 8: 'Earth', 9: 'Fire' };
const COMPASS: [string, string][][] = [[['NW', 'North-West'], ['N', 'North'], ['NE', 'North-East']], [['W', 'West'], ['', ''], ['E', 'East']], [['SW', 'South-West'], ['S', 'South'], ['SE', 'South-East']]];
const ABBR_HI: Record<string, string> = { NW: 'उ.प.', N: 'उ.', NE: 'उ.पू.', W: 'प.', E: 'पू.', SW: 'द.प.', S: 'द.', SE: 'द.पू.' };

export function Calculator({ kind }: { kind: CalcKind }) {
  const [dob, setDob] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const { lang } = useApp();
  const hi = lang === 'hi';
  const L = (en: string, h: string) => (hi ? h : en);
  const T = (x: string) => tr(lang, x);
  const d = parseIso(dob);
  const traits = NUMBER_TRAITS[lang];
  let out: React.ReactNode = null;

  try {
    if (kind === 'moolank' && d) {
      const m = moolank(d.day).value, p = planetOf(m), prof = mulankFor(m, lang);
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Big label={L('Your Moolank', 'आपका मूलांक')} n={m} sub={hi ? p.devanagari : `${p.name} (${p.hindiName})`} />
            <div className="space-y-2 text-sm">
              {prof && <p className="font-serif text-xl font-semibold gold-text">{prof.title} · <span className="text-base font-normal italic text-muted-foreground">{prof.tagline}</span></p>}
              <p>{prof?.intro ?? `${traits[m].keyword} – ${traits[m].plus}.`}</p>
              <p className="text-muted-foreground">{L('Watch for', 'सावधानी')}: {traits[m].minus}{hi ? '।' : '.'}</p>
            </div>
          </div>
          <Panel title={L('Your lucky details', 'आपके शुभ विवरण')}><Facts items={[[L('Ruling planet', 'स्वामी ग्रह'), hi ? p.devanagari : `${p.name} (${p.devanagari})`], [L('Element', 'तत्व'), T(p.element)], [L('Lucky day', 'शुभ दिन'), T(p.weekday)], [L('Lucky colours', 'शुभ रंग'), p.colours.map(T).join(', ')], [L('Lucky numbers', 'शुभ अंक'), prof?.luckyNumbers.join(', ') ?? '—'], [L('Direction', 'दिशा'), prof?.direction ?? '—'], [L('Gemstone', 'रत्न'), hi ? T(p.gemstone.name) : `${p.gemstone.name} (${p.gemstone.hindi})`], [L('Metal & finger', 'धातु और उँगली'), `${T(p.gemstone.metal)}, ${T(p.gemstone.finger)}`], [L('Fasting day', 'व्रत का दिन'), T(p.fastingDay)]]} /><p className="text-xs text-muted-foreground">{T(p.gemstone.caution)}</p></Panel>
          {prof && <Grid2><Panel title={L('Strengths', 'ख़ूबियाँ')}><Bullets items={prof.strengths} /></Panel><Panel title={L('Challenges', 'चुनौतियाँ')}><Bullets items={prof.challenges} /></Panel></Grid2>}
          {prof && <Grid2><Panel title={L('Career', 'करियर')}><p className="text-muted-foreground">{prof.career}</p></Panel><Panel title={L('Relationships', 'रिश्ते')}><p className="text-muted-foreground">{prof.relationships}</p></Panel><Panel title={L('Health', 'स्वास्थ्य')}><p className="text-muted-foreground">{prof.health}</p></Panel><Panel title={L('Money', 'धन')}><p className="text-muted-foreground">{prof.money}</p></Panel></Grid2>}
          <Grid2>
            <Panel title={L('Remedies', 'उपाय')}><Bullets items={[...(prof?.remedies ?? []), hi ? `मंत्र: ${p.mantra.beej} (रोज़ ${p.mantra.dailyCount} बार)` : `Mantra: ${p.mantra.beej} (${p.mantra.dailyCount} times daily)`, `${L('Deity', 'देवता')}: ${T(p.deity)}`, `${L('Daan', 'दान')}: ${p.daan.map(T).join(', ')}`, `${L('Rudraksha', 'रुद्राक्ष')}: ${p.rudraksha.replace(' or ', hi ? ' या ' : ' or ').replace('Mukhi', hi ? 'मुखी' : 'Mukhi')}`]} /></Panel>
            <Panel title={L('Compatibility', 'अनुकूलता')}><p>{L('Harmonious with', 'इनसे मेल')}: <b>{(prof?.compatible ?? RELATION_TABLE[m].friend).join(', ')}</b></p><p>{L('Needs care with', 'इनसे सावधानी')}: <b>{(prof?.avoid ?? RELATION_TABLE[m].enemy).join(', ') || L('none', 'कोई नहीं')}</b></p><Link href={`/mulank/${m}`} className="inline-block text-gold underline">{hi ? `मूलांक ${m} की पूरी प्रोफ़ाइल पढ़ें →` : `Read the full Mulank ${m} profile →`}</Link></Panel>
          </Grid2>
        </div>
      );
    }
    if (kind === 'bhagyank' && d) {
      const b = bhagyank(d), p = planetOf(b.value), mo = moolank(d.day).value;
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const rel = mo === b.value ? 'friend' : RELATION_TABLE[mo].friend.includes(b.value) ? 'friend' : RELATION_TABLE[mo].enemy.includes(b.value) ? 'enemy' : 'neutral';
      const cur = r.pinnacles.find((x) => x.current), py = r.personalCycles.current.personalYear;
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Big label={L('Your Bhagyank', 'आपका भाग्यांक')} n={b.value} sub={hi ? `योग ${b.compound}${b.master ? ` · मास्टर ${b.master}` : ''} · ${p.devanagari}` : `Total ${b.compound}${b.master ? ` · master ${b.master}` : ''} · ${p.name}`} />
            <div className="space-y-2 text-sm">
              <p className="font-serif text-xl font-semibold gold-text">{traits[b.value].keyword}</p>
              <p>{hi ? <>आपका भाग्यांक (भाग्य अंक) बताता है कि जीवन आपको किस दिशा में ले जाता है। इसका स्वामी {p.devanagari} है, इसलिए आपका मार्ग इन गुणों से जुड़ा है: <b>{traits[b.value].plus}</b>।</> : <>Your Bhagyank (destiny number) shows the direction life tends to take you. With {p.name} as its ruler, your path is about <b>{traits[b.value].plus.toLowerCase()}</b>.</>}</p>
              <p className="text-muted-foreground">{L('Watch for', 'सावधानी')}: {traits[b.value].minus}{hi ? '।' : '.'}</p>
              {b.master && <p className="text-gold">{hi ? `आपकी जन्म तिथि में मास्टर नंबर ${b.master} है – अधिक संभावना और अधिक ज़िम्मेदारी का संकेत।` : `Master number ${b.master} is present in your date of birth – a sign of higher potential and higher responsibility.`}</p>}
            </div>
          </div>
          <Grid2>
            <Panel title={L('How it is calculated', 'यह कैसे निकाला जाता है')}><p className="text-muted-foreground">{hi ? `${toIso(d)} के सभी अंक जोड़कर घटाए जाते हैं:` : `All digits of ${toIso(d)} are added and reduced:`} {Array.isArray(b.chain) ? b.chain.join(' → ') : b.compound} → <b className="text-foreground">{b.value}</b>.</p></Panel>
            <Panel title={hi ? `मूलांक ${mo} + भाग्यांक ${b.value}` : `Moolank ${mo} + Bhagyank ${b.value}`}><p className="text-muted-foreground">{hi ? <>आपका स्वभाव (मूलांक {mo}, {planetOf(mo).devanagari}) और आपका भाग्य ({p.devanagari}) एक-दूसरे के लिए <b className="text-foreground">{REL_HI[rel]}</b> हैं। {rel === 'friend' ? 'आपका चरित्र आपके जीवन-पथ का साथ देता है, इसलिए मेहनत प्रायः परिणाम में बदलती है।' : rel === 'enemy' ? 'आप जो हैं और जीवन जहाँ ले जाता है, उनके बीच खिंचाव महसूस हो सकता है; संतुलन और नीचे दिए उपाय मदद करते हैं।' : 'ये एक-दूसरे की बहुत मदद या रुकावट नहीं करते; सचेत प्रयास परिणाम तय करता है।'}</> : <>Your nature (Moolank {mo}, {planetOf(mo).name}) and your destiny ({p.name}) are <b className="text-foreground">{REL_TEXT[rel]}</b> to each other. {rel === 'friend' ? 'Your character supports your life path, so effort tends to turn into results.' : rel === 'enemy' ? 'You may feel a pull between what you are and where life takes you; balance and the remedies below help.' : 'They neither help nor block each other strongly; conscious effort decides the outcome.'}</>}</p></Panel>
          </Grid2>
          <Panel title={L('Career & life direction', 'करियर और जीवन की दिशा')}><Chips items={p.careers.map(T)} tone="gold" /><p className="text-muted-foreground">{T(p.signatureTip)}</p></Panel>
          <Grid2>
            <Panel title={L('Lucky details', 'शुभ विवरण')}><Facts items={[[L('Planet', 'ग्रह'), hi ? p.devanagari : `${p.name} (${p.devanagari})`], [L('Element', 'तत्व'), T(p.element)], [L('Lucky day', 'शुभ दिन'), T(p.weekday)], [L('Colours', 'रंग'), p.colours.slice(0, 3).map(T).join(', ')], [L('Gemstone', 'रत्न'), T(p.gemstone.name)], [L('Fasting day', 'व्रत का दिन'), T(p.fastingDay)]]} /></Panel>
            <Panel title={L('Remedies', 'उपाय')}><Bullets items={[`${L('Mantra', 'मंत्र')}: ${p.mantra.beej}`, `${L('Deity', 'देवता')}: ${T(p.deity)}`, `${L('Daan', 'दान')}: ${p.daan.map(T).join(', ')}`, `${L('Rudraksha', 'रुद्राक्ष')}: ${hi ? p.rudraksha.replace(' or ', ' या ').replace('Mukhi', 'मुखी') : p.rudraksha}`]} /></Panel>
          </Grid2>
          <Panel title={L('Your life timeline', 'आपकी जीवन-रेखा')}><p className="text-muted-foreground">{hi ? <>आपकी आयु {r.age} वर्ष है और आप <b className="text-foreground">व्यक्तिगत वर्ष {py}</b> ({traits[py].keyword}) में हैं ({r.personalCycles.current.label}).{cur ? ` आपका वर्तमान शिखर (पिनेकल) ${cur.number} (${traits[cur.number].keyword}) है, जो ${cur.fromAge}–${cur.toAge ?? 'आगे'} वर्ष की आयु तक है।` : ''}</> : <>You are {r.age} years old and in <b className="text-foreground">Personal Year {py}</b> ({traits[py].keyword.toLowerCase()}, {r.personalCycles.current.label}).{cur ? ` Your current pinnacle is ${cur.number} (${traits[cur.number].keyword.toLowerCase()}), covering ages ${cur.fromAge}–${cur.toAge ?? 'onwards'}.` : ''}</>}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{r.pinnacles.map((x) => <div key={x.index} className={cn('rounded-md border p-2 text-center', x.current ? 'border-gold bg-gold/10' : 'border-border')}><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{L('Pinnacle', 'शिखर')} {x.index}</p><p className="gold-text font-serif text-2xl font-bold">{x.number}</p><p className="text-xs text-muted-foreground">{L('Age', 'आयु')} {x.fromAge}–{x.toAge ?? '+'}</p></div>)}</div></Panel>
        </div>
      );
    }
    if (kind === 'loshu' && d) {
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const mp = planetOf(r.moolank.value), bp = planetOf(r.bhagyank.value);
      out = (
        <div className="space-y-4">
          <div className="grid items-start gap-6 sm:grid-cols-2">
            <NumberGrid cells={r.loShu.cells} label={L('Lo Shu Grid', 'लो शू ग्रिड')} />
            <div className="space-y-2 text-sm">
              <p>{L('Moolank', 'मूलांक')} <b>{r.moolank.value}</b> ({hi ? mp.devanagari : mp.name}) · {L('Bhagyank', 'भाग्यांक')} <b>{r.bhagyank.value}</b> ({hi ? bp.devanagari : bp.name}) · {L('Kua', 'कुआ')} <b>{r.kua.value}</b></p>
              <p>{L('Present numbers', 'उपस्थित अंक')}: <b>{r.loShu.present.join(', ')}</b></p>
              <p>{L('Missing numbers', 'अनुपस्थित अंक')}: <b>{r.loShu.missing.join(', ') || L('none', 'कोई नहीं')}</b></p>
              <p>{L('Repeated', 'दोहराए गए')}: {r.loShu.repeated.map((x) => `${x.number}×${x.count}`).join(', ') || L('none', 'कोई नहीं')}</p>
              <div className="flex flex-wrap gap-1">{r.loShu.yogs.map((y) => <Badge key={y.name} tone="good">{T(y.name)}</Badge>)}{r.loShu.arrowsOfStrength.map((a) => <Badge key={a.lineId} tone="gold">{T(a.name)}</Badge>)}{r.loShu.arrowsOfWeakness.map((a) => <Badge key={a.name} tone="warn">{T(a.name)}</Badge>)}</div>
            </div>
          </div>
          <Panel title={L('Life area strength', 'जीवन के क्षेत्रों की शक्ति')}>
            <div className="grid gap-3 sm:grid-cols-2">{Object.entries(r.lifeAreaScores).map(([k, v]) => <Meter key={k} label={hi ? T(k) : pretty(k)} value={v} />)}</div>
          </Panel>
          <Grid2>
            <Panel title={L('Strengths in your grid', 'आपके ग्रिड की ख़ूबियाँ')}>{r.loShu.yogs.length + r.loShu.arrowsOfStrength.length === 0 ? <p className="text-muted-foreground">{L('No complete line yet. Your strength comes from the individual numbers you carry.', 'अभी कोई पूर्ण रेखा नहीं है। आपकी शक्ति आपके अलग-अलग अंकों से आती है।')}</p> : <Bullets items={[...r.loShu.yogs.map((y) => hi ? `${T(y.name)} (${y.numbers.join('-')}) – सफलता में सहायक संयोजन` : `${y.name} (${y.numbers.join('-')}) – a combination that supports success`), ...r.loShu.arrowsOfStrength.map((a) => hi ? `${T(a.name)} (${a.numbers.join('-')}) – एक स्वाभाविक ख़ूबी` : `${a.name} (${a.numbers.join('-')}) – a natural strength`)]} />}</Panel>
            <Panel title={L('Areas to work on', 'जिन पर काम करना है')}>{r.loShu.arrowsOfWeakness.length === 0 ? <p className="text-muted-foreground">{L('No fully empty line. Your grid is well balanced.', 'कोई भी रेखा पूरी तरह खाली नहीं है। आपका ग्रिड अच्छी तरह संतुलित है।')}</p> : <Bullets items={r.loShu.arrowsOfWeakness.map((a) => hi ? `${T(a.name)} (${a.numbers.join('-')}) – आदतों और उपायों से इसे मज़बूत करें` : `${a.name} (${a.numbers.join('-')}) – build this through habits and remedies`)} />}</Panel>
          </Grid2>
          {r.loShu.missing.length > 0 && <Panel title={L('What your missing numbers mean', 'आपके अनुपस्थित अंकों का अर्थ')}><div className="grid gap-3 sm:grid-cols-2">{r.loShu.missing.map((n) => <div key={n} className="rounded-md border border-border p-3"><p><b className="gold-text text-lg">{n}</b> · {traits[n].keyword}</p><p className="text-muted-foreground">{L('Develop', 'विकसित करें')}: {hi ? traits[n].plus : traits[n].plus.toLowerCase()}{hi ? '।' : '.'}</p><p className="text-xs text-muted-foreground">{L('Remedy', 'उपाय')} – {PLANET_TIPS(n, lang)}</p></div>)}</div></Panel>}
          {r.loShu.repeated.length > 0 && <Panel title={L('Repeated numbers', 'दोहराए गए अंक')}><Bullets items={r.loShu.repeated.map((x) => hi ? `${x.number} ${x.count} बार आता है: ${traits[x.number].keyword} प्रबल है${x.count >= 3 ? ` – अधिकता को संतुलित करें (${traits[x.number].minus})` : ''}।` : `${x.number} appears ${x.count} times: ${traits[x.number].keyword.toLowerCase()} is strong${x.count >= 3 ? ` – balance the excess (${traits[x.number].minus.toLowerCase()})` : ''}.`)} /></Panel>}
          <Panel title={L('Your current cycle', 'आपका वर्तमान चक्र')}><p className="text-muted-foreground">{hi ? <>आप <b className="text-foreground">व्यक्तिगत वर्ष {r.personalCycles.current.personalYear}</b> ({traits[r.personalCycles.current.personalYear].keyword}, {r.personalCycles.current.label}) और व्यक्तिगत माह {r.personalCycles.current.personalMonth} में हैं।</> : <>You are in <b className="text-foreground">Personal Year {r.personalCycles.current.personalYear}</b> ({traits[r.personalCycles.current.personalYear].keyword.toLowerCase()}, {r.personalCycles.current.label}) and Personal Month {r.personalCycles.current.personalMonth}.</>}</p></Panel>
        </div>
      );
    }
    if (kind === 'name' && name.replace(/[^A-Za-z]/g, '').length >= 2) {
      const c = analyseNameSystem(name, 'chaldean'), py = analyseNameSystem(name, 'pythagorean');
      const n = c.nameNumber.single, pl = planetOf(n);
      const cat = c.nameNumber.category;
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3"><Big label={L('Chaldean name number', 'कैल्डियन नामांक')} n={n} sub={hi ? `संयुक्त अंक ${c.nameNumber.compound} · ${T(cat)}` : `Compound ${c.nameNumber.compound} · ${cat}`} /><Big label={L('Soul urge', 'आत्मा अंक (सोल अर्ज)')} n={c.soulUrge.single} sub={L('from vowels', 'स्वरों से')} /><Big label={L('Personality', 'व्यक्तित्व अंक')} n={c.personality.single} sub={L('from consonants', 'व्यंजनों से')} /></div>
          <Grid2>
            <Panel title={hi ? `नामांक ${n} क्या कहता है` : `What name number ${n} says`}><p><b>{traits[n].keyword}</b> – {traits[n].plus}{hi ? '।' : '.'}</p><p className="text-muted-foreground">{L('Watch for', 'सावधानी')}: {traits[n].minus}{hi ? '।' : '.'}</p><p className="text-muted-foreground">{hi ? `स्वामी ग्रह ${pl.devanagari}। शुभ दिन ${T(pl.weekday)}, रंग ${pl.colours.slice(0, 2).map(T).join(' और ')}।` : `Ruled by ${pl.name}. Lucky day ${pl.weekday}, colours ${pl.colours.slice(0, 2).join(' & ')}.`}</p></Panel>
            <Panel title={hi ? `संयुक्त अंक ${c.nameNumber.compound}: ${T(cat)}` : `Compound ${c.nameNumber.compound}: ${cat}`}><p className="text-muted-foreground">{cat === 'favourable' ? L('In the Chaldean system this compound number is traditionally considered supportive.', 'कैल्डियन पद्धति में यह संयुक्त अंक परंपरागत रूप से सहायक माना जाता है।') : cat === 'unfavourable' ? L('This compound number is traditionally considered challenging. A small spelling adjustment is sometimes suggested after checking it against your date of birth.', 'यह संयुक्त अंक परंपरागत रूप से चुनौतीपूर्ण माना जाता है। आपकी जन्म तिथि से मिलान के बाद कभी-कभी वर्तनी में छोटा बदलाव सुझाया जाता है।') : L('This compound number gives mixed results; its effect depends on how it relates to your birth numbers.', 'यह संयुक्त अंक मिश्रित परिणाम देता है; इसका प्रभाव इस पर निर्भर करता है कि यह आपके जन्म अंकों से कैसे जुड़ता है।')}</p><p className="text-xs text-muted-foreground">{hi ? 'नाम को हमेशा आपकी जन्म तिथि के साथ मिलाकर ही परखना चाहिए।' : <>A name should always be judged together with your Moolank and Bhagyank, which is what the complete report does.</>}</p></Panel>
          </Grid2>
          <Panel title={L('Letter values (Chaldean)', 'अक्षरों के मान (कैल्डियन)')}><div className="flex flex-wrap gap-1.5">{c.letters.map((l, i) => <div key={i} className={cn('w-9 rounded-md border p-1 text-center', l.vowel ? 'border-gold/60 bg-gold/10' : 'border-border')}><p className="text-sm font-semibold">{l.letter}</p><p className="text-xs text-muted-foreground">{l.value}</p></div>)}</div><p className="text-xs text-muted-foreground">{L('Highlighted letters are vowels (soul urge). The rest form your personality number.', 'हाइलाइट किए गए अक्षर स्वर हैं (आत्मा अंक)। बाक़ी अक्षरों से आपका व्यक्तित्व अंक बनता है।')}</p></Panel>
          <Grid2>
            <Panel title={L('Each word of your name', 'आपके नाम का हर शब्द')}><table className="w-full text-left"><thead><tr className="text-xs text-muted-foreground"><th>{L('Word', 'शब्द')}</th><th>{L('Compound', 'संयुक्त')}</th><th>{L('Single', 'एकल')}</th></tr></thead><tbody>{c.words.map((w) => <tr key={w.word} className="border-t border-border/50"><td>{w.word}</td><td>{w.compound}</td><td className="font-semibold">{w.single}</td></tr>)}</tbody></table></Panel>
            <Panel title={L('Two systems compared', 'दो पद्धतियों की तुलना')}><Facts items={[[L('Chaldean', 'कैल्डियन'), `${c.nameNumber.compound} → ${c.nameNumber.single}`], [L('Pythagorean', 'पाइथागोरियन'), `${py.nameNumber.compound} → ${py.nameNumber.single}`], [L('Pythagorean soul urge', 'पाइथागोरियन आत्मा अंक'), py.soulUrge.single], [L('Pythagorean personality', 'पाइथागोरियन व्यक्तित्व अंक'), py.personality.single]]} /><p className="text-xs text-muted-foreground">{L('Indian numerology mostly uses Chaldean values; Pythagorean is shown for comparison.', 'भारतीय अंक ज्योतिष में मुख्यतः कैल्डियन मान उपयोग होते हैं; पाइथागोरियन तुलना के लिए दिखाया गया है।')}</p></Panel>
          </Grid2>
        </div>
      );
    }
    if (kind === 'mobile' && d && mobile.replace(/\D/g, '').length >= 10) {
      const r = analyseDob({ dob, gender }, { asOf: todayIST() });
      const m = analyseMobile(mobile, { moolank: r.moolank.value, bhagyank: r.bhagyank.value, missingNumbers: r.loShu.missing });
      const kindTone = { malefic: 'bad', conflict: 'warn', supportive: 'good', neutral: undefined } as const;
      const LABEL: Record<string, string> = hi ? { base: 'आरंभिक स्कोर', bhagyankRelation: 'योग बनाम आपका भाग्यांक', moolankRelation: 'योग बनाम आपका मूलांक', compound: 'संयुक्त अंक की गुणवत्ता', heavy48: 'भारी 4/8 योग', maleficPairs: 'कठिन अंक-जोड़ियाँ', zeros: 'बहुत अधिक शून्य', repeatedEnemyDigits: 'दोहराए गए शत्रु अंक', missingFilled: 'आपके अनुपस्थित अंकों की पूर्ति', last4: 'अंतिम चार अंक' } : { base: 'Starting score', bhagyankRelation: 'Total vs your Bhagyank', moolankRelation: 'Total vs your Moolank', compound: 'Compound number quality', heavy48: 'Heavy 4/8 total', maleficPairs: 'Difficult digit pairs', zeros: 'Too many zeros', repeatedEnemyDigits: 'Repeated unfriendly digits', missingFilled: 'Fills your missing numbers', last4: 'Last four digits' };
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]"><Big label={L('Compatibility score', 'अनुकूलता स्कोर')} n={m.score} sub={T(m.verdict)} />
            <div className="space-y-2 text-sm"><Meter label={hi ? `${m.masked} – 100 में से` : `${m.masked} – out of 100`} value={m.score} text={`${m.score}/100`} />
              <p>{hi ? <>योग <b>{m.total.compound} → {m.total.single}</b> ({T(m.total.category)})। यह आपके भाग्यांक {r.bhagyank.value} के लिए <b>{REL_HI[m.relationWithBhagyank]}</b> और आपके मूलांक {r.moolank.value} के लिए <b>{REL_HI[m.relationWithMoolank]}</b> है।</> : <>Total <b>{m.total.compound} → {m.total.single}</b> ({m.total.category}). It is <b>{REL_TEXT[m.relationWithBhagyank]}</b> to your Bhagyank {r.bhagyank.value} and <b>{REL_TEXT[m.relationWithMoolank]}</b> to your Moolank {r.moolank.value}.</>}</p></div></div>
          <Grid2>
            <Panel title={L('Digit pairs', 'अंक-जोड़ियाँ')}><div className="flex flex-wrap gap-1.5">{m.pairs.map((p) => <Badge key={p.position} tone={kindTone[p.kind as keyof typeof kindTone]}>{p.pair}</Badge>)}</div><p className="text-xs text-muted-foreground">{L('Green: supportive · Orange: conflicting · Red: difficult · Plain: neutral.', 'हरा: सहायक · नारंगी: विरोधी · लाल: कठिन · सादा: सम।')}</p>
              <p>{L('Difficult pairs', 'कठिन जोड़ियाँ')}: <b>{m.maleficPairs.join(', ') || L('none', 'कोई नहीं')}</b> · {L('Conflicting', 'विरोधी')}: <b>{m.conflictPairs.join(', ') || L('none', 'कोई नहीं')}</b></p></Panel>
            <Panel title={L('Digit frequency', 'अंकों की आवृत्ति')}><div className="space-y-1.5">{Object.entries(m.digitFrequency).map(([dg, n]) => <Meter key={dg} label={hi ? `अंक ${dg}` : `Digit ${dg}`} value={n} max={Math.max(3, ...Object.values(m.digitFrequency))} text={`${n}×`} />)}</div></Panel>
          </Grid2>
          <Grid2>
            <Panel title={L('Last four digits', 'अंतिम चार अंक')}><p>{hi ? <><b>{m.last4.digits}</b> → योग {m.last4.compound} → {m.last4.single}, जो आपके भाग्यांक के लिए <b>{REL_HI[m.last4.relationWithBhagyank]}</b> है।</> : <><b>{m.last4.digits}</b> → total {m.last4.compound} → {m.last4.single}, which is <b>{REL_TEXT[m.last4.relationWithBhagyank]}</b> to your Bhagyank.</>}</p><p className="text-muted-foreground">{L('The last four digits are traditionally given extra weight.', 'परंपरागत रूप से अंतिम चार अंकों को अधिक महत्व दिया जाता है।')}</p>{m.missingNumbersFilled.length > 0 && <p>{hi ? `यह नंबर आपके अनुपस्थित अंक ${m.missingNumbersFilled.join(', ')} की पूर्ति करता है।` : `This number fills your missing ${m.missingNumbersFilled.join(', ')}.`}</p>}{m.repeatingDigits.length > 0 && <p className="text-muted-foreground">{L('Repeating digits', 'दोहराए गए अंक')}: {m.repeatingDigits.map((x) => `${x.digit}×${x.count}`).join(', ')}.</p>}</Panel>
            <Panel title={L('How the score is built', 'स्कोर कैसे बनता है')}><table className="w-full">{<tbody>{Object.entries(m.scoreBreakdown).filter(([, v]) => v !== 0).map(([k, v]) => <tr key={k} className="border-t border-border/50 first:border-0"><td className="py-1">{LABEL[k] ?? pretty(k)}</td><td className={cn('text-right tabular-nums', v > 0 ? 'text-success' : 'text-danger')}>{v > 0 ? '+' : ''}{Math.round(v)}</td></tr>)}</tbody>}</table></Panel>
          </Grid2>
          <Panel title={L('What would suit you better', 'आपके लिए बेहतर क्या होगा')}><Facts items={[[L('Ideal totals', 'आदर्श योग'), m.suggestion.idealTotals.join(', ') || '—'], [L('Favourable compounds', 'शुभ संयुक्त अंक'), m.suggestion.idealCompounds.slice(0, 8).join(', ') || '—'], [L('Good digit pairs', 'अच्छी अंक-जोड़ियाँ'), m.suggestion.favourableDigitPairs.slice(0, 8).join(', ') || '—'], [L('Digits to avoid', 'बचने योग्य अंक'), m.suggestion.avoidDigits.join(', ') || L('none', 'कोई नहीं')], [L('Pairs to avoid', 'बचने योग्य जोड़ियाँ'), m.suggestion.avoidPairs.join(', ')]]} /></Panel>
        </div>
      );
    }
    if (kind === 'kua' && d) {
      const k = kuaNumber(d.year, gender), dirs = KUA_DIRECTIONS[k];
      const dirMap = new Map<string, { label: string; good: boolean }>();
      (Object.entries(dirs.favourable) as [keyof typeof KUA_MEANING, string][]).forEach(([key, dir]) => dirMap.set(dir, { label: hi ? T(key) : pretty(key), good: true }));
      (Object.entries(dirs.unfavourable) as [keyof typeof KUA_MEANING, string][]).forEach(([key, dir]) => dirMap.set(dir, { label: hi ? T(key) : pretty(key), good: false }));
      const KM = hi ? KUA_MEANING_HI : KUA_MEANING;
      out = (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]"><Big label={L('Your Kua number', 'आपका कुआ अंक')} n={k} sub={hi ? `${dirs.group === 'East' ? 'पूर्व' : 'पश्चिम'} समूह · ${T(KUA_ELEMENT[k] ?? '')}` : `${dirs.group} group · ${KUA_ELEMENT[k] ?? ''}`} />
            <div className="space-y-2 text-sm"><p>{hi ? <>आप <b>{dirs.group === 'East' ? 'पूर्व' : 'पश्चिम'} समूह</b> में हैं। आपकी सबसे अच्छी दिशा <b className="text-gold">{T(dirs.favourable.success)}</b> (सफलता) है और स्वास्थ्य के लिए सबसे अच्छी दिशा <b className="text-gold">{T(dirs.favourable.health)}</b> है।</> : <>You belong to the <b>{dirs.group} group</b>. Your best direction is <b className="text-gold">{dirs.favourable.success}</b> (success) and your best direction for health is <b className="text-gold">{dirs.favourable.health}</b>.</>}</p><p className="text-muted-foreground">{L('Kua numbers guide the placement of your bed, desk and main seating according to the Eight Mansions system.', 'कुआ अंक आठ भवन (एट मेंशन्स) पद्धति के अनुसार आपके बिस्तर, मेज़ और मुख्य बैठक की दिशा तय करने में मार्गदर्शन देते हैं।')}</p></div></div>
          <Panel title={L('Your direction compass', 'आपका दिशा कम्पास')}><div className="mx-auto grid max-w-md grid-cols-3 gap-2">{COMPASS.flat().map(([abbr, full], i) => { const info = dirMap.get(full); return abbr ? (
            <div key={i} className={cn('mk-rise rounded-lg border p-2 text-center', info?.good ? 'border-gold bg-gold/10' : 'border-border bg-muted/30')} style={{ animationDelay: `${i * 50}ms` }}><p className="font-serif text-lg font-bold">{hi ? ABBR_HI[abbr] : abbr}</p><p className={cn('text-[11px]', info?.good ? 'text-gold' : 'text-muted-foreground')}>{info?.label}</p></div>
          ) : <div key={i} className="mk-pulse flex items-center justify-center rounded-full border border-gold/60 bg-gradient-to-br from-[#2a0e1b] to-[#24130a]"><span className="gold-text font-serif text-3xl font-bold">{k}</span></div>; })}</div><p className="text-center text-xs text-muted-foreground">{L('Gold = favourable directions for you.', 'सुनहरा = आपके लिए अनुकूल दिशाएँ।')}</p></Panel>
          <Grid2>
            <Panel title={L('Favourable directions', 'अनुकूल दिशाएँ')}>{(Object.entries(dirs.favourable) as [keyof typeof KUA_MEANING, string][]).map(([key, dir]) => <p key={key}><b className="text-gold">{T(dir)}</b> – {KM[key]}</p>)}</Panel>
            <Panel title={L('Directions to avoid', 'बचने योग्य दिशाएँ')}>{(Object.entries(dirs.unfavourable) as [keyof typeof KUA_MEANING, string][]).map(([key, dir]) => <p key={key}><b>{T(dir)}</b> – <span className="text-muted-foreground">{KM[key]}</span></p>)}</Panel>
          </Grid2>
          <Panel title={L('How to use this', 'इसका उपयोग कैसे करें')}><Bullets items={hi ? [`${T(dirs.favourable.health)} या ${T(dirs.favourable.success)} की ओर सिर करके सोएँ।`, `काम, पढ़ाई या महत्वपूर्ण निर्णय लेते समय ${T(dirs.favourable.success)} की ओर मुँह करें।`, `मुख्य बैठक और अपनी ऑफ़िस की कुर्सी अनुकूल दिशा (${Object.values(dirs.favourable).map(T).join(', ')}) की ओर रखें।`, `लंबे समय तक ${T(dirs.unfavourable.totalLoss)} और ${T(dirs.unfavourable.mishaps)} की ओर मुँह करके न बैठें।`] : [`Sleep with your head towards ${dirs.favourable.health} or ${dirs.favourable.success}.`, `Face ${dirs.favourable.success} when you work, study or take important decisions.`, `Keep the main seating and your office chair facing a favourable direction (${Object.values(dirs.favourable).join(', ')}).`, `Avoid facing ${dirs.unfavourable.totalLoss} and ${dirs.unfavourable.mishaps} for long stretches.`]} /></Panel>
        </div>
      );
    }
  } catch { out = <p className="text-sm text-danger">{L('Please check the details you entered.', 'कृपया दर्ज किए गए विवरण जाँचें।')}</p>; }

  const needsDob = kind !== 'name';
  return (
    <div className="glass space-y-5 rounded-lg p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        {needsDob && <Field label={L('Date of birth', 'जन्म तिथि')} htmlFor="c-dob"><Input id="c-dob" type="date" max={toIso(todayIST())} min="1900-01-01" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>}
        {(kind === 'loshu' || kind === 'kua' || kind === 'mobile' || kind === 'bhagyank') && <Field label={kind === 'bhagyank' ? L('Gender (optional)', 'लिंग (वैकल्पिक)') : L('Gender (for Kua)', 'लिंग (कुआ के लिए)')}><ChipGroup options={[{ value: 'male' as const, label: L('Male', 'पुरुष') }, { value: 'female' as const, label: L('Female', 'महिला') }]} value={[gender]} onChange={(v) => setGender(v[0] ?? 'male')} /></Field>}
        {kind === 'name' && <Field label={L('Name you use (English letters)', 'आपका प्रचलित नाम (अंग्रेज़ी अक्षरों में)')} htmlFor="c-name" className="sm:col-span-2"><Input id="c-name" placeholder={L('e.g. Rahul Sharma', 'जैसे Rahul Sharma')} value={name} onChange={(e) => setName(e.target.value)} /></Field>}
        {kind === 'mobile' && <Field label={L('Mobile number', 'मोबाइल नंबर')} htmlFor="c-mob"><Input id="c-mob" type="tel" inputMode="numeric" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>}
      </div>
      <div aria-live="polite">{out}</div>
      {out && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">{L('This is a free summary from traditional Vedic and Chaldean rules. Acharya Nandram combines every number in your chart in the complete report, with personal remedies.', 'यह पारंपरिक वैदिक और कैल्डियन नियमों पर आधारित मुफ़्त सारांश है। संपूर्ण रिपोर्ट में आचार्य नंदराम आपके चार्ट के हर अंक को जोड़कर व्यक्तिगत उपायों के साथ समझाते हैं।')}</p>
          <div className="flex flex-wrap gap-2"><Link href="/reading" className={buttonVariants({ variant: 'gold' })}><Sparkles /> {L('Get your complete reading', 'अपनी संपूर्ण रीडिंग पाएँ')}</Link><Link href="/pricing" className={buttonVariants({ variant: 'outline' })}>{L('See full report options', 'पूरी रिपोर्ट के विकल्प देखें')}</Link></div>
        </div>
      )}
    </div>
  );
}
