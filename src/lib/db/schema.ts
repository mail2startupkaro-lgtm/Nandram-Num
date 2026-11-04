/**
 * Database schema (PostgreSQL – Supabase, Neon or any Postgres 14+), defined with Drizzle ORM.
 * PRIVACY: personal data (inputs, results, report text) is stored AES-256-GCM encrypted.
 * There is deliberately no column that could hold a full Aadhaar number – only its last 4 digits.
 */
import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['super_admin', 'expert', 'customer']);
export const moduleEnum = pgEnum('report_module', ['dob', 'name', 'mobile', 'aadhaar', 'couple', 'complete']);
export const statusEnum = pgEnum('report_status', ['draft', 'awaiting_review', 'final']);

const id = () => text('id').primaryKey().default(sql`gen_random_uuid()::text`);
const created = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: id(),
  email: varchar('email', { length: 320 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  name: text('name'),
  role: roleEnum('role').notNull().default('customer'),
  expertId: text('expert_id'), // customer accounts created under a consultant
  googleSub: varchar('google_sub', { length: 64 }).unique(),
  credits: integer('credits').notNull().default(0),
  billingState: varchar('billing_state', { length: 60 }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  disabledAt: timestamp('disabled_at', { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
});

export const clientProfiles = pgTable('client_profiles', {
  id: id(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** Display name for dashboards/search (the full input lives encrypted in input_enc). */
  displayName: text('display_name').notNull(),
  inputEnc: text('input_enc').notNull(),
  aadhaarLast4: varchar('aadhaar_last4', { length: 4 }),
  consentAt: timestamp('consent_at', { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ owner: index('client_profiles_owner_idx').on(t.ownerId, t.updatedAt) }));

export const reports = pgTable('reports', {
  id: id(),
  profileId: text('profile_id').notNull().references(() => clientProfiles.id, { onDelete: 'cascade' }),
  module: moduleEnum('module').notNull(),
  version: integer('version').notNull(),
  status: statusEnum('status').notNull().default('draft'),
  inputHash: varchar('input_hash', { length: 64 }).notNull(),
  engineVersion: varchar('engine_version', { length: 20 }).notNull(),
  asOf: varchar('as_of', { length: 10 }).notNull(),
  resultEnc: text('result_enc').notNull(),
  narrativeEnc: text('narrative_enc'),
  theme: varchar('theme', { length: 40 }).notNull().default('royal-gold-maroon'),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  /** Non-personal summary for dashboards (core numbers, scores). */
  summary: jsonb('summary').$type<ReportSummary>().notNull(),
  /** Set when the full PDF has been paid for (credit) or opened under a Pro plan. */
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({
  version: uniqueIndex('reports_profile_module_version_uq').on(t.profileId, t.module, t.version),
  hash: index('reports_input_hash_idx').on(t.inputHash),
}));

export const shareLinks = pgTable('share_links', {
  id: id(),
  reportId: text('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(), // sha256 of the token – the token itself is never stored
  passwordHash: text('password_hash'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  views: integer('views').notNull().default(0),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: created(),
});

// ---------- Phase 6: auth ----------
export const otpChannelEnum = pgEnum('otp_channel', ['email', 'sms']);

export const sessions = pgTable('sessions', {
  id: id(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  userAgent: text('user_agent'),
  createdAt: created(),
}, (t) => ({ user: index('sessions_user_idx').on(t.userId) }));

export const otpCodes = pgTable('otp_codes', {
  id: id(),
  channel: otpChannelEnum('channel').notNull(),
  identifierHash: varchar('identifier_hash', { length: 64 }).notNull(),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  ip: varchar('ip', { length: 64 }),
  createdAt: created(),
}, (t) => ({ ident: index('otp_identifier_idx').on(t.identifierHash, t.createdAt) }));

// ---------- Phase 6: billing ----------
export interface PlanFeatures {
  fullReports: boolean;     // full PDF without using credits
  whiteLabel: boolean;
  bulk: boolean;            // CSV/JSON bulk import & export
  share: boolean;           // share links for any report
  watermark: boolean;       // free tier watermark
  maxProfiles: number | null;
}

export const plans = pgTable('plans', {
  code: varchar('code', { length: 30 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  pricePaise: integer('price_paise').notNull(), // GST-inclusive price
  intervalDays: integer('interval_days'),      // null = one-time purchase
  credits: integer('credits').notNull().default(0),
  features: jsonb('features').$type<PlanFeatures>().notNull(),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  updatedAt: updated(),
});

export const subscriptions = pgTable('subscriptions', {
  id: id(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  planCode: varchar('plan_code', { length: 30 }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: updated(),
});

export const paymentStatusEnum = pgEnum('payment_status', ['created', 'paid', 'failed']);

export const payments = pgTable('payments', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planCode: varchar('plan_code', { length: 30 }).notNull(),
  razorpayOrderId: varchar('razorpay_order_id', { length: 60 }).notNull().unique(),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 60 }).unique(),
  status: paymentStatusEnum('status').notNull().default('created'),
  listPricePaise: integer('list_price_paise').notNull(),
  discountPaise: integer('discount_paise').notNull().default(0),
  amountPaise: integer('amount_paise').notNull(),      // charged, GST inclusive
  taxablePaise: integer('taxable_paise').notNull(),
  cgstPaise: integer('cgst_paise').notNull().default(0),
  sgstPaise: integer('sgst_paise').notNull().default(0),
  igstPaise: integer('igst_paise').notNull().default(0),
  couponCode: varchar('coupon_code', { length: 40 }),
  billingName: text('billing_name'),
  billingState: varchar('billing_state', { length: 60 }),
  gstin: varchar('gstin', { length: 15 }),
  invoiceNumber: varchar('invoice_number', { length: 30 }).unique(),
  createdAt: created(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
}, (t) => ({ user: index('payments_user_idx').on(t.userId, t.createdAt) }));

export const invoiceCounters = pgTable('invoice_counters', {
  fy: varchar('fy', { length: 9 }).primaryKey(), // e.g. 2026-27
  last: integer('last').notNull().default(0),
});

export const coupons = pgTable('coupons', {
  code: varchar('code', { length: 40 }).primaryKey(),
  percentOff: integer('percent_off'),
  amountOffPaise: integer('amount_off_paise'),
  maxUses: integer('max_uses'),
  used: integer('used').notNull().default(0),
  planCodes: jsonb('plan_codes').$type<string[]>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  createdAt: created(),
});

export const creditLedger = pgTable('credit_ledger', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  reason: varchar('reason', { length: 40 }).notNull(), // purchase | unlock | admin
  paymentId: text('payment_id'),
  reportId: text('report_id'),
  note: text('note'),
  createdAt: created(),
});

// ---------- Phase 6: admin & white-label ----------
export const knowledgeEntries = pgTable('knowledge_entries', {
  key: varchar('key', { length: 80 }).notNull(),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: updated(),
}, (t) => ({ pk: primaryKey({ columns: [t.key, t.language] }) }));

export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 60 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: updated(),
});

export const brandings = pgTable('brandings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  brandName: text('brand_name').notNull(),
  expertName: text('expert_name').notNull(),
  expertTitle: text('expert_title'),
  contactLine: text('contact_line'),
  website: text('website'),
  bookingUrl: text('booking_url'),
  logo: text('logo'),          // data: URL (PNG/JPEG, size-limited)
  photo: text('photo'),
  signature: text('signature'),
  colours: jsonb('colours').$type<{ primary?: string; accent?: string; border?: string }>(),
  defaultTheme: varchar('default_theme', { length: 40 }),
  updatedAt: updated(),
});

export type Plan = typeof plans.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type BrandingRow = typeof brandings.$inferSelect;

export interface ReportSummary {
  moolank: number;
  bhagyank: number;
  kua: number;
  nameNumber: number | null;
  personalYear: number;
  nameScore: number | null;
  mobileScore: number | null;
  coupleScore: number | null;
  sections: number;
}

export type User = typeof users.$inferSelect;
export type ClientProfileRow = typeof clientProfiles.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type ShareLinkRow = typeof shareLinks.$inferSelect;
