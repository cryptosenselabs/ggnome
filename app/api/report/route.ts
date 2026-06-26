import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "") : "";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scam_url, scam_evidence } = body;

    if (!scam_url || !scam_evidence) {
      return NextResponse.json({ error: 'Missing scam URL or evidence' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO bot_scam_reports (chat_id, reporter_telegram_id, reporter_username, scam_url, scam_evidence, status, upvotes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [null, null, 'Anonymous', scam_url, scam_evidence, 'pending', 0]);
      
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error submitting web report:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
