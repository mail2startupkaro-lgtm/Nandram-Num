/**
 * Destiny Matrix chart as a self-contained SVG string (used on screen, in the printable PDF and on the website).
 * Layout follows the classic chart: A left (day), B top (month), C right (year), D bottom, E centre; F/G/H/I in the corners;
 * two points on each line to the centre, the heart points on the A and B lines, and the $ / ♥ channel in the lower right.
 */
import type { DestinyMatrix } from './matrix';

const C = 300, R = 238;
const COL = { main: '#6d3fc0', centre: '#f2c230', year: '#c0392b', anc: '#ffffff', p2: '#2f6fd6', p1: '#22a6c7', heart: '#2fa864', ch: '#e67e22', line: '#c9a227', text: '#2a1a10' };

function pt(angleDeg: number, r: number): [number, number] { const t = (angleDeg * Math.PI) / 180; return [Math.round(C + r * Math.cos(t)), Math.round(C + r * Math.sin(t))]; }
function dot(x: number, y: number, v: number, r: number, fill: string, light = fill === COL.anc || fill === COL.centre): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${COL.line}" stroke-width="${fill === COL.anc ? 2 : 1.5}"/><text x="${x}" y="${y + r * 0.36}" text-anchor="middle" font-size="${Math.round(r * 0.95)}" font-weight="700" font-family="Georgia,serif" fill="${light ? COL.text : '#fff'}">${v}</text>`;
}
const label = (x: number, y: number, t: string, size = 13, fill = '#8a6d12', anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-family="Georgia,serif" fill="${fill}">${t}</text>`;

export function destinySvg(m: DestinyMatrix, opts: { ages?: boolean; title?: string } = {}): string {
  // angles: A 180 (left), F 225, B 270 (top), G 315, C 0 (right), H 45, D 90 (bottom), I 135
  const spokes: { a: number; o: number; v2: number; v1: number; main: boolean; fill: string }[] = [
    { a: 180, o: m.A, v2: m.a2, v1: m.a1, main: true, fill: COL.main }, { a: 270, o: m.B, v2: m.b2, v1: m.b1, main: true, fill: COL.main },
    { a: 0, o: m.C, v2: m.c2, v1: m.c1, main: true, fill: COL.year }, { a: 90, o: m.D, v2: m.d2, v1: m.d1, main: true, fill: COL.year },
    { a: 225, o: m.F, v2: m.f2, v1: m.f1, main: false, fill: COL.anc }, { a: 315, o: m.G, v2: m.g2, v1: m.g1, main: false, fill: COL.anc },
    { a: 45, o: m.H, v2: m.h2, v1: m.h1, main: false, fill: COL.anc }, { a: 135, o: m.I, v2: m.i2, v1: m.i1, main: false, fill: COL.anc },
  ];
  const outer = (a: number) => pt(a, R);
  const sq1 = [180, 270, 0, 90].map(outer), sq2 = [225, 315, 45, 135].map(outer);
  const poly = (ps: [number, number][]) => `<polygon points="${ps.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${COL.line}" stroke-width="2"/>`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${opts.title ? 640 : 600}" role="img" aria-label="Destiny Matrix chart" style="max-width:100%;height:auto">`;
  s += `<rect width="600" height="${opts.title ? 640 : 600}" fill="#fffaf0" rx="18"/>`;
  s += `<circle cx="${C}" cy="${C}" r="${R + 30}" fill="none" stroke="#e5d3a1" stroke-dasharray="4 6"/>`;
  s += poly(sq1) + poly(sq2);
  // lines through the centre
  s += `<line x1="${sq1[0][0]}" y1="${C}" x2="${sq1[2][0]}" y2="${C}" stroke="#e5d3a1" stroke-width="1.5"/><line x1="${C}" y1="${sq1[1][1]}" x2="${C}" y2="${sq1[3][1]}" stroke="#e5d3a1" stroke-width="1.5"/>`;
  s += `<line x1="${sq2[0][0]}" y1="${sq2[0][1]}" x2="${sq2[2][0]}" y2="${sq2[2][1]}" stroke="#e5d3a1" stroke-width="1.2" stroke-dasharray="3 4"/><line x1="${sq2[1][0]}" y1="${sq2[1][1]}" x2="${sq2[3][0]}" y2="${sq2[3][1]}" stroke="#e5d3a1" stroke-width="1.2" stroke-dasharray="3 4"/>`;
  // money / love channel
  const c1 = pt(0, 118), d1 = pt(90, 118), X = pt(45, 84);
  const mon = [Math.round((c1[0] + X[0]) / 2) + 8, Math.round((c1[1] + X[1]) / 2) + 6] as [number, number], lov = [Math.round((d1[0] + X[0]) / 2) + 6, Math.round((d1[1] + X[1]) / 2) + 8] as [number, number];
  s += `<polyline points="${c1.join(',')} ${mon.join(',')} ${X.join(',')} ${lov.join(',')} ${d1.join(',')}" fill="none" stroke="${COL.ch}" stroke-width="2" stroke-dasharray="5 4"/>`;
  for (const sp of spokes) {
    const [ox, oy] = outer(sp.a), [x2, y2] = pt(sp.a, 172), [x1, y1] = pt(sp.a, 118);
    s += dot(x2, y2, sp.v2, sp.main ? 17 : 14, sp.main ? COL.p2 : '#f6efe0', !sp.main);
    s += dot(x1, y1, sp.v1, sp.main ? 17 : 14, sp.main ? (sp.a === 0 || sp.a === 90 ? COL.ch : COL.p1) : '#f6efe0', !sp.main);
    s += dot(ox, oy, sp.o, sp.main ? 27 : 22, sp.fill);
  }
  // heart points on the A and B lines
  const [ha, hay] = pt(180, 70), [hb, hby] = pt(270, 70);
  s += dot(ha, hay, m.a3, 14, COL.heart) + dot(hb, hby, m.b3, 14, COL.heart);
  s += dot(X[0], X[1], m.x, 15, '#f6efe0', true) + dot(mon[0], mon[1], m.money, 15, COL.ch) + dot(lov[0], lov[1], m.love, 15, '#d64b74');
  s += label(mon[0] + 24, mon[1] + 6, '$', 18, COL.ch) + label(lov[0] + 2, lov[1] + 32, '♥', 18, '#d64b74');
  s += dot(C, C, m.E, 32, COL.centre);
  if (opts.ages !== false) {
    const ages: [number, string][] = [[180, '0'], [225, '10'], [270, '20'], [315, '30'], [0, '40'], [45, '50'], [90, '60'], [135, '70']];
    for (const [a, t] of ages) { const [x, y] = pt(a, R + 46); s += label(x, y + 4, t, 12, '#8a6d12'); }
  }
  if (opts.title) s += label(300, 628, opts.title, 15, COL.text);
  s += '</svg>';
  return s;
}
