/**
 * Celebrity Numerology posts – storage. The table is created on first use (also shipped as
 * drizzle/0011_celebrity_posts.sql), so no manual migration is needed.
 */
import { sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import type { CelebPost } from './post';

export type CelebStatus = 'draft' | 'published';
export interface CelebRow { id: number; slug: string; name: string; dob: string; status: CelebStatus; post: CelebPost; createdAt: string; updatedAt: string; publishedAt: string | null }
export interface CelebListItem { id: number; slug: string; name: string; dob: string; status: CelebStatus; title: string; excerpt: string; profession: string; moolank: number; bhagyank: number; hasHindi: boolean; updatedAt: string; publishedAt: string | null }

const DDL = [
  `CREATE TABLE IF NOT EXISTS celebrity_posts (id bigserial PRIMARY KEY, slug varchar(140) NOT NULL UNIQUE, name varchar(120) NOT NULL, dob varchar(10) NOT NULL, status varchar(12) NOT NULL DEFAULT 'draft', post jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz)`,
  `CREATE INDEX IF NOT EXISTS celebrity_posts_status_idx ON celebrity_posts (status, published_at DESC)`,
];

const g = globalThis as unknown as { __celebReady?: Promise<void> };
export function ensureCelebTable(db: Db = getDb()): Promise<void> {
  if (!g.__celebReady) {
    g.__celebReady = (async () => { for (const s of DDL) await db.execute(sql.raw(s)); })().catch((e) => { g.__celebReady = undefined; throw e; });
  }
  return g.__celebReady;
}

type Raw = { id: string | number; slug: string; name: string; dob: string; status: CelebStatus; post: CelebPost; created_at: Date | string; updated_at: Date | string; published_at: Date | string | null };
const iso = (d: Date | string | null) => (d == null ? null : new Date(d).toISOString());
const toRow = (r: Raw): CelebRow => ({ id: Number(r.id), slug: r.slug, name: r.name, dob: r.dob, status: r.status, post: r.post, createdAt: iso(r.created_at)!, updatedAt: iso(r.updated_at)!, publishedAt: iso(r.published_at) });
const toItem = (r: CelebRow): CelebListItem => ({
  id: r.id, slug: r.slug, name: r.name, dob: r.dob, status: r.status, title: r.post.en.h1, excerpt: r.post.en.excerpt, profession: r.post.profile?.profession ?? '',
  moolank: r.post.numbers?.moolank?.value, bhagyank: r.post.numbers?.bhagyank?.value, hasHindi: !!r.post.hi, updatedAt: r.updatedAt, publishedAt: r.publishedAt,
});
const rows = (res: unknown) => ((res as { rows?: Raw[] }).rows ?? (res as Raw[])) as Raw[];

export async function listCelebPosts(opts: { publishedOnly?: boolean; limit?: number } = {}, db: Db = getDb()): Promise<CelebListItem[]> {
  await ensureCelebTable(db);
  const lim = Math.min(Math.max(opts.limit ?? 500, 1), 1000);
  const res = opts.publishedOnly
    ? await db.execute(sql`SELECT * FROM celebrity_posts WHERE status = 'published' ORDER BY published_at DESC NULLS LAST, id DESC LIMIT ${lim}`)
    : await db.execute(sql`SELECT * FROM celebrity_posts ORDER BY updated_at DESC LIMIT ${lim}`);
  return rows(res).map(toRow).map(toItem);
}

export async function getCelebPost(slug: string, opts: { publishedOnly?: boolean } = {}, db: Db = getDb()): Promise<CelebRow | null> {
  await ensureCelebTable(db);
  const res = opts.publishedOnly
    ? await db.execute(sql`SELECT * FROM celebrity_posts WHERE slug = ${slug} AND status = 'published' LIMIT 1`)
    : await db.execute(sql`SELECT * FROM celebrity_posts WHERE slug = ${slug} LIMIT 1`);
  const r = rows(res)[0];
  return r ? toRow(r) : null;
}

export class SlugTakenError extends Error { code = 'SLUG_TAKEN'; }

/**
 * Creates or updates a post. `id` = the row being edited (null = new). A new post whose slug is already used by
 * another row is refused (SLUG_TAKEN) so an existing article is never overwritten by accident.
 */
export async function saveCelebPost(post: CelebPost, status: CelebStatus, id: number | null, db: Db = getDb()): Promise<CelebRow> {
  await ensureCelebTable(db);
  const clash = rows(await db.execute(sql`SELECT id FROM celebrity_posts WHERE slug = ${post.slug} LIMIT 1`))[0];
  if (clash && Number(clash.id) !== id) throw new SlugTakenError(`The URL /blog/celebrity/${post.slug} is already used by another post`);
  const body = JSON.stringify(post);
  const res = id == null
    ? await db.execute(sql`INSERT INTO celebrity_posts (slug, name, dob, status, post, published_at) VALUES (${post.slug}, ${post.name}, ${post.dob}, ${status}, ${body}::jsonb, ${status === 'published' ? sql`now()` : null}) RETURNING *`)
    : await db.execute(sql`UPDATE celebrity_posts SET slug = ${post.slug}, name = ${post.name}, dob = ${post.dob}, status = ${status}, post = ${body}::jsonb, updated_at = now(),
        published_at = CASE WHEN ${status} = 'published' THEN COALESCE(published_at, now()) ELSE published_at END WHERE id = ${id} RETURNING *`);
  const r = rows(res)[0];
  if (!r) throw Object.assign(new Error('Post not found'), { code: 'NOT_FOUND' });
  return toRow(r);
}

export async function setCelebStatus(id: number, status: CelebStatus, db: Db = getDb()): Promise<CelebRow | null> {
  await ensureCelebTable(db);
  const r = rows(await db.execute(sql`UPDATE celebrity_posts SET status = ${status}, updated_at = now(), published_at = CASE WHEN ${status} = 'published' THEN COALESCE(published_at, now()) ELSE published_at END WHERE id = ${id} RETURNING *`))[0];
  return r ? toRow(r) : null;
}

export async function getCelebPostById(id: number, db: Db = getDb()): Promise<CelebRow | null> {
  await ensureCelebTable(db);
  const r = rows(await db.execute(sql`SELECT * FROM celebrity_posts WHERE id = ${id} LIMIT 1`))[0];
  return r ? toRow(r) : null;
}

export async function deleteCelebPost(id: number, db: Db = getDb()): Promise<string | null> {
  await ensureCelebTable(db);
  const r = rows(await db.execute(sql`DELETE FROM celebrity_posts WHERE id = ${id} RETURNING slug`))[0];
  return r?.slug ?? null;
}
