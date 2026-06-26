require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "") : "";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  console.log("Connecting to production database...");
  const client = await pool.connect();
  try {
    console.log("Creating bot_scam_reports table if it doesn't exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_scam_reports (
        id SERIAL PRIMARY KEY,
        scam_url TEXT NOT NULL,
        scam_evidence TEXT NOT NULL,
        reporter_username TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        upvotes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table successfully created or verified.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    client.release();
    pool.end();
  }
}

initDB();
