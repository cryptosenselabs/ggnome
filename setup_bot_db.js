const { Pool } = require('pg');

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "") : "";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_users (
          id SERIAL PRIMARY KEY,
          telegram_user_id BIGINT UNIQUE,
          username TEXT,
          first_name TEXT,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          points INTEGER DEFAULT 0,
          plant_count INTEGER DEFAULT 0,
          last_plant_at TIMESTAMP,
          rank TEXT DEFAULT 'Baby Root'
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_group_state (
          chat_id BIGINT PRIMARY KEY,
          mode TEXT DEFAULT 'calm',
          last_human_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_20_min_message_at TIMESTAMP,
          last_30_min_quest_at TIMESTAMP,
          last_3_hour_event_at TIMESTAMP,
          auto_messages_today INTEGER DEFAULT 0,
          gemini_calls_today INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  } finally {
    pool.end();
  }
}

createTables();
