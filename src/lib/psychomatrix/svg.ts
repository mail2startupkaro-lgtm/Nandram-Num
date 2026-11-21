/** Pythagoras Square chart as a self-contained SVG string (screen, PDF and the free tool). */
import { cellText, type CellDigit, type Psychomatrix } from './engine';
import { CELLS } from './meanings';
import type { Lang } from '@/lib/report/blocks';

const ORDER: CellDigit[][] = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];

/** The 3×3 square with line totals: rows on the right, columns below, diagonals in the corners. */
export function psychomatrixSvg(p: Psychomatrix, lang: Lang = 'en'): string {
  const cs = 150, x0 = 60, y0 = 60, W = x0 + cs * 3 + 110, H = y0 + cs * 3 + 90;
  const tot = (id: string) => p.lines.find((l) => l.id === id)!.total;
  const name = (d: CellDigit) => CELLS[d].name[lang].split(/ [&और]/)[0];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pythagoras square" style="max-width:100%;height:auto"><rect width="${W}" height="${H}" rx="18" fill="#fffaf0"/>`;
  ORDER.forEach((row, r) => row.forEach((d, c) => {
    const x = x0 + c * cs, y = y0 + r * cs, n = p.counts[d];
    const fill = n === 0 ? '#f3ece0' : n >= 3 ? '#f6e2a8' : '#fff';
    const txt = cellText(d, n);
    const size = txt.length > 5 ? 26 : txt.length > 3 ? 32 : 40;
    s += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${fill}" stroke="#c9a227" stroke-width="2"/>`;
    s += `<text x="${x + cs / 2}" y="${y + cs / 2 + 8}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${size}" fill="${n ? '#7a1f2b' : '#b8a98f'}">${txt}</text>`;
    s += `<text x="${x + cs / 2}" y="${y + cs - 14}" text-anchor="middle" font-family="Georgia,'Noto Sans Devanagari',sans-serif" font-size="13" fill="#8a6d12">${name(d)}</text>`;
  }));
  const ln = (x: number, y: number, v: number, anchor = 'middle') => `<circle cx="${x}" cy="${y - 7}" r="20" fill="#7a1f2b"/><text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Georgia,serif" font-weight="700" font-size="18" fill="#fff">${v}</text>`;
  ['purpose', 'family', 'stability'].forEach((id, r) => { s += ln(x0 + cs * 3 + 40, y0 + r * cs + cs / 2 + 7, tot(id)); });
  ['selfEsteem', 'money', 'talent'].forEach((id, c) => { s += ln(x0 + c * cs + cs / 2, y0 + cs * 3 + 42, tot(id)); });
  s += ln(x0 + cs * 3 + 40, y0 + cs * 3 + 42, tot('spirituality')) + ln(x0 + cs * 3 + 40, y0 - 22, tot('temperament'));
  return `${s}</svg>`;
}

