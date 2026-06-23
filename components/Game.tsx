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
  type: "redCandle" | "cryptoCoin" | "liquidationLaser";
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
  x: number;
  y: number;
  text: string;
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
  "I reached ${mcap} MCAP in Gnome Runner before getting {reason}. Dodge bears. Survive rugs. Harvest $GNOME. https://chaosgnome.xyz",
  "Just got {reason} at ${mcap} MCAP. Still performing better than my actual crypto portfolio! $GNOME to the moon! 🍄 https://chaosgnome.xyz",
  "Paper handed at ${mcap} MCAP because of {reason}. Don't fade $GNOME! 💎🙌 https://chaosgnome.xyz",
  "Liquidated?! I got {reason} at ${mcap} MCAP. Selling my house to buy more $GNOME! 📉 https://chaosgnome.xyz",
  "I was farming $GNOME at ${mcap} MCAP when suddenly: {reason}. Can you beat my score? https://chaosgnome.xyz",
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
    canvasH: 1280
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
    speed: Math.random() * 3 + 1
  })));

  // --- Assets ---
  const assetsRef = useRef<Record<string, HTMLImageElement>>({});
  const cryptoCoinsRef = useRef<CryptoCoin[]>([]);
  const cryptoLogosRef = useRef<Record<string, HTMLImageElement>>({});

  // --- Initialization & API Fetching ---
  useEffect(() => {
    const storedName = localStorage.getItem("gnome_runner_name");
    if (storedName) setPlayerName(storedName);

    const storedScore = localStorage.getItem("gnome_runner_highscore");
    if (storedScore) setHighScore(parseInt(storedScore));

    // Fetch Leaderboard
    fetch("/api/leaderboard").then(res => res.json()).then(data => {
      if (data.leaderboard) setLeaderboardData(data.leaderboard);
    }).catch(e => console.error("Leaderboard error:", e));

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

    // Preload Gnome Rocket
    const rocketImg = new Image();
    rocketImg.src = "/assets/gnome-rocket.png";
    rocketImg.onload = () => { assetsRef.current["rocket"] = rocketImg; };
    rocketImg.onerror = () => setAssetError("Failed to load /assets/gnome-rocket.png");

  }, []);

  // --- Responsive Canvas Setup ---
  useEffect(() => {
    const handleResize = () => {
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
    if (!playerName.trim()) return alert("Please enter your name!");
    localStorage.setItem("gnome_runner_name", playerName);

    setGameState("playing");
    engineRef.current.state = "playing";
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
    engineRef.current.state = "gameover";
    setGameState("gameover");
    setGameOverReason(reason);

    const mcapString = Math.floor(engineRef.current.score).toLocaleString();
    const finalMsg = SHARE_MESSAGES[Math.floor(Math.random() * SHARE_MESSAGES.length)]
      .replace("{mcap}", mcapString)
      .replace("{reason}", reason);
    setShareMessage(encodeURIComponent(finalMsg));

    const finalScore = Math.floor(engineRef.current.score);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("gnome_runner_highscore", finalScore.toString());
    }

    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName, score: finalScore })
    }).then(() => fetch("/api/leaderboard"))
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

    // Progression
    engine.speed += 0.002;
    engine.score += engine.speed * (isGnomeMode ? 20 : 10);

    // Player Movement (Smooth X follow and fixed Y to avoid mobile bottom bars)
    p.x += (p.targetX - p.x) * 0.15;
    p.y = engine.canvasH * 0.7 + Math.sin(time * 0.005) * 10;

    // Thruster Particles
    if (Math.random() > 0.4) {
      particlesRef.current.push({
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y + p.h / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: engine.speed + Math.random() * 5,
        life: 0.6,
        color: isGnomeMode ? "#fbbf24" : "#f97316"
      });
    }

    // Spawning
    if (time > engine.nextObstacleSpawn) {
      const type = Math.random() > 0.2 ? "redCandle" : "liquidationLaser";
      
      let w, h;
      if (type === "redCandle") {
        w = 40 + Math.random() * 30;
        h = 100 + Math.random() * 200;
      } else {
        // Laser acts as a falling horizontal wall, clamp width to 30%-50% of screen
        w = CANVAS_W * (0.3 + Math.random() * 0.2);
        h = 20;
      }
      
      entitiesRef.current.push({
        id: time, type,
        x: Math.random() * (CANVAS_W - w),
        y: -h - 100,
        w, h
      });
      engine.nextObstacleSpawn = time + Math.max(400, 1500 - engine.speed * 10);
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
    const pBox = { x: p.x - p.w/2 + 20, y: p.y - p.h/2 + 20, w: p.w - 40, h: p.h - 40 };

    for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
      const ent = entitiesRef.current[i];
      ent.y += engine.speed;
      if (ent.type === "redCandle") ent.y += 2;

      // Gnome Mode Magnet
      if (isGnomeMode && ent.type === "cryptoCoin" && !ent.collected) {
        if (ent.y < p.y && ent.y > p.y - 600) {
          ent.y += 10;
          ent.x += (p.x - (ent.x + ent.w/2)) * 0.1;
        }
      }

      // Collision
      if (!ent.collected &&
          pBox.x < ent.x + ent.w &&
          pBox.x + pBox.w > ent.x &&
          pBox.y < ent.y + ent.h &&
          pBox.y + pBox.h > ent.y) {
        
        if (ent.type === "redCandle" || ent.type === "liquidationLaser") {
          triggerGameOver(ent.type === "redCandle" ? "hit a Red Candle" : "got Liquidated");
          return;
        } else if (ent.type === "cryptoCoin" && ent.coin) {
          ent.collected = true;
          engine.score += ent.coin.scoreValue * (isGnomeMode ? 2 : 1);
          engine.coins++;
          
          floatingTextsRef.current.push({ x: ent.x, y: ent.y, text: `+${ent.coin.symbol}`, life: 1.0 });
          
          // Trigger Gnome Mode randomly on pickup
          if (Math.random() > 0.95 && !isGnomeMode) {
            engine.gnomeModeTime = time + 6000;
            floatingTextsRef.current.push({ x: p.x, y: p.y - 100, text: "GNOME MODE!", life: 2.0 });
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

    // Stars
    starsRef.current.forEach(s => {
      s.y += s.speed + engine.speed * 0.2;
      if (s.y > engine.canvasH) {
        s.y = 0; s.x = Math.random() * CANVAS_W;
      }
    });
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

    // 1. Procedural Sky Gradient (Changes with score)
    const progress = Math.min(1, engine.score / 500000); // 0 to 500k
    
    // Sky Blue
    let r1 = 135, g1 = 206, b1 = 235;
    let r2 = 224, g2 = 246, b2 = 255;
    
    if (progress > 0) {
      // Transition to space (dark blue/black)
      r1 = Math.floor(135 - (130 * progress));
      g1 = Math.floor(206 - (200 * progress));
      b1 = Math.floor(235 - (215 * progress));
      
      r2 = Math.floor(224 - (204 * progress));
      g2 = Math.floor(246 - (226 * progress));
      b2 = Math.floor(255 - (215 * progress));
    }

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
    grad.addColorStop(1, `rgb(${r2},${g2},${b2})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. Stars
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, progress * 2)})`;
    starsRef.current.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
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
        ctx.fillRect(ent.x + ent.w/2 - 2, ent.y - 20, 4, ent.h + 40);
        
        // Speed trail lines (to emphasize falling)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 138, 128, 0.4)";
        ctx.fillRect(ent.x + 4, ent.y - 40 - (pulse * 10), 2, 20);
        ctx.fillRect(ent.x + ent.w - 6, ent.y - 30 + (pulse * 10), 2, 15);
        ctx.restore();
        
      } else if (ent.type === "liquidationLaser") {
        ctx.save();
        const laserPulse = Math.sin(time * 0.03 + ent.id);
        
        // Extreme Heat Glow
        ctx.shadowBlur = 20 + laserPulse * 15;
        ctx.shadowColor = "#ef4444";
        
        // Outer Aura (flickering size & opacity)
        const auraSpread = 10 + laserPulse * 5;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + laserPulse * 0.2})`;
        ctx.fillRect(ent.x, ent.y - auraSpread, ent.w, ent.h + auraSpread * 2);
        
        // Base Laser Beam
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(ent.x, ent.y, ent.w, ent.h);
        
        // White-Hot Plasma Center (blinking)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + laserPulse * 0.3})`;
        ctx.fillRect(ent.x, ent.y + ent.h/2 - 2, ent.w, 4);
        ctx.restore();
      } else if (ent.type === "cryptoCoin" && ent.coin) {
        const floatY = ent.y + Math.sin(time * 0.005 + ent.id) * 10;
        
        ctx.save();
        
        // Background Coin Glow/Shadow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(251, 191, 36, 0.5)";
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath(); 
        ctx.arc(ent.x + ent.w/2, floatY + ent.h/2, ent.w/2, 0, Math.PI*2); 
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow for inner drawing

        const logo = cryptoLogosRef.current[ent.coin.symbol];
        if (logo && logo.complete) {
          // Create circular clipping mask for the image
          ctx.beginPath();
          ctx.arc(ent.x + ent.w/2, floatY + ent.h/2, ent.w/2 - 2, 0, Math.PI*2);
          ctx.clip();
          
          // Draw image (it will be cropped by the circle)
          ctx.drawImage(logo, ent.x + 2, floatY + 2, ent.w - 4, ent.h - 4);
        } else {
          ctx.fillStyle = "#fbbf24"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(ent.coin.symbol, ent.x + ent.w/2, floatY + ent.h/2 + 6);
        }
        
        // Add a nice metallic rim around the coin
        ctx.beginPath();
        ctx.arc(ent.x + ent.w/2, floatY + ent.h/2, ent.w/2, 0, Math.PI*2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();
        
        ctx.restore();
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
      ctx.drawImage(rocket, -p.w/2, -p.h/2, p.w, p.h); 
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    }
    ctx.restore();

    // 5. Particles
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 6. Floating Text
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    floatingTextsRef.current.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.strokeStyle = "black"; ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = "#4ade80";
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;
  };

  // --- JSX Rendering ---
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
      {gameState === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 p-4">
          <div className="max-w-md w-full max-h-[95dvh] overflow-y-auto bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-4 sm:gap-6">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-2 filter drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
              GNOME MOON RUN
            </h1>
            <p className="text-slate-300 text-lg">Ascend to the moon. Harvest crypto. Dodge red candles.</p>

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
              <div className="w-full mt-4 text-left">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Top Degens</h3>
                <div className="space-y-1">
                  {leaderboardData.slice(0, 5).map((l, i) => (
                    <div key={i} className="flex justify-between text-sm">
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
      {gameState === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-sm z-30 p-4">
          <div className="max-w-md w-full max-h-[95dvh] overflow-y-auto bg-slate-900 border-2 border-red-900 rounded-2xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-4 sm:gap-6">
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
              APING BACK IN (PLAY AGAIN)
            </button>

            <a
              href={`https://x.com/intent/tweet?text=${shareMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block bg-black hover:bg-slate-800 border border-slate-700 text-white font-bold text-lg py-3 rounded-xl transition-colors"
            >
              Share on X
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
