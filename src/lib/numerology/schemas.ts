/** Zod schema for the Input Sheet (Section 5.1). Shared by the wizard, API and JSON import. */
import { z } from 'zod';
import { isValidDate, parseDate } from './core/date';

const LATIN_MSG = 'Write the name in English letters (A–Z) – numerology values are calculated from the English spelling.';
const hasLatin = (s: string) => /[A-Za-z\u00C0-\u024F]/.test(s);
const latinName = (min: number, msg?: string) => z.string().trim().min(min, msg).refine(hasLatin, LATIN_MSG);

const dobString = z
  .string()
  .trim()
  .refine((s) => {
    try { return isValidDate(parseDate(s)); } catch { return false; }
  }, 'Enter a valid date (DD-MM-YYYY or YYYY-MM-DD)');

export const LIFE_CONCERNS = ['career', 'business', 'money', 'marriage', 'love', 'health', 'children', 'education', 'foreignTravel', 'property', 'legal'] as const;

export const PartnerSchema = z.object({
  name: latinName(2),
  gender: z.enum(['male', 'female', 'other']),
  dob: dobString,
  mobile: z.string().optional(),
});

export const ClientInputBase = z.object({
  fullName: latinName(2, 'Full name is required'),
  commonName: z.string().trim().optional().refine((s) => !s || hasLatin(s), LATIN_MSG),
  hindiName: z.string().trim().optional(),
  gender: z.enum(['male', 'female', 'other']),
  kuaBasis: z.enum(['male', 'female']).optional(),
  dob: dobString,
  timeOfBirth: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  placeOfBirth: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'engaged', 'divorced', 'widowed']).optional(),
  profession: z.string().optional(),
  education: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  mobile: z.string().optional(),
  /** Never persisted. Only accepted together with consent. */
  aadhaar: z.string().optional(),
  aadhaarConsent: z.boolean().default(false),
  concerns: z.array(z.enum(LIFE_CONCERNS)).default([]),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  partner: PartnerSchema.optional(),
});

export const ClientInputSchema = ClientInputBase.refine((v) => !v.aadhaar || v.aadhaarConsent, { message: 'Consent is required to use Aadhaar', path: ['aadhaarConsent'] });

/** What is stored for a profile: everything except the Aadhaar number. */
export const StoredInputSchema = ClientInputBase.omit({ aadhaar: true });
export type StoredInput = z.infer<typeof StoredInputSchema>;

export type ClientInput = z.infer<typeof ClientInputSchema>;
