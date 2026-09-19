import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({
    client: pool,
});

export async function initDb(): Promise<void> {
    await pool.query("SELECT 1");
    console.info("Database connected.");
}

export async function closeDb(): Promise<void> {
    await pool.end();
}