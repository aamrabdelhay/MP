import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js uses .env.local while Drizzle Kit traditionally reads .env.
loadEnv({ path: ".env.local" });
loadEnv();

if (!process.env.DATABASE_URL) {
  // `drizzle-kit generate` does not need a live database. Migrations do.
  process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
