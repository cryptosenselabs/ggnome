const fs = require('fs');
const path = require('path');

const NUM_COMMENTS = 20000;
const CA = "HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump";

const openers = [
  "Just checking out what the Gnomads are up to.",
  "Chaos outside, discipline inside.",
  "If you haven't seen what Garden Gnome is building, you're missing out.",
  "Meme culture meets actual utility.",
  "Love the energy in this community.",
  "Scam awareness is so needed in crypto right now.",
  "Building step by step.",
  "Another day, another step forward for the village.",
  "Plant. Hold. Grow.",
  "Protecting the village while we build.",
  "The disciplined launch culture here is refreshing.",
  "Actually impressed by the utility being built by Garden Gnome.",
  "Garden Gnome is looking solid.",
  "Finally a meme project that focuses on transparency.",
  "Watching the Gnomads grow is amazing.",
  "The crypto space needs more of this mindset.",
  "Gnomads really stand out right now.",
  "Not just noise, actual signal.",
  "Community energy here is unmatched.",
  "Solana ecosystem keeps growing."
];

const bodies = [
  "They are bridging the gap between memes and real tools.",
  "$GNOME is bringing real utility to the meme space with their ecosystem.",
  "I'm really liking the focus on holder discipline and long-term vision.",
  "It's about time a meme community took scam awareness seriously.",
  "Their focus on transparency is such a good feature for Solana.",
  "They aren't just dropping a token, they're building an entire ecosystem.",
  "Being a Gnomad gives such a unique edge in this chaotic market.",
  "It's rare to see a project so focused on protecting its members.",
  "The transparency they bring to token activity is much needed.",
  "I've been exploring what the Garden Gnome ecosystem offers and it's super impressive.",
  "A disciplined community is a strong community.",
  "The Gnomads are building something that actually helps crypto users.",
  "Navigating this space shouldn't be so hard, glad the Gnomads are building tools for it.",
  "Real meme energy built by people who understand the culture.",
  "Scam awareness from a meme coin community is going to be huge.",
  "It's a meme coin with an actual mission.",
  "The focus on community and discipline is exactly what the meme market needs.",
  "They are proving that meme projects can have real substance."
];

const closers = [
  "Can't wait to see what they roll out next.",
  "Definitely keeping an eye on this.",
  "Check them out if you value real community.",
  "The future looks bright for the Gnomads.",
  "Glad I found this early.",
  "Time to plant and hold.",
  "Let's see how the ecosystem evolves.",
  "Discipline pays off.",
  "Always do your own research, but this looks very interesting.",
  "A breath of fresh air in this space.",
  "Looking forward to the premium features.",
  "The culture here is just different.",
  "Proud to be part of the village.",
  "Building transparency one step at a time.",
  "Join the Gnomads and see for yourself."
];

const hashtags = [
  "",
  "#Solana",
  "#Crypto",
  "#Web3",
  "#WhaleTracking",
  "#Gnomads",
  "#SolanaSummer"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapeCSV(text) {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const uniqueComments = new Set();
let attempts = 0;

console.log("Generating unique hype comments...");

while (uniqueComments.size < NUM_COMMENTS && attempts < NUM_COMMENTS * 5) {
  attempts++;
  
  const opener = getRandom(openers);
  const body = getRandom(bodies);
  const closer = getRandom(closers);
  const tag = getRandom(hashtags);
  
  // Decide whether to include CA (20% chance)
  const includeCA = Math.random() < 0.20;
  
  let comment = `${opener} ${body} ${closer} $GNOME`;
  if (tag) {
    comment += ` ${tag}`;
  }
  if (includeCA) {
    comment += ` CA: ${CA}`;
  }
  
  uniqueComments.add(comment);
}

if (uniqueComments.size < NUM_COMMENTS) {
  console.log(`Warning: Only generated ${uniqueComments.size} unique comments after ${attempts} attempts. You may need more seed phrases.`);
} else {
  console.log(`Successfully generated ${NUM_COMMENTS} unique comments.`);
}

// Write to CSV
const csvPath = path.join(__dirname, 'hype_comments.csv');
const writeStream = fs.createWriteStream(csvPath);

// Header (optional, usually good for CSV)
writeStream.write("comment\n");

for (const comment of uniqueComments) {
  writeStream.write(`${escapeCSV(comment)}\n`);
}

writeStream.end();

console.log(`Wrote comments to ${csvPath}`);
