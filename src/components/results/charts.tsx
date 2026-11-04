'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Bar, BarChart, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const GOLD = 'hsl(var(--gold))';
const MAROON = 'hsl(var(--maroon))';
const MUTED = 'hsl(var(--muted-foreground))';

const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--gold) / 0.4)', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' };

export function LifeRadar({ data, second }: { data: { area: string; value: number; value2?: number }[]; second?: boolean }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="area" tick={{ fill: MUTED, fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.35} strokeWidth={2} isAnimationActive={false} />
          {second && <Radar dataKey="value2" stroke={MAROON} fill={MAROON} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />}
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function YearBars({ data, currentYear, themeOf }: { data: { year: number; personalYear: number }[]; currentYear: number; themeOf: (n: number) => string }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
          <YAxis domain={[0, 9]} ticks={[1, 3, 5, 7, 9]} tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: 'hsl(var(--gold) / 0.08)' }} contentStyle={tooltipStyle}
            formatter={(v: number) => [`${v} · ${themeOf(v)}`, 'PY']} />
          <Bar dataKey="personalYear" isAnimationActive={false} radius={[6, 6, 0, 0]} label={{ position: 'top', fill: 'hsl(var(--foreground))', fontSize: 12 }}>
            {data.map((d) => <Cell key={d.year} fill={d.year === currentYear ? MAROON : GOLD} fillOpacity={d.year === currentYear ? 1 : 0.75} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Semi-circular score meter (0–100). */
export function Gauge({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const r = 70, c = Math.PI * r;
  const colour = value >= 80 ? 'hsl(var(--success))' : value >= 65 ? GOLD : value >= 45 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 105" className="w-44" role="img" aria-label={`${label}: ${value} / 100`}>
        <path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        <motion.path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke={colour} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.1, ease: 'easeOut' }} />
        <text x="90" y="85" textAnchor="middle" className="fill-foreground font-serif" fontSize="30" fontWeight="700">{value}</text>
      </svg>
      <p className="-mt-1 text-sm font-semibold">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Full-circle compatibility ring. */
export function Ring({ value, label }: { value: number; label: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 130 130" className="w-36" role="img" aria-label={`${label}: ${value}%`}>
      <defs><linearGradient id="ringGrad" x1="0" x2="1"><stop offset="0" stopColor={MAROON} /><stop offset="1" stopColor={GOLD} /></linearGradient></defs>
      <circle cx="65" cy="65" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
      <motion.circle cx="65" cy="65" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="12" strokeLinecap="round" transform="rotate(-90 65 65)"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.2 }} />
      <text x="65" y="70" textAnchor="middle" className="fill-foreground font-serif" fontSize="28" fontWeight="700">{value}%</text>
      <text x="65" y="90" textAnchor="middle" className="fill-muted-foreground" fontSize="10">{label}</text>
    </svg>
  );
}
