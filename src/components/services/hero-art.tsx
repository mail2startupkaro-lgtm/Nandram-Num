/**
 * Animated hero illustration for each service page (pure SVG + CSS, no JavaScript, decorative only).
 * Styles and keyframes: `.ha` block in app/cosmic.css. Animations stop for visitors who prefer reduced motion.
 * Numbers shown are real calculations for the fictional sample client (DOB 14-08-1992 → Moolank 5, Bhagyank 7).
 */
import type { CSSProperties, ReactElement } from 'react';
import type { HeroIcon } from '@/lib/service-hero';

const d = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

export function HeroArt({ kind }: { kind: HeroIcon }) {
  const Art = ARTS[kind] ?? PersonalArt;
  return <svg viewBox="0 0 220 180" className="ha" aria-hidden focusable="false"><Art /></svg>;
}

/* Signature analysis – a signature writes itself with the pen, then the underline and the dot */
const SIG = 'M38 112 C46 66 72 66 62 108 C58 124 78 118 90 96 C96 84 104 84 102 100 C100 114 112 112 120 94 C124 84 132 86 128 100 C126 112 142 108 152 90 C158 80 170 82 182 74';
function SignatureArt() {
  return (
    <>
      <rect x="14" y="26" width="192" height="128" rx="12" className="ha-paper" transform="rotate(-3 110 90)" />
      <line x1="34" y1="132" x2="190" y2="128" className="s sd" strokeDasharray="3 5" />
      <g className="a-sig">
        <path d={SIG} pathLength={1} className="s a-draw-sig" style={{ strokeWidth: 3 }} />
        <path d="M44 138 Q110 148 180 132" pathLength={1} className="s a-draw-ul" style={{ strokeWidth: 2.5 }} />
        <circle cx="190" cy="132" r="3.5" className="f a-dot" />
      </g>
      <g className="a-pen">
        <g>
          <animateMotion dur="5s" repeatCount="indefinite" path={SIG} keyPoints="0;1;1" keyTimes="0;0.5;1" calcMode="linear" />
          <g transform="rotate(35)"><path d="M0 0 L4 -10 L4 -46 Q0 -52 -4 -46 L-4 -10 Z" className="f" /><path d="M0 0 L4 -10 L-4 -10 Z" className="tk" /></g>
        </g>
      </g>
    </>
  );
}

/* Mobile number – digits light up one by one, the total appears, signal waves pulse */
function PhoneArt() {
  const digits = '9827456310'.split('');
  return (
    <>
      <rect x="68" y="10" width="84" height="160" rx="16" className="s ha-body" />
      <rect x="76" y="26" width="68" height="118" rx="6" className="fd" />
      <rect x="100" y="16" width="20" height="4" rx="2" className="f" opacity=".5" />
      {digits.map((n, i) => (
        <text key={i} x={86 + (i % 5) * 12} y={i < 5 ? 58 : 80} className="ha-num a-dig" style={d(i * 0.22)} textAnchor="middle">{n}</text>
      ))}
      <g className="a-pop" style={d(2.4)}>
        <rect x="84" y="96" width="52" height="30" rx="15" className="f" />
        <text x="110" y="117" textAnchor="middle" className="ha-num tk" style={{ fontSize: 17 }}>= 9</text>
      </g>
      <circle cx="110" cy="157" r="5" className="s sd" />
      {[0, 1, 2].map((i) => <path key={i} d={`M${166 + i * 9} ${46 - i * 9} a ${16 + i * 9} ${16 + i * 9} 0 0 1 0 ${36 + i * 18}`} className="s a-wave" style={d(i * 0.35)} />)}
      {[0, 1, 2].map((i) => <path key={`l${i}`} d={`M${54 - i * 9} ${46 - i * 9} a ${16 + i * 9} ${16 + i * 9} 0 0 0 0 ${36 + i * 18}`} className="s a-wave" style={d(i * 0.35)} />)}
    </>
  );
}

/* Lo Shu grid – present numbers pop in, the missing 3 and 6 pulse as question marks */
function LoShuArt() {
  const grid = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const present = new Set([1, 2, 4, 5, 7, 8, 9]);
  let k = 0;
  return (
    <>
      {grid.map((n, i) => {
        const x = 50 + (i % 3) * 42, y = 18 + Math.floor(i / 3) * 42;
        const on = present.has(n);
        return (
          <g key={n}>
            <rect x={x} y={y} width="36" height="36" rx="8" className={on ? 's sd' : 's sd ha-dash'} />
            {on ? (
              <g className="a-pop" style={d(0.3 * k++)}>
                <rect x={x} y={y} width="36" height="36" rx="8" className="f" />
                <text x={x + 18} y={y + 25} textAnchor="middle" className="ha-num tk">{n}</text>
              </g>
            ) : (
              <text x={x + 18} y={y + 25} textAnchor="middle" className="ha-num ts a-pulse" style={d(2.2)}>?</text>
            )}
          </g>
        );
      })}
      <text x="110" y="166" textAnchor="middle" className="ha-small a-fade" style={d(2.4)}>3 · 6 missing</text>
    </>
  );
}

/* Name numerology – letters drop in, Chaldean values appear, the total reduces: N5 A1 M4 E5 = 15 → 6 */
function NameArt() {
  const L = [['N', 5], ['A', 1], ['M', 4], ['E', 5]] as const;
  return (
    <>
      {L.map(([c, v], i) => (
        <g key={c}>
          <text x={44 + i * 44} y="72" textAnchor="middle" className="ha-letter a-drop" style={d(i * 0.2)}>{c}</text>
          <circle cx={44 + i * 44} cy="104" r="13" className="fd a-fade" style={d(0.9 + i * 0.2)} />
          <text x={44 + i * 44} y="110" textAnchor="middle" className="ha-num ts a-fade" style={d(0.9 + i * 0.2)}>{v}</text>
        </g>
      ))}
      <path d="M24 86 H196" pathLength={1} className="s a-draw" style={d(0.6)} />
      <g className="a-pop" style={d(2.2)}>
        <rect x="58" y="134" width="104" height="32" rx="16" className="f" />
        <text x="110" y="156" textAnchor="middle" className="ha-num tk" style={{ fontSize: 16 }}>15 → 6</text>
      </g>
    </>
  );
}

/* Personal report – a report page writes itself, the Moolank and Bhagyank badges pop out, a seal spins */
function PersonalArt() {
  return (
    <>
      <rect x="44" y="12" width="118" height="156" rx="10" className="ha-paper" />
      <text x="103" y="34" textAnchor="middle" className="ha-small">14 · 08 · 1992</text>
      {[52, 66, 80, 94, 108, 122].map((y, i) => <path key={y} d={`M60 ${y} H${i % 2 ? 128 : 146}`} pathLength={1} className="s sd a-draw" style={d(0.25 * i)} />)}
      <g className="a-pop" style={d(1.8)}><circle cx="170" cy="58" r="22" className="f" /><text x="170" y="65" textAnchor="middle" className="ha-num tk" style={{ fontSize: 20 }}>5</text></g>
      <g className="a-pop" style={d(2.2)}><circle cx="178" cy="112" r="18" className="fd ha-ring" /><text x="178" y="118" textAnchor="middle" className="ha-num ts" style={{ fontSize: 17 }}>7</text></g>
      <g className="a-spin"><path d="M72 134 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1 z" className="f" opacity=".85" /></g>
    </>
  );
}

/* Baby name – a rocking moon, twinkling stars and bouncing letter blocks */
function BabyArt() {
  return (
    <>
      <g className="a-rock" style={{ transformOrigin: '70px 20px' }}><path d="M84 18 a34 34 0 1 0 26 52 a28 28 0 1 1 -26 -52 z" className="f" /></g>
      {[[150, 26, 0], [184, 60, 0.6], [128, 70, 1.2], [36, 92, 1.8], [196, 104, 0.9]].map(([x, y, t]) => (
        <path key={`${x}`} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} className="f a-twinkle" style={d(t)} />
      ))}
      {['A', 'B', 'C'].map((c, i) => (
        <g key={c} className="a-bounce" style={d(i * 0.25)}>
          <rect x={56 + i * 38} y="126" width="32" height="32" rx="6" className={i === 1 ? 'f' : 'fd ha-ring'} />
          <text x={72 + i * 38} y="149" textAnchor="middle" className={`ha-num ${i === 1 ? 'tk' : 'ts'}`}>{c}</text>
        </g>
      ))}
    </>
  );
}

/* Couple compatibility – two numbers move together, the heart beats, small hearts float up */
const HEART = 'M0 6 C-14 -6 -6 -20 0 -10 C6 -20 14 -6 0 6 Z';
function CoupleArt() {
  return (
    <>
      <path d="M58 92 Q110 40 162 92" pathLength={1} className="s sd a-draw" />
      <g className="a-nearL"><circle cx="58" cy="96" r="28" className="f" /><text x="58" y="104" textAnchor="middle" className="ha-num tk" style={{ fontSize: 22 }}>3</text></g>
      <g className="a-nearR"><circle cx="162" cy="96" r="28" className="fd ha-ring" /><text x="162" y="104" textAnchor="middle" className="ha-num ts" style={{ fontSize: 22 }}>6</text></g>
      <g transform="translate(110 100) scale(1.8)"><g className="a-beat"><path d={HEART} className="ha-heart" /></g></g>
      {[[92, 0], [126, 1.3], [110, 2.4]].map(([x, t]) => <g key={x} transform={`translate(${x} 150) scale(.6)`}><g className="a-up" style={d(t)}><path d={HEART} className="ha-heart" /></g></g>)}
    </>
  );
}

/* Business name – a shop sign whose letters switch on like neon, sparkles around */
function StoreArt() {
  const word = 'BRAND'.split('');
  return (
    <>
      <rect x="36" y="20" width="148" height="40" rx="8" className="s ha-body" />
      {word.map((c, i) => <text key={i} x={62 + i * 24} y="48" textAnchor="middle" className="ha-letter a-neon" style={{ ...d(i * 0.3), fontSize: 22 }}>{c}</text>)}
      <path d="M40 72 H180 L188 92 H32 Z" className="f" opacity=".9" />
      {[0, 2, 4, 6].map((i) => <path key={i} d={`M${40 + i * 20} 72 H${60 + i * 20} L${32 + (i + 1) * 22.29} 92 H${32 + i * 22.29} Z`} className="tk" opacity=".35" />)}
      <rect x="44" y="92" width="132" height="70" className="s ha-body" />
      <rect x="96" y="112" width="28" height="50" rx="3" className="fd ha-ring" />
      <rect x="56" y="106" width="28" height="24" rx="3" className="fd" /><rect x="136" y="106" width="28" height="24" rx="3" className="fd" />
      {[[22, 30, 0.4], [198, 46, 1.2], [200, 120, 2]].map(([x, y, t]) => <path key={x} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} className="f a-twinkle" style={d(t)} />)}
    </>
  );
}

/* Complete business report – growth bars rise and a trend arrow draws upward */
function BusinessArt() {
  const bars = [30, 46, 40, 66, 92];
  return (
    <>
      <path d="M26 160 H200" className="s sd" />
      {bars.map((h, i) => <rect key={i} x={40 + i * 30} y={160 - h} width="20" height={h} rx="4" className={`${i === 4 ? 'f' : 'fd ha-ring'} a-grow`} style={d(i * 0.2)} />)}
      <path d="M40 120 L80 100 L110 108 L150 72 L186 40" pathLength={1} className="s a-draw" style={{ ...d(1.1), strokeWidth: 3 }} />
      <path d="M172 38 L188 38 L188 54" className="s a-fade" style={{ ...d(2), strokeWidth: 3 }} />
      <g className="a-pop" style={d(2.3)}><circle cx="188" cy="38" r="5" className="f" /></g>
    </>
  );
}

/* Business compatibility – a match meter needle swings and settles in the green zone */
function CompatArt() {
  return (
    <>
      <path d="M30 120 A80 80 0 0 1 70 51" className="ha-arc ha-bad" />
      <path d="M74 49 A80 80 0 0 1 146 49" className="ha-arc ha-mid" />
      <path d="M150 51 A80 80 0 0 1 190 120" className="ha-arc ha-good" />
      {[-80, -40, 0, 40, 80].map((a) => <line key={a} x1="110" y1="52" x2="110" y2="60" className="s sd" transform={`rotate(${a} 110 120)`} />)}
      <g className="a-needle"><path d="M107 120 L110 56 L113 120 Z" className="f" /></g>
      <circle cx="110" cy="120" r="9" className="f" />
      <g transform="translate(86 136)"><rect x="0" y="6" width="48" height="32" rx="6" className="s ha-body" /><path d="M16 6 V2 H32 V6" className="s" /><path d="M0 20 H48" className="s sd" /></g>
      <text x="176" y="146" textAnchor="middle" className="ha-small a-fade" style={d(2)}>✓ match</text>
    </>
  );
}

/* Personal year – the 9-year cycle with a glowing marker travelling round, and this year's number in the centre */
function YearArt() {
  return (
    <>
      <circle cx="110" cy="90" r="66" className="s sd" />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n, i) => {
        const a = (i / 9) * Math.PI * 2 - Math.PI / 2, x = 110 + Math.cos(a) * 66, y = 90 + Math.sin(a) * 66;
        return <g key={n}><circle cx={x} cy={y} r="11" className={n === 7 ? 'f' : 'ha-chip'} /><text x={x} y={y + 4.5} textAnchor="middle" className={`ha-num ${n === 7 ? 'tk' : 'ts'}`} style={{ fontSize: 12 }}>{n}</text></g>;
      })}
      <g className="a-orbit" style={{ transformOrigin: '110px 90px' }}><circle cx="110" cy="24" r="15" className="ha-glow" /></g>
      <g className="a-flip">
        <rect x="84" y="62" width="52" height="56" rx="8" className="ha-paper" />
        <rect x="84" y="62" width="52" height="14" rx="6" className="f" />
        <text x="110" y="108" textAnchor="middle" className="ha-num ts" style={{ fontSize: 26 }}>7</text>
      </g>
    </>
  );
}

/* White-label (professionals page) – the report cover takes on "your" brand: logo stamps in, brand colour cycles */
function WhiteLabelArt() {
  return (
    <>
      <rect x="40" y="16" width="112" height="150" rx="10" className="ha-paper" />
      <rect x="40" y="16" width="112" height="40" rx="10" className="a-brand" />
      <rect x="40" y="44" width="112" height="12" className="a-brand" />
      <circle cx="96" cy="56" r="20" className="s sd ha-dash" style={{ fill: 'hsl(var(--card))' }} />
      <g className="a-pop" style={d(0.6)}>
        <circle cx="96" cy="56" r="20" className="f" />
        <path d="M96 44 l3.5 8 8.5 .8 -6.5 5.6 2 8.4 -7.5 -4.5 -7.5 4.5 2 -8.4 -6.5 -5.6 8.5 -.8 z" className="tk" />
      </g>
      <text x="96" y="96" textAnchor="middle" className="ha-small a-fade" style={{ ...d(1), fill: 'hsl(var(--foreground))', letterSpacing: '.2em' }}>YOUR BRAND</text>
      {[110, 122, 134, 146].map((y, i) => <path key={y} d={`M58 ${y} H${i % 2 ? 118 : 134}`} pathLength={1} className="s sd a-draw" style={d(1.2 + i * 0.2)} />)}
      <g className="a-pop" style={d(2.2)}>
        <rect x="146" y="118" width="46" height="24" rx="6" className="f" />
        <text x="169" y="135" textAnchor="middle" className="ha-num tk" style={{ fontSize: 12 }}>PDF</text>
      </g>
      {[[178, 34, 0.3], [24, 70, 1.1], [186, 82, 1.9]].map(([x, y, t]) => <path key={x} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} className="f a-twinkle" style={d(t)} />)}
    </>
  );
}

/* Destiny Matrix – the eight-pointed star draws itself, the arcana pop in around it and the centre glows */
function MatrixArt() {
  const C = [110, 90], R = 72;
  const pt = (deg: number, r = R) => [C[0] + r * Math.cos((deg * Math.PI) / 180), C[1] + r * Math.sin((deg * Math.PI) / 180)];
  const sq = (a: number[]) => a.map((d) => pt(d).map((v) => v.toFixed(1)).join(',')).join(' ');
  const outer: [number, number][] = [[180, 14], [270, 8], [0, 21], [90, 7], [225, 22], [315, 11], [45, 10], [135, 21]];
  return (
    <>
      <circle cx={C[0]} cy={C[1]} r="86" className="s sd ha-dash a-spin" style={{ ['--t' as string]: '24s' } as CSSProperties} />
      <polygon points={sq([180, 270, 0, 90])} pathLength={1} className="s a-draw" />
      <polygon points={sq([225, 315, 45, 135])} pathLength={1} className="s a-draw" style={d(0.4)} />
      {outer.map(([deg, n], i) => { const [x, y] = pt(deg); const main = i < 4; return (
        <g key={deg} className="a-pop" style={d(0.8 + i * 0.15)}>
          <circle cx={x} cy={y} r={main ? 13 : 11} className={main ? 'f' : 'fd ha-ring'} />
          <text x={x} y={y + 4.5} textAnchor="middle" className={`ha-num ${main ? 'tk' : 'ts'}`} style={{ fontSize: main ? 13 : 11 }}>{n}</text>
        </g>); })}
      <g className="a-pop" style={d(2.2)}><circle cx={C[0]} cy={C[1]} r="17" className="f" /><text x={C[0]} y={C[1] + 5.5} textAnchor="middle" className="ha-num tk" style={{ fontSize: 16 }}>5</text></g>
      <circle cx={C[0]} cy={C[1]} r="24" className="ha-glow a-pulse" style={d(2.6)} />
    </>
  );
}

/* Pythagorean birth chart – the 3×3 Pythagoras square fills digit by digit, the line totals light up */
function SquareArt() {
  const cells = ['11', '44', '7', '22', '5', '8', '33', '', '99'];
  return (
    <>
      {cells.map((t, i) => {
        const x = 47 + (i % 3) * 42, y = 18 + Math.floor(i / 3) * 42;
        return (
          <g key={i}>
            <rect x={x} y={y} width="40" height="40" rx="5" className={t ? 's sd' : 's sd ha-dash'} />
            {t ? <text x={x + 20} y={y + 26} textAnchor="middle" className="ha-num ts a-fade" style={{ ...d(0.25 * i), fontSize: 15 }}>{t}</text>
              : <text x={x + 20} y={y + 26} textAnchor="middle" className="ha-num ts a-pulse" style={d(2.4)}>?</text>}
          </g>
        );
      })}
      {[0, 1, 2].map((r) => <g key={`r${r}`} className="a-pop" style={d(2.4 + r * 0.2)}><circle cx="186" cy={38 + r * 42} r="10" className="f" /><text x="186" y={42 + r * 42} textAnchor="middle" className="ha-num tk" style={{ fontSize: 10 }}>{[5, 4, 4][r]}</text></g>)}
      {[0, 1, 2].map((c) => <g key={`c${c}`} className="a-pop" style={d(3 + c * 0.2)}><circle cx={68 + c * 42} cy="160" r="10" className="f" /><text x={68 + c * 42} y="164" textAnchor="middle" className="ha-num tk" style={{ fontSize: 10 }}>{[6, 3, 4][c]}</text></g>)}
    </>
  );
}

const ARTS: Record<HeroIcon, () => ReactElement> = {
  matrix: MatrixArt, square: SquareArt,
  label: WhiteLabelArt,
  pen: SignatureArt, phone: PhoneArt, grid: LoShuArt, type: NameArt, user: PersonalArt, baby: BabyArt,
  heart: CoupleArt, store: StoreArt, building: BusinessArt, briefcase: CompatArt, calendar: YearArt,
};
