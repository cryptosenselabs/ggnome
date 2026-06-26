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
      UPDATE bot_scam_reports 
      SET scam_evidence = 'Asked for upfront promo fees to Solana wallet 9ATDy5NYDoY7e13gGhriyoZ3e6ee5gsMn56GnJRNBzEd and ran away'
      WHERE scam_url = 'https://t.me/Lucifers_Calls'
    `);
    console.log("Successfully updated LuciferCalls evidence.");
  } catch (err) {
    console.error("Error updating data:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
