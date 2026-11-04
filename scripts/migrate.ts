/** Applies SQL migrations in ./drizzle to DATABASE_URL.  npm run db:migrate */
import { closeDb, runMigrations } from '../src/lib/db/client';
await runMigrations();
console.log('Migrations applied.');
await closeDb();
