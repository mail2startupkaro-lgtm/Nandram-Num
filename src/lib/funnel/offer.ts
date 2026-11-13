/**
 * Limited-time offer for the services funnel.
 * Consumer Protection (Dark Patterns) Guidelines 2023 forbid "false urgency", so the countdown always runs to the
 * real end date the owner sets in Admin → Offer & leads, and the offer disappears by itself once that date passes.
 */
import { getSetting, type OfferSettings } from '@/lib/admin/settings';

export interface LiveOffer { endsAt: string; label: { en: string; hi: string } }

/** Pure: the offer to show at `now`, or null when it is switched off, has no valid date, or has ended. */
export function liveOffer(o: OfferSettings, now: Date = new Date()): LiveOffer | null {
  if (!o.enabled || !o.endsAt) return null;
  const end = new Date(o.endsAt);
  if (Number.isNaN(end.getTime()) || end.getTime() <= now.getTime()) return null;
  return { endsAt: end.toISOString(), label: { en: o.labelEn.trim() || 'Limited-time offer', hi: o.labelHi.trim() || 'सीमित समय का ऑफ़र' } };
}

export async function getLiveOffer(): Promise<LiveOffer | null> {
  try { return liveOffer(await getSetting('offer')); } catch { return null; } // no database (build / preview) → no offer
}

/** "30 Nov 2026, 11:59 pm IST" */
export function formatOfferEnd(iso: string, lang: 'en' | 'hi' = 'en') {
  return new Date(iso).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' IST';
}

/** WhatsApp for the funnel CTAs: CONTACT_WHATSAPP (digits with country code), else the consultancy number 88199-99374. */
export const funnelWhatsapp = () => (process.env.CONTACT_WHATSAPP || '').replace(/\D/g, '') || '918819999374';
