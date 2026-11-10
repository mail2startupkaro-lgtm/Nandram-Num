'use client';
import * as React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { tr as term } from '@/lib/i18n/hi-terms';
import { analyseDob, analyseNameSystem, todayIST, toIso } from '@/lib/numerology';
import { planetOf } from '@/lib/numerology/data/planets';
import { NUMBER_TRAITS } from '@/lib/i18n/numberMeanings';
import type { Lang } from '@/lib/i18n/dictionary';

const L = {
  en: { details: 'Your details', hint: 'Use the name you commonly write.', name: 'Name', dob: 'Date of birth', gender: 'Gender (for Kua)', male: 'Male', female: 'Female',
    calc: 'Calculate my numbers', moolank: 'Moolank', bhagyank: 'Bhagyank', kua: 'Kua', nameNo: 'Name', grid: 'Lo Shu grid', day: 'Lucky day', colour: 'Lucky colours',
    planet: 'Ruling planet', missing: 'Missing numbers', none: 'none', full: 'Get my complete reading', bad: 'Please check the date of birth.', destiny: 'Your Bhagyank' },
  hi: { details: 'आपका विवरण', hint: 'वही नाम लिखें जो आप आमतौर पर उपयोग करते हैं (अंग्रेज़ी अक्षरों में)।', name: 'नाम', dob: 'जन्म तिथि', gender: 'लिंग (कुआ के लिए)', male: 'पुरुष', female: 'महिला',
    calc: 'मेरे अंक निकालें', moolank: 'मूलांक', bhagyank: 'भाग्यांक', kua: 'कुआ', nameNo: 'नामांक', grid: 'लो शू ग्रिड', day: 'शुभ दिन', colour: 'शुभ रंग',
    planet: 'स्वामी ग्रह', missing: 'अनुपस्थित अंक', none: 'कोई नहीं', full: 'मेरी पूरी रिपोर्ट', bad: 'कृपया जन्म तिथि जाँचें।', destiny: 'आपका भाग्यांक' },
};
const SWATCH: Record<number, string> = { 1: '#ffb347', 2: '#e8eefc', 3: '#f6d365', 4: '#8fa3b8', 5: '#7ed6a5', 6: '#ff9ecb', 7: '#c7a6ff', 8: '#4b5bd6', 9: '#ff6b5b' };

export function QuickReading({ lang }: { lang: Lang }) {
  const t = L[lang];
  const [name, setName] = React.useState('Rahul Sharma');
  const [dob, setDob] = React.useState('1990-08-28');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [input, setInput] = React.useState({ name: 'Rahul Sharma', dob: '1990-08-28', gender: 'male' as 'male' | 'female' });
  const [run, setRun] = React.useState(0);
  const box = React.useRef<HTMLDivElement>(null);

  const result = React.useMemo(() => {
    try {
      const d = analyseDob({ dob: input.dob, gender: input.gender }, { asOf: todayIST() });
      let nameNo: number | null = null;
      try { nameNo = analyseNameSystem(input.name, 'chaldean').nameNumber.single; } catch { nameNo = null; }
      return { d, nameNo };
    } catch { return null; }
  }, [input]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setInput({ name, dob, gender }); setRun((r) => r + 1);
    const el = box.current;
    if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let q = 0; q < 18; q++) {
        const s = document.createElement('span');
        s.className = 'cz-burst'; s.textContent = String((q % 9) + 1);
        Object.assign(s.style, { left: '50%', top: '40%', fontSize: `${14 + Math.random() * 18}px` });
        s.style.setProperty('--x', `${Math.random() * 600 - 300}px`); s.style.setProperty('--y', `${Math.random() * 400 - 260}px`);
        el.appendChild(s); setTimeout(() => s.remove(), 1300);
      }
      if (window.innerWidth < 880) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const field = 'w-full rounded-xl border border-gold/30 bg-background/40 px-4 py-3 text-[15px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20';
  const lab = 'mb-1.5 mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold';

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
      <form onSubmit={submit} className="cz-card p-6 sm:p-8">
        <h3 className="font-cinzel text-2xl font-bold">{t.details}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
        <label className={lab} htmlFor="qr-name">{t.name}</label>
        <input id="qr-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lab} htmlFor="qr-dob">{t.dob}</label>
            <input id="qr-dob" type="date" className={field} value={dob} min="1900-01-01" max={toIso(todayIST())} onChange={(e) => setDob(e.target.value)} required /></div>
          <div><label className={lab} htmlFor="qr-g">{t.gender}</label>
            <select id="qr-g" className={field} value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
              <option value="male">{t.male}</option><option value="female">{t.female}</option>
            </select></div>
        </div>
        <button type="submit" className="cz-btn cz-btn-primary mt-6 w-full"><Sparkles className="h-4 w-4" />{t.calc}</button>
      </form>

      <div ref={box} className="cz-card relative overflow-hidden p-6 sm:p-8" aria-live="polite">
        {!result ? <p className="text-danger">{t.bad}</p> : (() => {
          const { d, nameNo } = result;
          const m = d.moolank.value, b = d.bhagyank.value, p = planetOf(m), tr = NUMBER_TRAITS[lang][m];
          const badges: [string, number | null][] = [[t.moolank, m], [t.bhagyank, b], [t.kua, d.kua.value], [t.nameNo, nameNo]];
          return (
            <div key={run}>
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-cinzel text-2xl font-bold">{input.name || '—'}</h3>
                <span className="font-cormorant text-lg text-muted-foreground">{new Date(input.dob + 'T00:00:00').toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {badges.filter(([, v]) => v != null).map(([k, v], i) => (
                  <div key={k} className="cz-badge" style={{ animationDelay: `${i * 0.12}s` }}>
                    <div className="n"><Roller to={v as number} /></div>
                    <div className="mt-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">{k}</div>
                    <div className="text-xs font-semibold" style={{ color: 'hsl(var(--saffron))' }}>{lang === 'hi' ? planetOf(v as number).devanagari : planetOf(v as number).name}</div>
                  </div>
                ))}
              </div>
              <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                <div className="mx-auto">
                  <div className="cz-loshu">
                    {d.loShu.layout.flat().map((n: number, i: number) => {
                      const c = d.loShu.counts[n] || 0;
                      return <div key={n} className={c ? 'f' : ''} style={{ animationDelay: `${0.3 + i * 0.08}s` }}>{c ? String(n).repeat(Math.min(c, 4)) : n}</div>;
                    })}
                  </div>
                  <p className="mt-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">{t.grid}</p>
                </div>
                <div>
                  <h4 className="font-cinzel text-lg font-bold text-gold">{tr.keyword}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{tr.plus}. {t.destiny} {b} ({lang === 'hi' ? planetOf(b).devanagari : planetOf(b).name}).</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tr.plus.split(/,\s*/).map((x, i) => <span key={x} className="cz-tag" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>{x}</span>)}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{t.missing}: <b className="text-foreground">{d.loShu.missing.join(', ') || t.none}</b></p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <div className="rounded-xl border border-dashed border-gold/30 p-3">{t.colour}<b className="mt-0.5 block text-sm text-foreground"><span className="mr-1.5 inline-block h-3 w-3 rounded-full align-[-1px]" style={{ background: SWATCH[m], boxShadow: `0 0 8px ${SWATCH[m]}` }} />{p.colours.slice(0, 2).map((x) => term(lang, x)).join(', ')}</b></div>
                <div className="rounded-xl border border-dashed border-gold/30 p-3">{t.day}<b className="mt-0.5 block text-sm text-foreground">{term(lang, p.weekday)}</b></div>
                <div className="rounded-xl border border-dashed border-gold/30 p-3">{t.planet}<b className="mt-0.5 block text-sm text-foreground">{lang === 'hi' ? p.devanagari : p.name}</b></div>
              </div>
              <div className="mt-6 text-center"><Link href="/reading" className="cz-btn cz-btn-ghost text-sm">{t.full} →</Link></div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/** Spins through 1–9 before settling on the real value. */
function Roller({ to }: { to: number }) {
  const [v, setV] = React.useState(to);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let c = 0;
    const id = setInterval(() => { c++; setV((c % 9) + 1); if (c > 12) { clearInterval(id); setV(to); } }, 55);
    return () => clearInterval(id);
  }, [to]);
  return <>{v}</>;
}
