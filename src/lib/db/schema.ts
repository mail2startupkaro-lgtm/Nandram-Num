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
  passwordHash: text('password_hash'),
  passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
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
  /** Report-delivery queue for general clients: when the client submitted the report, when it becomes available, admin overrides. */
  requestedAt: timestamp('requested_at', { withTimezone: true }),
  deliverAt: timestamp('deliver_at', { withTimezone: true }),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  onHold: boolean('on_hold').notNull().default(false),
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
  mrpPaise?: number | null;    // real (struck-through) ₹ price
  usdCents?: number | null;    // $ price for visitors outside India (null = ₹ only)
  usdMrpCents?: number | null; // real (struck-through) $ price
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
  gatewayOrderId: varchar('razorpay_order_id', { length: 60 }).notNull().unique(),
  gatewayPaymentId: varchar('razorpay_payment_id', { length: 60 }).unique(),
  status: paymentStatusEnum('status').notNull().default('created'),
  listPricePaise: integer('list_price_paise').notNull(),
  discountPaise: integer('discount_paise').notNull().default(0),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'), // INR or USD; every *_paise column is in this currency's minor unit
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

// ---------- Marketing & CRM ----------
export const marketingChannelEnum = pgEnum('marketing_channel', ['email', 'whatsapp', 'sms', 'push']);
export const consentStatusEnum = pgEnum('consent_status', ['opted_in', 'opted_out', 'bounced', 'unsubscribed']);
export const leadLifecycleStageEnum = pgEnum('lead_lifecycle_stage', ['subscriber', 'lead', 'mql', 'sql', 'customer', 'churned']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'scheduled', 'running', 'completed', 'paused']);

export const marketingLeads = pgTable('marketing_leads', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName: text('full_name').notNull(),
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 20 }),
  dob: varchar('dob', { length: 10 }), // YYYY-MM-DD
  gender: varchar('gender', { length: 10 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('India'),
  language: varchar('language', { length: 10 }).default('en'),
  moolank: integer('moolank'),
  bhagyank: integer('bhagyank'),
  kuaNumber: integer('kua_number'),
  primaryConcern: varchar('primary_concern', { length: 50 }),
  leadSource: varchar('lead_source', { length: 80 }).notNull().default('website'),
  leadMagnet: varchar('lead_magnet', { length: 120 }),
  lifecycleStage: leadLifecycleStageEnum('lifecycle_stage').notNull().default('lead'),
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 150 }),
  utmTerm: varchar('utm_term', { length: 100 }),
  utmContent: varchar('utm_content', { length: 100 }),
  referrerUrl: text('referrer_url'),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').default({}),
  // CRM (migration 0009)
  crmStage: varchar('crm_stage', { length: 20 }).notNull().default('new'), // new | contacted | interested | consultation | proposal | won | lost
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  dealValuePaise: integer('deal_value_paise'),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'), // low | normal | high
  nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  lostReason: text('lost_reason'),
  notes: text('notes'),
  stageChangedAt: timestamp('stage_changed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({
  emailIdx: index('marketing_leads_email_idx').on(t.email),
  phoneIdx: index('marketing_leads_phone_idx').on(t.phone),
  moolankIdx: index('marketing_leads_moolank_idx').on(t.moolank),
  concernIdx: index('marketing_leads_concern_idx').on(t.primaryConcern),
}));

export const marketingConsents = pgTable('marketing_consents', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  leadId: text('lead_id').notNull().references(() => marketingLeads.id, { onDelete: 'cascade' }),
  channel: marketingChannelEnum('channel').notNull(),
  status: consentStatusEnum('status').notNull().default('opted_in'),
  purpose: varchar('purpose', { length: 100 }).notNull(),
  consentText: text('consent_text').notNull(),
  optedInAt: timestamp('opted_in_at', { withTimezone: true }).notNull().defaultNow(),
  optedOutAt: timestamp('opted_out_at', { withTimezone: true }),
  optOutReason: text('opt_out_reason'),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: created(),
}, (t) => ({
  leadChannel: index('marketing_consents_lead_channel_idx').on(t.leadId, t.channel, t.status),
}));

export const marketingTags = pgTable('marketing_tags', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  description: text('description'),
  createdAt: created(),
});

export const leadTags = pgTable('lead_tags', {
  leadId: text('lead_id').notNull().references(() => marketingLeads.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => marketingTags.id, { onDelete: 'cascade' }),
  taggedAt: timestamp('tagged_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.leadId, t.tagId] }),
}));

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: varchar('name', { length: 180 }).notNull(),
  channel: marketingChannelEnum('channel').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  targetCriteria: jsonb('target_criteria').notNull().default({}),
  templateName: varchar('template_name', { length: 120 }),
  subjectOrTitle: text('subject_or_title'),
  contentPreview: text('content_preview'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  totalTargeted: integer('total_targeted').notNull().default(0),
  totalSent: integer('total_sent').notNull().default(0),
  totalDelivered: integer('total_delivered').notNull().default(0),
  totalOpened: integer('total_opened').notNull().default(0),
  totalClicked: integer('total_clicked').notNull().default(0),
  totalConverted: integer('total_converted').notNull().default(0),
  totalOptOuts: integer('total_opt_outs').notNull().default(0),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: created(),
  updatedAt: updated(),
});

export const marketingEvents = pgTable('marketing_events', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  leadId: text('lead_id').notNull().references(() => marketingLeads.id, { onDelete: 'cascade' }),
  eventName: varchar('event_name', { length: 80 }).notNull(),
  properties: jsonb('properties').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  leadEvent: index('marketing_events_lead_name_idx').on(t.leadId, t.eventName, t.occurredAt),
}));

/** CRM timeline: notes, calls, WhatsApp messages, stage changes and system events for a contact. */
export const crmActivities = pgTable('crm_activities', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  leadId: text('lead_id').notNull().references(() => marketingLeads.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // note | call | whatsapp | email | meeting | stage | task | system
  body: text('body'),
  meta: jsonb('meta').notNull().default({}),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: created(),
}, (t) => ({ leadIdx: index('crm_activities_lead_idx').on(t.leadId, t.createdAt) }));

/** CRM follow-up tasks. */
export const crmTasks = pgTable('crm_tasks', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  leadId: text('lead_id').notNull().references(() => marketingLeads.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'),
  doneAt: timestamp('done_at', { withTimezone: true }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: created(),
}, (t) => ({ leadIdx: index('crm_tasks_lead_idx').on(t.leadId) }));

export type MarketingLead = typeof marketingLeads.$inferSelect;
export type MarketingConsent = typeof marketingConsents.$inferSelect;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

// ---------- Contact us / enquiries ----------
/** Messages from the public Contact Us form. Name, mobile, email and message are stored encrypted (details_enc). */
export const contactMessages = pgTable('contact_messages', {
  id: id(),
  topic: varchar('topic', { length: 30 }).notNull(),          // service | support | other
  service: varchar('service', { length: 40 }),                 // which service (for service enquiries)
  detailsEnc: text('details_enc').notNull(),                   // { name, phone, email, message }
  phoneLast4: varchar('phone_last4', { length: 4 }),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  status: varchar('status', { length: 20 }).notNull().default('new'), // new | in_progress | resolved
  adminNote: text('admin_note'),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  page: varchar('page', { length: 200 }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ statusIdx: index('contact_messages_status_idx').on(t.status, t.createdAt) }));
export type ContactMessage = typeof contactMessages.$inferSelect;

// ---------- Expert services (bought online, delivered personally by the numerologist) ----------
export type ServiceIntakeField = 'clientName' | 'dob' | 'gender' | 'tob' | 'pob' | 'mobile' | 'currentName' | 'parents' | 'letters' | 'partnerName' | 'partnerDob' | 'questions';
export interface ServiceText { name: string; short: string; includes: string[]; delivery: string }
/** Services shown on /services. Code always starts with "SVC_" so payments can tell a service from a report plan. */
export const services = pgTable('services', {
  code: varchar('code', { length: 30 }).primaryKey(),
  en: jsonb('en').$type<ServiceText>().notNull(),
  hi: jsonb('hi').$type<ServiceText>().notNull(),
  pricePaise: integer('price_paise').notNull(),           // GST-inclusive
  mrpPaise: integer('mrp_paise'),                          // optional "was" price shown struck through
  usdCents: integer('usd_cents'),                          // $ fee for clients outside India (null = ₹ only)
  usdMrpCents: integer('usd_mrp_cents'),                   // optional $ "was" price
  priceConfirmed: boolean('price_confirmed').notNull().default(false), // online payment only after the owner confirms the price
  intake: jsonb('intake').$type<ServiceIntakeField[]>().notNull(),
  active: boolean('active').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  sort: integer('sort').notNull().default(0),
  updatedAt: updated(),
});

/** One row per service purchase. The client's details (name, date of birth…) are stored encrypted. */
export const serviceOrders = pgTable('service_orders', {
  id: id(),
  paymentId: text('payment_id').notNull().unique().references(() => payments.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  serviceCode: varchar('service_code', { length: 30 }).notNull(),
  detailsEnc: text('details_enc').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('awaiting_payment'), // awaiting_payment | paid | in_progress | delivered | cancelled
  adminNote: text('admin_note'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ statusIdx: index('service_orders_status_idx').on(t.status, t.createdAt), userIdx: index('service_orders_user_idx').on(t.userId) }));
export type Service = typeof services.$inferSelect;
export type ServiceOrder = typeof serviceOrders.$inferSelect;
