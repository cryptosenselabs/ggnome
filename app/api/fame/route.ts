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
  const client = await pool.connect();
  try {
    const { message, author_username } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const username = author_username || 'Anonymous Gnomad';

    const result = await client.query(
      `INSERT INTO bot_fame_posts (author_username, message, upvotes) VALUES ($1, $2, $3) RETURNING *`,
      [username, message, 0]
    );

    return NextResponse.json({ success: true, report: result.rows[0] });
  } catch (error) {
    console.error('Error submitting fame post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
