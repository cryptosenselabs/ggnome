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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

export async function GET(req: Request) {
  // Security check: Ensure the cron is called with the correct Vercel Cron Secret (if configured)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Initialize DB schemas if not exists (Lazy init)
    await query(`
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

    // Get all groups
    const result = await query(`SELECT * FROM bot_group_state`);
    const groups = result.rows;

    const now = new Date();

    for (const group of groups) {
      const lastHumanMsg = new Date(group.last_human_message_at);
      const diffMinutes = (now.getTime() - lastHumanMsg.getTime()) / (1000 * 60);

      // Check 1-Hour Emergency
      if (diffMinutes >= 60) {
        if (!group.last_3_hour_event_at || new Date(group.last_3_hour_event_at).getTime() < lastHumanMsg.getTime()) {
          await sendMessage(group.chat_id, "🚨 Village Emergency. The bears are holding a meeting. Send one meme, one prophecy, or one “I plant” to cancel their confidence.");
          await query(`UPDATE bot_group_state SET last_3_hour_event_at = CURRENT_TIMESTAMP WHERE chat_id = $1`, [group.chat_id]);
          continue; // Don't trigger smaller ones
        }
      }

      // Check 15-Minute Quest
      if (diffMinutes >= 15) {
        if (!group.last_30_min_quest_at || new Date(group.last_30_min_quest_at).getTime() < lastHumanMsg.getTime()) {
          await sendMessage(group.chat_id, "🍄 Mini Quest:\nFirst 3 Gnomads to say “I plant” receive mushroom blessings.");
          await query(`UPDATE bot_group_state SET last_30_min_quest_at = CURRENT_TIMESTAMP WHERE chat_id = $1`, [group.chat_id]);
          continue;
        }
      }

      // Check 5-Minute Silence
      if (diffMinutes >= 5) {
        if (!group.last_20_min_message_at || new Date(group.last_20_min_message_at).getTime() < lastHumanMsg.getTime()) {
          await sendMessage(group.chat_id, "Gnomads… the village is too quiet.\nEven the mushrooms are checking the chart. 🌱");
          await query(`UPDATE bot_group_state SET last_20_min_message_at = CURRENT_TIMESTAMP WHERE chat_id = $1`, [group.chat_id]);
        }
      }
    }

    return NextResponse.json({ status: 'ok', processed: groups.length });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
