"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPhysicsEngine, GAME_WIDTH, GAME_HEIGHT, DANGER_LINE, PhysicsEngine } from "@/lib/physics";
import { getCoinByLevel } from "@/lib/coins";

interface GameCanvasProps {
  onMerge: (fromLevel: number, toLevel: number) => void;
  onGameOver: (mergeCount: number, highestLevel: number) => void;
  gameStarted: boolean;
}

export default function GameCanvas({ onMerge, onGameOver, gameStarted }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const animFrameRef = useRef<number>(0);
  const dropXRef = useRef<number>(GAME_WIDTH / 2);
  const isDraggingRef = useRef<boolean>(false);
  const gameOverCalledRef = useRef<boolean>(false);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, level: number) => {
    const coinData = getCoinByLevel(level);
    if (!coinData) return;

    // Glow
    ctx.shadowColor = coinData.glowColor;
    ctx.shadowBlur = 12;

    // Coin daire
    ctx.beginPath();
    ctx.arc(x, y, coinData.radius, 0, Math.PI * 2);
    ctx.fillStyle = coinData.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.beginPath();
    ctx.arc(x, y, coinData.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Symbol text
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(10, coinData.radius * 0.55)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(coinData.symbol, x, y);
  }, []);

  const drawPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    const coinData = getCoinByLevel(1);
    if (!coinData) return;

    const x = Math.max(coinData.radius, Math.min(GAME_WIDTH - coinData.radius, dropXRef.current));

    // Dashed line guide
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview coin (yarı şeffaf)
    ctx.globalAlpha = 0.5;
    drawCoin(ctx, x, coinData.radius, 1);
    ctx.globalAlpha = 1;
  }, [drawCoin]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    engine.update();

    // Game over kontrolü
    if (engine.isGameOver && !gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(engine.mergeCount, engine.highestLevel);
      return;
    }

    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Danger line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(239,68,68,0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.moveTo(0, DANGER_LINE);
    ctx.lineTo(GAME_WIDTH, DANGER_LINE);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview (eğer game over yoksa)
    if (!engine.isGameOver) {
      drawPreview(ctx);
    }

    // Coins çiz
    for (const coin of engine.coins) {
      drawCoin(ctx, coin.body.position.x, coin.body.position.y, coin.level);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [drawCoin, drawPreview, onGameOver]);

  // Touch & mouse handlers
  const getX = useCallback((e: React.TouchEvent | React.MouseEvent): number => {
    const canvas = canvasRef.current;
    if (!canvas) return GAME_WIDTH / 2;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;

    if ("touches" in e && e.touches.length > 0) {
      return (e.touches[0].clientX - rect.left) * scaleX;
    }
    if ("clientX" in e) {
      return (e.clientX - rect.left) * scaleX;
    }
    return GAME_WIDTH / 2;
  }, []);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStarted || engineRef.current?.isGameOver) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dropXRef.current = getX(e);
  }, [gameStarted, getX]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    dropXRef.current = getX(e);
  }, []);

  const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    isDraggingRef.current = false;

    if (engineRef.current && !engineRef.current.isGameOver) {
      engineRef.current.addCoin(dropXRef.current);
    }
  }, []);

  // Keyboard handlers
  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (engineRef.current?.isGameOver) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        dropXRef.current = Math.max(15, dropXRef.current - 20);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        dropXRef.current = Math.min(GAME_WIDTH - 15, dropXRef.current + 20);
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (engineRef.current) {
          engineRef.current.addCoin(dropXRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted]);

  // Engine init & loop
  useEffect(() => {
    if (!gameStarted) return;

    gameOverCalledRef.current = false;
    engineRef.current = createPhysicsEngine(onMerge);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [gameStarted, onMerge, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="rounded-xl border border-gray-800 cursor-pointer"
      style={{ maxWidth: "100%", touchAction: "none" }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
    />
  );
}
