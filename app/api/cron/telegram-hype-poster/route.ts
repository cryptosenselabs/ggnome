import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

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

async function sendPhoto(chatId: number, photoUrl: string, caption: string) {
  await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption, parse_mode: 'HTML' })
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

export async function GET(req: Request) {
  // Security check: Ensure the cron is called with the correct Secret
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Add columns if they don't exist
    try {
      await query(`ALTER TABLE bot_group_state ADD COLUMN hype_drops_today INTEGER DEFAULT 0`);
      await query(`ALTER TABLE bot_group_state ADD COLUMN last_hype_drop_at TIMESTAMP`);
      await query(`ALTER TABLE bot_group_state ADD COLUMN disable_hype BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      // Columns likely already exist, ignore
    }

    const result = await query(`SELECT * FROM bot_group_state WHERE disable_hype IS NOT TRUE`);
    const groups = result.rows;

    const now = new Date();
    const utcHour = now.getUTCHours();

    // Quiet hours: 00:00 to 08:00 UTC
    if (utcHour >= 0 && utcHour < 8) {
      return NextResponse.json({ status: 'skipped', reason: 'quiet_hours' });
    }

    const launchDate = new Date('2026-06-26T13:00:00Z'); // 15:00 CET = 13:00 UTC
    const diffMs = launchDate.getTime() - now.getTime();
    let countdownCaption = "";
    
    if (diffMs > 0) {
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      countdownCaption = `🚨 <b>LAUNCH WINDOW OPENS IN ${diffHrs}H ${diffMins}M</b> 🚨\n<b>Stay ready, Gnomads!</b> 🍄\n\n📜 <b>CA:</b> <code>HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump</code>\n\n⚠️ <i>We will NEVER DM you!</i>`;
    } else {
      countdownCaption = `🚨 <b>$GNOME IS LIVE!</b> 🚨\n<b>The garden is officially open!</b> 🍄\n\n📜 <b>CA:</b> <code>HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump</code>\n\n⚠️ <i>We will NEVER DM you!</i>`;
    }

    const captions = [
      "The Garden is Awake. 🍄",
      "Another Gnomad just joined the underground.",
      "The Gnomad Army is not a number. It is a signal.",
      "We are planting. The bears are panicking. 🌱",
      "The mushroom council approves this message."
    ];

    let dropped = 0;

    for (const group of groups) {
      const lastDrop = group.last_hype_drop_at ? new Date(group.last_hype_drop_at) : null;
      let dropsToday = group.hype_drops_today || 0;

      // Reset daily counter if it's a new day (UTC)
      if (lastDrop && lastDrop.getUTCDate() !== now.getUTCDate()) {
        dropsToday = 0;
      }

      // Max 500 drops per day (set very high for aggressive launch mode)
      if (dropsToday >= 500) {
        continue;
      }

      // Probability Check: 50% chance to drop each time the cron runs (targets ~6 drops per hour)
      if (Math.random() > 0.50) {
        continue;
      }

      // Find random poster from public/images/posters
      const postersDir = path.join(process.cwd(), 'public', 'images', 'posters');
      if (!fs.existsSync(postersDir)) {
        continue;
      }

      const files = fs.readdirSync(postersDir).filter(f => f.match(/\.(png|jpe?g|gif|webp)$/i));
      if (files.length === 0) {
        continue; // Folder exists but is empty
      }

      const randomFile = files[Math.floor(Math.random() * files.length)];

      // Determine the absolute URL for the image
      const host = req.headers.get('host') || 'www.chaosgnome.xyz';
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const photoUrl = `${protocol}://${host}/images/posters/${randomFile}`;

      const randomCaption = captions[Math.floor(Math.random() * captions.length)];
      const finalCaption = `${randomCaption}\n\n${countdownCaption}`;

      // Send the photo
      await sendPhoto(group.chat_id, photoUrl, finalCaption);

      // Update DB with the new drop count
      await query(`
        UPDATE bot_group_state 
        SET hype_drops_today = $1, last_hype_drop_at = CURRENT_TIMESTAMP 
        WHERE chat_id = $2
      `, [dropsToday + 1, group.chat_id]);

      dropped++;
    }

    return NextResponse.json({ status: 'ok', dropped: dropped });
  } catch (error) {
    console.error("Hype Cron Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
