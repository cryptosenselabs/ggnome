const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://postgres.zpgwsgtwavpqufuszffe:npA7MGR3T8NeDFWx@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const result = await client.query("DELETE FROM bot_scam_reports WHERE scam_url = 'erfwerf'");
    console.log(`Deleted ${result.rowCount} test reports.`);
  } catch (error) {
    console.error("Error deleting:", error);
  } finally {
    client.release();
    pool.end();
  }
}

run();
