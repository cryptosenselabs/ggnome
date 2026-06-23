"use client";

import React, { useEffect, useRef, useState } from "react";

// --- Types & Interfaces ---
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

interface Entity {
  id: number;
  type: "redCandle" | "cryptoCoin" | "liquidationLaser" | "bearTrap" | "rugPull" | "fudCloud" | "whaleBlackHole";
  x: number;
  y: number;
  w: number;
  h: number;
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
  id?: number;
  text: string;
  x: number;
  y: number;
  life: number;
}

// --- Helpers ---
function calculateCoinScore(priceUsd: number): number {
  return Math.max(10, Math.round(Math.log10(Number(priceUsd || 0) + 1) * 100));
}

function formatPrice(price: number) {
  if (price >= 1000) return "$" + (price / 1000).toFixed(1) + "K";
  if (price >= 1) return "$" + price.toFixed(2);
  if (price >= 0.01) return "$" + price.toFixed(4);
  return "$" + price.toExponential(2);
}

// Share Messages Pool
const SHARE_MESSAGES = [
  "Play $GNOME Runner: https://chaosgnome.xyz\n\nI reached ${mcap} MCAP before getting {reason}. Dodge bears. Survive rugs. Harvest $GNOME.",
  "Beat my score: https://chaosgnome.xyz\n\nJust got {reason} at ${mcap} MCAP. Still performing better than my actual crypto portfolio! 🍄",
  "Join the Gnome Army: https://chaosgnome.xyz\n\nPaper handed at ${mcap} MCAP because of {reason}. Don't fade $GNOME! 💎🙌",
  "Dodge the Red Candles: https://chaosgnome.xyz\n\nLiquidated?! I got {reason} at ${mcap} MCAP. Selling my house to buy more $GNOME! 📉",
  "To the moon: https://chaosgnome.xyz\n\nI was farming $GNOME at ${mcap} MCAP when suddenly: {reason}. Can you beat my score?",
];

const CAMPAIGN_LEVELS = [
  { threshold: 0, name: "Level 1: The Accumulation Zone", bg: [[2, 6, 23], [15, 23, 42]], speedBase: 8, hazardRate: 0.01 },
  { threshold: 5000, name: "Level 2: Bull Market Awakening", bg: [[15, 23, 42], [30, 58, 138]], speedBase: 10, hazardRate: 0.015 },
  { threshold: 12000, name: "Level 3: Resistance Breakout", bg: [[30, 58, 138], [59, 130, 246]], speedBase: 12, hazardRate: 0.02 },
  { threshold: 22000, name: "Level 4: FOMO Stratosphere", bg: [[59, 130, 246], [124, 58, 237]], speedBase: 14, hazardRate: 0.025 },
  { threshold: 35000, name: "Level 5: Liquidation Exosphere", bg: [[124, 58, 237], [88, 28, 135]], speedBase: 16, hazardRate: 0.03 },
  { threshold: 50000, name: "Level 6: The Memecoin Asteroid Belt", bg: [[88, 28, 135], [200, 40, 40]], speedBase: 18, hazardRate: 0.035 },
  { threshold: 70000, name: "Level 7: Market Correction Gravity", bg: [[200, 40, 40], [153, 27, 27]], speedBase: 20, hazardRate: 0.04 },
  { threshold: 95000, name: "Level 8: The Halving Event Horizon", bg: [[153, 27, 27], [0, 0, 0]], speedBase: 22, hazardRate: 0.045 },
  { threshold: 125000, name: "Level 9: Institutional Void", bg: [[0, 0, 0], [20, 0, 20]], speedBase: 24, hazardRate: 0.05 },
  { threshold: 160000, name: "Level 10: Diamond Hand Nebula", bg: [[20, 0, 20], [0, 40, 40]], speedBase: 26, hazardRate: 0.055 },
  { threshold: 200000, name: "Level 11: Quantitative Easing Sector", bg: [[0, 40, 40], [40, 40, 0]], speedBase: 28, hazardRate: 0.06 },
  { threshold: 250000, name: "Level 12: Flash Crash Wormhole", bg: [[40, 40, 0], [80, 0, 0]], speedBase: 30, hazardRate: 0.065 },
  { threshold: 310000, name: "Level 13: Decentralized Abyss", bg: [[80, 0, 0], [60, 0, 80]], speedBase: 32, hazardRate: 0.07 },
  { threshold: 380000, name: "Level 14: The 51% Attack", bg: [[60, 0, 80], [0, 80, 0]], speedBase: 34, hazardRate: 0.075 },
  { threshold: 460000, name: "Level 15: Hashrate Singularity", bg: [[0, 80, 0], [0, 0, 100]], speedBase: 36, hazardRate: 0.08 },
  { threshold: 550000, name: "Level 16: Hyperinflation Galaxy", bg: [[0, 0, 100], [100, 50, 0]], speedBase: 38, hazardRate: 0.085 },
  { threshold: 650000, name: "Level 17: Quantum Ledger", bg: [[100, 50, 0], [150, 0, 150]], speedBase: 40, hazardRate: 0.09 },
  { threshold: 760000, name: "Level 18: Genesis Block Sector", bg: [[150, 0, 150], [200, 200, 200]], speedBase: 42, hazardRate: 0.095 },
  { threshold: 880000, name: "Level 19: Satoshi's Hidden Realm", bg: [[200, 200, 200], [255, 255, 0]], speedBase: 44, hazardRate: 0.1 },
  { threshold: 1000000, name: "Level 20: THE MOON", bg: [[255, 255, 0], [255, 255, 255]], speedBase: 46, hazardRate: 0.12 },
];

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- React UI State ---
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [playerName, setPlayerName] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<{ name: string, score: number }[]>([]);
  const [assetError, setAssetError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  // Game Stats (Synced selectively to avoid massive re-renders)
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineAudioRef = useRef<{ osc1: OscillatorNode, osc2: OscillatorNode, gain: GainNode } | null>(null);

  // --- Audio Synthesizer ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: "coin" | "crash" | "levelup") => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "coin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "crash") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "levelup") {
      osc.type = "square";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  };

  const startEngineSound = (muted = isMuted) => {
    if (muted || !audioCtxRef.current || engineAudioRef.current) return;
    const ctx = audioCtxRef.current;

    // Deep, throbbing rocket rumble
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 40;

    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = 42;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 150; // Muffler to make it a deep rumble, not harsh

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.15; // Quiet background noise

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    engineAudioRef.current = { osc1, osc2, gain: gainNode };
  };

  const stopEngineSound = () => {
    if (engineAudioRef.current) {
      engineAudioRef.current.osc1.stop();
      engineAudioRef.current.osc2.stop();
      engineAudioRef.current.osc1.disconnect();
      engineAudioRef.current.osc2.disconnect();
      engineAudioRef.current.gain.disconnect();
      engineAudioRef.current = null;
    }
  };

  const playVoiceLine = (line: "moon" | "gnomemode" | "redcandle" | "levelup") => {
    if (isMuted) return;

    // Stop all currently playing voice lines so they don't overlap
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    const audio = audioRefs.current[line];
    if (audio) {
      audio.play().catch(e => console.warn("Browser blocked audio play:", e));
    }
  };

  // --- Mutable Game Engine State (Does not trigger React re-renders) ---
  const engineRef = useRef({
    state: "menu",
    score: 0,
    coins: 0,
    speed: 10,
    gnomeModeTime: 0,
    lastTime: 0,
    nextObstacleSpawn: 0,
    nextCoinSpawn: 0,
    canvasW: 720,
    canvasH: 1280,
    levelIndex: 0,
    r1: 135, g1: 206, b1: 235,
    r2: 224, g2: 246, b2: 255,
    starAlpha: 0,
    levelUpText: "",
    levelUpTime: 0,
    combo: 0,
    comboTimer: 0
  });

  const playerRef = useRef({
    x: 360,
    targetX: 360,
    y: 1000,
    w: 140,
    h: 190
  });

  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const starsRef = useRef(Array.from({ length: 150 }).map(() => ({
    x: Math.random() * 2000,
    y: Math.random() * 2000,
    size: Math.random() * 2 + 0.5,
    layer: Math.random() // 0 to 1 for parallax depth
  })));

  const windRef = useRef(Array.from({ length: 20 }).map(() => ({
    x: Math.random() * 2000,
    y: Math.random() * 2000,
    length: Math.random() * 150 + 50,
    speed: Math.random() * 15 + 10,
    opacity: Math.random() * 0.15 + 0.05
  })));

  // --- Assets ---
  const assetsRef = useRef<Record<string, HTMLImageElement>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const cryptoCoinsRef = useRef<CryptoCoin[]>([]);
  const cryptoLogosRef = useRef<Record<string, HTMLImageElement>>({});

  // --- Initialization & API Fetching ---
  useEffect(() => {
    const storedName = localStorage.getItem("gnome_runner_name");
    if (storedName) setPlayerName(storedName);

    const storedScore = localStorage.getItem("gnome_runner_highscore");
    if (storedScore) setHighScore(parseInt(storedScore));

    // Fetch Leaderboard
    fetch(`/api/leaderboard?t=${Date.now()}`).then(res => res.json()).then(data => {
      if (data.leaderboard) setLeaderboardData(data.leaderboard);
    }).catch(e => console.error("Leaderboard error:", e));

    // Preload Images
    const images = {
      player: "/assets/characters/gnome-rocket.png",
      enemyBear: "/assets/enemies/enemy_bear.png",
      enemyRug: "/assets/enemies/enemy_rug.png",
    };

    Object.entries(images).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => { assetsRef.current[key] = img; };
    });

    // Preload Custom MP3 Voice Lines
    const voiceFiles = {
      moon: "/assets/audio/moon.mp3",
      gnomemode: "/assets/audio/gnomemode.mp3",
      redcandle: "/assets/audio/redcandle.mp3",
      levelup: "/assets/audio/levelup.mp3"
    };

    Object.entries(voiceFiles).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audioRefs.current[key] = audio;
    });

    // Fetch Crypto Coins
    fetch("/assets/crypto/crypto-coins.json").then(res => res.json()).then((data: CryptoCoin[]) => {
      cryptoCoinsRef.current = data;
      data.forEach(c => {
        const img = new Image();
        img.src = c.logo;
        img.onload = () => { cryptoLogosRef.current[c.symbol] = img; };
      });
    }).catch(() => {
      console.warn("Using fallback crypto list");
      cryptoCoinsRef.current = [
        { id: "bitcoin", symbol: "BTC", name: "Bitcoin", priceUsd: 65000, rank: 1, change24h: 1.2, logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png", scoreValue: calculateCoinScore(65000) }
      ];
    });

    // Fetch Visitor Count
    fetch("/api/visitors")
      .then(res => res.json())
      .then(data => setVisitorCount(data.count))
      .catch(e => console.error("Failed to fetch visitors:", e));

    // Preload Gnome Rocket
    const rocketImg = new Image();
    rocketImg.src = "/assets/gnome-rocket.png";
    rocketImg.onload = () => { assetsRef.current["rocket"] = rocketImg; };
    rocketImg.onerror = () => setAssetError("Failed to load /assets/gnome-rocket.png");

    const whaleImg = new Image();
    whaleImg.src = "/assets/whale.png";
    whaleImg.onload = () => { assetsRef.current["enemyWhale"] = whaleImg; };

  }, []);

  // --- Responsive Canvas Setup ---
  useEffect(() => {
    const handleResize = () => {
      // Check for mobile landscape
      setIsMobileLandscape(window.innerWidth < 950 && window.innerHeight < 600 && window.innerWidth > window.innerHeight);

      if (canvasRef.current) {
        // High DPI Support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          canvasRef.current.width = rect.width * dpr;
          canvasRef.current.height = rect.height * dpr;
          engineRef.current.canvasW = rect.width;
          engineRef.current.canvasH = rect.height;

          const ctx = canvasRef.current.getContext("2d");
          if (ctx) ctx.scale(dpr, dpr);

          // Lock player vertically near the bottom 20% and center horizontally
          playerRef.current.y = rect.height * 0.8;

          // Only snap to center if we aren't currently dragging it during gameplay
          if (engineRef.current.state !== "playing") {
            playerRef.current.x = rect.width / 2;
            playerRef.current.targetX = rect.width / 2;
          }
        }
      }
    };
    window.addEventListener("resize", handleResize);
    setTimeout(handleResize, 100); // Initial trigger
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Event Listeners ---
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (engineRef.current.state === "playing" && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;

      // Clamp to screen bounds
      if (x < 50) x = 50;
      if (x > engineRef.current.canvasW - 50) x = engineRef.current.canvasW - 50;

      playerRef.current.targetX = x;
    }
  };

  // --- Game Loop Methods ---
  const startGame = () => {
    if (engineRef.current.state === "playing") return;
    
    initAudio();
    if (!playerName.trim()) return alert("Please enter your name!");
    localStorage.setItem("gnome_runner_name", playerName);

    startEngineSound(isMuted);
    playVoiceLine("moon");

    // Reset Engine State
    const engine = engineRef.current;
    engine.score = 0;
    engine.coins = 0;
    engine.speed = CAMPAIGN_LEVELS[0].speedBase;
    engine.levelIndex = 0;
    engine.levelUpTime = 0;
    engine.combo = 0;
    engine.comboTimer = 0;
    entitiesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    playerRef.current.x = window.innerWidth / 2 - 25;

    setGameState("playing");
    engine.state = "playing";
    engineRef.current.score = 0;
    engineRef.current.coins = 0;
    engineRef.current.speed = 10;
    engineRef.current.gnomeModeTime = 0;
    engineRef.current.nextObstacleSpawn = performance.now() + 2000;
    engineRef.current.nextCoinSpawn = performance.now() + 1000;

    // Center player immediately
    playerRef.current.x = engineRef.current.canvasW / 2;
    playerRef.current.targetX = engineRef.current.canvasW / 2;

    entitiesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    setDisplayScore(0);
    setDisplayCoins(0);

    requestAnimationFrame(gameLoop);
  };

  const triggerGameOver = (reason: string) => {
    playSound("crash");
    stopEngineSound();
    playVoiceLine("redcandle");
    engineRef.current.state = "gameover";
    setGameState("gameover");
    setGameOverReason(reason);

    const mcapString = Math.floor(engineRef.current.score).toLocaleString();
    const ogIndex = Math.floor(Math.random() * 3) + 1;
    const finalMsg = SHARE_MESSAGES[Math.floor(Math.random() * SHARE_MESSAGES.length)]
      .replace("{mcap}", mcapString)
      .replace("{reason}", reason)
      .replace("https://chaosgnome.xyz", `https://chaosgnome.xyz?og=${ogIndex}`);
    setShareMessage(encodeURIComponent(finalMsg));

    const finalScore = Math.floor(engineRef.current.score);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("gnome_runner_highscore", finalScore.toString());
    }

    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName.trim() || "Anon Degen", score: finalScore })
    }).then(() => fetch(`/api/leaderboard?t=${Date.now()}`))
      .then(res => res.json())
      .then(data => { if (data.leaderboard) setLeaderboardData(data.leaderboard); });

    // Explosion particles
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1.0,
        color: "#ef4444"
      });
    }
  };

  // --- Core Loop ---
  const gameLoop = (time: number) => {
    if (engineRef.current.state !== "playing") return;

    const dt = time - engineRef.current.lastTime;
    engineRef.current.lastTime = time;

    updatePhysics(time);
    render(time);

    // Sync state to UI every ~16ms but effectively React batches it
    setDisplayScore(Math.floor(engineRef.current.score));
    setDisplayCoins(engineRef.current.coins);

    requestAnimationFrame(gameLoop);
  };

  const updatePhysics = (time: number) => {
    const engine = engineRef.current;
    const p = playerRef.current;
    const CANVAS_W = engine.canvasW;

    const isGnomeMode = time < engine.gnomeModeTime;

    // Engine Progression
    // Smoothly interpolate current speed toward the target speed for this level
    engine.speed += (CAMPAIGN_LEVELS[engine.levelIndex].speedBase - engine.speed) * 0.01;
    // Score increases over time, normalized by roughly 60 FPS
    engine.score += (engine.speed * (isGnomeMode ? 20 : 10)) / 60;

    // --- Level Progression ---
    let nextLevelIdx = engine.levelIndex;
    for (let i = CAMPAIGN_LEVELS.length - 1; i >= 0; i--) {
      if (engine.score >= CAMPAIGN_LEVELS[i].threshold) {
        nextLevelIdx = i;
        break;
      }
    }

    // Level Up Announcer (Only trigger if playing to avoid menu spam)
    if (nextLevelIdx !== engine.levelIndex) {
      if (engine.state === "playing") {
        playSound("levelup");
        playVoiceLine("levelup");
      }
      engine.levelIndex = nextLevelIdx;
      engine.levelUpText = CAMPAIGN_LEVELS[nextLevelIdx].name;
      engine.levelUpTime = time + 4000;

      // Celebration particles
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: p.x + (Math.random() - 0.5) * 150,
          y: p.y - 100 + (Math.random() - 0.5) * 150,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 1.5,
          color: Math.random() > 0.5 ? "#4ade80" : "#fbbf24"
        });
      }
    }

    const currentLvl = CAMPAIGN_LEVELS[engine.levelIndex];

    // Smooth Color Interpolation
    engine.r1 += (currentLvl.bg[0][0] - engine.r1) * 0.01;
    engine.g1 += (currentLvl.bg[0][1] - engine.g1) * 0.01;
    engine.b1 += (currentLvl.bg[0][2] - engine.b1) * 0.01;
    engine.r2 += (currentLvl.bg[1][0] - engine.r2) * 0.01;
    engine.g2 += (currentLvl.bg[1][1] - engine.g2) * 0.01;
    engine.b2 += (currentLvl.bg[1][2] - engine.b2) * 0.01;
    engine.starAlpha += 0.01;
    // --- End Level Progression ---

    // Player Movement (Smooth X follow and fixed Y lower on screen)
    p.x += (p.targetX - p.x) * 0.15;
    p.y = engine.canvasH * 0.85 + Math.sin(time * 0.005) * 10;

    // Curving Engine Smoke Trails
    if (Math.random() > 0.2) {
      const isSmoke = Math.random() > 0.6;
      particlesRef.current.push({
        x: p.x + p.w / 2 + (Math.random() - 0.5) * 15,
        y: p.y + p.h,
        vx: (p.targetX - p.x) * -0.05 + (Math.random() - 0.5) * 2, // Trails curve opposite to steering direction
        vy: 5 + Math.random() * 5,
        life: isSmoke ? 2.0 : 0.8,
        color: isSmoke ? "rgba(150, 150, 150, 0.4)" : (Math.random() > 0.5 ? "#f97316" : "#eab308")
      });
    }

    // Combo Timer Drop
    if (time > engine.comboTimer && engine.combo > 0) {
      engine.combo = 0;
    }

    // Spawning Hazards & Obstacles
    if (time > engine.nextObstacleSpawn) {
      let type = "redCandle";
      const rand = Math.random();
      
      if (rand > 0.85 && engine.levelIndex >= 1) type = "whaleBlackHole";   // 15% chance
      else if (rand > 0.88 && engine.levelIndex >= 1) type = "liquidationLaser"; // 7% chance
      else if (rand > 0.78 && engine.levelIndex >= 2) type = "bearTrap";    // 10% chance
      else if (rand > 0.68 && engine.levelIndex >= 4) type = "rugPull";     // 10% chance
      else if (rand > 0.58 && engine.levelIndex >= 6) type = "fudCloud";    // 10% chance
      else type = "redCandle"; // 58% chance

      let w = 40, h = 100;
      let x = 0;

      if (type === "redCandle") {
        w = 40; h = 100 + Math.random() * 150;
        x = Math.random() * (CANVAS_W - w);
      } else if (type === "liquidationLaser") {
        w = Math.min(CANVAS_W * 0.5, 50 + Math.random() * (CANVAS_W * 0.4));
        h = engine.canvasH + 200;
        x = Math.random() * (CANVAS_W - w);
      } else if (type === "whaleBlackHole") {
        w = Math.min(100, CANVAS_W * 0.25); // Smaller base size, even smaller on mobile
        h = w;
        x = Math.random() * (CANVAS_W - w);
      } else if (type === "bearTrap") {
        w = 60; h = 60;
        x = Math.random() * (CANVAS_W - w);
      } else if (type === "rugPull") {
        w = CANVAS_W * 0.85; h = 40; // Massive horizontal blocker
        x = Math.random() > 0.5 ? 0 : CANVAS_W - w; // Attaches to left or right wall
      } else if (type === "fudCloud") {
        w = 150 + Math.random() * 100; h = 150;
        x = Math.random() * (CANVAS_W - w);
      }

      entitiesRef.current.push({
        id: time, type: type as any,
        x, y: -h - Math.random() * 200, w, h
      });

      // Spawn rate gets faster as level increases
      engine.nextObstacleSpawn = time + (1200 - Math.min(900, engine.levelIndex * 40));
    }

    if (time > engine.nextCoinSpawn && cryptoCoinsRef.current.length > 0) {
      const coin = cryptoCoinsRef.current[Math.floor(Math.random() * cryptoCoinsRef.current.length)];
      entitiesRef.current.push({
        id: time, type: "cryptoCoin",
        coin,
        x: Math.random() * (CANVAS_W - 80),
        y: -100,
        w: 80, h: 80
      });
      engine.nextCoinSpawn = time + Math.max(300, 1000 - engine.speed * 5);
    }

    // Entity Updates
    const pBox = { x: p.x - p.w / 2 + 20, y: p.y - p.h / 2 + 20, w: p.w - 40, h: p.h - 40 };

    for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
      const ent = entitiesRef.current[i];
      ent.y += engine.speed;
      if (ent.type === "redCandle") ent.y += 2;

      // Gnome Mode Magnet
      if (isGnomeMode && ent.type === "cryptoCoin" && !ent.collected) {
        if (ent.y < p.y && ent.y > p.y - 600) {
          ent.y += 10;
          ent.x += (p.x - (ent.x + ent.w / 2)) * 0.1;
        }
      }

      // Collision (Only when actually playing!)
      if (engine.state === "playing" && !ent.collected &&
        pBox.x < ent.x + ent.w &&
        pBox.x + pBox.w > ent.x &&
        pBox.y < ent.y + ent.h &&
        pBox.y + pBox.h > ent.y) {

        if (["redCandle", "liquidationLaser", "bearTrap", "rugPull", "whaleBlackHole"].includes(ent.type)) {
          const reason = ent.type.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
          triggerGameOver(`hit a ${reason}`);
          return;
        } else if (ent.type === "fudCloud") {
          if (!ent.collected) {
            ent.collected = true; // prevent multi-trigger
            engine.combo = 0; // Drain combo
            engine.score = Math.max(0, engine.score - 5000); // Drain score
            playSound("crash");
            floatingTextsRef.current.push({ id: time, x: p.x, y: p.y, text: "FUD! -5000", life: 1.5 });
          }
        } else if (ent.type === "cryptoCoin" && ent.coin) {
          ent.collected = true;
          engine.coins += 1;
          playSound("coin");

          // Combo Logic
          engine.combo += 1;
          engine.comboTimer = time + 3000;
          const multiplier = Math.min(5, 1 + Math.floor(engine.combo / 3));
          engine.score += ent.coin.scoreValue * multiplier;

          // Coin Shatter Particle Explosion
          for (let i = 0; i < 15; i++) {
            particlesRef.current.push({
              x: ent.x + ent.w / 2,
              y: ent.y + ent.h / 2,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15 - 5, // Explode upwards
              life: 1.2,
              color: "#fbbf24"
            });
          }

          floatingTextsRef.current.push({
            id: time,
            text: `+$${(ent.coin.scoreValue * multiplier).toLocaleString()} ${multiplier > 1 ? `(x${multiplier} COMBO!)` : ''}`,
            x: ent.x,
            y: ent.y,
            life: 1.0
          });

          // Trigger Gnome Mode randomly on pickup
          if (Math.random() > 0.98 && !isGnomeMode) {
            engine.gnomeModeTime = time + 5000;
            playVoiceLine("gnomemode");
            floatingTextsRef.current.push({ id: time, x: p.x, y: p.y - 100, text: "GNOME MODE!", life: 2.0 });
          }
        }
      }

      if (ent.y > engine.canvasH + 200 || ent.collected) {
        entitiesRef.current.splice(i, 1);
      }
    }

    // Particles & Text
    particlesRef.current.forEach(pt => {
      pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    floatingTextsRef.current.forEach(ft => {
      ft.y -= 2; ft.life -= 0.02;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(f => f.life > 0);
  };

  const render = (time: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const CANVAS_W = engineRef.current.canvasW;
    const CANVAS_H = engineRef.current.canvasH;
    const engine = engineRef.current;
    const p = playerRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 1. Procedural Sky Gradient (Interpolated by Level)
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, `rgb(${Math.floor(engine.r1)},${Math.floor(engine.g1)},${Math.floor(engine.b1)})`);
    grad.addColorStop(1, `rgb(${Math.floor(engine.r2)},${Math.floor(engine.g2)},${Math.floor(engine.b2)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. Parallax Stars
    if (engine.starAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, engine.starAlpha)})`;
      starsRef.current.forEach(s => {
        // Parallax depth calculation
        s.y += (1 + s.layer * 3) * engine.speed;
        if (s.y > CANVAS_H) s.y = 0;

        ctx.globalAlpha = 0.2 + s.layer * 0.8;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    }

    // 2.5 Speed/Wind Streaks
    windRef.current.forEach(w => {
      // Move streaks downwards relative to engine speed to simulate upward flight
      w.y += w.speed + engine.speed * 2;
      if (w.y > CANVAS_H + w.length) {
        w.y = -w.length;
        w.x = Math.random() * CANVAS_W;
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${w.opacity})`;
      ctx.fillRect(w.x, w.y, 2, w.length);
    });

    // 3. Entities
    entitiesRef.current.forEach(ent => {
      if (ent.type === "redCandle") {
        ctx.save();
        const pulse = Math.sin(time * 0.01 + ent.id);

        // Volatility Glow
        ctx.shadowBlur = 15 + pulse * 10;
        ctx.shadowColor = "rgba(255, 0, 0, 0.8)";

        // Main Body
        ctx.fillStyle = "#E53935";
        ctx.fillRect(ent.x, ent.y, ent.w, ent.h);

        // Wick
        ctx.fillStyle = "#FF8A80";
        ctx.fillRect(ent.x + ent.w / 2 - 2, ent.y - 20, 4, ent.h + 40);

        // Speed trail lines (to emphasize falling)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 138, 128, 0.4)";
        ctx.fillRect(ent.x + 4, ent.y - 40 - (pulse * 10), 2, 20);
        ctx.fillRect(ent.x + ent.w - 6, ent.y - 30 + (pulse * 10), 2, 15);
        ctx.restore();

      } else if (ent.type === "cryptoCoin" && ent.coin) {
        const floatY = ent.y + Math.sin(time * 0.005 + ent.id) * 10;

        ctx.save();

        // Background Coin Glow/Shadow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(251, 191, 36, 0.5)";
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, floatY + ent.h / 2, ent.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow for inner drawing

        const logo = cryptoLogosRef.current[ent.coin.symbol];
        if (logo && logo.complete) {
          // Create circular clipping mask for the image
          ctx.beginPath();
          ctx.arc(ent.x + ent.w / 2, floatY + ent.h / 2, ent.w / 2 - 2, 0, Math.PI * 2);
          ctx.clip();

          // Draw image (it will be cropped by the circle)
          ctx.drawImage(logo, ent.x + 2, floatY + 2, ent.w - 4, ent.h - 4);
        } else {
          ctx.fillStyle = "#fbbf24"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(ent.coin.symbol, ent.x + ent.w / 2, floatY + ent.h / 2 + 6);
        }

        // Add a nice metallic rim around the coin
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, floatY + ent.h / 2, ent.w / 2, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();

        ctx.restore();
      } else if (ent.type === "liquidationLaser") {
        ctx.save();
        const pulse = Math.sin(time * 0.02 + ent.id);
        
        ctx.shadowBlur = 30 + pulse * 15;
        ctx.shadowColor = "rgba(236, 72, 153, 0.9)"; // Intense Pink/Purple glow

        // Core laser beam
        const gradient = ctx.createLinearGradient(ent.x, 0, ent.x + ent.w, 0);
        gradient.addColorStop(0, "rgba(236, 72, 153, 0.1)");
        gradient.addColorStop(0.3, "rgba(236, 72, 153, 0.7)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)"); // White hot center
        gradient.addColorStop(0.7, "rgba(236, 72, 153, 0.7)");
        gradient.addColorStop(1, "rgba(236, 72, 153, 0.1)");

        ctx.fillStyle = gradient;
        ctx.fillRect(ent.x, ent.y, ent.w, ent.h);

        // Chaotic inner lightning arcs
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2 + Math.random() * 2;
        ctx.beginPath();
        let lx = ent.x + ent.w/2;
        ctx.moveTo(lx, ent.y);
        for(let ly = ent.y; ly < ent.y + ent.h; ly += 40) {
            lx = ent.x + ent.w/2 + (Math.random() - 0.5) * (ent.w * 0.4);
            ctx.lineTo(lx, ly);
        }
        ctx.stroke();

        ctx.restore();
      } else if (ent.type === "whaleBlackHole") {
        const whaleImg = assetsRef.current.enemyWhale;
        const pulse = Math.sin(time * 0.01 + ent.id) * 0.15; // Pulsates visually by 15%
        const visualW = ent.w * (1 + pulse);
        const visualH = ent.h * (1 + pulse);
        const offsetX = ent.x - (visualW - ent.w) / 2;
        const offsetY = ent.y - (visualH - ent.h) / 2;

        if (whaleImg && whaleImg.naturalWidth > 0) {
           ctx.drawImage(whaleImg, offsetX - 15, offsetY - 15, visualW + 30, visualH + 30);
        } else {
           // Fallback Black Hole
           ctx.fillStyle = "#000";
           ctx.shadowBlur = 50 + pulse * 30;
           ctx.shadowColor = "#3b82f6";
           ctx.beginPath();
           ctx.arc(offsetX + visualW/2, offsetY + visualH/2, visualW/2, 0, Math.PI * 2);
           ctx.fill();
           ctx.shadowBlur = 0;
        }
      } else if (ent.type === "bearTrap") {
        const trapImg = assetsRef.current.enemyBear;
        if (trapImg && trapImg.naturalWidth > 0) {
          ctx.drawImage(trapImg, ent.x, ent.y, ent.w, ent.h);
        } else {
          // Fallback Triangle Trap
          ctx.fillStyle = "#475569";
          ctx.beginPath();
          ctx.moveTo(ent.x, ent.y + ent.h);
          ctx.lineTo(ent.x + ent.w / 2, ent.y);
          ctx.lineTo(ent.x + ent.w, ent.y + ent.h);
          ctx.fill();
        }
      } else if (ent.type === "rugPull") {
        const rugImg = assetsRef.current.enemyRug;
        if (rugImg && rugImg.naturalWidth > 0) {
          ctx.drawImage(rugImg, ent.x, ent.y, ent.w, ent.h);
        } else {
          // Fallback Red Carpet
          ctx.fillStyle = "#7c2d12"; // Dark brown rug base
          ctx.fillRect(ent.x, ent.y, ent.w, ent.h);
          ctx.fillStyle = "#ef4444"; // Red carpet pattern
          ctx.fillRect(ent.x + 5, ent.y + 5, ent.w - 10, ent.h - 10);
        }
      } else if (ent.type === "fudCloud") {
        // Procedural FUD Cloud
        ctx.fillStyle = `rgba(71, 85, 105, ${ent.collected ? 0.2 : 0.8})`; // Slate gray FUD
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, ent.y + ent.h / 2, ent.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(ent.x + ent.w * 0.2, ent.y + ent.h * 0.4, ent.w * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(ent.x + ent.w * 0.8, ent.y + ent.h * 0.6, ent.w * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${ent.collected ? 0.1 : 0.6})`;
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("FUD", ent.x + ent.w / 2, ent.y + ent.h / 2 + 8);
      }
    });

    // 4. Player Gnome
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(0); // Explicit zero degree rotation

    if (engine.gnomeModeTime > time) {
      ctx.shadowBlur = 30; ctx.shadowColor = "#fbbf24";
    }

    const rocket = assetsRef.current["rocket"];
    if (rocket) {
      ctx.drawImage(rocket, -p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();

    // 5. Particles
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 6. Floating Text
    ctx.textAlign = "center";
    floatingTextsRef.current.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.life);

      const isCombo = ft.text.includes("COMBO");
      ctx.font = isCombo ? "900 32px sans-serif" : "bold 24px sans-serif";

      if (isCombo) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fbbf24";
      }

      ctx.strokeStyle = "black"; ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = isCombo ? "#fbbf24" : "#4ade80";
      ctx.fillText(ft.text, ft.x, ft.y);

      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;

    // 7. Level Up Announcer
    if (engine.levelUpTime > time) {
      ctx.save();
      const alpha = Math.min(1, (engine.levelUpTime - time) / 1000);
      ctx.globalAlpha = alpha;

      ctx.textAlign = "center";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(249, 115, 22, 0.8)";

      // Main "LEVEL UP!" text
      ctx.fillStyle = "#fbbf24";
      const mainSize = CANVAS_W < 500 ? 36 : 50;
      ctx.font = `900 ${mainSize}px sans-serif`;
      ctx.fillText("LEVEL UP!", CANVAS_W / 2, CANVAS_H / 2 - 160);

      // Chapter Name text
      ctx.fillStyle = "white";
      const subSize = CANVAS_W < 500 ? 22 : 32;
      ctx.font = `900 ${subSize}px sans-serif`;
      ctx.fillText(engine.levelUpText, CANVAS_W / 2, CANVAS_H / 2 - 120);

      ctx.restore();
    }
  };

  // --- JSX Rendering ---
  const formatVisitors = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return num.toLocaleString();
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-sans text-white select-none">

      {/* Canvas Layer */}
      <div
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* Asset Error Warning */}
      {assetError && (
        <div className="absolute top-2 left-2 bg-red-900 px-4 py-2 text-sm rounded border border-red-500 z-50">
          {assetError}
        </div>
      )}

      {/* HUD Overlay */}
      {gameState === "playing" && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Market Cap</div>
            <div className="text-3xl font-black text-green-400">${displayScore.toLocaleString()}</div>
          </div>
          <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-xl border border-white/10 text-right">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Coins</div>
            <div className="text-3xl font-black text-yellow-400">{displayCoins}</div>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === "menu" && !isMobileLandscape && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl text-center flex flex-col items-center gap-3 sm:gap-4">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-2 filter drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
              $GNOME MOON RUN
            </h1>
            <p className="text-slate-300 text-lg">Ascend to the moon. Harvest crypto. Dodge red candles.</p>

            {visitorCount !== null && (
              <div className="text-green-400 text-xs sm:text-sm font-black tracking-widest bg-green-950/50 py-1.5 px-4 rounded-full border border-green-800/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                🚀 {formatVisitors(visitorCount)} DEGENS VISITED
              </div>
            )}

            <input
              type="text"
              placeholder="ENTER DEGEN NAME"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-black border-2 border-slate-600 rounded-xl px-4 py-3 text-center text-xl font-bold uppercase focus:outline-none focus:border-green-500 transition-colors"
              maxLength={15}
            />

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-2xl py-4 rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              LAUNCH ROCKET
            </button>

            {leaderboardData.length > 0 && (
              <div className="w-full mt-4 text-left border-t border-slate-700 pt-4">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Top Degens</h3>
                  <span className="text-xs font-bold text-slate-500 uppercase">Global Top 100</span>
                </div>
                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                  {leaderboardData.slice(0, 100).map((l, i) => (
                    <div key={i} className="flex justify-between text-sm py-0.5 border-b border-white/5 last:border-0">
                      <span className="font-bold text-slate-300">{i + 1}. {l.name}</span>
                      <span className="text-green-400 font-mono">${l.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "gameover" && !isMobileLandscape && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-sm z-30 p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-900 rounded-2xl p-4 sm:p-6 shadow-2xl text-center flex flex-col items-center gap-3 sm:gap-4">
            <h2 className="text-4xl sm:text-5xl font-black text-red-500">REKT!</h2>
            <p className="text-xl text-slate-300">You {gameOverReason}.</p>

            <div className="bg-black/50 rounded-xl p-4 w-full my-2">
              <div className="text-sm text-slate-400 uppercase font-bold">Final Market Cap</div>
              <div className="text-4xl font-black text-green-400">${displayScore.toLocaleString()}</div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-xl py-4 rounded-xl transition-colors shadow-lg"
            >
              PLAY AGAIN
            </button>

            <a
              href={`https://x.com/intent/tweet?text=${shareMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block bg-black hover:bg-slate-800 border border-slate-700 text-white font-bold text-lg py-3 rounded-xl transition-colors"
            >
              Share on X
            </a>

            {leaderboardData.length > 0 && (
              <div className="w-full mt-2 text-left border-t border-slate-700 pt-4">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Top Degens</h3>
                  <span className="text-xs font-bold text-slate-500 uppercase">Global Top 100</span>
                </div>
                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                  {leaderboardData.slice(0, 100).map((l, i) => (
                    <div key={i} className="flex justify-between text-sm py-0.5 border-b border-white/5 last:border-0">
                      <span className={`font-bold ${l.name === playerName ? "text-green-400" : "text-slate-300"}`}>
                        {i + 1}. {l.name}
                        {l.name === playerName && " (YOU)"}
                      </span>
                      <span className="text-green-400 font-mono">${l.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Mute Toggle (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-50">
        <button
          onClick={() => {
            if (!audioCtxRef.current) initAudio();
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            if (newMuted) {
              stopEngineSound();
            } else if (gameState === "playing") {
              startEngineSound(newMuted);
            }
          }}
          className="bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-full border-2 border-slate-700 shadow-xl hover:bg-slate-800 transition-colors"
        >
          {isMuted ? "🔇 Muted" : "🔊 Sound On"}
        </button>
      </div>

      {/* Mobile Landscape Blocker */}
      {isMobileLandscape && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-[100] p-8 text-center border-4 border-red-500">
          <div className="text-8xl mb-6 animate-pulse">📱</div>
          <h2 className="text-4xl font-black text-red-500 mb-4">ROTATE YOUR DEVICE</h2>
          <p className="text-xl text-slate-300 font-bold max-w-sm">
            $GNOME MOON RUN is a vertical climber! Please rotate your phone to portrait mode to continue playing.
          </p>
        </div>
      )}

    </div>
  );
}
