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
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
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
    // Check if the bot_tasks table exists yet
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bot_tasks'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return NextResponse.json({ status: 'skipped', reason: 'table_not_initialized' });
    }

    // Get all open tasks grouped by chat_id
    const result = await query(`
      SELECT chat_id, id, assignee, task_name 
      FROM bot_tasks 
      WHERE status = 'open' 
      ORDER BY chat_id, id ASC
    `);

    const openTasks = result.rows;
    if (openTasks.length === 0) {
      return NextResponse.json({ status: 'ok', tasks_found: 0 });
    }

    // Group tasks by chat
    const groupedTasks: { [key: string]: typeof openTasks } = {};
    for (const task of openTasks) {
      if (!groupedTasks[task.chat_id]) {
        groupedTasks[task.chat_id] = [];
      }
      groupedTasks[task.chat_id].push(task);
    }

    // Send reminders to each chat that has open tasks
    let sentCount = 0;
    for (const chatId in groupedTasks) {
      const tasks = groupedTasks[chatId];
      let message = `⚠️ <b>OPEN TASKS REMINDER</b> ⚠️\n\n`;
      
      tasks.forEach(t => {
        message += `<b>#${t.id}</b> - ${t.assignee}: ${t.task_name}\n`;
      });
      
      message += `\n<i>Type /done [id] to complete a task.</i>`;

      await sendMessage(parseInt(chatId), message);
      sentCount++;
    }

    return NextResponse.json({ status: 'ok', groups_notified: sentCount });
  } catch (error) {
    console.error("Task Reminder Cron Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
