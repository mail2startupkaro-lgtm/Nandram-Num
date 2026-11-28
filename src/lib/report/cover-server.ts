/**
 * Full-page branded cover + Report Reading Guide / services CTA for the reports that are printed from HTML
 * (Destiny Matrix, birth chart, Business reports). Used by /api/admin/report-cover (admin screens) and by the
 * automatic delivery, so both produce the same cover.
 */
import { coverCss, coverInner } from '@/lib/pdf/cover';
import { fontFaceCss } from '@/lib/pdf/fonts';
import { DEFAULT_BRANDING, resolveTheme, type Branding, type ThemeId } from '@/lib/pdf/themes';
import { printExtras } from '@/lib/report/guide-cta';
import type { CoverWithExtras, PrintExtrasKind } from '@/lib/report/print-extras';

export interface CoverInput {
  title: string; subtitle?: string; clientName: string; preparedBy?: string;
  facts?: [string, string][]; lang?: 'en' | 'hi'; theme?: ThemeId; extras?: PrintExtrasKind;
}

export async function buildCover(b: CoverInput): Promise<CoverWithExtras> {
  const branding = DEFAULT_BRANDING as Branding;
  const lang = b.lang ?? 'en';
  const theme = resolveTheme(b.theme ?? 'royal-gold-maroon', branding);
  const extras = b.extras ? await printExtras(lang, b.extras, theme, b.preparedBy) : undefined;
  return { css: `${fontFaceCss()}${coverCss(theme)}`, html: coverInner({ ...b, facts: b.facts ?? [], lang, theme, branding }), extras };
}
