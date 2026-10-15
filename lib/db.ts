import "server-only";
import postgres, { type Sql } from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

type SharedDatabase = {
  capitalUniversitySql?: Sql;
  capitalUniversityDrizzle?: PostgresJsDatabase<typeof schema>;
};

const globalDatabase = globalThis as typeof globalThis & SharedDatabase;

function getClient(): Sql {
  if (globalDatabase.capitalUniversitySql) return globalDatabase.capitalUniversitySql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Add it to .env.local or Vercel environment variables.");
  }

  // A small pool is a good fit for serverless deployments. Neon/Supabase pooled
  // URLs are recommended; prepared statements are disabled for pooler compatibility.
  globalDatabase.capitalUniversitySql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return globalDatabase.capitalUniversitySql;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!globalDatabase.capitalUniversityDrizzle) {
    globalDatabase.capitalUniversityDrizzle = drizzle(getClient(), { schema });
  }
  return globalDatabase.capitalUniversityDrizzle;
}
