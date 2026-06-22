import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Connect to Vercel KV / Upstash Redis
const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export async function GET() {
  try {
    if (!process.env.KV_REST_API_URL) {
      console.warn("KV_REST_API_URL is missing. Returning empty leaderboard.");
      return NextResponse.json({ leaderboard: [] });
    }
    
    // Fetch top 10 from sorted set 'gnome_leaderboard' (highest score first)
    const results = await redis.zrange("gnome_leaderboard", 0, 9, { rev: true, withScores: true });
    
    // Upstash zrange withScores returns an array like [member1, score1, member2, score2, ...]
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({ name: results[i], score: results[i + 1] });
    }

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    return NextResponse.json({ leaderboard: [] });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json({ success: false, message: "KV not configured" });
    }

    const { name, score } = await req.json();

    if (!name || typeof score !== 'number') {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Add score to sorted set. If user plays again, this overwrites their previous score.
    await redis.zadd("gnome_leaderboard", { score, member: name });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
