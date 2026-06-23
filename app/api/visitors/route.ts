import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Create table if it doesn't exist
async function ensureTableExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_stats (
      id VARCHAR(50) PRIMARY KEY,
      value INTEGER NOT NULL
    );
  `);
  
  // Seed it with 1042 if it's completely empty
  await pool.query(`
    INSERT INTO site_stats (id, value) 
    VALUES ('visitors', 1042) 
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function GET() {
  try {
    if (!connectionString) {
      return NextResponse.json({ count: 1042 });
    }

    await ensureTableExists();

    // Atomically increment the visitor count and return the new value
    const result = await pool.query(`
      UPDATE site_stats 
      SET value = value + 1 
      WHERE id = 'visitors' 
      RETURNING value;
    `);

    if (result.rows.length > 0) {
      return NextResponse.json({ count: result.rows[0].value });
    }

    return NextResponse.json({ count: 1042 });
  } catch (error) {
    console.error("Failed to update Postgres visitors:", error);
    // Fallback if DB fails
    return NextResponse.json({ count: 1042 });
  }
}
