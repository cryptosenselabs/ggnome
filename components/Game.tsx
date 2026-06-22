"use client";

import React, { useEffect, useRef, useState } from "react";

// Game Constants
const CANVAS_W = 1280;
const CANVAS_H = 720;
const FLOOR_Y = 600;

const GRAVITY = 0.8;
const JUMP_VELOCITY = -16;
const SLIDE_DURATION = 450;
const INITIAL_SPEED = 8;
const SPEED_INCREMENT = 0.001;

// Visual Sizes
const GNOME_VISUAL_WIDTH = 170;
const GNOME_VISUAL_HEIGHT = 125;
const GNOME_SLIDE_WIDTH = 185;
const GNOME_SLIDE_HEIGHT = 95;

// Interfaces
interface Entity {
  id: number;
  type: "rug" | "bear" | "coin";
  x: number;
  y: number;
  w: number;
  h: number;
  collected?: boolean;
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
  const [highScore, setHighScore] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [gnomeModeActive, setGnomeModeActive] = useState(false);
  const [assetError, setAssetError] = useState("");

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
    runFrameIndex: 0,
    runFrameTimer: 0,
  });

  const bgStateRef = useRef({
    x: 0,
    currentIndex: 0,
  });

  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const frameRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const nextCoinSpawnRef = useRef(0);

  // Asset Refs
  const assetsRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Load high score
    const stored = localStorage.getItem("gnome_runner_highscore");
    if (stored) setHighScore(parseInt(stored));

    // Preload Images
    const imagePaths: Record<string, string> = {
      "coin-gnome": "/assets/coin-gnome.png",
      "enemy-bear": "/assets/enemy-bear.png",
      "enemy-rug": "/assets/enemy-rug.png",
      "gnome-run": "/assets/gnome-run.png",
      "gnomeJump": "/assets/gnome-jump.png",
      "gnomeFall": "/assets/gnome-fall.png",
      "gnomeSlide": "/assets/gnome-slide.png",
      "gnomeHit": "/assets/gnome-hit.png",
      "gnomeMode": "/assets/gnome-mode.png",
    };

    // Add 11 background images
    for (let i = 1; i <= 11; i++) {
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
        } else {
           setAssetError("Missing game assets. Please check public/assets.");
        }
      };
    });
  }, []);

  const jump = () => {
    const p = playerRef.current;
    if (stateRef.current.state === "playing" && p.state !== "jumping") {
      p.vy = JUMP_VELOCITY;
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
      runFrameIndex: 0,
      runFrameTimer: 0,
    };

    bgStateRef.current = {
      x: 0,
      currentIndex: 0,
    };

    entitiesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
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
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (stateRef.current.state === "playing") jump();
        else if (stateRef.current.state === "gameover" || stateRef.current.state === "menu") startGame();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        if (stateRef.current.state === "playing") slide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highScore]);

  // Touch Handling for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (stateRef.current.state !== "playing") {
      startGame();
      return;
    }
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = touch.clientY - rect.top;

    if (y > rect.height / 2) {
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
    const isBear = Math.random() > 0.6;
    if (isBear) {
      // Bear Market (must slide under)
      entitiesRef.current.push({
        id: time,
        type: "bear",
        x: CANVAS_W + 100,
        y: FLOOR_Y - 140, // Floating above ground to allow sliding under
        w: 160,
        h: 140,
      });
    } else {
      // Rug Pull (must jump over)
      entitiesRef.current.push({
        id: time,
        type: "rug",
        x: CANVAS_W + 100,
        y: FLOOR_Y - 30, // On ground
        w: 140,
        h: 30,
      });
    }
  };

  const spawnCoin = (time: number) => {
    const yHeight = Math.random() > 0.5 ? FLOOR_Y - 100 : FLOOR_Y - 220;
    entitiesRef.current.push({
      id: time + 1, // Ensure unique
      type: "coin",
      x: CANVAS_W + 100,
      y: yHeight,
      w: 50,
      h: 50,
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
    if (p.state === "jumping") {
      p.vy += GRAVITY;
      p.y += p.vy;

      if (p.y >= FLOOR_Y) {
        p.y = FLOOR_Y;
        p.vy = 0;
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
      nextSpawnRef.current = time + Math.random() * 1500 + 1000 - s.speed * 20; // Faster spawns over time
    }
    if (time > nextCoinSpawnRef.current) {
      spawnCoin(time);
      nextCoinSpawnRef.current = time + Math.random() * 800 + 500;
    }

    // Entities Logic
    for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
      const ent = entitiesRef.current[i];
      ent.x -= s.speed;

      // Auto-collect coins in Gnome Mode
      if (isGnomeMode && ent.type === "coin" && !ent.collected) {
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
        if (ent.type === "rug") {
          gameOver("RUG PULLED!");
          return;
        } else if (ent.type === "bear") {
          if (p.state !== "sliding") {
             gameOver("LIQUIDATED BY THE BEAR MARKET!");
             return;
          }
        } else if (ent.type === "coin" && !ent.collected) {
          ent.collected = true;
          const coinValue = isGnomeMode ? 2 : 1;
          s.coins += coinValue;
          s.score += 100 * coinValue;
          s.multiplier += 0.01;

          // Float text
          floatingTextsRef.current.push({
            x: ent.x,
            y: ent.y,
            text: `+${100 * coinValue}`,
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
              text: "GNOME MODE ACTIVATED!",
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
        bg.currentIndex = (bg.currentIndex + 1) % 11;
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
        const bgScale = FLOOR_Y / bgImg.height;
        const drawW = bgImg.width * bgScale;
        
        // Draw to fill the scenic environment up to FLOOR_Y
        ctx.drawImage(bgImg, currentDrawX, 0, drawW, FLOOR_Y);
        
        currentDrawX += drawW;
        bgRenderIndex = (bgRenderIndex + 1) % 11;
      } else {
        // Fallback
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(currentDrawX, 0, CANVAS_W, FLOOR_Y);
        break;
      }
    }

    // Floor (Foreground separate gameplay lane)
    ctx.fillStyle = "#2d3748"; // Dark pavement
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
    
    // Add some simple floor speed lines to make the ground feel fast
    ctx.fillStyle = "#1a202c";
    const speed = stateRef.current.speed;
    const offset = (time * speed) % 100;
    for (let i = 0; i < CANVAS_W + 100; i += 100) {
       ctx.fillRect(i - offset, FLOOR_Y + 10, 50, 4);
       ctx.fillRect(i - offset + 20, FLOOR_Y + 40, 60, 4);
       ctx.fillRect(i - offset - 10, FLOOR_Y + 80, 80, 4);
    }

    // Draw Entities
    entitiesRef.current.forEach((ent) => {
      if (ent.type === "rug") {
        const rugImg = assetsRef.current["enemy-rug"];
        if (rugImg) ctx.drawImage(rugImg, ent.x, ent.y, ent.w, ent.h);
      } else if (ent.type === "bear") {
        const bearImg = assetsRef.current["enemy-bear"];
        if (bearImg) ctx.drawImage(bearImg, ent.x, ent.y, ent.w, ent.h);
      } else if (ent.type === "coin") {
        const coinImg = assetsRef.current["coin-gnome"];
        if (coinImg) {
          const floatY = ent.y + Math.sin(time * 0.005 + ent.id) * 10;
          ctx.drawImage(coinImg, ent.x, floatY, ent.w, ent.h);
        }
      }
    });

    // Determine Sprite & Visual Bounds
    const p = playerRef.current;
    let pImg: HTMLImageElement | undefined;
    let drawW = GNOME_VISUAL_WIDTH;
    let drawH = GNOME_VISUAL_HEIGHT;
    let drawY = p.y - GNOME_VISUAL_HEIGHT;
    
    const isGnomeMode = stateRef.current.gnomeModeTime > time;

    if (stateRef.current.state === "gameover") {
      pImg = assetsRef.current["gnomeHit"];
    } else if (isGnomeMode) {
      pImg = assetsRef.current["gnomeMode"];
      ctx.shadowBlur = 20;
      ctx.shadowColor = "red";
    } else if (p.state === "sliding") {
      pImg = assetsRef.current["gnomeSlide"];
      drawW = GNOME_SLIDE_WIDTH;
      drawH = GNOME_SLIDE_HEIGHT;
      drawY = p.y - GNOME_SLIDE_HEIGHT; 
    } else if (p.y < FLOOR_Y && p.vy < 0) {
      pImg = assetsRef.current["gnomeJump"];
    } else if (p.y < FLOOR_Y && p.vy >= 0) {
      pImg = assetsRef.current["gnomeFall"];
    } else {
      pImg = assetsRef.current["gnome-run"];
    }

    if (!pImg) pImg = assetsRef.current["gnome-run"];

    if (pImg) {
      if (pImg === assetsRef.current["gnome-run"] && stateRef.current.state !== "gameover") {
        // Procedural Running Animation
        const runPulse = time * 0.018;
        const bobY = Math.sin(runPulse) * 6;
        const rotation = Math.sin(runPulse) * 0.025;
        const scaleX = 1 + Math.sin(runPulse) * 0.015;
        const scaleY = 1 - Math.sin(runPulse) * 0.015;
        
        // Dynamic Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(p.x + drawW/2, FLOOR_Y, 40 - bobY*2, 10 - bobY/2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(p.x + drawW/2, drawY + drawH/2 + bobY);
        ctx.rotate(rotation);
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
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
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
    <div 
      className="relative w-full max-w-[1280px] aspect-video mx-auto overflow-hidden bg-black touch-none font-sans"
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-full block"
        style={{ imageRendering: "pixelated" }}
      />

      {assetError && (
        <div className="absolute top-2 left-2 bg-red-900 text-white px-4 py-2 font-bold text-lg rounded shadow-lg border border-red-500 z-50">
          {assetError}
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
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-yellow-500/30">
            <img src="/assets/coin-gnome.png" className="w-8 h-8" alt="Gnome Coin" />
            <span className="text-2xl font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">
              {coins}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
          <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl">GNOME RUNNER</h1>
          <p className="text-green-400 text-xl font-bold mb-8">Dodge Bears. Survive Rugs. Stack $GNOME.</p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-green-500 hover:bg-green-400 text-black font-black text-2xl rounded-full transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(74,222,128,0.6)] pointer-events-auto"
          >
            START RUN
          </button>
          <div className="mt-8 text-gray-400 text-sm text-center">
            <p>Desktop: Space/Up = Jump, Down = Slide</p>
            <p>Mobile: Tap top = Jump, Tap bottom = Slide</p>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center backdrop-blur-md">
          <h1 className="text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
            {gameOverReason}
          </h1>
          
          <div className="bg-black/50 p-8 rounded-2xl border border-red-500/30 mt-6 mb-8 text-center min-w-[400px]">
            <p className="text-gray-300 text-lg mb-1">Final Market Cap</p>
            <p className="text-5xl font-black text-green-400 mb-6">${score.toLocaleString()}</p>
            
            <p className="text-gray-400 text-sm">Best Run</p>
            <p className="text-2xl font-bold text-gray-200">${highScore.toLocaleString()}</p>
          </div>

          <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-black text-xl rounded-full transform hover:scale-105 transition-all"
            >
              TRY AGAIN
            </button>
            <a 
              href={`https://x.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-black border-2 border-white hover:bg-gray-900 text-white font-black text-xl rounded-full transform hover:scale-105 transition-all flex items-center gap-2"
            >
              SHARE ON X
            </a>
          </div>
          
          <button className="mt-6 text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 pointer-events-auto">
            RAID TELEGRAM
          </button>
        </div>
      )}
    </div>
  );
}
