import { NextResponse } from "next/server";
import { Pool } from "pg";
import bots from "./bots.json";

export const dynamic = 'force-dynamic';

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

// Strip sslmode=require from the URL because it overrides the Pool's ssl config
// and causes "self-signed certificate in certificate chain" errors with Supabase pooler.
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "").replace("&sslmode=require", "") : undefined;

// We use a connection pool to handle multiple concurrent requests efficiently.
const pool = new Pool({
  connectionString,
  // If we are connecting to a cloud database (Supabase/Vercel) over the internet, we usually need ssl.
  ssl: connectionString?.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Helper function to ensure the table exists (so local Docker works seamlessly)
async function ensureTableExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function GET() {
  try {
    if (!connectionString) {
      console.warn("POSTGRES_URL is missing. Returning empty leaderboard.");
      return NextResponse.json({ leaderboard: [] });
    }

    await ensureTableExists();

    const result = await pool.query(`
      SELECT name, score 
      FROM leaderboard 
      ORDER BY score DESC 
      LIMIT 100
    `);

    // Combine DB results with simulated bots
    const allScores = [...result.rows, ...bots];

    // Sort by score descending and take top 100
    const top100 = allScores.sort((a, b) => b.score - a.score).slice(0, 100);

    return NextResponse.json({ leaderboard: top100 });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    // Fallback to just bots if DB fails
    return NextResponse.json({ leaderboard: bots.sort((a, b) => b.score - a.score).slice(0, 100) });
  }
}

export async function POST(req: Request) {
  try {
    if (!connectionString) {
      return NextResponse.json({ success: false, message: "POSTGRES_URL not configured" });
    }

    const { name, score } = await req.json();

    if (!name || typeof score !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await ensureTableExists();

    await pool.query(
      `INSERT INTO leaderboard (name, score) VALUES ($1, $2)`,
      [name, score]
    );

    // Auto-rotation: Delete any records older than 20 days to prevent infinite DB growth.
    // This piggybacks on the POST request so we don't need a dedicated cron job.
    // We don't await this because the client doesn't need to wait for cleanup to finish.
    pool.query(`DELETE FROM leaderboard WHERE created_at < NOW() - INTERVAL '20 days'`).catch(e => {
      console.error("Failed to run cleanup rotation:", e);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
