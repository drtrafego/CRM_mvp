import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/server/db/schema";

// Fallback for build time if DATABASE_URL is missing
const connectionString = process.env.DATABASE_URL || "postgresql://mock:mock@mock/mock";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    // In dev, we might want to crash, but in build phase it can be tricky if env vars aren't loaded yet
    console.warn("⚠️ DATABASE_URL is not defined");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
