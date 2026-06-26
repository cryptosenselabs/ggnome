require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "") : "";

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
    // Ensure table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_scam_reports (
          id SERIAL PRIMARY KEY,
          chat_id BIGINT,
          reporter_telegram_id BIGINT,
          reporter_username TEXT,
          scam_url TEXT,
          scam_evidence TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert the record
    await client.query(`
      INSERT INTO bot_scam_reports (chat_id, reporter_telegram_id, reporter_username, scam_url, scam_evidence, status) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      0, 
      0, 
      'GnomadAdmin', 
      'https://t.me/Lucifers_Calls', 
      'Asking for $20 upfront promo fee to Solana wallet 9ATDy5NYDoY7e13gGhriyoZ3e6ee5gsMn56GnJRNBzEd', 
      'verified_scam'
    ]);

    console.log("Successfully inserted Lucifers_Calls into the database.");
  } catch (err) {
    console.error("Error inserting data:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
