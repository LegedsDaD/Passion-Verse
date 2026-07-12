/**
 * Drizzle / Postgres is optional. This file is only kept so legacy code paths
 * that import `@/db` do not crash at build time. The app persists data via
 * Firebase Firestore (see `src/hooks/useRoadmaps.ts`).
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (databaseUrl) {
  const globalForDb = globalThis as typeof globalThis & {
    __passionVersePool?: Pool;
  };
  pool =
    globalForDb.__passionVersePool ??
    new Pool({ connectionString: databaseUrl, max: 2 });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__passionVersePool = pool;
  }
  db = drizzle(pool);
}

export { pool, db };
