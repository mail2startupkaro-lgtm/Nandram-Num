/**
 * Self-hosted web fonts (from the @fontsource packages) via next/font/local.
 * Replaces the render-blocking Google Fonts stylesheet: no third-party request, files are hashed,
 * cached forever, preloaded where it matters and use font-display: swap with metric-matched fallbacks (less layout shift).
 */
import localFont from 'next/font/local';

export const cinzel = localFont({
  src: [
    { path: '../../node_modules/@fontsource/cinzel/files/cinzel-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/cinzel/files/cinzel-latin-700-normal.woff2', weight: '700' },
    { path: '../../node_modules/@fontsource/cinzel/files/cinzel-latin-900-normal.woff2', weight: '900' },
  ],
  variable: '--font-cinzel', display: 'swap', fallback: ['Georgia', 'serif'],
});

export const cormorant = localFont({
  src: [
    { path: '../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--font-cormorant', display: 'swap', preload: false, fallback: ['Georgia', 'serif'],
});

export const playfair = localFont({
  src: [
    { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2', weight: '600' },
    { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-playfair', display: 'swap', preload: false, fallback: ['Georgia', 'serif'],
});

export const poppins = localFont({
  src: [
    { path: '../../node_modules/@fontsource/poppins/files/poppins-latin-300-normal.woff2', weight: '300' },
    { path: '../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--font-poppins', display: 'swap', fallback: ['system-ui', 'sans-serif'],
});

/** Devanagari glyphs only – Latin text in Hindi pages falls through to Poppins. */
export const notoDevanagari = localFont({
  src: [
    { path: '../../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-600-normal.woff2', weight: '600' },
  ],
  variable: '--font-deva', display: 'swap', preload: false, fallback: ['sans-serif'], adjustFontFallback: false,
});

export const fontVariables = [cinzel, cormorant, playfair, poppins, notoDevanagari].map((f) => f.variable).join(' ');
