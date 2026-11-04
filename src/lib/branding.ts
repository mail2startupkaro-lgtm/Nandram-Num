/** White-label branding for Pro experts (logo, photo, signature, colours, contact, booking link). */
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type Db } from '@/lib/db/client';
import { brandings, type BrandingRow } from '@/lib/db/schema';
import { getSetting } from '@/lib/admin/settings';
import { getAccount } from '@/lib/billing/entitlements';
import type { Branding, ThemeId } from '@/lib/pdf/themes';

const MAX_IMAGE_BYTES = 400 * 1024;
const MAGIC: Record<string, (b: Buffer) => boolean> = {
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
};

/** Accepts only real PNG/JPEG/WebP data URLs (checked by magic bytes) up to 400 KB. SVG is refused (can carry scripts). */
export function validateImageDataUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) throw new z.ZodError([{ code: 'custom', path: ['image'], message: 'Upload a PNG, JPEG or WebP image.' }]);
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_IMAGE_BYTES) throw new z.ZodError([{ code: 'custom', path: ['image'], message: 'Image must be under 400 KB.' }]);
  if (!MAGIC[m[1]](buf)) throw new z.ZodError([{ code: 'custom', path: ['image'], message: 'The file is not a valid image.' }]);
  return v;
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();
export const BrandingInput = z.object({
  brandName: z.string().trim().min(2).max(80), expertName: z.string().trim().min(2).max(80), expertTitle: z.string().max(120).optional().nullable(),
  contactLine: z.string().max(160).optional().nullable(), website: z.string().url().max(200).optional().nullable().or(z.literal('')),
  bookingUrl: z.string().url().max(300).optional().nullable().or(z.literal('')),
  logo: z.string().optional().nullable(), photo: z.string().optional().nullable(), signature: z.string().optional().nullable(),
  colours: z.object({ primary: hex, accent: hex, border: hex }).optional().nullable(),
  defaultTheme: z.enum(['royal-gold-maroon', 'cosmic-blue', 'saffron-cream', 'minimal-white']).optional().nullable(),
});

export async function getBranding(userId: string, db: Db = getDb()): Promise<BrandingRow | null> {
  return (await db.select().from(brandings).where(eq(brandings.userId, userId)).limit(1))[0] ?? null;
}

export async function saveBranding(userId: string, raw: unknown, db: Db = getDb()) {
  const b = BrandingInput.parse(raw);
  const row = {
    brandName: b.brandName, expertName: b.expertName, expertTitle: b.expertTitle ?? null, contactLine: b.contactLine ?? null, website: b.website || null, bookingUrl: b.bookingUrl || null,
    logo: validateImageDataUrl(b.logo), photo: validateImageDataUrl(b.photo), signature: validateImageDataUrl(b.signature), colours: b.colours ?? null, defaultTheme: b.defaultTheme ?? null,
  };
  await db.insert(brandings).values({ userId, ...row }).onConflictDoUpdate({ target: brandings.userId, set: { ...row, updatedAt: new Date() } });
  return getBranding(userId, db);
}

/** Expert voice used by the narrative writer for this owner (white-label only). */
export async function personaFor(userId: string | null, db: Db = getDb()): Promise<{ expertName: string; brandName: string } | undefined> {
  if (!userId || !(await getAccount(userId, db)).features.whiteLabel) return undefined;
  const b = await getBranding(userId, db);
  return b ? { expertName: b.expertName, brandName: b.brandName } : undefined;
}

/** Branding + theme to use for a PDF owned by `userId` (white-label only on plans that include it). */
export async function pdfStyleFor(userId: string | null, requested?: string | null, db: Db = getDb()): Promise<{ branding?: Partial<Branding>; theme: ThemeId }> {
  const themes = await getSetting('themes', db);
  const own = userId && (await getAccount(userId, db)).features.whiteLabel ? await getBranding(userId, db) : null;
  const pick = (t?: string | null) => (t && themes.enabled.includes(t) ? (t as ThemeId) : undefined);
  const theme = pick(requested) ?? pick(own?.defaultTheme) ?? (themes.defaultTheme as ThemeId);
  const adminColours = themes.overrides[theme] ?? {};
  if (!own) return { theme, branding: Object.keys(adminColours).length ? { colours: adminColours } : undefined };
  return {
    theme,
    branding: {
      brandName: own.brandName, expertName: own.expertName, expertTitle: own.expertTitle ?? undefined, contactLine: own.contactLine ?? undefined,
      website: own.website ?? undefined, bookingUrl: own.bookingUrl ?? undefined, logoDataUrl: own.logo ?? undefined, photoDataUrl: own.photo ?? undefined,
      signatureDataUrl: own.signature ?? undefined, colours: { ...adminColours, ...(own.colours ?? {}) },
    },
  };
}
