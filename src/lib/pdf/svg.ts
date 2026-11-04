/**
 * Server-side vector graphics for the PDF (pure SVG strings – deterministic, no browser charting needed):
 * grids, radar, bars, gauge, ring, compass, swatches, planet icons, number medallions, remedy icons, mandala.
 */
import type { PlanetId } from '@/lib/numerology/data/planets';
import { COLOUR_HEX, type PdfTheme } from './themes';

export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (n: number) => Math.round(n * 100) / 100;

// ---------- Mandala ----------
export function mandala(size: number, colour: string, opacity = 1, petals = 24): string {
  const ring = (r: number) => `<circle r="${r}" />`;
  const pet = Array.from({ length: petals }, (_, i) => {
    const a = (360 / petals) * i;
    return `<g transform="rotate(${a})"><ellipse cx="0" cy="-54" rx="8" ry="28"/><path d="M0 -92 L7 -78 L0 -64 L-7 -78 Z"/></g>`;
  }).join('');
  const inner = Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30})"><path d="M0 -14 C 10 -24, 10 -34, 0 -42 C -10 -34, -10 -24, 0 -14 Z"/></g>`).join('');
  const spokes = Array.from({ length: 36 }, (_, i) => `<line x1="0" y1="-62" x2="0" y2="-70" transform="rotate(${i * 10})"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="${size}" height="${size}" style="opacity:${opacity}"><g fill="none" stroke="${colour}" stroke-width="0.6">${[96, 92, 70, 62, 46, 12].map(ring).join('')}${pet}${inner}${spokes}<polygon points="0,-30 26,15 -26,15"/><polygon points="0,30 26,-15 -26,-15"/></g></svg>`;
}

// ---------- Ornaments ----------
export function divider(t: PdfTheme, width = 220): string {
  const mid = width / 2;
  const centre = t.ornament === 'lotus'
    ? `<path d="M${mid} 2 C ${mid + 6} 8, ${mid + 6} 14, ${mid} 18 C ${mid - 6} 14, ${mid - 6} 8, ${mid} 2 Z" fill="${t.accent}"/><path d="M${mid - 4} 16 C ${mid - 14} 14, ${mid - 16} 8, ${mid - 12} 4 C ${mid - 8} 10, ${mid - 6} 12, ${mid - 4} 16 Z M${mid + 4} 16 C ${mid + 14} 14, ${mid + 16} 8, ${mid + 12} 4 C ${mid + 8} 10, ${mid + 6} 12, ${mid + 4} 16 Z" fill="${t.accent}" opacity=".7"/>`
    : t.ornament === 'star'
      ? `<path d="M${mid} 1 L${mid + 3} 7 L${mid + 9} 10 L${mid + 3} 13 L${mid} 19 L${mid - 3} 13 L${mid - 9} 10 L${mid - 3} 7 Z" fill="${t.accent}"/>`
      : t.ornament === 'sun'
        ? `<circle cx="${mid}" cy="10" r="5" fill="${t.accent}"/>${Array.from({ length: 8 }, (_, i) => `<line x1="${mid}" y1="1" x2="${mid}" y2="3.5" stroke="${t.accent}" stroke-width="1.4" transform="rotate(${i * 45} ${mid} 10)"/>`).join('')}`
        : `<rect x="${mid - 3}" y="7" width="6" height="6" transform="rotate(45 ${mid} 10)" fill="${t.accent}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" viewBox="0 0 ${width} 20"><line x1="0" y1="10" x2="${mid - 18}" y2="10" stroke="${t.accent}" stroke-width="0.8"/><line x1="${mid + 18}" y1="10" x2="${width}" y2="10" stroke="${t.accent}" stroke-width="0.8"/>${centre}</svg>`;
}

// ---------- Number medallion ----------
export function numberMedallion(n: number | string, t: PdfTheme, size = 92, label?: string): string {
  const petals = Array.from({ length: 16 }, (_, i) => `<ellipse cx="50" cy="12" rx="5" ry="10" transform="rotate(${i * 22.5} 50 50)" fill="${t.accent}" opacity="0.28"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${petals}<circle cx="50" cy="50" r="33" fill="${t.paper}" stroke="${t.accent}" stroke-width="2"/><circle cx="50" cy="50" r="29" fill="none" stroke="${t.primary}" stroke-width="0.6"/><text x="50" y="${label ? 57 : 61}" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="${String(n).length > 1 ? 26 : 34}" fill="${t.primary}">${esc(n)}</text>${label ? `<text x="50" y="71" text-anchor="middle" font-family="Poppins" font-size="7" fill="${t.muted}">${esc(label)}</text>` : ''}</svg>`;
}

// ---------- Planet icons ----------
export function planetIcon(p: PlanetId, t: PdfTheme, size = 34): string {
  const c = t.primary, a = t.accent;
  const body: Record<PlanetId, string> = {
    sun: `<circle cx="20" cy="20" r="7" fill="${a}"/>${Array.from({ length: 12 }, (_, i) => `<line x1="20" y1="5" x2="20" y2="9" stroke="${a}" stroke-width="1.6" stroke-linecap="round" transform="rotate(${i * 30} 20 20)"/>`).join('')}`,
    moon: `<path d="M24 7 A13 13 0 1 0 24 33 A10 10 0 1 1 24 7 Z" fill="${a}"/>`,
    jupiter: `<circle cx="20" cy="20" r="11" fill="${a}"/><path d="M10 16 H30 M9.5 21 H30.5 M11 26 H29" stroke="${c}" stroke-width="1.4" opacity=".6"/>`,
    rahu: `<circle cx="20" cy="20" r="11" fill="${c}"/><path d="M20 9 A11 11 0 0 1 20 31 Z" fill="${a}"/>`,
    mercury: `<ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="${c}" stroke-width="1.2" transform="rotate(-25 20 20)"/><circle cx="20" cy="20" r="6" fill="${a}"/>`,
    venus: `<path d="M20 5 L23 16 L34 20 L23 24 L20 35 L17 24 L6 20 L17 16 Z" fill="${a}"/>`,
    ketu: `<circle cx="27" cy="13" r="5" fill="${a}"/><path d="M23 16 Q 14 24 6 34 M25 18 Q 18 27 12 35 M21 15 Q 12 20 5 27" stroke="${c}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    saturn: `<circle cx="20" cy="20" r="8" fill="${a}"/><ellipse cx="20" cy="20" rx="16" ry="4.5" fill="none" stroke="${c}" stroke-width="1.6" transform="rotate(-18 20 20)"/>`,
    mars: `<circle cx="17" cy="23" r="9" fill="${a}"/><path d="M23 17 L32 8 M25 8 H32 V15" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">${body[p]}</svg>`;
}

// ---------- Remedy icons ----------
export type RemedyIcon = 'gem' | 'colour' | 'compass' | 'mantra' | 'daan' | 'fast' | 'habit' | 'signature' | 'calendar' | 'home' | 'number';
export function remedyIcon(kind: RemedyIcon, t: PdfTheme, size = 30): string {
  const c = t.primary, a = t.accent;
  const g: Record<RemedyIcon, string> = {
    gem: `<path d="M8 15 L14 8 H26 L32 15 L20 33 Z" fill="${a}" opacity=".85"/><path d="M8 15 H32 M14 8 L17 15 L20 33 L23 15 L26 8" stroke="${c}" stroke-width="1" fill="none"/>`,
    colour: `<circle cx="14" cy="15" r="7" fill="${a}"/><circle cx="26" cy="15" r="7" fill="${c}" opacity=".8"/><circle cx="20" cy="25" r="7" fill="${t.good}" opacity=".7"/>`,
    compass: `<circle cx="20" cy="20" r="14" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M20 8 L24 20 L20 32 L16 20 Z" fill="${a}"/><path d="M20 8 L24 20 L16 20 Z" fill="${c}"/>`,
    mantra: `<path d="M20 6 C 26 14, 26 18, 20 22 C 14 18, 14 14, 20 6 Z" fill="${a}"/><path d="M8 26 Q 20 36 32 26 L30 30 Q 20 38 10 30 Z" fill="${c}"/>`,
    daan: `<path d="M7 20 H33 Q 31 32 20 32 Q 9 32 7 20 Z" fill="${a}"/><circle cx="16" cy="16" r="3" fill="${c}"/><circle cx="23" cy="15" r="3" fill="${c}"/><circle cx="20" cy="11" r="3" fill="${c}"/>`,
    fast: `<rect x="8" y="10" width="24" height="22" rx="3" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M8 16 H32" stroke="${c}" stroke-width="1.5"/><path d="M14 6 V12 M26 6 V12" stroke="${c}" stroke-width="1.5"/><circle cx="20" cy="24" r="4" fill="${a}"/>`,
    calendar: `<rect x="8" y="10" width="24" height="22" rx="3" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M8 16 H32" stroke="${c}" stroke-width="1.5"/><path d="M13 21 h3 M19 21 h3 M25 21 h3 M13 26 h3 M19 26 h3" stroke="${a}" stroke-width="2"/>`,
    habit: `<path d="M20 34 C 20 24, 12 20, 8 10 C 18 12, 22 18, 20 34 Z" fill="${t.good}" opacity=".8"/><path d="M20 34 C 20 22, 28 18, 33 8 C 24 10, 19 18, 20 34 Z" fill="${a}"/>`,
    signature: `<path d="M6 28 C 12 14, 16 30, 20 20 S 28 14, 34 22" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M6 33 H34" stroke="${a}" stroke-width="1.2"/>`,
    home: `<path d="M7 20 L20 8 L33 20" stroke="${c}" stroke-width="1.8" fill="none"/><rect x="11" y="19" width="18" height="13" fill="${a}" opacity=".8"/><rect x="17" y="24" width="6" height="8" fill="${c}"/>`,
    number: `<circle cx="20" cy="20" r="13" fill="${a}" opacity=".85"/><text x="20" y="25" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="14" fill="${t.paper}">#</text>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">${g[kind]}</svg>`;
}

// ---------- 3×3 grid ----------
export interface GridCell { number: number; row: number; col: number; count: number; status: 'missing' | 'present' | 'repeated'; label?: string }
export function gridSvg(cells: GridCell[], t: PdfTheme, size = 210, opts: { highlight?: number[]; labels?: boolean; colourA?: string } = {}): string {
  const cell = size / 3, gap = 5;
  const parts = cells.map((c) => {
    const x = c.col * cell + gap / 2, y = c.row * cell + gap / 2, w = cell - gap;
    const fill = c.status === 'missing' ? t.missing : c.status === 'repeated' ? t.repeated : t.present;
    const stroke = c.status === 'missing' ? t.border : c.status === 'repeated' ? t.primary : t.accent;
    const txt = c.count === 0 ? String(c.number) : String(c.number).repeat(Math.min(c.count, 4));
    const fs = txt.length >= 4 ? cell * 0.22 : txt.length === 3 ? cell * 0.26 : cell * 0.34;
    const hl = opts.highlight?.includes(c.number) ? `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${w + 4}" rx="9" fill="none" stroke="${t.accent}" stroke-width="2.5"/>` : '';
    return `${hl}<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${c.status === 'missing' ? 1 : 1.6}" ${c.status === 'missing' ? 'stroke-dasharray="4 3"' : ''}/>
      <text x="${x + w / 2}" y="${y + w / 2 + fs * 0.35}" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="${f(fs)}" fill="${c.status === 'missing' ? t.border : t.ink}">${txt}</text>
      ${c.count > 1 ? `<text x="${x + w - 6}" y="${y + 13}" text-anchor="end" font-family="Poppins" font-weight="600" font-size="9" fill="${t.primary}">×${c.count}</text>` : ''}
      ${opts.labels && c.label ? `<text x="${x + w / 2}" y="${y + w - 7}" text-anchor="middle" font-family="Poppins" font-size="8" fill="${t.muted}">${esc(c.label)}</text>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${parts}</svg>`;
}

// ---------- Radar ----------
export function radarSvg(axes: { label: string; value: number; value2?: number }[], t: PdfTheme, size = 260): string {
  const padX = 58, W = size + padX * 2;
  const cx = W / 2, cy = size / 2 + 4, R = size * 0.34, n = axes.length;
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  const rings = [25, 50, 75, 100].map((v) => `<polygon points="${axes.map((_, i) => pt(i, v).map(f).join(',')).join(' ')}" fill="none" stroke="${t.border}" stroke-width="0.6" opacity=".7"/>`).join('');
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" stroke="${t.border}" stroke-width="0.5" opacity=".7"/>`; }).join('');
  const poly = (k: 'value' | 'value2', col: string, op: number) => `<polygon points="${axes.map((a, i) => pt(i, a[k] ?? 0).map(f).join(',')).join(' ')}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-width="1.8"/>`;
  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, 124);
    const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end';
    return `<text x="${f(x)}" y="${f(y + 3)}" text-anchor="${anchor}" font-family="Poppins" font-size="9.5" fill="${t.ink}">${esc(a.label)} <tspan font-weight="600" fill="${t.primary}">${a.value}</tspan></text>`;
  }).join('');
  const dots = axes.map((a, i) => { const [x, y] = pt(i, a.value); return `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="${t.chart[1]}"/>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${size}" width="${W}" height="${size}">${rings}${spokes}${axes.some((a) => a.value2 !== undefined) ? poly('value2', t.chart[1], 0.15) : ''}${poly('value', t.chart[0], 0.3)}${dots}${labels}</svg>`;
}

// ---------- Bars (Personal Year timeline) ----------
export function barsSvg(data: { label: string; value: number; highlight?: boolean; sub?: string }[], t: PdfTheme, width = 470, height = 190, max = 9): string {
  const padL = 22, padB = 34, padT = 14, w = width - padL - 6, h = height - padB - padT, bw = w / data.length;
  const grid = [1, 3, 5, 7, 9].map((v) => { const y = padT + h - (h * v) / max; return `<line x1="${padL}" x2="${width - 6}" y1="${f(y)}" y2="${f(y)}" stroke="${t.border}" stroke-width="0.4" opacity=".6"/><text x="${padL - 6}" y="${f(y + 3)}" text-anchor="end" font-family="Poppins" font-size="8" fill="${t.muted}">${v}</text>`; }).join('');
  const bars = data.map((d, i) => {
    const bh = (h * d.value) / max, x = padL + i * bw + bw * 0.18, y = padT + h - bh;
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(bw * 0.64)}" height="${f(bh)}" rx="4" fill="${d.highlight ? t.chart[1] : t.chart[0]}" opacity="${d.highlight ? 1 : 0.8}"/>
      <text x="${f(x + bw * 0.32)}" y="${f(y - 4)}" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="11" fill="${t.ink}">${d.value}</text>
      <text x="${f(x + bw * 0.32)}" y="${height - padB + 13}" text-anchor="middle" font-family="Poppins" font-size="8.5" fill="${t.ink}">${esc(d.label)}</text>
      ${d.sub ? `<text x="${f(x + bw * 0.32)}" y="${height - padB + 25}" text-anchor="middle" font-family="Poppins" font-size="6.8" fill="${t.muted}">${esc(d.sub)}</text>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}${bars}</svg>`;
}

// ---------- Gauge & ring ----------
export function scoreColour(v: number, t: PdfTheme) { return v >= 80 ? t.good : v >= 65 ? t.accent : v >= 45 ? t.warn : t.bad; }

export function gaugeSvg(value: number, t: PdfTheme, label: string, size = 170): string {
  const r = 62, cx = 85, cy = 82;
  const arc = (from: number, to: number) => { const a0 = Math.PI * (1 - from / 100), a1 = Math.PI * (1 - to / 100); return `M ${f(cx + r * Math.cos(a0))} ${f(cy - r * Math.sin(a0))} A ${r} ${r} 0 0 1 ${f(cx + r * Math.cos(a1))} ${f(cy - r * Math.sin(a1))}`; };
  const ticks = [0, 25, 50, 75, 100].map((v) => { const a = Math.PI * (1 - v / 100); return `<line x1="${f(cx + (r + 10) * Math.cos(a))}" y1="${f(cy - (r + 10) * Math.sin(a))}" x2="${f(cx + (r + 15) * Math.cos(a))}" y2="${f(cy - (r + 15) * Math.sin(a))}" stroke="${t.muted}" stroke-width="1"/>`; }).join('');
  const na = Math.PI * (1 - value / 100);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 118" width="${size}" height="${f(size * 118 / 170)}">
    <path d="${arc(0, 100)}" stroke="${t.soft}" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="${arc(0, Math.max(0.5, value))}" stroke="${scoreColour(value, t)}" stroke-width="14" fill="none" stroke-linecap="round"/>
    ${ticks}
    <line x1="${cx}" y1="${cy}" x2="${f(cx + (r - 18) * Math.cos(na))}" y2="${f(cy - (r - 18) * Math.sin(na))}" stroke="${t.ink}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${t.ink}"/>
    <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="22" fill="${t.ink}">${value}</text>
    <text x="${cx}" y="${cy + 36}" text-anchor="middle" font-family="Poppins" font-size="8.5" fill="${t.muted}">${esc(label)}</text></svg>`;
}

export function ringSvg(value: number, t: PdfTheme, label: string, size = 150): string {
  const r = 56, c = 2 * Math.PI * r;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="${size}" height="${size}"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="${t.primary}"/><stop offset="1" stop-color="${t.accent}"/></linearGradient></defs>
    <circle cx="75" cy="75" r="${r}" fill="none" stroke="${t.soft}" stroke-width="13"/>
    <circle cx="75" cy="75" r="${r}" fill="none" stroke="url(#rg)" stroke-width="13" stroke-linecap="round" stroke-dasharray="${f(c)}" stroke-dashoffset="${f(c * (1 - value / 100))}" transform="rotate(-90 75 75)"/>
    <text x="75" y="80" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="30" fill="${t.ink}">${value}%</text>
    <text x="75" y="98" text-anchor="middle" font-family="Poppins" font-size="9" fill="${t.muted}">${esc(label)}</text></svg>`;
}

// ---------- Compass (Kua) ----------
const DIR_ANGLE: Record<string, number> = { North: 0, 'North-East': 45, East: 90, 'South-East': 135, South: 180, 'South-West': 225, West: 270, 'North-West': 315 };
const DIR_ABBR: Record<string, string> = { North: 'N', 'North-East': 'NE', East: 'E', 'South-East': 'SE', South: 'S', 'South-West': 'SW', West: 'W', 'North-West': 'NW' };
export function compassSvg(good: Record<string, string>, bad: Record<string, string>, t: PdfTheme, size = 220): string {
  const cx = 110, cy = 110;
  const goodSet = new Map(Object.entries(good).map(([k, v]) => [v, k]));
  const badSet = new Set(Object.values(bad));
  const sectors = Object.entries(DIR_ANGLE).map(([d, a]) => {
    const a0 = ((a - 22.5 - 90) * Math.PI) / 180, a1 = ((a + 22.5 - 90) * Math.PI) / 180, R = 84;
    const col = goodSet.has(d) ? t.good : badSet.has(d) ? t.bad : t.soft;
    return `<path d="M${cx} ${cy} L${f(cx + R * Math.cos(a0))} ${f(cy + R * Math.sin(a0))} A${R} ${R} 0 0 1 ${f(cx + R * Math.cos(a1))} ${f(cy + R * Math.sin(a1))} Z" fill="${col}" fill-opacity="${goodSet.has(d) ? 0.28 : badSet.has(d) ? 0.14 : 0.5}" stroke="${t.paper}" stroke-width="1.5"/>`;
  }).join('');
  const labels = Object.entries(DIR_ANGLE).map(([d, a]) => {
    const rad = ((a - 90) * Math.PI) / 180;
    const x = cx + 98 * Math.cos(rad), y = cy + 98 * Math.sin(rad);
    const tag = goodSet.get(d);
    const ix = cx + 58 * Math.cos(rad), iy = cy + 58 * Math.sin(rad);
    return `<text x="${f(x)}" y="${f(y + 4)}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="11" fill="${goodSet.has(d) ? t.good : badSet.has(d) ? t.bad : t.muted}">${DIR_ABBR[d]}</text>${tag ? `<text x="${f(ix)}" y="${f(iy + 3)}" text-anchor="middle" font-family="Poppins" font-size="7.2" fill="${t.ink}">${esc({ success: 'Success', health: 'Health', relationships: 'Love', personalGrowth: 'Growth' }[tag] ?? tag)}</text>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="${size}" height="${size}">${sectors}<circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="${t.border}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="20" fill="${t.paper}" stroke="${t.accent}" stroke-width="1.5"/><path d="M${cx} ${cy - 16} L${cx + 5} ${cy} L${cx} ${cy + 16} L${cx - 5} ${cy} Z" fill="${t.primary}"/>${labels}</svg>`;
}

// ---------- Colour swatches ----------
export function swatches(names: string[], t: PdfTheme): string {
  return names.map((n) => {
    const hex = COLOUR_HEX[n.toLowerCase()] ?? t.soft;
    return `<span class="sw"><i style="background:${hex}"></i>${esc(n)}</span>`;
  }).join('');
}

// ---------- Timeline (pinnacles) ----------
export function timelineSvg(items: { number: number; fromAge: number; toAge: number | null; current: boolean }[], t: PdfTheme, width = 470): string {
  const h = 92, pad = 16, seg = (width - pad * 2) / items.length;
  const parts = items.map((p, i) => {
    const x = pad + i * seg, cx = x + seg / 2;
    return `<rect x="${f(x + 3)}" y="40" width="${f(seg - 6)}" height="10" rx="5" fill="${p.current ? t.chart[1] : t.chart[0]}" opacity="${p.current ? 1 : 0.55}"/>
      <circle cx="${f(cx)}" cy="22" r="15" fill="${p.current ? t.primary : t.paper}" stroke="${t.accent}" stroke-width="1.5"/>
      <text x="${f(cx)}" y="28" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="15" fill="${p.current ? t.paper : t.primary}">${p.number}</text>
      <text x="${f(cx)}" y="66" text-anchor="middle" font-family="Poppins" font-size="9" fill="${t.ink}">${p.fromAge}–${p.toAge ?? '+'}</text>
      ${p.current ? `<text x="${f(cx)}" y="80" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="8" fill="${t.primary}">NOW</text>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${h}" width="${width}" height="${h}">${parts}</svg>`;
}

/** Simple monogram used when no logo has been uploaded. */
export function monogram(text: string, t: PdfTheme, size = 56, onDark = false): string {
  const initials = text.replace(/[\[\]]/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ॐ';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="${size}" height="${size}"><circle cx="30" cy="30" r="28" fill="none" stroke="${onDark ? t.coverAccent : t.accent}" stroke-width="1.6"/><circle cx="30" cy="30" r="23" fill="none" stroke="${onDark ? t.coverAccent : t.accent}" stroke-width="0.6"/><text x="30" y="37" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="19" fill="${onDark ? t.coverInk : t.primary}">${esc(initials)}</text></svg>`;
}

export function portraitPlaceholder(name: string, t: PdfTheme, size = 92): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="48" fill="${t.soft}" stroke="${t.accent}" stroke-width="2"/><circle cx="50" cy="40" r="16" fill="${t.accent}" opacity=".55"/><path d="M20 84 C 26 62, 74 62, 80 84" fill="${t.accent}" opacity=".55"/></svg>`;
}
