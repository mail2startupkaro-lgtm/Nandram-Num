/** Embeds the report fonts as base64 @font-face so PDFs look identical on every server (no network needed). */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FILES: [family: string, weight: number, style: 'normal' | 'italic', pkg: string, file: string, range?: string][] = [
  ['Playfair Display', 600, 'normal', '@fontsource/playfair-display', 'playfair-display-latin-600-normal.woff2'],
  ['Playfair Display', 700, 'normal', '@fontsource/playfair-display', 'playfair-display-latin-700-normal.woff2'],
  ['Playfair Display', 600, 'italic', '@fontsource/playfair-display', 'playfair-display-latin-600-italic.woff2'],
  ['Poppins', 400, 'normal', '@fontsource/poppins', 'poppins-latin-400-normal.woff2'],
  ['Poppins', 500, 'normal', '@fontsource/poppins', 'poppins-latin-500-normal.woff2'],
  ['Poppins', 600, 'normal', '@fontsource/poppins', 'poppins-latin-600-normal.woff2'],
  ['Noto Sans Devanagari', 400, 'normal', '@fontsource/noto-sans-devanagari', 'noto-sans-devanagari-devanagari-400-normal.woff2', 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF'],
  ['Noto Sans Devanagari', 600, 'normal', '@fontsource/noto-sans-devanagari', 'noto-sans-devanagari-devanagari-600-normal.woff2', 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF'],
];

let cached: string | null = null;

function pkgDir(pkg: string): string {
  // Resolved from the project root; next.config includes these files in the server bundle trace.
  return path.join(process.cwd(), 'node_modules', pkg);
}

export function fontFaceCss(): string {
  if (cached) return cached;
  cached = FILES.map(([family, weight, style, pkg, file, range]) => {
    const b64 = readFileSync(path.join(pkgDir(pkg), 'files', file)).toString('base64');
    return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');${range ? `unicode-range:${range};` : ''}}`;
  }).join('\n');
  return cached;
}
