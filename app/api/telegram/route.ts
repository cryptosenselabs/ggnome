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

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  });
}

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
      await query(`
        CREATE TABLE IF NOT EXISTS bot_tasks (
          id SERIAL PRIMARY KEY,
          chat_id BIGINT,
          task_name TEXT,
          assignee TEXT,
          status TEXT DEFAULT 'open',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS bot_scam_reports (
            id SERIAL PRIMARY KEY,
            chat_id BIGINT,
            reporter_telegram_id BIGINT,
            reporter_username TEXT,
            scam_url TEXT,
            scam_evidence TEXT,
            status TEXT DEFAULT 'pending',
            upvotes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS bot_fame_posts (
            id SERIAL PRIMARY KEY,
            chat_id BIGINT,
            author_telegram_id BIGINT,
            author_username TEXT,
            message TEXT,
            upvotes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

      // Handle new members joining
      if (body.message.new_chat_members) {
        for (const member of body.message.new_chat_members) {
          if (member.is_bot) continue;
          
          const memberId = member.id;
          const memberUsername = member.username || '';
          const memberFirstName = member.first_name || '';
          const displayUsername = member.username ? `@${member.username}` : member.first_name;

          // Automatically bless the new user with +1 respect
          await query(`
            INSERT INTO bot_users (telegram_user_id, username, first_name, points, plant_count) 
            VALUES ($1, $2, $3, 1, 0)
            ON CONFLICT (telegram_user_id) 
            DO UPDATE SET points = bot_users.points + 1;
          `, [memberId, memberUsername, memberFirstName]);

          const welcomeText = `A new Gnomad has entered the village! 🍄\n\n` +
            `${displayUsername}, you have been officially BLESSED by the mushroom council (+1 Village Respect).\n\n` +
            `📜 <b>The Gnome Dictionary:</b>\n` +
            `- <b>Gnomad</b>: A trusted member of the village.\n` +
            `- <b>Planting</b>: Holding the line and trusting the soil.\n` +
            `- <b>Bears</b>: The enemy. We do not fear them.\n` +
            `- <b>Red Candles</b>: Temporary bad weather. We plant through the storm.\n` +
            `- <b>Soil</b>: The foundation of our wealth.\n\n` +
            `📜 <b>The 5 Commandments of a Gnomad:</b>\n` +
            `1. Thou shalt never sell the bottom.\n` +
            `2. Thou shalt plant thy seeds daily.\n` +
            `3. Thou shalt respect the mushroom council.\n` +
            `4. Thou shalt mock the bears relentlessly.\n` +
            `5. Thou shalt hold the line until the garden blooms.\n\n` +
            `Reply with:\n<b>I plant</b>\n\n…and GnomeDad will give you your first official rank. <i>(You have 5 minutes before the soil forgets you)</i>`;

          await sendMessage(chatId, welcomeText);
        }
      }

      const displaySenderName = username ? `@${username}` : firstName;

      // Command handling
      if (text.startsWith('/start')) {
        await sendMessage(chatId, "GnomeDad is awake.\nAdd me to the village and I will watch over the Gnomads.");
      } else if (text.startsWith('/help')) {
        await sendMessage(chatId, "Available commands:\n/plant - Plant your seed in the garden\n/prophecy - Hear a prophecy from the elders\n/quest - See the current quest\n/rank - Check your rank\n/about - Learn about me\n/stats - View village statistics");
      } else if (text.startsWith('/about')) {
        await sendMessage(chatId, "GnomeDad watches the village, wakes sleepy Gnomads, blesses planters, and releases tiny chaos when the group gets too quiet.");
      } else if (text.startsWith('/plant') || text.toLowerCase() === 'i plant') {
        const result = await query(`SELECT plant_count FROM bot_users WHERE telegram_user_id = $1`, [userId]);
        const userState = result.rows[0];
        
        if (userState && userState.plant_count === 0) {
          const titles = ["Baby Root Gnomad", "Tiny Hat Recruit", "Mushroom Intern", "Soil Walker", "Bear Annoyer", "Candle Whisperer", "Village Sprout", "Garden Goblin"];
          const randomTitle = titles[Math.floor(Math.random() * titles.length)];
          
          await query(`
            UPDATE bot_users 
            SET plant_count = plant_count + 1, points = points + 1, last_plant_at = CURRENT_TIMESTAMP, rank = $2
            WHERE telegram_user_id = $1
          `, [userId, randomTitle]);
          
          await sendMessage(chatId, `The soil accepts you, ${displaySenderName}.\n\nYour first title:\n${randomTitle}\n\nWelcome to the village.`);
        } else {
          // Record normal plant
          await query(`
            UPDATE bot_users 
            SET plant_count = plant_count + 1, points = points + 1, last_plant_at = CURRENT_TIMESTAMP
            WHERE telegram_user_id = $1
          `, [userId]);
          await sendMessage(chatId, "You planted. The soil respects you. 🌱");
        }
      } else if (text.startsWith('/prophecy')) {
        await sendMessage(chatId, "Prophecy #888: When Gnomads stand together, even red candles lose courage.");
      } else if (text.startsWith('/rank')) {
        const result = await query(`SELECT points, rank FROM bot_users WHERE telegram_user_id = $1`, [userId]);
        const user = result.rows[0];
        if (user) {
          await sendMessage(chatId, `You have ${user.points} points. Your rank is: ${user.rank}`);
        } else {
          await sendMessage(chatId, "You are an unknown wanderer. Try /plant first.");
        }
      } else if (text.startsWith('/bless')) {
        const parts = text.split(' ');
        const targetUser = parts.length > 1 ? parts[1] : null;
        if (targetUser && targetUser.startsWith('@')) {
          // Add a point to the blessed user (if they exist)
          const cleanUsername = targetUser.replace('@', '');
          await query(`UPDATE bot_users SET points = points + 1 WHERE username = $1 OR username = $2`, [cleanUsername, targetUser]);
          await sendMessage(chatId, `${targetUser} has been blessed by the mushroom council.\n+1 village respect. 🍄`);
        } else {
          await sendMessage(chatId, "Who do you want to bless? Use /bless @username");
        }
      } else if (text.startsWith('/title')) {
        const result = await query(`SELECT username, first_name, plant_count, points, rank FROM bot_users WHERE telegram_user_id = $1`, [userId]);
        const user = result.rows[0];
        if (user) {
          const displayUsername = user.username ? `@${user.username}` : user.first_name;
          await sendMessage(chatId, `Gnomad: ${displayUsername}\nTitle: ${user.rank}\nPlants: ${user.plant_count}\nVillage Respect: ${user.points}`);
        } else {
          await sendMessage(chatId, "You are an unknown wanderer. Try /plant first.");
        }
      } else if (text.startsWith('/vibe')) {
        // Stealth Admin Tracker Queries
        const totalResult = await query(`SELECT COUNT(*) FROM bot_users`);
        const passiveResult = await query(`SELECT COUNT(*) FROM bot_users WHERE plant_count = 0 AND points = 1`);
        
        const totalUsers = totalResult.rows[0].count;
        const passiveUsers = passiveResult.rows[0].count;

        const moods = ["Slightly chaotic", "Extremely bullish", "Dangerously sleepy", "Ready to harvest", "Waiting for mushrooms"];
        const activities = ["Needs watering", "Planting aggressively", "Watching the charts", "Shitposting", "Holding the line"];
        
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const bearConfidence = Math.floor(Math.random() * 20) + 1; // 1-20%
        
        await sendMessage(chatId, `Village Mood: ${randomMood}\nBear Confidence: ${bearConfidence}%\nMushroom Energy: Rising\nGnomad Activity: ${randomActivity}\n\n<i>Atmospheric Pressure: ${passiveUsers}${totalUsers} hPa</i>`);
      } else if (text.startsWith('/create')) {
        // Example: /create Update the website @Hamza_Cho
        const match = text.match(/\/create\s+(.*?)\s+(@\w+)/i);
        if (match) {
          const taskName = match[1].trim();
          const assignee = match[2];
          
          const insertResult = await query(`
            INSERT INTO bot_tasks (chat_id, task_name, assignee) 
            VALUES ($1, $2, $3) RETURNING id
          `, [chatId, taskName, assignee]);
          
          const taskId = insertResult.rows[0].id;
          await sendMessage(chatId, `Task #${taskId} assigned to ${assignee}!\nTo complete it, type: /done ${taskId}`);
        } else {
          await sendMessage(chatId, "Format: /create [task details] @username");
        }
      } else if (text.startsWith('/report')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const scamUrl = parts[1];
          const scamEvidence = parts.slice(2).join(' ') || 'No additional evidence provided.';
          
          await query(`
            INSERT INTO bot_scam_reports (chat_id, reporter_telegram_id, reporter_username, scam_url, scam_evidence) 
            VALUES ($1, $2, $3, $4, $5)
          `, [chatId, userId, displaySenderName, scamUrl, scamEvidence]);
          
          // Reward the user
          await query(`UPDATE bot_users SET points = points + 1 WHERE telegram_user_id = $1`, [userId]);
          
          await sendMessage(chatId, `👁️ The Gnomad council has logged your report against:\n${scamUrl}\n\nWe are watching them. Thank you for protecting the village, ${displaySenderName}! (+1 Village Respect)`);
        } else {
          await sendMessage(chatId, "Format: /report [URL like Twitter/Telegram] [Evidence or reason]");
        }
      } else if (text.startsWith('/wallofshame')) {
        const result = await query(`
          SELECT scam_url, reporter_username, status 
          FROM bot_scam_reports 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        
        if (result.rows.length > 0) {
          let msg = "🚨 <b>Gnomad Watchlist (Recent Reports)</b> 🚨\n\n";
          result.rows.forEach((row, idx) => {
            const safeUrl = row.scam_url.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeUsername = row.reporter_username.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            msg += `${idx + 1}. ${safeUrl} (Reported by ${safeUsername}) - Status: ${row.status}\n`;
          });
          await sendMessage(chatId, msg);
        } else {
          await sendMessage(chatId, "The wall of shame is currently empty. The village is safe... for now.");
        }
      } else if (text.startsWith('/fame')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const message = parts.slice(1).join(' ');
          
          await query(`
            INSERT INTO bot_fame_posts (chat_id, author_telegram_id, author_username, message) 
            VALUES ($1, $2, $3, $4)
          `, [chatId, userId, displaySenderName, message]);
          
          // Reward the user for contributing positivity
          await query(`UPDATE bot_users SET points = points + 1 WHERE telegram_user_id = $1`, [userId]);
          
          await sendMessage(chatId, `🏆 Your message has been added to the Wall of Fame!\nThank you for spreading good vibes in the village, ${displaySenderName}! (+1 Village Respect)`);
        } else {
          await sendMessage(chatId, "Format: /fame [Your positive message or shoutout]");
        }
      } else if (text.startsWith('/done')) {
        const match = text.match(/\/done\s+(\d+)/);
        if (match) {
          const taskId = parseInt(match[1]);
          const updateResult = await query(`
            UPDATE bot_tasks SET status = 'completed' 
            WHERE id = $1 AND chat_id = $2 AND status = 'open'
            RETURNING id
          `, [taskId, chatId]);
          
          if (updateResult && updateResult.rowCount && updateResult.rowCount > 0) {
            await sendMessage(chatId, `✅ Task #${taskId} marked as completed!`);
          } else {
            await sendMessage(chatId, `Task #${taskId} not found or already completed.`);
          }
        } else {
          await sendMessage(chatId, "Format: /done [Task ID]");
        }
      } else if (text.startsWith('/hype')) {
        // Manual Hype Poster Trigger - Reads from CSV
        const csvPath = path.join(process.cwd(), 'scripts', 'hype_comments.csv');
        if (fs.existsSync(csvPath)) {
          const content = fs.readFileSync(csvPath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim().length > 0);
          
          if (lines.length > 1) {
            // Pick a random line (skip header at index 0)
            const randomIndex = Math.floor(Math.random() * (lines.length - 1)) + 1;
            let randomComment = lines[randomIndex];
            
            // Remove leading/trailing quotes if escaped
            if (randomComment.startsWith('"') && randomComment.endsWith('"')) {
              randomComment = randomComment.substring(1, randomComment.length - 1);
            }
            
            // Send just the text so it can be easily copy-pasted
            await sendMessage(chatId, randomComment);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
