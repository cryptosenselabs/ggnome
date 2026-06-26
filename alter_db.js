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
    await client.query(`ALTER TABLE bot_scam_reports ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;`);
    console.log("Successfully added upvotes column.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
