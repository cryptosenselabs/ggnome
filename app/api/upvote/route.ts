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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing scam ID' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE bot_scam_reports 
        SET upvotes = COALESCE(upvotes, 0) + 1 
        WHERE id = $1
      `, [id]);
      
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error upvoting scam:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
