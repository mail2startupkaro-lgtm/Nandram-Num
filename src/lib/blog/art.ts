/**
 * Illustration specs for blog posts. Each spec is drawn as an animated, theme-matched SVG by
 * `components/blog/post-art.tsx` (hero images and in-article figures), so posts need no image files.
 */
export type Art =
  | { t: 'orb'; n: number }
  | { t: 'pair'; a: number; b: number; score: number }
  | { t: 'grid'; present: number[]; missing?: number }
  | { t: 'phone'; n: number }
  | { t: 'house'; n: number }
  | { t: 'year'; n: number }
  | { t: 'letters'; letters: string; n: number }
  | { t: 'compass'; n: number; good: string[] }
  | { t: 'wheel' }
  | { t: 'portrait' }
  | { t: 'pen' }
  | { t: 'rings' }
  | { t: 'baby' }
  | { t: 'shop' };
