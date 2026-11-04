/** Four PDF themes (Section 8). All use light "paper" for print; covers are full-bleed. White-label overrides merge on top. */

export type ThemeId = 'royal-gold-maroon' | 'cosmic-blue' | 'saffron-cream' | 'minimal-white';

export interface PdfTheme {
  id: ThemeId;
  name: string;
  paper: string;          // page background (drawn under every body page)
  ink: string;            // body text
  muted: string;          // secondary text
  primary: string;        // headings, key accents
  accent: string;         // gold / highlight
  soft: string;           // tinted panels
  border: string;         // page frame & rules
  coverBg: string;        // cover background (CSS)
  coverInk: string;
  coverAccent: string;
  present: string; repeated: string; missing: string; // grid cell fills
  good: string; warn: string; bad: string;
  chart: [string, string];
  ornament: 'lotus' | 'star' | 'sun' | 'line';
}

export const THEMES: Record<ThemeId, PdfTheme> = {
  'royal-gold-maroon': {
    id: 'royal-gold-maroon', name: 'Royal Gold & Maroon',
    paper: '#FBF6EC', ink: '#2A1A1F', muted: '#6E5A5E', primary: '#7A1E2C', accent: '#B8892B', soft: '#F3E6CF', border: '#B8892B',
    coverBg: 'radial-gradient(circle at 50% 35%, #8E2433 0%, #5A1220 55%, #3A0A14 100%)', coverInk: '#FBEFD9', coverAccent: '#E2B85A',
    present: '#F1DDB0', repeated: '#E7B9B5', missing: '#FFFFFF', good: '#2E7D4F', warn: '#B5651D', bad: '#A12A2A',
    chart: ['#B8892B', '#7A1E2C'], ornament: 'lotus',
  },
  'cosmic-blue': {
    id: 'cosmic-blue', name: 'Cosmic Blue',
    paper: '#F5F7FC', ink: '#18203A', muted: '#5A6482', primary: '#22306B', accent: '#C9A227', soft: '#E3E9F7', border: '#5468B0',
    coverBg: 'radial-gradient(circle at 50% 30%, #2E3F8F 0%, #151E4A 55%, #0A0F2A 100%)', coverInk: '#EEF1FF', coverAccent: '#E7C766',
    present: '#D9E2F8', repeated: '#C8C2EE', missing: '#FFFFFF', good: '#2C7A5B', warn: '#B07A12', bad: '#B03A48',
    chart: ['#3D55B5', '#C9A227'], ornament: 'star',
  },
  'saffron-cream': {
    id: 'saffron-cream', name: 'Saffron & Cream',
    paper: '#FFF9EE', ink: '#3A2410', muted: '#7A6048', primary: '#C25A00', accent: '#E39B1B', soft: '#FCE9C8', border: '#E39B1B',
    coverBg: 'radial-gradient(circle at 50% 35%, #F7A23B 0%, #E07B12 50%, #A84D05 100%)', coverInk: '#FFF8EA', coverAccent: '#FFE2A3',
    present: '#FDE2B0', repeated: '#F8C49A', missing: '#FFFFFF', good: '#3E7D2E', warn: '#B5651D', bad: '#B23A1E',
    chart: ['#E07B12', '#8A3B0A'], ornament: 'sun',
  },
  'minimal-white': {
    id: 'minimal-white', name: 'Minimal White',
    paper: '#FFFFFF', ink: '#1F2328', muted: '#626A73', primary: '#1F2328', accent: '#9A7B3F', soft: '#F3F4F6', border: '#D0D4DA',
    coverBg: 'linear-gradient(180deg, #FFFFFF 0%, #F4F1EA 100%)', coverInk: '#1F2328', coverAccent: '#9A7B3F',
    present: '#ECE6D8', repeated: '#D9CDB2', missing: '#FFFFFF', good: '#2F6F4E', warn: '#9A6A1A', bad: '#9E3A3A',
    chart: ['#9A7B3F', '#1F2328'], ornament: 'line',
  },
};

export interface Branding {
  brandName: string;
  expertName: string;
  expertTitle?: string;
  contactLine?: string;   // phone / email / city
  website?: string;
  bookingUrl?: string;    // encoded into the QR code on the last page
  logoDataUrl?: string;   // white-label uploads (data: URLs)
  photoDataUrl?: string;
  signatureDataUrl?: string;
  colours?: Partial<Pick<PdfTheme, 'primary' | 'accent' | 'border'>>;
}

export const DEFAULT_BRANDING: Branding = {
  brandName: process.env.BRAND_NAME || 'mynumerologist.com',
  expertName: process.env.EXPERT_NAME || '[Expert Name]',
  expertTitle: 'Numerologist · Vedic, Chaldean & Lo Shu',
  contactLine: process.env.EXPERT_CONTACT || '[Phone] · [Email] · [City]',
  website: process.env.BRAND_WEBSITE || '',
  bookingUrl: process.env.BOOKING_URL || 'https://example.com/book',
};

export function resolveTheme(id: ThemeId | undefined, b?: Branding): PdfTheme {
  const base = THEMES[id ?? 'royal-gold-maroon'] ?? THEMES['royal-gold-maroon'];
  return { ...base, ...(b?.colours ?? {}) };
}

/** Colour names used by the remedies → swatch hex values. */
export const COLOUR_HEX: Record<string, string> = {
  golden: '#D4A017', orange: '#F28C28', saffron: '#F4A300', yellow: '#F5D33F', white: '#FFFFFF', cream: '#FFF3C8', silver: '#C0C0C0',
  'light green': '#9BD99B', 'light orange': '#FFB870', grey: '#9A9A9A', 'electric blue': '#2F6BFF', 'smoky shades': '#7D7D85', green: '#2E9E4F',
  turquoise: '#30C5C0', pink: '#F4A6C1', 'light blue': '#A9CCF2', pastels: '#E8D5F2', 'smoky grey': '#8A8A90', 'light yellow': '#FFF1A6',
  multicolour: 'conic-gradient(red, orange, yellow, green, blue, violet, red)', 'navy blue': '#1F2F6B', 'dark blue': '#16235A', black: '#111111',
  violet: '#7F3FBF', red: '#D22B2B', maroon: '#7A1E2C', coral: '#FF7F61',
};
