import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Store in a local temp directory or use a simple file-based approach
const dataFilePath = path.join(process.cwd(), 'public', 'visitors.json');

export async function GET() {
  try {
    let count = 1000;
    
    // Read current count if file exists
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (typeof parsed.count === 'number') {
        count = parsed.count;
      }
    }

    // Increment
    count += 1;

    // Save new count
    fs.writeFileSync(dataFilePath, JSON.stringify({ count }));

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to read/write visitors file:", error);
    // Fallback if file system is read-only (like Vercel serverless)
    return NextResponse.json({ count: 1042 });
  }
}
