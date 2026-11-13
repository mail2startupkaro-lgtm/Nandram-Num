/** Key/value app settings edited from the admin panel (seller details, themes, prompt overrides). */
import { eq } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { appSettings } from '@/lib/db/schema';

export interface SellerSettings { legalName: string; gstin: string; address: string; state: string; stateCode: string; sac: string; email: string; phone: string; invoicePrefix: string }
export interface ThemeSettings { defaultTheme: string; enabled: string[]; overrides: Record<string, { primary?: string; accent?: string; border?: string }> }
export interface PromptSettings { extraStyleRules: string; sectionBriefs: Record<string, string> }
export interface AnalyticsSettings {
  measurementId: string;
  gtmId: string;
  enabled: boolean;
  trackPageViews: boolean;
  trackReadings: boolean;
  trackCheckouts: boolean;
  trackPdfDownloads: boolean;
  trackServices: boolean;
}
/** Limited-time offer shown on /services and the service pages. Counts down to a REAL end date set by the owner; never resets. */
export interface OfferSettings { enabled: boolean; endsAt: string; labelEn: string; labelHi: string }

export const SETTING_DEFAULTS = {
  seller: {
    legalName: process.env.SELLER_LEGAL_NAME || '[Legal business name]', gstin: process.env.SELLER_GSTIN || '', address: process.env.SELLER_ADDRESS || '[Registered address]',
    state: process.env.SELLER_STATE || 'Rajasthan', stateCode: process.env.SELLER_STATE_CODE || '08', sac: process.env.SELLER_SAC || '999799',
    email: process.env.SELLER_EMAIL || '', phone: process.env.SELLER_PHONE || '', invoicePrefix: process.env.INVOICE_PREFIX || 'INV',
  } as SellerSettings,
  themes: { defaultTheme: 'royal-gold-maroon', enabled: ['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white'], overrides: {} } as ThemeSettings,
  prompts: { extraStyleRules: '', sectionBriefs: {} } as PromptSettings,
  analytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_ID || process.env.GA_MEASUREMENT_ID || '',
    gtmId: process.env.NEXT_PUBLIC_GTM_ID || 'GTM-NPNKXF4B',
    enabled: true,
    trackPageViews: true,
    trackReadings: true,
    trackCheckouts: true,
    trackPdfDownloads: true,
    trackServices: true,
  } as AnalyticsSettings,
  offer: { enabled: false, endsAt: '', labelEn: 'Limited-time offer', labelHi: 'सीमित समय का ऑफ़र' } as OfferSettings,
};
export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSetting<K extends SettingKey>(key: K, db: Db = getDb()): Promise<(typeof SETTING_DEFAULTS)[K]> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return { ...SETTING_DEFAULTS[key], ...((row?.value as object) ?? {}) } as (typeof SETTING_DEFAULTS)[K];
}

export async function setSetting<K extends SettingKey>(key: K, value: (typeof SETTING_DEFAULTS)[K], db: Db = getDb()) {
  await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}
