import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let _db: Database | undefined;

/**
 * Lazily initialized database connection.
 * Throws only when first query is attempted — not at module load time.
 * This allows Edge Runtime (middleware) to import DB-dependent modules
 * without crashing, since they never actually execute queries there.
 */
export function getDb(): Database {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const client = postgres(connectionString);
    _db = drizzle(client, { schema });
  }
  return _db;
}

// Proxy provides the same API as a drizzle instance, but defers connection
// until a property is actually accessed (e.g., db.query, db.select, db.insert).
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
