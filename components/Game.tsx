"use client";

import React, { useEffect, useRef, useState } from "react";

// Game Constants
const CANVAS_W = 1280;
const CANVAS_H = 720;
const FLOOR_Y = 520; // Hover altitude (roughly 72% down the screen)

const GRAVITY = 0.8;
const JUMP_VELOCITY = -22;
const SLIDE_DURATION = 450;
const INITIAL_SPEED = 12;
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

// Interfaces
interface Entity {
  id: number;
  type: "redCandle" | "cryptoCoin";
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

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UI State
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [harvestedCount, setHarvestedCount] = useState(0);
  const [lastGrab, setLastGrab] = useState("");
  const [highScore, setHighScore] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [gnomeModeActive, setGnomeModeActive] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<{name: string, score: number}[]>([]);

  // Refs for game loop state
  const stateRef = useRef({
    state: "menu",
    score: 0,
    coins: 0,
    speed: INITIAL_SPEED,
    multiplier: 1.0,
    gnomeModeTime: 0,
  });

  const playerRef = useRef({
    x: 200,
    y: FLOOR_Y,
    w: 100,
    h: 120,
    vy: 0,
    state: "running" as "running" | "jumping" | "sliding",
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

    // Add 10 background images
    for (let i = 1; i <= 10; i++) {
      const idx = String(i).padStart(2, '0');
      imagePaths[`bg-${idx}`] = `/assets/background/bg-${idx}.png`;
    }

    Object.entries(imagePaths).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[key] = img;
      };
      img.onerror = () => {
        if (key.startsWith("bg-")) {
           setAssetError("Missing background assets. Please check /public/assets/background.");
        } else if (["gnome-rocket", "coin-gnome"].includes(key)) {
           setAssetError(`Missing game asset: ${key}. Please check public/assets.`);
        }
      };
    });
  }, []);

  const jump = () => {
    const p = playerRef.current;
    if (stateRef.current.state === "playing") {
      p.state = "jumping";
      p.slideEndTime = 0; // Cancel slide
    }
  };

  const slide = () => {
    const p = playerRef.current;
    if (stateRef.current.state === "playing" && p.state !== "jumping" && p.state !== "sliding") {
      p.state = "sliding";
      p.slideEndTime = performance.now() + SLIDE_DURATION;
    }
  };

  const startGame = () => {
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
    };

    playerRef.current = {
      x: 200,
      y: FLOOR_Y,
      w: 100,
      h: 120,
      vy: 0,
      state: "running",
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
        if (stateRef.current.state === "playing") jump();
        else if (stateRef.current.state === "gameover" || stateRef.current.state === "menu") startGame();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        if (stateRef.current.state === "playing") slide();
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

  // Touch Handling for Mobile
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (stateRef.current.state !== "playing") {
      startGame();
      return;
    }
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (stateRef.current.state !== "playing") return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStartY.current;

    if (diffY > 30) {
      slide();
    } else {
      jump();
    }
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

  const spawnObstacle = (time: number) => {
    const isTopCandle = Math.random() > 0.5; // 50% chance ceiling candle
    const width = 45 + Math.random() * 25; // 45 to 70 width
    const height = 100 + Math.random() * 200; // 100 to 300 height
    
    if (isTopCandle) {
       // Hanging from ceiling
       entitiesRef.current.push({
         id: time,
         type: "redCandle",
         x: CANVAS_W + 100,
         y: 0,
         w: width,
         h: height,
         vy: 0,
       });
    } else {
       // Ground candle
       entitiesRef.current.push({
         id: time,
         type: "redCandle",
         x: CANVAS_W + 100,
         y: FLOOR_Y - height,
         w: width,
         h: height,
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

    // Increase score & speed
    s.score += (s.speed * s.multiplier) / 10;
    s.speed += SPEED_INCREMENT;

    // Gnome Mode
    const isGnomeMode = time < s.gnomeModeTime;

    // Player Physics & Animation
    const isHoldingJump = keysRef.current["Space"] || keysRef.current["ArrowUp"] || keysRef.current["TouchJump"];
    
    if (isHoldingJump) {
      p.state = "jumping";
      p.slideEndTime = 0;
      p.vy -= 1.0; // Constant rocket thrust
      
      // Rocket thrust particles
      particlesRef.current.push({
        x: p.x + 35, // booster nozzle
        y: p.y - 10,
        vx: -s.speed - Math.random() * 5,
        vy: 5 + Math.random() * 10,
        life: 0.8,
        color: Math.random() > 0.5 ? "#fbbf24" : "#f97316", // fiery exhaust
      });
    }
    
    // Always apply gravity
    p.vy += GRAVITY * 0.8; // Slightly floatier gravity
    p.y += p.vy;

    // Terminal velocity & Screen boundaries
    if (p.vy > 12) p.vy = 12; // Max fall speed
    if (p.vy < -12) p.vy = -12; // Max fly speed
    
    // Ceiling (don't fly off screen)
    if (p.y < GNOME_VISUAL_HEIGHT - 20) {
      p.y = GNOME_VISUAL_HEIGHT - 20;
      p.vy = 0;
    }

    // Floor
    if (p.y >= FLOOR_Y) {
      p.y = FLOOR_Y;
      if (p.vy > 0) p.vy = 0;
      
      if (!isHoldingJump && p.state === "jumping") {
        p.state = "running";
      }
    } else if (p.state === "sliding") {
      if (time > p.slideEndTime) {
        p.state = "running";
      }
    } else {
      // Running - dust particles
      if (stateRef.current.state === "playing" && Math.random() > 0.6) {
        particlesRef.current.push({
          x: p.x + 30, // behind feet
          y: p.y - 10,
          vx: -s.speed * 0.5 - Math.random() * 2,
          vy: -Math.random() * 2,
          life: 1.0,
          color: "rgba(200, 200, 200, 0.5)", // dust color
        });
      }
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
      y: p.state === "sliding" ? p.y - 60 : p.y - 110,
      w: p.w - 40,
      h: p.state === "sliding" ? 60 : 110,
    };

    // Spawning
    if (time > nextSpawnRef.current) {
      spawnObstacle(time);
      nextSpawnRef.current = time + 1200; // Faster spawns for testing
    }
    if (time > nextCoinSpawnRef.current) {
      spawnCoin(time);
      nextCoinSpawnRef.current = time + Math.random() * 800 + 500;
    }
    // Entities Logic
    for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
      const ent = entitiesRef.current[i];
      ent.x -= s.speed;

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

      if (
        pBox.x < eBox.x + eBox.w &&
        pBox.x + pBox.w > eBox.x &&
        pBox.y < eBox.y + eBox.h &&
        pBox.y + pBox.h > eBox.y
      ) {
        if (ent.type === "redCandle") {
          gameOver("REKT BY THE RED CANDLE!");
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

      // Cleanup offscreen or collected
      if (ent.x + ent.w < 0 || ent.collected) {
        entitiesRef.current.splice(i, 1);
      }
    }

    // Background Sequence Scroll
    const bg = bgStateRef.current;
    bg.x -= s.speed * 0.3; // Slower than foreground for parallax depth effect

    const currentBgImg = assetsRef.current[`bg-${String(bg.currentIndex + 1).padStart(2, '0')}`];
    if (currentBgImg) {
      const bgScale = FLOOR_Y / currentBgImg.height;
      const drawW = currentBgImg.width * bgScale;
      
      // If the current background has completely scrolled offscreen to the left
      if (bg.x <= -drawW) {
        bg.x += drawW;
        bg.currentIndex = (bg.currentIndex + 1) % 10;
      }
    }

    updateVisualsOnly();
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Apply camera shake if game over
    if (stateRef.current.state === "gameover") {
      const shakeAmt = Math.max(0, 5 - (performance.now() - stateRef.current.gnomeModeTime)*0.01); 
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
        bgRenderIndex = (bgRenderIndex + 1) % 10;
      } else {
        // Fallback
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(currentDrawX, 0, CANVAS_W, CANVAS_H);
        break;
      }
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
        ctx.arc(ent.x + ent.w/2, floatY + ent.h/2, ent.w/2, 0, Math.PI * 2);
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
           ctx.fillText(ent.coin.symbol.slice(0, 3), ent.x + ent.w/2, floatY + ent.h/2);
        }

        // draw ticker and price
        if (ent.coin) {
           ctx.fillStyle = "#ffffff";
           ctx.font = "bold 12px sans-serif";
           ctx.textAlign = "center";
           ctx.shadowBlur = 5;
           ctx.shadowColor = "#000000";
           ctx.fillText(ent.coin.symbol, ent.x + ent.w/2, floatY - 6);
           
           ctx.fillStyle = "#4ade80"; // green
           ctx.font = "bold 10px sans-serif";
           ctx.fillText(formatPrice(ent.coin.priceUsd), ent.x + ent.w/2, floatY + ent.h + 12);
        }
        
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
             ctx.arc(p.x + drawW/2, drawY + drawH/2 + bobY, pulseRad, 0, Math.PI * 2);
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
               vx: -baseSpeed - Math.random()*5,
               vy: (Math.random()-0.5)*2,
               life: 1.0,
               color: isGnomeMode ? "#fbbf24" : "rgba(150, 150, 150, 0.5)"
             });
          }
          
          ctx.restore();
        }

        // Dynamic Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(p.x + drawW/2, FLOOR_Y, 40 - bobY*2 - (p.state === "jumping" ? 20 : 0), 10 - bobY/2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(p.x + drawW/2, drawY + drawH/2 + bobY);
        ctx.rotate(tilt);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(pImg, -drawW/2, -drawH/2, drawW, drawH);
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

  const shareText = encodeURIComponent(`I reached $${score} MCAP in Gnome Runner before getting ${gameOverReason}. Dodge bears. Survive rugs. Harvest $GNOME. https://chaosgnome.xyz`);

  return (
    <main 
      className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-black font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="block h-full w-full touch-none select-none"
      />

      {assetError && (
        <div className="absolute top-2 left-2 bg-red-900 text-white px-4 py-2 font-bold text-lg rounded shadow-lg border border-red-500 z-50">
          {assetError}
        </div>
      )}

      {/* Mobile Controls Overlay */}
      {gameState === "playing" && (
        <div className="pointer-events-none fixed inset-0 z-30 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              slide();
            }}
            className="pointer-events-auto absolute bottom-6 left-6 h-20 w-20 rounded-full border border-orange-300/60 bg-orange-500/25 text-sm font-black text-orange-100 shadow-2xl backdrop-blur-md active:scale-95"
          >
            SLIDE
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              keysRef.current["TouchJump"] = true;
              jump();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current["TouchJump"] = false;
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              keysRef.current["TouchJump"] = false;
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current["TouchJump"] = false;
            }}
            className="pointer-events-auto absolute bottom-6 right-6 h-24 w-24 rounded-full border border-green-300/60 bg-green-500/25 text-base font-black text-green-100 shadow-2xl backdrop-blur-md active:scale-95"
          >
            JUMP
          </button>
        </div>
      )}

      {/* HUD overlay */}
      <div className="absolute top-4 right-6 flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-green-500/30">
          <h2 className="text-4xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] tracking-tighter">
            MCAP: ${score.toLocaleString()}
          </h2>
        </div>
        <div className="flex gap-4">
           {gnomeModeActive && (
              <div className="bg-red-900/80 backdrop-blur-md px-4 py-2 rounded-xl flex items-center border border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                <span className="text-xl font-black text-white tracking-widest">
                  GNOME MODE ACTIVE
                </span>
              </div>
           )}
           
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex flex-col items-end justify-center gap-0 border border-yellow-500/30">
              <span className="text-sm font-bold text-gray-300">
                Harvested: <span className="text-yellow-400">{harvestedCount}</span>
              </span>
              <span className="text-xs font-bold text-green-400">
                {lastGrab ? `Last Grab: ${lastGrab}` : ''}
              </span>
           </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-50 py-4">
          <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center items-center px-4 h-full">
            {/* Left: Title and Input */}
            <div className="flex flex-col items-center flex-1">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl text-center">GNOME RUNNER</h1>
              <p className="text-green-400 text-lg md:text-xl font-bold mb-6 text-center px-4">Dodge Bears. Survive Rugs. Stack $GNOME.</p>
              <div className="mb-6 flex flex-col items-center pointer-events-auto">
                 <input 
                   type="text" 
                   maxLength={15}
                   placeholder="Enter Name..." 
                   value={playerName}
                   onChange={(e) => {
                     setPlayerName(e.target.value);
                     localStorage.setItem("gnome_runner_name", e.target.value);
                   }}
                   className="bg-black/50 border-2 border-green-500/50 text-white text-center text-xl font-bold py-3 px-6 rounded-xl outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all placeholder:text-gray-500 w-[250px] md:w-[300px]"
                 />
              </div>
              <button 
                onClick={startGame}
                className="px-10 py-4 bg-green-500 hover:bg-green-400 text-black font-black text-2xl rounded-full transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(74,222,128,0.6)] pointer-events-auto"
              >
                START RUN
              </button>
              <div className="mt-6 text-gray-400 text-xs md:text-sm text-center px-6 hidden md:block">
                <p className="mb-2">Desktop: Space/Up = Jump, Down = Slide</p>
                <p>Mobile: Tap top = Jump, Tap bottom = Slide</p>
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
        <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center backdrop-blur-md z-50">
          <h1 className="text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] text-center px-4">
            {gameOverReason}
          </h1>
          
          <div className="flex flex-col md:flex-row gap-6 mt-6 mb-8 w-full max-w-4xl justify-center items-center px-4 pointer-events-auto">
            {/* Stats Panel */}
            <div className="bg-black/50 p-6 rounded-2xl border border-red-500/30 text-center w-full max-w-[350px]">
              <p className="text-gray-300 text-lg mb-1">Final Market Cap</p>
              <p className="text-5xl font-black text-green-400 mb-6">${score.toLocaleString()}</p>
              
              <p className="text-gray-400 text-sm">Best Run</p>
              <p className="text-2xl font-bold text-gray-200">${highScore.toLocaleString()}</p>
            </div>

            {/* Leaderboard Panel */}
            <div className="bg-black/80 p-4 md:p-6 rounded-2xl border border-yellow-500/30 text-left w-full max-w-[350px] flex flex-col h-[200px] md:h-[260px]">
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

          <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto px-4">
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-black text-xl rounded-full transform hover:scale-105 transition-all w-full sm:w-auto"
            >
              TRY AGAIN
            </button>
            <a 
              href={`https://x.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-black border-2 border-white hover:bg-gray-900 text-white font-black text-xl rounded-full transform hover:scale-105 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              SHARE ON X
            </a>
          </div>
          
          <button className="mt-6 text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 pointer-events-auto">
            RAID TELEGRAM
          </button>
        </div>
      )}
      {/* Landscape Prompt Overlay */}
      <div className="portrait:flex hidden fixed inset-0 z-[100] bg-black items-center justify-center flex-col pointer-events-auto px-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-400 mb-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <h2 className="text-3xl font-black text-white leading-tight mb-2">
          PLEASE ROTATE YOUR DEVICE
        </h2>
        <p className="text-green-400 font-bold text-lg">Landscape mode required to play $GNOME Runner</p>
      </div>
    </main>
  );
}
