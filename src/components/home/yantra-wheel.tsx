'use client';
import * as React from 'react';
import { planetOf } from '@/lib/numerology/data/planets';

/** Rotating numerology yantra: number ring, lotus petals, shatkona, orbiting planets and a cycling core number. */
export function YantraWheel({ lang }: { lang: 'en' | 'hi' }) {
  const [n, setN] = React.useState(9);
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => { setShow(false); setTimeout(() => { setN((x) => (x % 9) + 1); setShow(true); }, 400); }, 2200);
    return () => clearInterval(id);
  }, []);
  const p = planetOf(n);
  return (
    <div className="cz-wheel" aria-hidden>
      <svg viewBox="-200 -200 400 400">
        <defs>
          <linearGradient id="czg" x1="0" x2="1"><stop offset="0" stopColor="#ffe39a" /><stop offset="1" stopColor="#e3b54f" /></linearGradient>
          <radialGradient id="czr"><stop offset="0" stopColor="#ff8f3c" stopOpacity=".35" /><stop offset="1" stopColor="#ff8f3c" stopOpacity="0" /></radialGradient>
        </defs>
        <circle r="200" fill="url(#czr)" />
        <g className="cz-w-outer" fill="none" stroke="url(#czg)" strokeWidth=".8">
          <circle r="188" /><circle r="170" strokeDasharray="2 6" />
          {Array.from({ length: 72 }, (_, i) => <line key={i} x1={0} y1={-188} x2={0} y2={i % 2 ? -182 : -176} transform={`rotate(${i * 5})`} />)}
          <g fill="#e3b54f" stroke="none" style={{ fontFamily: 'var(--font-cinzel), serif' }} fontSize="17" fontWeight="700" textAnchor="middle">
            {Array.from({ length: 18 }, (_, j) => <text key={j} x={0} y={-151} transform={`rotate(${j * 20})`}>{(j % 9) + 1}</text>)}
          </g>
        </g>
        <g className="cz-w-mid" fill="none" stroke="#e3b54f" strokeWidth=".7" opacity=".85">
          <circle r="140" />
          {Array.from({ length: 16 }, (_, k) => <ellipse key={k} cx={0} cy={-118} rx={10} ry={24} transform={`rotate(${k * 22.5})`} />)}
        </g>
        <g className="cz-w-inner" fill="none" stroke="#e3b54f" strokeWidth=".9" opacity=".9">
          <polygon points="0,-110 95,55 -95,55" /><polygon points="0,110 95,-55 -95,-55" />
          <polygon points="0,-82 71,41 -71,41" opacity=".6" /><polygon points="0,82 71,-41 -71,-41" opacity=".6" />
          <circle r="110" strokeDasharray="1 4" />
        </g>
      </svg>
      <div className="cz-orbit"><i /></div>
      <div className="cz-orbit o2"><i /></div>
      <div className="cz-core">
        <div>
          <b style={{ opacity: show ? 1 : 0, transform: show ? 'none' : 'scale(.6)' }}>{n}</b>
          <small>{lang === 'hi' ? p.devanagari : p.name}</small>
        </div>
      </div>
    </div>
  );
}
