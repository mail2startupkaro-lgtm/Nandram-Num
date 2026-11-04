/** Postgres connection (node-postgres pool) + Drizzle. Works with Supabase, Neon or any Postgres. Server-only. */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;
type Pool = InstanceType<typeof pg.Pool>;
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

const g = globalThis as unknown as { __numerologyPool?: Pool; __numerologyDb?: Db };

export function getDb(): Db {
  if (!g.__numerologyDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    g.__numerologyPool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      ssl: /sslmode=require|supabase\.co|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined,
    });
    g.__numerologyDb = drizzle(g.__numerologyPool, { schema });
  }
  return g.__numerologyDb;
}

export async function runMigrations(db: Db = getDb()) {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
}

export async function closeDb() {
  await g.__numerologyPool?.end();
  g.__numerologyPool = undefined;
  g.__numerologyDb = undefined;
}
