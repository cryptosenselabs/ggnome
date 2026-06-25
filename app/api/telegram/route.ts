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

// Database Helper
async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  try {
    // Security: Validate Telegram Secret Token
    const telegramSecret = req.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.TELEGRAM_WEBHOOK_SECRET && telegramSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn("Unauthorized webhook attempt");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    
    // Check if it's a message
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || '';
      const userId = body.message.from?.id;
      const username = body.message.from?.username || '';
      const firstName = body.message.from?.first_name || '';

      // Ignore bots
      if (body.message.from?.is_bot) {
        return NextResponse.json({ status: 'ignored' });
      }

      // Initialize DB schemas if not exists (Lazy init)
      await query(`
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

      // Track Activity
      await query(`
        INSERT INTO bot_group_state (chat_id, last_human_message_at) 
        VALUES ($1, CURRENT_TIMESTAMP)
        ON CONFLICT (chat_id) 
        DO UPDATE SET last_human_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;
      `, [chatId]);

      await query(`
        INSERT INTO bot_users (telegram_user_id, username, first_name, last_seen_at) 
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (telegram_user_id) 
        DO UPDATE SET username = $2, first_name = $3, last_seen_at = CURRENT_TIMESTAMP;
      `, [userId, username, firstName]);

      // Command handling
      if (text.startsWith('/start')) {
        await sendMessage(chatId, "GnomeDad is awake.\\nAdd me to the village and I will watch over the Gnomads.");
      } else if (text.startsWith('/help')) {
        await sendMessage(chatId, "Available commands:\\n/plant - Plant your seed in the garden\\n/prophecy - Hear a prophecy from the elders\\n/quest - See the current quest\\n/rank - Check your rank\\n/about - Learn about me\\n/stats - View village statistics");
      } else if (text.startsWith('/about')) {
        await sendMessage(chatId, "GnomeDad watches the village, wakes sleepy Gnomads, blesses planters, and releases tiny chaos when the group gets too quiet.");
      } else if (text.startsWith('/plant')) {
        // Record plant
        await query(`
          UPDATE bot_users 
          SET plant_count = plant_count + 1, points = points + 1, last_plant_at = CURRENT_TIMESTAMP
          WHERE telegram_user_id = $1
        `, [userId]);
        await sendMessage(chatId, "You planted. The soil respects you. 🌱");
      } else if (text.startsWith('/prophecy')) {
        await sendMessage(chatId, "Prophecy #888: When Gnomads stand together, even red candles lose courage.");
      } else if (text.startsWith('/rank')) {
        const result = await query(`SELECT points, rank FROM bot_users WHERE telegram_user_id = $1`, [userId]);
        const user = result.rows[0];
        if (user) {
          await sendMessage(chatId, \`You have \${user.points} points. Your rank is: \${user.rank}\`);
        } else {
          await sendMessage(chatId, "You are an unknown wanderer. Try /plant first.");
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
