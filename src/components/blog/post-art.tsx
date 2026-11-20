/**
 * Animated SVG illustrations for blog posts (hero art and in-article figures).
 * Pure SVG + CSS animations (.pa-*) from cosmic.css; motion is switched off for prefers-reduced-motion.
 * Gradient ids are unique per spec + language so a hidden language copy never breaks the visible one.
 */
import * as React from 'react';
import type { Art } from '@/lib/blog/art';

type Lang = 'en' | 'hi';
type Mode = Lang | 'both';

const PLANET: Record<Lang, string[]> = {
  en: ['Sun', 'Moon', 'Jupiter', 'Rahu', 'Mercury', 'Venus', 'Ketu', 'Saturn', 'Mars'],
  hi: ['सूर्य', 'चंद्र', 'गुरु', 'राहु', 'बुध', 'शुक्र', 'केतु', 'शनि', 'मंगल'],
};
const LOSHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const GOLD = '#fbbf24', PALE = '#fde68a', CREAM = '#f3e9cc', MAROON = '#2a0e1b', RED = '#f87171';

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };

/** Text in one language, or both (CSS shows the active one). */
function Tx({ mode, en, hi, ...rest }: { mode: Mode; en: string; hi: string } & React.SVGProps<SVGTextElement>) {
  if (mode === 'both') return <><text {...rest} className="lang-en">{en}</text><text {...rest} className="lang-hi">{hi}</text></>;
  return <text {...rest}>{mode === 'hi' ? hi : en}</text>;
}

function Stars({ seed }: { seed: number }) {
  const pts = Array.from({ length: 26 }, (_, i) => ({ x: (seed * 37 + i * 97) % 640, y: (seed * 53 + i * 61) % 360, r: (i % 3) + 0.8, d: (i % 7) * 0.45 }));
  return <g>{pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={CREAM} className="pa-twinkle" style={{ animationDelay: `${p.d}s` }} />)}</g>;
}

function Rings({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeOpacity={0.45} strokeDasharray="6 8" className="pa-spin" />
      <circle cx={cx} cy={cy} r={r - 18} fill="none" stroke={GOLD} strokeOpacity={0.25} className="pa-spin-r" strokeDasharray="2 10" />
    </g>
  );
}

function NumberDisc({ cx, cy, r, n, id, mode, sub = true }: { cx: number; cy: number; r: number; n: number | string; id: string; mode: Mode; sub?: boolean }) {
  const k = typeof n === 'number' ? n : 0;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-disc)`} stroke={GOLD} strokeWidth={2} className="pa-pulse" />
      <text x={cx} y={cy + r * 0.32} textAnchor="middle" fontSize={r * 0.95} fontWeight={700} fill={PALE} fontFamily="Georgia, serif">{n}</text>
      {sub && k > 0 && k <= 9 && <Tx mode={mode} en={PLANET.en[k - 1]} hi={PLANET.hi[k - 1]} x={cx} y={cy + r + 24} textAnchor="middle" fontSize={16} fill={CREAM} letterSpacing={2} />}
    </g>
  );
}

function Orbit({ cx, cy, r, dur = 14 }: { cx: number; cy: number; r: number; dur?: number }) {
  return (
    <g className="pa-orbit" style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: `${dur}s` }}>
      <circle cx={cx} cy={cy - r} r={7} fill={GOLD} />
      <circle cx={cx} cy={cy + r} r={4} fill={CREAM} opacity={0.8} />
    </g>
  );
}

function Motif({ art, id, mode }: { art: Art; id: string; mode: Mode }) {
  switch (art.t) {
    case 'orb':
      return <g><Rings cx={320} cy={170} r={130} /><Orbit cx={320} cy={170} r={108} /><NumberDisc cx={320} cy={165} r={70} n={art.n} id={id} mode={mode} /></g>;
    case 'pair': {
      const pct = Math.max(0, Math.min(100, art.score));
      return (
        <g>
          <circle cx={262} cy={165} r={98} fill={GOLD} fillOpacity={0.08} stroke={GOLD} strokeOpacity={0.5} className="pa-float" />
          <circle cx={378} cy={165} r={98} fill={RED} fillOpacity={0.07} stroke={RED} strokeOpacity={0.45} className="pa-float" style={{ animationDelay: '-2s' }} />
          <NumberDisc cx={215} cy={160} r={52} n={art.a} id={id} mode={mode} />
          <NumberDisc cx={425} cy={160} r={52} n={art.b} id={id} mode={mode} />
          <path d="M320 150 C 305 128, 280 140, 292 162 L 320 190 L 348 162 C 360 140, 335 128, 320 150 Z" fill={RED} className="pa-pulse" />
          <rect x={220} y={300} width={200} height={10} rx={5} fill={CREAM} fillOpacity={0.15} />
          <rect x={220} y={300} width={2 * pct} height={10} rx={5} fill={GOLD} className="pa-grow" />
          <Tx mode={mode} en={`Harmony ${pct}/100`} hi={`सामंजस्य ${pct}/100`} x={320} y={334} textAnchor="middle" fontSize={15} fill={CREAM} />
        </g>
      );
    }
    case 'grid': {
      const size = 74, gap = 10, x0 = 320 - (size * 3 + gap * 2) / 2, y0 = 34;
      return (
        <g>
          {LOSHU.flatMap((row, r) => row.map((n, c) => {
            const x = x0 + c * (size + gap), y = y0 + r * (size + gap);
            const on = art.present.includes(n), miss = art.missing === n;
            return (
              <g key={n} className={on ? 'pa-pop' : undefined} style={{ animationDelay: `${(r * 3 + c) * 0.12}s` }}>
                <rect x={x} y={y} width={size} height={size} rx={12} fill={on ? `url(#${id}-gold)` : 'rgba(255,255,255,0.03)'} stroke={miss ? RED : GOLD} strokeOpacity={miss ? 1 : 0.4} strokeWidth={miss ? 3 : 1.5} strokeDasharray={miss ? '7 6' : undefined} className={miss ? 'pa-pulse' : undefined} />
                <text x={x + size / 2} y={y + size / 2 + 11} textAnchor="middle" fontSize={30} fontWeight={700} fontFamily="Georgia, serif" fill={on ? MAROON : miss ? RED : CREAM} fillOpacity={on || miss ? 1 : 0.35}>{miss ? '?' : n}</text>
              </g>
            );
          }))}
        </g>
      );
    }
    case 'phone':
      return (
        <g>
          <g className="pa-float">
            <rect x={232} y={30} width={130} height={250} rx={22} fill="rgba(0,0,0,0.35)" stroke={GOLD} strokeWidth={2.5} />
            <rect x={246} y={56} width={102} height={190} rx={8} fill="rgba(251,191,36,0.07)" />
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d, i) => <text key={d} x={268 + (i % 3) * 30} y={100 + Math.floor(i / 3) * 44} textAnchor="middle" fontSize={22} fill={CREAM} fontFamily="Georgia, serif" className="pa-twinkle" style={{ animationDelay: `${i * 0.3}s` }}>{d}</text>)}
            <text x={298} y={232} textAnchor="middle" fontSize={22} fill={CREAM} fontFamily="Georgia, serif">0</text>
          </g>
          <path d="M370 150 C 395 150, 405 160, 418 168" stroke={GOLD} strokeWidth={2} fill="none" className="pa-draw" />
          <NumberDisc cx={470} cy={168} r={52} n={art.n} id={id} mode={mode} />
        </g>
      );
    case 'house':
      return (
        <g>
          <g className="pa-float">
            <path d="M200 160 L320 60 L440 160" fill="none" stroke={GOLD} strokeWidth={3} className="pa-draw" />
            <rect x={222} y={158} width={196} height={140} rx={6} fill="rgba(0,0,0,0.3)" stroke={GOLD} strokeWidth={2} />
            <rect x={300} y={218} width={40} height={80} rx={4} fill={`url(#${id}-gold)`} />
            <rect x={240} y={178} width={40} height={34} rx={3} fill={PALE} className="pa-glow" />
            <rect x={360} y={178} width={40} height={34} rx={3} fill={PALE} className="pa-glow" style={{ animationDelay: '-1.5s' }} />
          </g>
          <circle cx={320} cy={120} r={26} fill={MAROON} stroke={GOLD} strokeWidth={2} className="pa-pulse" />
          <text x={320} y={130} textAnchor="middle" fontSize={28} fontWeight={700} fill={PALE} fontFamily="Georgia, serif">{art.n}</text>
          <Tx mode={mode} en={PLANET.en[art.n - 1]} hi={PLANET.hi[art.n - 1]} x={320} y={330} textAnchor="middle" fontSize={16} fill={CREAM} letterSpacing={2} />
        </g>
      );
    case 'year': {
      const ticks = Array.from({ length: 12 }, (_, i) => i);
      return (
        <g>
          {ticks.map((i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={320 + Math.cos(a) * 120} cy={170 + Math.sin(a) * 120} r={i % 3 === 0 ? 7 : 4} fill={GOLD} fillOpacity={0.35 + (i % 4) * 0.15} className="pa-twinkle" style={{ animationDelay: `${i * 0.25}s` }} />; })}
          <circle cx={320} cy={170} r={100} fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" className="pa-draw-long" />
          <NumberDisc cx={320} cy={165} r={62} n={art.n} id={id} mode={mode} sub={false} />
          <Tx mode={mode} en="PERSONAL YEAR" hi="व्यक्तिगत वर्ष" x={320} y={326} textAnchor="middle" fontSize={15} fill={CREAM} letterSpacing={3} />
        </g>
      );
    }
    case 'letters': {
      const ls = art.letters.slice(0, 7).split('');
      const w = 54, x0 = 320 - (ls.length * (w + 8) - 8) / 2;
      return (
        <g>
          {ls.map((ch, i) => (
            <g key={i} className="pa-pop" style={{ animationDelay: `${i * 0.15}s` }}>
              <rect x={x0 + i * (w + 8)} y={70} width={w} height={64} rx={10} fill="rgba(0,0,0,0.3)" stroke={GOLD} strokeOpacity={0.6} />
              <text x={x0 + i * (w + 8) + w / 2} y={113} textAnchor="middle" fontSize={30} fontWeight={700} fill={PALE} fontFamily="Georgia, serif">{ch}</text>
            </g>
          ))}
          <path d="M320 150 L320 186" stroke={GOLD} strokeWidth={2} className="pa-draw" />
          <NumberDisc cx={320} cy={232} r={44} n={art.n} id={id} mode={mode} sub={false} />
          <Tx mode={mode} en="Chaldean name number" hi="कैल्डियन नामांक" x={320} y={326} textAnchor="middle" fontSize={15} fill={CREAM} letterSpacing={2} />
        </g>
      );
    }
    case 'compass': {
      const dirs: [string, string, number][] = [['N', 'उ', 0], ['NE', 'ई', 45], ['E', 'पू', 90], ['SE', 'आ', 135], ['S', 'द', 180], ['SW', 'नै', 225], ['W', 'प', 270], ['NW', 'वा', 315]];
      const full: Record<string, string> = { N: 'North', NE: 'North-East', E: 'East', SE: 'South-East', S: 'South', SW: 'South-West', W: 'West', NW: 'North-West' };
      return (
        <g>
          <Rings cx={320} cy={172} r={140} />
          <g className="pa-orbit" style={{ transformOrigin: '320px 172px', animationDuration: '40s' }}><path d="M320 62 L332 172 L320 282 L308 172 Z" fill={GOLD} fillOpacity={0.35} /></g>
          {dirs.map(([en, hi, deg]) => {
            const a = ((deg - 90) * Math.PI) / 180, x = 320 + Math.cos(a) * 112, y = 172 + Math.sin(a) * 112;
            const good = art.good.includes(full[en]);
            return <g key={en}><circle cx={x} cy={y} r={20} fill={good ? `url(#${id}-gold)` : 'rgba(0,0,0,0.35)'} stroke={good ? GOLD : CREAM} strokeOpacity={good ? 1 : 0.3} className={good ? 'pa-pulse' : undefined} /><Tx mode={mode} en={en} hi={hi} x={x} y={y + 6} textAnchor="middle" fontSize={15} fontWeight={700} fill={good ? MAROON : CREAM} /></g>;
          })}
          <NumberDisc cx={320} cy={170} r={42} n={art.n} id={id} mode={mode} sub={false} />
        </g>
      );
    }
    case 'wheel':
      return (
        <g>
          <Rings cx={320} cy={172} r={150} />
          <g className="pa-orbit" style={{ transformOrigin: '320px 172px', animationDuration: '60s' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n, i) => { const a = (i / 9) * Math.PI * 2 - Math.PI / 2; const x = 320 + Math.cos(a) * 118, y = 172 + Math.sin(a) * 118; return <g key={n}><circle cx={x} cy={y} r={22} fill="rgba(0,0,0,0.4)" stroke={GOLD} strokeOpacity={0.7} /><text x={x} y={y + 8} textAnchor="middle" fontSize={22} fontWeight={700} fill={PALE} fontFamily="Georgia, serif">{n}</text></g>; })}
          </g>
          <circle cx={320} cy={172} r={56} fill={`url(#${id}-disc)`} stroke={GOLD} strokeWidth={2} className="pa-pulse" />
          <text x={320} y={186} textAnchor="middle" fontSize={40} fill={PALE} fontFamily="Georgia, serif">ॐ</text>
        </g>
      );
    case 'portrait':
      return (
        <g>
          <Rings cx={320} cy={168} r={140} />
          <Orbit cx={320} cy={168} r={124} dur={18} />
          <defs><clipPath id={`${id}-clip`}><circle cx={320} cy={168} r={96} /></clipPath></defs>
          <circle cx={320} cy={168} r={100} fill={MAROON} stroke={GOLD} strokeWidth={3} className="pa-pulse" />
          <image href="/images/acharya-nandram-512.png" x={224} y={72} width={192} height={192} preserveAspectRatio="xMidYMin slice" clipPath={`url(#${id}-clip)`} />
          <Tx mode={mode} en="ACHARYA NANDRAM · 15+ YEARS" hi="आचार्य नंदराम · 15+ वर्ष" x={320} y={336} textAnchor="middle" fontSize={15} fill={PALE} letterSpacing={2} />
        </g>
      );
    case 'pen':
      return (
        <g>
          <path d="M150 240 C 200 160, 240 260, 290 190 S 380 150, 420 210 S 480 230, 500 170" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" className="pa-draw-long" />
          <path d="M160 268 L 500 268" stroke={CREAM} strokeOpacity={0.3} strokeWidth={1.5} />
          <g className="pa-float"><path d="M470 80 L520 130 L430 220 L405 228 L413 203 Z" fill={`url(#${id}-gold)`} stroke={GOLD} /><path d="M413 203 L405 228 L430 220" fill={MAROON} /></g>
        </g>
      );
    case 'rings':
      return (
        <g>
          <circle cx={285} cy={175} r={70} fill="none" stroke={GOLD} strokeWidth={10} className="pa-float" />
          <circle cx={355} cy={175} r={70} fill="none" stroke={PALE} strokeWidth={10} className="pa-float" style={{ animationDelay: '-2s' }} />
          <path d="M320 70 l8 16 18 3 -13 12 3 18 -16 -9 -16 9 3 -18 -13 -12 18 -3 z" fill={GOLD} className="pa-pulse" />
          <Tx mode={mode} en="SHUBH VIVAH" hi="शुभ विवाह" x={320} y={300} textAnchor="middle" fontSize={18} fill={CREAM} letterSpacing={4} />
        </g>
      );
    case 'baby':
      return (
        <g>
          <path d="M240 210 Q 320 300 400 210 Z" fill="rgba(0,0,0,0.35)" stroke={GOLD} strokeWidth={2.5} className="pa-float" />
          <path d="M258 210 L 382 210" stroke={GOLD} strokeWidth={2.5} />
          <circle cx={320} cy={150} r={44} fill={`url(#${id}-disc)`} stroke={GOLD} strokeWidth={2} className="pa-pulse" />
          <path d="M300 92 a 50 50 0 1 0 40 0 a 38 38 0 1 1 -40 0" fill={PALE} className="pa-twinkle" />
          <Tx mode={mode} en="A NAME FOR A LIFETIME" hi="जीवन भर का नाम" x={320} y={318} textAnchor="middle" fontSize={15} fill={CREAM} letterSpacing={3} />
        </g>
      );
    case 'shop':
      return (
        <g>
          <g className="pa-float">
            <rect x={220} y={130} width={200} height={150} rx={6} fill="rgba(0,0,0,0.3)" stroke={GOLD} strokeWidth={2} />
            <path d="M205 130 L235 80 L405 80 L435 130 Z" fill={`url(#${id}-gold)`} />
            <rect x={300} y={200} width={40} height={80} fill={MAROON} stroke={GOLD} />
            <rect x={240} y={160} width={44} height={36} fill={PALE} className="pa-glow" />
            <rect x={356} y={160} width={44} height={36} fill={PALE} className="pa-glow" style={{ animationDelay: '-1.5s' }} />
          </g>
          <path d="M455 230 l 30 -40 25 20 35 -60" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" className="pa-draw" />
          <Tx mode={mode} en="LUCKY BUSINESS NAME" hi="शुभ व्यवसाय नाम" x={320} y={322} textAnchor="middle" fontSize={15} fill={CREAM} letterSpacing={3} />
        </g>
      );
  }
}

export function PostArt({ art, mode = 'both', title, className }: { art: Art; mode?: Mode; title?: string; className?: string }) {
  const key = JSON.stringify(art);
  const id = `pa${hash(key)}${mode}`;
  const seed = parseInt(hash(key), 36) % 97;
  return (
    <svg viewBox="0 0 640 360" role="img" aria-label={title} className={`pa-art block h-auto w-full ${className ?? ''}`} xmlns="http://www.w3.org/2000/svg">
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a0e1b" /><stop offset="0.55" stopColor="#140f2b" /><stop offset="1" stopColor="#24130a" /></linearGradient>
        <radialGradient id={`${id}-disc`}><stop offset="0" stopColor="#5b1d2e" /><stop offset="1" stopColor="#1a0b12" /></radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#d4a017" /></linearGradient>
        <radialGradient id={`${id}-neb`} cx="0.8" cy="0.2" r="0.7"><stop offset="0" stopColor="#7c3aed" stopOpacity="0.35" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="640" height="360" rx="22" fill={`url(#${id}-bg)`} />
      <rect width="640" height="360" rx="22" fill={`url(#${id}-neb)`} />
      <Stars seed={seed} />
      <Motif art={art} id={id} mode={mode} />
    </svg>
  );
}
