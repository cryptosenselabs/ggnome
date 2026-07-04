require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.zpgwsgtwavpqufuszffe',
  password: 'npA7MGR3T8NeDFWx',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_ideas (
          id SERIAL PRIMARY KEY,
          chat_id BIGINT,
          author_telegram_id BIGINT,
          author_username TEXT,
          idea TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Successfully created bot_ideas table.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
