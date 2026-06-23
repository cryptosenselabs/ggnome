"use client";

import React, { useEffect, useRef, useState } from "react";

// Game Constants
const CANVAS_W = 1280;
const CANVAS_H = 720;
const FLOOR_Y = 520; // Hover altitude (roughly 72% down the screen)

const GRAVITY = 0.8;
const JUMP_VELOCITY = -22;
const SLIDE_DURATION = 450;
const INITIAL_SPEED = 18; // 1.5x original base speed
const SPEED_INCREMENT = 0.002;

// Visual Sizes
const GNOME_VISUAL_WIDTH = 170;
const GNOME_VISUAL_HEIGHT = 125;
const GNOME_SLIDE_WIDTH = 185;
const GNOME_SLIDE_HEIGHT = 95;

// Helpers
export type CryptoCoin = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  rank: number | null;
  change24h: number | null;
  logo: string;
  scoreValue: number;
};

function calculateCoinScore(priceUsd: number): number {
  return Math.max(10, Math.round(Math.log10(Number(priceUsd || 0) + 1) * 100));
}

function formatPrice(price: number) {
  if (price >= 1000) return "$" + (price / 1000).toFixed(1) + "K";
  if (price >= 1) return "$" + price.toFixed(2);
  if (price >= 0.01) return "$" + price.toFixed(4);
  return "$" + price.toExponential(2);
}

// Level Progression Configuration
interface LevelData {
  chapter: string;
  name: string;
  scoreThreshold: number;
  bgFolder: string;
  backgroundTint: string;
  speedMultiplier: number;
  hazards: {
    candles: boolean;
    lasers: boolean;
    wind: boolean;
  };
  obstacleSpawnRate: number; // Smaller = faster spawns
  coinSpawnRate: number;     // Smaller = faster spawns
}

const CAMPAIGN_LEVELS: LevelData[] = [
  // Chapter 1: The Garden Awakens
  { chapter: "Chapter 1: The Garden Awakens", name: "Gnome Meadow", scoreThreshold: 0, bgFolder: "level1", backgroundTint: "rgba(0, 0, 0, 0)", speedMultiplier: 1.0, hazards: { candles: true, lasers: false, wind: false }, obstacleSpawnRate: 1300, coinSpawnRate: 550 },
  { chapter: "Chapter 1: The Garden Awakens", name: "Seedling Valley", scoreThreshold: 5000, bgFolder: "level2", backgroundTint: "rgba(255, 165, 0, 0.15)", speedMultiplier: 1.2, hazards: { candles: true, lasers: true, wind: false }, obstacleSpawnRate: 1200, coinSpawnRate: 450 },

  // Chapter 2: The Gnome Homeland
  { chapter: "Chapter 2: The Gnome Homeland", name: "Mushroom Fields", scoreThreshold: 15000, bgFolder: "level3", backgroundTint: "rgba(128, 0, 128, 0.2)", speedMultiplier: 1.4, hazards: { candles: true, lasers: false, wind: false }, obstacleSpawnRate: 1000, coinSpawnRate: 400 },
  { chapter: "Chapter 2: The Gnome Homeland", name: "Alpine Wind Run", scoreThreshold: 30000, bgFolder: "level4", backgroundTint: "rgba(0, 191, 255, 0.2)", speedMultiplier: 1.6, hazards: { candles: false, lasers: false, wind: true }, obstacleSpawnRate: 850, coinSpawnRate: 350 },

  // Chapter 3: Market Chaos
  { chapter: "Chapter 3: Market Chaos", name: "Red Candle Pass", scoreThreshold: 50000, bgFolder: "level5", backgroundTint: "rgba(255, 0, 0, 0.2)", speedMultiplier: 1.8, hazards: { candles: true, lasers: false, wind: true }, obstacleSpawnRate: 750, coinSpawnRate: 350 },
  { chapter: "Chapter 3: Market Chaos", name: "Liquidation Ridge", scoreThreshold: 75000, bgFolder: "level6", backgroundTint: "rgba(255, 0, 0, 0.4)", speedMultiplier: 2.1, hazards: { candles: true, lasers: true, wind: true }, obstacleSpawnRate: 600, coinSpawnRate: 400 },

  // Chapter 4: The Gnomad Cult
  { chapter: "Chapter 4: The Gnomad Cult", name: "The Gnomad Village", scoreThreshold: 125000, bgFolder: "level7", backgroundTint: "rgba(0, 100, 0, 0.3)", speedMultiplier: 2.5, hazards: { candles: true, lasers: true, wind: false }, obstacleSpawnRate: 550, coinSpawnRate: 250 },
  { chapter: "Chapter 4: The Gnomad Cult", name: "Full Moon Raid", scoreThreshold: 200000, bgFolder: "level8", backgroundTint: "rgba(0, 0, 139, 0.6)", speedMultiplier: 3.0, hazards: { candles: true, lasers: true, wind: true }, obstacleSpawnRate: 450, coinSpawnRate: 200 },

  // Chapter 5: The Moon Pump
  { chapter: "Chapter 5: The Moon Pump", name: "Bear Market Storm", scoreThreshold: 350000, bgFolder: "level9", backgroundTint: "rgba(50, 50, 50, 0.8)", speedMultiplier: 3.5, hazards: { candles: true, lasers: true, wind: true }, obstacleSpawnRate: 400, coinSpawnRate: 250 },
  { chapter: "Chapter 5: The Moon Pump", name: "Moon Pump Summit", scoreThreshold: 750000, bgFolder: "level10", backgroundTint: "rgba(255, 215, 0, 0.5)", speedMultiplier: 4.5, hazards: { candles: true, lasers: true, wind: true }, obstacleSpawnRate: 250, coinSpawnRate: 150 },
];

// Interfaces
interface Entity {
  id: number;
  type: "redCandle" | "cryptoCoin" | "liquidationLaser" | "windStreak";
  x: number;
  y: number;
  w: number;
  h: number;
  vy?: number;
  collected?: boolean;
  coin?: CryptoCoin;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
}

const SHARE_MESSAGES = [
  "I reached ${mcap} MCAP on Level {level} in Gnome Runner before getting {reason}. Dodge bears. Survive rugs. Harvest $GNOME. https://chaosgnome.xyz",
  "My wife left me but at least I hit ${mcap} MCAP on Level {level} before {reason}. $GNOME is my family now. https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP (Level {level}). Still performing better than my actual crypto portfolio! $GNOME to the moon! 🍄 https://chaosgnome.xyz",
  "Paper handed at ${mcap} MCAP on Level {level} because of {reason}. Don't fade $GNOME! 💎🙌 https://chaosgnome.xyz",
  "They said it was a bull market, but I got {reason} at ${mcap} MCAP on Level {level}. Stacking $GNOME anyway! https://chaosgnome.xyz",
  "Liquidated?! I got {reason} at ${mcap} MCAP on Level {level}. Selling my house to buy more $GNOME! 📉 https://chaosgnome.xyz",
  "Surviving the bear market until {reason} took me out at ${mcap} MCAP on Level {level}. $GNOME never sleeps! 🌕 https://chaosgnome.xyz",
  "I was farming $GNOME at ${mcap} MCAP (Level {level}) when suddenly: {reason}. Can you beat my score? https://chaosgnome.xyz",
  "Secured ${mcap} MCAP by Level {level} until I suffered {reason}. Need more $GNOME! 🚀 https://chaosgnome.xyz",
  "Level {level} boss? The chart! Got {reason} at ${mcap} MCAP. Apeing into more $GNOME. https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. I am emotionally damaged but financially $GNOME! https://chaosgnome.xyz",
  "Lost my life savings on Level {level} to {reason} at ${mcap} MCAP. At least I still have my $GNOME bags. https://chaosgnome.xyz",
  "I told my boss I quit, then got {reason} at ${mcap} MCAP on Level {level}. Guess I'll just farm $GNOME. https://chaosgnome.xyz",
  "Ate glass, got {reason} at ${mcap} MCAP on Level {level}. Typical Tuesday in the $GNOME mines. https://chaosgnome.xyz",
  "Nothing hurts more than {reason} at ${mcap} MCAP on Level {level}. Send $GNOME and prayers! 🙏 https://chaosgnome.xyz",
  "Just experienced {reason} at ${mcap} MCAP on Level {level}. Time to touch grass... wait, $GNOME lives in the grass! https://chaosgnome.xyz",
  "I was up bigly (${mcap} MCAP, Level {level}) until {reason}. Now I am just a poor $GNOME farmer. https://chaosgnome.xyz",
  "Can someone explain why {reason} happens at ${mcap} MCAP on Level {level}? I'm just a simple $GNOME! https://chaosgnome.xyz",
  "Got rekt by {reason} at ${mcap} MCAP (Level {level}). Re-mortgaging my gnome-home to buy more $GNOME! 🍄 https://chaosgnome.xyz",
  "Level {level} was going great until {reason} at ${mcap} MCAP. Still holding my $GNOME with diamond hands! 💎 https://chaosgnome.xyz",
  "Mom: 'Are you winning?' Me: 'I got {reason} at ${mcap} MCAP on Level {level}.' Mom: 'Get more $GNOME.' https://chaosgnome.xyz",
  "My therapist said {reason} isn't real, but it killed me at ${mcap} MCAP on Level {level}! Only $GNOME can heal me. https://chaosgnome.xyz",
  "I don't always get {reason}, but when I do, it's at ${mcap} MCAP on Level {level}. Stay thirsty, my $GNOME friends. https://chaosgnome.xyz",
  "Just dropped my phone because of {reason} at ${mcap} MCAP (Level {level}). $GNOME is my only hope now. https://chaosgnome.xyz",
  "I survived the FTX crash but couldn't survive {reason} at ${mcap} MCAP on Level {level}. $GNOME is SAFU! https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. Time to revenge-farm some $GNOME! 😡🍄 https://chaosgnome.xyz",
  "To the guy who invented {reason}: I lost at ${mcap} MCAP on Level {level}. I will find you. And I will take your $GNOME. https://chaosgnome.xyz",
  "Was calculating my lambo color at ${mcap} MCAP on Level {level} when {reason} happened. $GNOME is still the play! 🏎️ https://chaosgnome.xyz",
  "Just told my date about {reason} at ${mcap} MCAP on Level {level}. She left. At least $GNOME stays. 💔 https://chaosgnome.xyz",
  "I put my life savings into $GNOME and got {reason} at ${mcap} MCAP on Level {level}. No regrets! 🚀 https://chaosgnome.xyz",
  "My dog ate my hardware wallet and then I got {reason} at ${mcap} MCAP on Level {level}. $GNOME is my spirit animal now. https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. If anyone needs me, I'll be crying into my $GNOME bags. 😭 https://chaosgnome.xyz",
  "I was this close to retirement (${mcap} MCAP, Level {level}) until {reason}. Back to the $GNOME fiat mines! ⛏️ https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP on Level {level}. The simulation is glitching, but $GNOME is real! 🍄 https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. I'm starting to think this is a personal attack on my $GNOME. 🛑 https://chaosgnome.xyz",
  "I thought I was a whale at ${mcap} MCAP on Level {level}, then {reason} turned me into plankton. $GNOME will save me! 🐋 https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP on Level {level}. My mom says I'm still her favorite $GNOME! 🥰 https://chaosgnome.xyz",
  "I don't need sleep, I need answers! Why did {reason} happen at ${mcap} MCAP on Level {level}? $GNOME is the answer! 🍄 https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. I'm going to tell my kids this was the Great $GNOME Crash of '24. 📉 https://chaosgnome.xyz",
  "I was feeling bullish at ${mcap} MCAP on Level {level} until {reason}. Now I'm just feeling $GNOME. 🍄 https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP on Level {level}. The only thing greener than my chart is my $GNOME! 🌿 https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. I'm not crying, I just got some $GNOME dust in my eye. 😢 https://chaosgnome.xyz",
  "I was promised lambos, but all I got was {reason} at ${mcap} MCAP on Level {level}. At least I have $GNOME! 🏎️ https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP on Level {level}. My hands are weak, but my $GNOME bags are heavy! 💪 https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. I'm starting a support group for $GNOME victims. 🍄 https://chaosgnome.xyz",
  "I was dodging rugs like Neo at ${mcap} MCAP on Level {level} until {reason}. $GNOME is the chosen one! 🕶️ https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP on Level {level}. My portfolio is rekt, but my $GNOME is thriving! 📈 https://chaosgnome.xyz",
  "Got {reason} at ${mcap} MCAP on Level {level}. I'm going to go live in the woods with the actual $GNOME now. 🌲 https://chaosgnome.xyz",
  "I was so close to financial freedom (${mcap} MCAP, Level {level}) until {reason}. $GNOME is my only path forward! 🍄 https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP on Level {level}. I'm not sure what hurts more, the loss or the lack of $GNOME. 🍄 https://chaosgnome.xyz"
];

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UI State
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [shareMessage, setShareMessage] = useState("");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [harvestedCount, setHarvestedCount] = useState(0);
  const [lastGrab, setLastGrab] = useState("");
  const [highScore, setHighScore] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [gnomeModeActive, setGnomeModeActive] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<{ name: string, score: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelBanner, setLevelBanner] = useState<{ chapter: string; name: string } | null>(null);

  // Refs for game loop state
  const stateRef = useRef({
    state: "menu",
    score: 0,
    coins: 0,
    speed: INITIAL_SPEED,
    multiplier: 1.0,
    gnomeModeTime: 0,
    levelIndex: 0,
    loopOffset: 0,
  });

  const playerRef = useRef({
    x: 200,
    baseX: 200,
    y: FLOOR_Y,
    targetY: FLOOR_Y,
    w: 100,
    h: 120,
    vy: 0,
    state: "jumping" as "running" | "jumping" | "sliding",
    slideEndTime: 0,
  });

  const bgStateRef = useRef({
    x: 0,
    currentIndex: 0,
  });

  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});

  const frameRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const nextCoinSpawnRef = useRef(0);

  // Asset Refs
  const assetsRef = useRef<Record<string, HTMLImageElement>>({});
  const cryptoCoinsRef = useRef<CryptoCoin[]>([]);
  const cryptoLogosRef = useRef<Record<string, HTMLImageElement>>({});
  const harvestedCountRef = useRef(0);
  const lastGrabRef = useRef("");

  useEffect(() => {
    // Load player name from local storage if available
    const storedName = localStorage.getItem("gnome_runner_name");
    if (storedName) setPlayerName(storedName);

    if (gameState === "menu") {
      fetch("/api/leaderboard")
        .then(res => res.json())
        .then(data => {
          if (data.leaderboard) setLeaderboardData(data.leaderboard);
        })
        .catch(e => console.error("Leaderboard fetch error:", e));
    }
  }, [gameState]);

  useEffect(() => {
    // Load high score
    const stored = localStorage.getItem("gnome_runner_highscore");
    if (stored) setHighScore(parseInt(stored));

    // Load Crypto JSON
    fetch("/assets/crypto/crypto-coins.json")
      .then(res => res.json())
      .then((data: CryptoCoin[]) => {
        const subset = data.sort(() => 0.5 - Math.random()).slice(0, 20);
        cryptoCoinsRef.current = subset;
        subset.forEach(c => {
          const img = new Image();
          img.src = c.logo;
          img.onload = () => { cryptoLogosRef.current[c.symbol] = img; };
        });
      }).catch(err => {
        console.warn("Using fallback crypto list", err);
        cryptoCoinsRef.current = [
          { id: "bitcoin", symbol: "BTC", name: "Bitcoin", priceUsd: 65000, rank: 1, change24h: 1.2, logo: "/assets/crypto/logos/bitcoin.png", scoreValue: calculateCoinScore(65000) },
          { id: "ethereum", symbol: "ETH", name: "Ethereum", priceUsd: 3500, rank: 2, change24h: -0.5, logo: "/assets/crypto/logos/ethereum.png", scoreValue: calculateCoinScore(3500) },
          { id: "solana", symbol: "SOL", name: "Solana", priceUsd: 150, rank: 5, change24h: 5.4, logo: "/assets/crypto/logos/solana.png", scoreValue: calculateCoinScore(150) }
        ];
      });

    // Preload Images
    const imagePaths: Record<string, string> = {
      "coin-gnome": "/assets/coin-gnome.png",
      "gnome-rocket": "/assets/gnome-rocket.png",
    };

    Object.entries(imagePaths).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[key] = img;
      };
      img.onerror = () => {
        if (["gnome-rocket", "coin-gnome"].includes(key)) {
          setAssetError(`Missing game asset: ${key}. Please check public/assets.`);
        }
      };
    });
  }, []);

  // Dynamic Background Loader
  useEffect(() => {
    const levelData = CAMPAIGN_LEVELS[currentLevel];
    if (!levelData) return;

    setAssetError("");

    for (let i = 1; i <= 5; i++) {
      const idx = String(i).padStart(2, '0');
      const key = `bg-${idx}`;
      const src = `/assets/background/${levelData.bgFolder}/bg-${idx}.png`;

      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[key] = img;
      };
      img.onerror = () => {
        console.warn(`Missing background: ${src}`);
      };
    }
  }, [currentLevel]);

  useEffect(() => {
    // Developer Cheat: Expose function to global window
    (window as any).jumpToLevel = (levelNumber: number) => {
      const idx = levelNumber - 1;
      if (idx >= 0 && idx < CAMPAIGN_LEVELS.length) {
        const targetLevel = CAMPAIGN_LEVELS[idx];
        stateRef.current.levelIndex = idx;
        stateRef.current.score = targetLevel.scoreThreshold;
        stateRef.current.speed = INITIAL_SPEED * targetLevel.speedMultiplier;
        setCurrentLevel(idx);
        setLevelBanner({ chapter: targetLevel.chapter, name: targetLevel.name });
        setTimeout(() => setLevelBanner(null), 4000);
        console.log(`Jumped to level ${levelNumber}: ${targetLevel.name}`);
      } else {
        console.log("Invalid level number! Use 1 to 15.");
      }
    };
  }, []);

  const startGame = () => {
    if (!playerName.trim()) {
      alert("Please enter your name to play!");
      return;
    }

    // Attempt to enter fullscreen to hide mobile browser address bars
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(e => console.log(e));
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    } catch (e) {
      console.log("Fullscreen request failed", e);
    }

    setGameState("playing");
    setGameOverReason("");
    setScore(0);
    setCoins(0);
    setGnomeModeActive(false);

    stateRef.current = {
      state: "playing",
      score: 0,
      coins: 0,
      speed: INITIAL_SPEED,
      multiplier: 1.0,
      gnomeModeTime: 0,
      levelIndex: 0,
      loopOffset: 0,
    };

    playerRef.current = {
      x: 200,
      y: FLOOR_Y,
      targetY: FLOOR_Y,
      w: 100,
      h: 120,
      vy: 0,
      state: "jumping",
      slideEndTime: 0,
    };

    bgStateRef.current = {
      x: 0,
      currentIndex: 0,
    };

    entitiesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    harvestedCountRef.current = 0;
    lastGrabRef.current = "";

    nextSpawnRef.current = performance.now() + 1000;
    nextCoinSpawnRef.current = performance.now() + 500;
  };

  const gameOver = (reason: string) => {
    stateRef.current.state = "gameover";
    setGameState("gameover");
    setGameOverReason(reason);
    setGnomeModeActive(false);

    const mcapString = Math.floor(stateRef.current.score).toLocaleString();
    const levelStr = (stateRef.current.levelIndex + 1).toString();
    const randomMsg = SHARE_MESSAGES[Math.floor(Math.random() * SHARE_MESSAGES.length)];
    const finalMsg = randomMsg
      .replace("{mcap}", mcapString)
      .replace("{level}", levelStr)
      .replace("{reason}", reason);
    setShareMessage(encodeURIComponent(finalMsg));

    // Screen flash and hit particles
    for (let j = 0; j < 20; j++) {
      particlesRef.current.push({
        x: playerRef.current.x + 85,
        y: playerRef.current.y - 60,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: "#ef4444", // red hit
      });
    }

    const finalScore = Math.floor(stateRef.current.score);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("gnome_runner_highscore", finalScore.toString());
    }

    const submitName = playerName.trim() || "Anonymous Degen";
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: submitName, score: finalScore })
    }).then(() => {
      fetch("/api/leaderboard")
        .then(res => res.json())
        .then(data => {
          if (data.leaderboard) setLeaderboardData(data.leaderboard);
        });
    }).catch(e => console.error("Score submit error:", e));
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (stateRef.current.state === "gameover" || stateRef.current.state === "menu") startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [highScore]);

  // Pointer Tracking for Mouse & Touch
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (stateRef.current.state === "playing" && canvasRef.current) {
      if (e.pointerType === "touch" || e.buttons === 1) {
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Calculate the actual drawn area within the object-contain element
        const canvasAspect = CANVAS_W / CANVAS_H;
        const rectAspect = rect.width / rect.height;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        if (rectAspect > canvasAspect) {
          drawHeight = rect.height;
          drawWidth = drawHeight * canvasAspect;
          offsetX = (rect.width - drawWidth) / 2;
        } else {
          drawWidth = rect.width;
          drawHeight = drawWidth / canvasAspect;
          offsetY = (rect.height - drawHeight) / 2;
        }

        const scaleX = CANVAS_W / drawWidth;
        const scaleY = CANVAS_H / drawHeight;
        
        let y = (e.clientY - rect.top - offsetY) * scaleY;
        let x = (e.clientX - rect.left - offsetX) * scaleX;

        // Clamp to screen
        if (y < GNOME_VISUAL_HEIGHT - 20) y = GNOME_VISUAL_HEIGHT - 20;
        if (y > FLOOR_Y) y = FLOOR_Y;

        playerRef.current.targetY = y;
        (playerRef.current as any).targetX = x;
        (playerRef.current as any).isDragging = true;
      } else {
        (playerRef.current as any).isDragging = false;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    (playerRef.current as any).isDragging = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Do not hijack clicks on buttons, links, or inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.tagName === "INPUT" ||
      target.closest("button") ||
      target.closest("a")
    ) {
      return;
    }

    if (stateRef.current.state === "gameover") {
      startGame();
      return;
    }

    // Do not auto-start if in menu (must click START RUN button to validate name)
    if (stateRef.current.state === "menu") {
      return;
    }

    (playerRef.current as any).isDragging = true;

    // Player Physics & Animation (Drag to Steer)
    handlePointerMove(e);
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      frameRef.current = requestAnimationFrame(loop);
      const dt = time - lastTime;
      lastTime = time;

      if (stateRef.current.state !== "playing") {
        // Run particle/text decay even when game over
        updateVisualsOnly();
        drawFrame(ctx, time);
        return;
      }

      updatePhysics(time, dt);
      drawFrame(ctx, time);

      // Sync UI occasionally
      setScore(Math.floor(stateRef.current.score));
      setCoins(stateRef.current.coins);
      setHarvestedCount(harvestedCountRef.current);
      setLastGrab(lastGrabRef.current);
      setGnomeModeActive(stateRef.current.gnomeModeTime > time);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const updateVisualsOnly = () => {
    // Particles Update
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const part = particlesRef.current[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life -= 0.05;
      if (part.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Floating Text Update
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatingTextsRef.current[i];
      ft.y -= 2;
      ft.life -= 0.02;
      if (ft.life <= 0) floatingTextsRef.current.splice(i, 1);
    }
  }

  const spawnObstacle = (time: number, levelData: LevelData) => {
    // Determine which hazards are allowed
    const choices = [];
    if (levelData.hazards.candles) choices.push("redCandle");
    if (levelData.hazards.lasers) choices.push("liquidationLaser");
    if (levelData.hazards.wind) choices.push("windStreak");

    if (choices.length === 0) return; // No hazards for this level

    const chosenType = choices[Math.floor(Math.random() * choices.length)];

    if (chosenType === "redCandle") {
      const isTopCandle = Math.random() > 0.5;
      const width = 45 + Math.random() * 25;
      const height = 100 + Math.random() * 200;

      entitiesRef.current.push({
        id: time,
        type: "redCandle",
        x: CANVAS_W + 100,
        y: isTopCandle ? 0 : FLOOR_Y - height,
        w: width,
        h: height,
        vy: 0,
      });
    } else if (chosenType === "liquidationLaser") {
      entitiesRef.current.push({
        id: time,
        type: "liquidationLaser",
        x: CANVAS_W + 100,
        y: 100 + Math.random() * (FLOOR_Y - 200), // Random altitude
        w: 150 + Math.random() * 300, // Long horizontal beam
        h: 20, // Thin laser
        vy: 0,
      });
    } else if (chosenType === "windStreak") {
      entitiesRef.current.push({
        id: time,
        type: "windStreak",
        x: CANVAS_W + 100,
        y: Math.random() * FLOOR_Y,
        w: 300 + Math.random() * 400,
        h: 5,
        vy: 0,
      });
    }
  };

  const spawnCoin = (time: number) => {
    let coinData = undefined;
    if (cryptoCoinsRef.current.length > 0) {
      coinData = cryptoCoinsRef.current[Math.floor(Math.random() * cryptoCoinsRef.current.length)];
    }

    entitiesRef.current.push({
      id: time,
      type: "cryptoCoin",
      coin: coinData,
      x: CANVAS_W + 100,
      y: Math.random() * (FLOOR_Y - 100) + 50, // Any altitude from 50 to FLOOR_Y-50
      w: 40,
      h: 40,
    });
  };

  const updatePhysics = (time: number, dt: number) => {
    const p = playerRef.current;
    const s = stateRef.current;

    let forwardBoost = 1.0;
    if ((p as any).isDragging && (p as any).targetX && (p as any).targetX > 200) {
      forwardBoost = 1.0 + Math.min(((p as any).targetX - 200) / 400, 0.5); // Max 1.5x speed multiplier
    }
    const currentFrameSpeed = s.speed * forwardBoost;

    // Increase score & speed
    s.score += (currentFrameSpeed * s.multiplier) / 10;
    s.speed += SPEED_INCREMENT;

    // Check Level Up
    const nextLevelIndex = s.levelIndex + 1;
    const effectiveScore = s.score - s.loopOffset;

    if (nextLevelIndex < CAMPAIGN_LEVELS.length) {
      if (effectiveScore >= CAMPAIGN_LEVELS[nextLevelIndex].scoreThreshold) {
        const nextLevelData = CAMPAIGN_LEVELS[nextLevelIndex];
        s.levelIndex = nextLevelIndex;
        s.speed = INITIAL_SPEED * nextLevelData.speedMultiplier;
        setCurrentLevel(nextLevelIndex);
        setLevelBanner({ chapter: nextLevelData.chapter, name: nextLevelData.name });
        setTimeout(() => setLevelBanner(null), 4000);

        floatingTextsRef.current.push({
          x: CANVAS_W / 2 - 200,
          y: CANVAS_H / 2,
          text: `LEVEL UP!\n${nextLevelData.name}`,
          life: 2.0,
        });
      }
    } else {
      if (effectiveScore >= 1250000) {
        s.levelIndex = 0;
        s.loopOffset = s.score;
        s.speed = INITIAL_SPEED * CAMPAIGN_LEVELS[0].speedMultiplier;
        setCurrentLevel(0);
        setLevelBanner({ chapter: "CYCLE REPEATS", name: "The Bear Trap" });
        setTimeout(() => setLevelBanner(null), 4000);

        floatingTextsRef.current.push({
          x: CANVAS_W / 2 - 200,
          y: CANVAS_H / 2,
          text: `NEW CYCLE!\nSURVIVE`,
          life: 2.0,
        });
      }
    }

    // Gnome Mode
    const isGnomeMode = time < s.gnomeModeTime;

    // Safe initialization for hot-reloads
    if (typeof (p as any).baseX === "undefined") (p as any).baseX = 200;

    // Player Physics & Animation (Drag to Steer)
    if (!(p as any).isDragging) {
      p.targetY = FLOOR_Y; // Gravity pulls back to the ground when released
    }
    const diffY = p.targetY - p.y;
    p.y += diffY * 0.15; // Smooth interpolation Y

    // Elastic forward pull (X-axis)
    let desiredX = (p as any).baseX;
    if ((p as any).isDragging && (p as any).targetX > (p as any).baseX) {
      desiredX = (p as any).baseX + Math.min(((p as any).targetX - (p as any).baseX), 300); // Stretch up to 300px forward
    }
    const diffX = desiredX - p.x;
    p.x += diffX * 0.1; // Smooth elastic interpolation X

    // Boundaries
    if (p.y < GNOME_VISUAL_HEIGHT - 20) p.y = GNOME_VISUAL_HEIGHT - 20;
    if (p.y > FLOOR_Y) p.y = FLOOR_Y;

    p.state = "jumping"; // Always flying

    // Rocket thrust exhaust following vertical movement
    if (Math.random() > 0.4) {
      particlesRef.current.push({
        x: p.x + 35, // booster nozzle
        y: p.y - 10,
        vx: -currentFrameSpeed - Math.random() * 5,
        vy: diffY * 0.1 + (Math.random() - 0.5) * 5,
        life: 0.6,
        color: Math.random() > 0.5 ? "#fbbf24" : "#f97316", // fiery exhaust
      });
    }

    if (isGnomeMode) {
      // Passive Gnome Mode red/gold particles
      if (Math.random() > 0.7) {
        particlesRef.current.push({
          x: p.x + Math.random() * p.w,
          y: p.y - Math.random() * 120,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0.8,
          color: Math.random() > 0.5 ? "#ef4444" : "#fbbf24", // red/gold
        });
      }
    }

    // Hitbox dimensions based on state (physics hitboxes)
    const pBox = {
      x: p.x + 30, // Tighter horizontal hitboxes
      y: p.y - 110,
      w: p.w - 40,
      h: 110,
    };

    // Spawning
    const currentLevelData = CAMPAIGN_LEVELS[s.levelIndex];
    if (time > nextSpawnRef.current) {
      spawnObstacle(time, currentLevelData);
      nextSpawnRef.current = time + currentLevelData.obstacleSpawnRate + Math.random() * 500;
    }
    if (time > nextCoinSpawnRef.current) {
      spawnCoin(time);
      nextCoinSpawnRef.current = time + currentLevelData.coinSpawnRate + Math.random() * 400;
    }
    // Entities Logic
    for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
      const ent = entitiesRef.current[i];
      ent.x -= currentFrameSpeed;

      if (ent.type === "redCandle") {
        ent.y += ent.vy ?? 2.5; // Diagonal drop simulation
      }

      // Auto-collect coins in Gnome Mode
      if (isGnomeMode && ent.type === "cryptoCoin" && !ent.collected) {
        if (ent.x < p.x + 600 && ent.x > p.x) {
          // Magnetize towards player aggressively
          ent.x -= 15;
          ent.y += (p.y - 60 - ent.y) * 0.15;
        }
      }

      // Collision Detection AABB
      const eBox = { x: ent.x + 10, y: ent.y + 10, w: ent.w - 20, h: ent.h - 20 };

      // Wind streaks have no hitbox
      if (ent.type !== "windStreak") {
        if (
          pBox.x < eBox.x + eBox.w &&
          pBox.x + pBox.w > eBox.x &&
          pBox.y < eBox.y + eBox.h &&
          pBox.y + pBox.h > eBox.y
        ) {
          if (ent.type === "redCandle") {
            gameOver("REKT BY THE RED CANDLE!");
            return;
          } else if (ent.type === "liquidationLaser") {
            gameOver("LIQUIDATED BY A LASER!");
            return;
          } else if (ent.type === "cryptoCoin" && !ent.collected) {
            ent.collected = true;
            const coinVal = ent.coin ? ent.coin.scoreValue : 100;
            const multiplier = isGnomeMode ? 2 : 1;
            const finalScore = coinVal * multiplier;

            s.coins += 1;
            s.score += finalScore;
            s.multiplier += 0.01;

            harvestedCountRef.current += 1;
            lastGrabRef.current = `${ent.coin ? ent.coin.symbol : 'COIN'} +${finalScore}`;

            // Float text
            floatingTextsRef.current.push({
              x: ent.x,
              y: ent.y,
              text: `+${finalScore} MCAP\n${ent.coin ? ent.coin.symbol : ''}`,
              life: 1.0,
            });

            // Sparkles
            for (let j = 0; j < 6; j++) {
              particlesRef.current.push({
                x: ent.x + ent.w / 2,
                y: ent.y + ent.h / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1.0,
                color: "#fbbf24", // gold
              });
            }

            // Very rare chance to trigger Gnome Mode
            if (Math.random() > 0.95 && !isGnomeMode) {
              s.gnomeModeTime = time + 6000; // 6 seconds
              floatingTextsRef.current.push({
                x: p.x,
                y: p.y - 150,
                text: "GNOME MODE: 2X HARVEST",
                life: 2.0,
              });
            }
          }
        }
      }

      // Cleanup offscreen or collected
      if (ent.x + ent.w < 0 || ent.collected) {
        entitiesRef.current.splice(i, 1);
      }
    }

    // Background Sequence Scroll
    const bg = bgStateRef.current;
    bg.x -= currentFrameSpeed * 0.3; // Slower than foreground for parallax depth effect

    const currentBgImg = assetsRef.current[`bg-${String(bg.currentIndex + 1).padStart(2, '0')}`];
    if (currentBgImg) {
      const bgScale = FLOOR_Y / currentBgImg.height;
      const drawW = currentBgImg.width * bgScale;

      // If the current background has completely scrolled offscreen to the left
      if (bg.x <= -drawW) {
        bg.x += drawW;
        bg.currentIndex = (bg.currentIndex + 1) % 5;
      }
    }

    updateVisualsOnly();
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Apply camera shake if game over
    if (stateRef.current.state === "gameover") {
      const shakeAmt = Math.max(0, 5 - (performance.now() - stateRef.current.gnomeModeTime) * 0.01);
      ctx.save();
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    } else {
      ctx.save();
    }

    // Draw Sequential Backgrounds
    const bg = bgStateRef.current;
    let currentDrawX = bg.x;
    let bgRenderIndex = bg.currentIndex;

    // Loop drawing backgrounds horizontally until we fill the canvas width
    let safeLoopBreak = 0;
    while (currentDrawX < CANVAS_W && safeLoopBreak < 5) {
      safeLoopBreak++;
      const bgKey = `bg-${String(bgRenderIndex + 1).padStart(2, '0')}`;
      const bgImg = assetsRef.current[bgKey];

      if (bgImg) {
        const bgScale = CANVAS_H / bgImg.height;
        const drawW = bgImg.width * bgScale;

        // Draw to fill the entire canvas (scenery at bottom, sky at top)
        ctx.drawImage(bgImg, currentDrawX, 0, drawW, CANVAS_H);

        currentDrawX += drawW;
        bgRenderIndex = (bgRenderIndex + 1) % 5;
      } else {
        // Fallback
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(currentDrawX, 0, CANVAS_W, CANVAS_H);
        break;
      }
    }

    // Apply Background Tint for Level Atmosphere
    const currentLevelData = CAMPAIGN_LEVELS[stateRef.current.levelIndex];
    if (currentLevelData && currentLevelData.backgroundTint !== "rgba(0, 0, 0, 0)") {
      ctx.save();
      ctx.fillStyle = currentLevelData.backgroundTint;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }

    // Draw Entities
    entitiesRef.current.forEach((ent) => {
      if (ent.type === "redCandle") {
        const wickX = ent.x + ent.w / 2;
        const wickTop = ent.y - 30; // wick goes 30px above
        const wickBottom = ent.y + ent.h + 10; // wick goes 10px below

        ctx.save();
        ctx.globalCompositeOperation = "source-over";

        // 1. Wick line
        ctx.strokeStyle = "#4A0D0D";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(wickX, wickTop);
        ctx.lineTo(wickX, wickBottom);
        ctx.stroke();

        // 2. Dark outline body
        ctx.fillStyle = "#5D0000";
        ctx.beginPath();
        ctx.roundRect(ent.x - 3, ent.y - 3, ent.w + 6, ent.h + 6, 4);
        ctx.fill();

        // 3. Main solid body fill
        ctx.fillStyle = "#E53935";
        ctx.beginPath();
        ctx.roundRect(ent.x, ent.y, ent.w, ent.h, 2);
        ctx.fill();

        // 4. Inner highlight stripe
        ctx.fillStyle = "#FF8A80";
        ctx.fillRect(ent.x + 6, ent.y + 6, 6, ent.h - 12);

        ctx.restore();
      } else if (ent.type === "cryptoCoin") {
        const floatY = ent.y + Math.sin(time * 0.005 + ent.id) * 10;

        ctx.save();
        // glowing circular frame
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(250, 204, 21, 0.6)";
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.strokeStyle = "rgba(250, 204, 21, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, floatY + ent.h / 2, ent.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // draw logo or fallback text
        let drawnLogo = false;
        if (ent.coin && cryptoLogosRef.current[ent.coin.symbol]) {
          const img = cryptoLogosRef.current[ent.coin.symbol];
          if (img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, ent.x + 4, floatY + 4, ent.w - 8, ent.h - 8);
            drawnLogo = true;
          }
        }

        if (!drawnLogo && ent.coin) {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ent.coin.symbol.slice(0, 3), ent.x + ent.w / 2, floatY + ent.h / 2);
        }

        // draw ticker and price
        if (ent.coin) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.shadowBlur = 5;
          ctx.shadowColor = "#000000";
          ctx.fillText(ent.coin.symbol, ent.x + ent.w / 2, floatY - 6);

          ctx.fillStyle = "#4ade80"; // green
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(formatPrice(ent.coin.priceUsd), ent.x + ent.w / 2, floatY + ent.h + 12);
        }

        ctx.restore();
      } else if (ent.type === "liquidationLaser") {
        ctx.save();
        ctx.fillStyle = "rgba(239, 68, 68, 0.4)"; // red core
        ctx.fillRect(ent.x, ent.y - 10, ent.w, ent.h + 20); // aura
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(ent.x, ent.y, ent.w, ent.h); // beam
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ef4444";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(ent.x, ent.y + ent.h / 2 - 2, ent.w, 4); // hot core
        ctx.restore();
      } else if (ent.type === "windStreak") {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.roundRect(ent.x, ent.y, ent.w, ent.h, 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Determine Sprite & Visual Bounds
    const p = playerRef.current;
    let pImg: HTMLImageElement | undefined;
    let drawW = GNOME_VISUAL_WIDTH;
    let drawH = GNOME_VISUAL_HEIGHT;
    let drawY = p.y - GNOME_VISUAL_HEIGHT;

    const isGnomeMode = stateRef.current.gnomeModeTime > time;

    pImg = assetsRef.current["gnome-rocket"];

    if (stateRef.current.state === "gameover") {
      pImg = assetsRef.current["gnomeHit"] || pImg;
    }

    if (pImg) {
      if (stateRef.current.state !== "gameover") {
        // Rocket Procedural Animation
        const pulse = time * 0.01;

        let bobY = Math.sin(pulse) * 4;
        let tilt = Math.sin(pulse) * 0.015;
        const scaleX = 1 + Math.sin(pulse) * 0.01;
        const scaleY = 1 - Math.sin(pulse) * 0.01;

        // Jump/Slide state overrides
        if (p.state === "jumping") {
          tilt = -0.15; // Nose up
          bobY = 0;
        } else if (p.state === "sliding") {
          // Duck / crouch
          drawY += 20;
          tilt = 0.05; // slight nose down
        }
        // Power Aura Implementation
        if (!isGnomeMode) {
          let auraColor = "";
          let auraRadius = 0;
          if (stateRef.current.score > 30000) { auraColor = "rgba(250, 204, 21, 0.4)"; auraRadius = 90; } // Gold
          else if (stateRef.current.score > 15000) { auraColor = "rgba(74, 222, 128, 0.4)"; auraRadius = 70; } // Green
          else if (stateRef.current.score > 5000) { auraColor = "rgba(34, 211, 238, 0.4)"; auraRadius = 50; } // Cyan

          if (auraColor) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.fillStyle = auraColor;
            ctx.shadowBlur = 30;
            ctx.shadowColor = auraColor;
            ctx.beginPath();
            // Pulsing radius based on time
            const pulseRad = auraRadius + Math.sin(time * 0.005) * 10;
            ctx.arc(p.x + drawW / 2, drawY + drawH / 2 + bobY, pulseRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Draw Canvas Rocket Flame
        if (pImg === assetsRef.current["gnome-rocket"] || pImg === assetsRef.current["gnomeMode"]) {
          const flameOriginX = p.x + drawW * 0.08;
          const flameOriginY = drawY + drawH * 0.66 + bobY;

          ctx.save();
          ctx.globalCompositeOperation = "lighter";

          const baseSpeed = stateRef.current.speed;
          const flameLength = 45 + Math.sin(time * 0.04) * 12 + baseSpeed * 2 + (p.state === "jumping" ? 20 : 0);

          ctx.shadowBlur = 25;
          ctx.shadowColor = "rgba(255, 120, 0, 0.9)";

          // outer flame
          ctx.beginPath();
          ctx.moveTo(flameOriginX, flameOriginY - 14);
          ctx.quadraticCurveTo(
            flameOriginX - flameLength * 0.55,
            flameOriginY,
            flameOriginX - flameLength,
            flameOriginY + Math.sin(time * 0.08) * 8
          );
          ctx.quadraticCurveTo(
            flameOriginX - flameLength * 0.55,
            flameOriginY + 18,
            flameOriginX,
            flameOriginY + 14
          );
          ctx.closePath();
          ctx.fillStyle = isGnomeMode ? "rgba(255, 50, 0, 0.75)" : "rgba(255, 90, 0, 0.75)";
          ctx.fill();

          // inner flame
          ctx.beginPath();
          ctx.moveTo(flameOriginX, flameOriginY - 8);
          ctx.quadraticCurveTo(
            flameOriginX - flameLength * 0.45,
            flameOriginY,
            flameOriginX - flameLength * 0.75,
            flameOriginY + Math.sin(time * 0.1) * 5
          );
          ctx.quadraticCurveTo(
            flameOriginX - flameLength * 0.45,
            flameOriginY + 10,
            flameOriginX,
            flameOriginY + 8
          );
          ctx.closePath();
          ctx.fillStyle = isGnomeMode ? "rgba(255, 200, 0, 0.9)" : "rgba(255, 230, 80, 0.9)";
          ctx.fill();

          // Smoke/spark particles spawning from rocket
          if (Math.random() > 0.5) {
            particlesRef.current.push({
              x: flameOriginX - 10,
              y: flameOriginY,
              vx: -baseSpeed - Math.random() * 5,
              vy: (Math.random() - 0.5) * 2,
              life: 1.0,
              color: isGnomeMode ? "#fbbf24" : "rgba(150, 150, 150, 0.5)"
            });
          }

          ctx.restore();
        }

        // Dynamic Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(p.x + drawW / 2, FLOOR_Y, 40 - bobY * 2 - (p.state === "jumping" ? 20 : 0), 10 - bobY / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(p.x + drawW / 2, drawY + drawH / 2 + bobY);
        ctx.rotate(tilt);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(pImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(pImg, p.x, drawY, drawW, drawH);
      }
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(p.x, drawY, drawW, drawH);
    }

    ctx.shadowBlur = 0;

    // Draw Particles
    particlesRef.current.forEach((part) => {
      ctx.globalAlpha = Math.max(0, part.life);
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Floating Text
    ctx.font = "bold 24px sans-serif";
    floatingTextsRef.current.forEach((ft) => {
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillStyle = "#4ade80"; // Neon green
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      const lines = ft.text.split('\n');
      lines.forEach((line, index) => {
        ctx.strokeText(line, ft.x, ft.y + index * 26);
        ctx.fillText(line, ft.x, ft.y + index * 26);
      });
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();

    // Red screen flash on game over
    if (stateRef.current.state === "gameover") {
      ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  };

  return (
    <main
      className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-black font-sans"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="block w-full h-full touch-none select-none object-contain"
      />

      {assetError && (
        <div className="absolute top-2 left-2 bg-red-900 text-white px-4 py-2 font-bold text-lg rounded shadow-lg border border-red-500 z-50">
          {assetError}
        </div>
      )}

      {/* Level Banner Animation */}
      {levelBanner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40">
          <div className="animate-in fade-in zoom-in duration-500 text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
            <h1 className="text-4xl md:text-6xl font-black text-yellow-400 tracking-widest uppercase mb-4">
              {levelBanner.chapter}
            </h1>
            <h2 className="text-6xl md:text-8xl font-black text-white">
              {levelBanner.name}
            </h2>
          </div>
        </div>
      )}

      {/* HUD overlay (Level) */}
      <div className="absolute bottom-4 md:bottom-auto md:top-4 left-4 md:left-6 pointer-events-none z-30">
        <div className="bg-black/80 backdrop-blur-md px-3 py-2 md:px-6 md:py-3 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <h2 className="text-sm md:text-2xl font-black text-blue-400 drop-shadow-lg">
            [CH {Math.floor(currentLevel / 3) + 1}] {CAMPAIGN_LEVELS[currentLevel]?.name}
          </h2>
        </div>
      </div>

      {/* HUD overlay (Score & Status) */}
      <div className="absolute bottom-4 md:bottom-auto md:top-4 right-4 md:right-6 flex flex-col items-end gap-2 pointer-events-none z-30">
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 md:px-6 md:py-3 rounded-xl border border-green-500/30">
          <h2 className="text-xl md:text-4xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] tracking-tighter">
            MCAP: ${score.toLocaleString()}
          </h2>
        </div>
        <div className="flex gap-4">
          {gnomeModeActive && (
            <div className="bg-red-900/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center border border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]">
              <span className="text-sm md:text-xl font-black text-white tracking-widest">
                GNOME MODE ACTIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Overlay */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-50 py-2">
          <div className="flex flex-col md:flex-row landscape:flex-row gap-4 md:gap-8 w-full max-w-5xl justify-center items-center px-4 h-full">
            {/* Left: Title and Input */}
            <div className="flex flex-col items-center flex-1">
              <img src="/assets/splash.png" alt="Gnome Character" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] animate-bounce mb-2" />
              <h1 className="text-4xl md:text-7xl landscape:text-5xl font-black text-white mb-2 md:mb-4 drop-shadow-2xl text-center">GNOME RUNNER</h1>
              <p className="text-green-400 text-sm md:text-xl font-bold mb-4 md:mb-6 text-center px-4 hidden md:block portrait:block">Dodge Bears. Survive Rugs. Stack $GNOME.</p>
              <div className="mb-4 md:mb-6 flex flex-col items-center pointer-events-auto">
                <input
                  type="text"
                  maxLength={15}
                  placeholder="Enter Name..."
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    localStorage.setItem("gnome_runner_name", e.target.value);
                  }}
                  className="bg-black/50 border-2 border-green-500/50 text-white text-center text-lg md:text-xl font-bold py-2 md:py-3 px-4 md:px-6 rounded-xl outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all placeholder:text-gray-500 w-[200px] md:w-[300px]"
                />
              </div>
              <button
                onClick={startGame}
                className="px-8 md:px-10 py-3 md:py-4 bg-green-500 hover:bg-green-400 text-black font-black text-xl md:text-2xl rounded-full transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(74,222,128,0.6)] pointer-events-auto"
              >
                START RUN
              </button>
              <div className="mt-4 md:mt-6 text-green-300 text-xs md:text-base font-bold text-center px-4 py-2 md:px-6 bg-green-900/40 md:py-3 rounded-xl border border-green-500/30 pointer-events-auto">
                <p className="mb-1">🖱️ Desktop: Click and drag Mouse to steer</p>
                <p>📱 Mobile: Touch and drag Finger to steer</p>
              </div>
            </div>

            {/* Right: Leaderboard */}
            <div className="bg-black/60 p-4 md:p-6 rounded-2xl border border-yellow-500/30 text-left w-full max-w-[350px] flex-shrink-0 flex flex-col h-[220px] md:h-[400px] pointer-events-auto">
              <h2 className="text-lg md:text-xl font-black text-yellow-400 mb-4 text-center border-b border-yellow-500/20 pb-2">GLOBAL TOP 100</h2>
              <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {leaderboardData.length > 0 ? leaderboardData.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-1">
                    <span className="font-bold text-gray-300 truncate max-w-[160px] flex items-center gap-2">
                      <span className="text-gray-500 w-6 text-right inline-block">{idx + 1}.</span>
                      <span className="text-base">{idx === 0 ? "👑" : idx < 3 ? "🔥" : "🍄"}</span>
                      {entry.name}
                    </span>
                    <span className="font-black text-green-400">${entry.score.toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-center text-sm italic mt-4">Connecting to blockchain...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center backdrop-blur-md z-50 py-2">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] text-center px-4 flex-shrink-0 leading-none mt-2">
            {gameOverReason}
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl justify-center items-center px-4 pointer-events-auto flex-1 min-h-0 my-2">
            {/* Stats Panel */}
            <div className="bg-black/50 p-4 rounded-2xl border border-red-500/30 text-center w-full sm:w-[300px] flex-shrink-0">
              <p className="text-gray-300 text-sm mb-1">Final Market Cap</p>
              <p className="text-4xl sm:text-5xl font-black text-green-400 mb-3">${score.toLocaleString()}</p>

              <p className="text-gray-400 text-xs">Best Run</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-200">${highScore.toLocaleString()}</p>
            </div>

            {/* Leaderboard Panel */}
            <div className="bg-black/80 p-3 sm:p-4 rounded-2xl border border-yellow-500/30 text-left w-full sm:w-[350px] flex flex-col h-[180px] sm:h-[220px] flex-shrink-0">
              <h2 className="text-base sm:text-lg font-black text-yellow-400 mb-2 text-center border-b border-yellow-500/20 pb-1">GLOBAL TOP 100</h2>
              <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {leaderboardData.length > 0 ? leaderboardData.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs sm:text-sm border-b border-gray-800/50 pb-1">
                    <span className="font-bold text-gray-300 truncate max-w-[140px] flex items-center gap-1 sm:gap-2">
                      <span className="text-gray-500 w-5 text-right inline-block">{idx + 1}.</span>
                      <span className="text-sm">{idx === 0 ? "👑" : idx < 3 ? "🔥" : "🍄"}</span>
                      {entry.name}
                    </span>
                    <span className="font-black text-green-400">${entry.score.toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-center text-xs sm:text-sm italic mt-2">Connecting to blockchain...</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-4 pointer-events-auto px-4 flex-shrink-0 mb-2">
            <button
              onClick={startGame}
              className="px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-400 text-black font-black text-sm sm:text-lg rounded-full transform hover:scale-105 transition-all"
            >
              TRY AGAIN
            </button>
            <a
              href={`https://x.com/intent/tweet?text=${shareMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 sm:py-3 bg-black border-2 border-white hover:bg-gray-900 text-white font-black text-sm sm:text-lg rounded-full transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              SHARE ON X
            </a>
          </div>
        </div>
      )}
      {/* Landscape Prompt Overlay */}
      <div className="portrait:flex hidden fixed inset-0 z-[100] bg-black items-center justify-center flex-col pointer-events-auto px-6 text-center py-8">
        <div className="flex-shrink-0 mb-6 flex flex-col items-center">
          <img src="/assets/splash.png" alt="Gnome Character" className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] mb-4" />
          <h1 className="text-5xl font-black text-white mb-2 drop-shadow-2xl text-center">GNOME RUNNER</h1>
          <p className="text-green-400 text-sm font-bold mb-8 text-center px-4">Dodge Bears. Survive Rugs. Stack $GNOME.</p>

          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h2 className="text-2xl font-black text-white leading-tight mb-2">
            ROTATE TO PLAY
          </h2>
          <p className="text-gray-400 font-bold text-sm">Landscape mode required</p>
        </div>

        {/* Leaderboard Panel for Portrait */}
        <div className="bg-black/60 p-4 rounded-2xl border border-yellow-500/30 text-left w-full max-w-[350px] flex flex-col h-[300px] flex-1">
          <h2 className="text-lg font-black text-yellow-400 mb-4 text-center border-b border-yellow-500/20 pb-2">GLOBAL TOP 100</h2>
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {leaderboardData.length > 0 ? leaderboardData.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-1">
                <span className="font-bold text-gray-300 truncate max-w-[150px] flex items-center gap-2">
                  <span className="text-gray-500 w-6 text-right inline-block">{idx + 1}.</span>
                  <span className="text-base">{idx === 0 ? "👑" : idx < 3 ? "🔥" : "🍄"}</span>
                  {entry.name}
                </span>
                <span className="font-black text-green-400">${entry.score.toLocaleString()}</span>
              </div>
            )) : (
              <div className="text-gray-500 text-center text-sm italic mt-4">Connecting to blockchain...</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
