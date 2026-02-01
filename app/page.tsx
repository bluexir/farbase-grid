"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import GameCanvas from "@/components/GameCanvas";
import Scoreboard from "@/components/Scoreboard";
import GameOver from "@/components/GameOver";
import { getCoinByLevel } from "@/lib/coins";

export default function Home() {
  const [fid, setFid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [mergeCount, setMergeCount] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    async function init() {
      const context = await sdk.context;
      setFid(context.user.fid);
      await sdk.actions.ready();
      setLoading(false);
    }
    init();
  }, []);

  const handleMerge = useCallback((fromLevel: number, toLevel: number) => {
    setMergeCount((prev) => prev + 1);
    setHighestLevel((prev) => Math.max(prev, toLevel));
  }, []);

  const handleGameOver = useCallback((finalMerges: number, finalHighest: number) => {
    setGameOver(true);
    const coinData = getCoinByLevel(finalHighest);
    const finalScore = (coinData?.scoreValue || 1) * finalMerges;
    setScore(finalScore);
    setMergeCount(finalMerges);
    setHighestLevel(finalHighest);
  }, []);

  const startGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setMergeCount(0);
    setHighestLevel(1);
    setGameStarted(true);
    setGameKey((prev) => prev + 1);
  }, []);

  const restartGame = useCallback(() => {
    setGameStarted(false);
    setTimeout(() => {
      startGame();
    }, 100);
  }, [startGame]);

  // Live score hesap
  const liveScore = (getCoinByLevel(highestLevel)?.scoreValue || 1) * mergeCount;

  if (loading) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400">FarBase Drop</h1>
        <p className="text-gray-400 mt-2">Loading...</p>
      </div>
    );
  }

  // Ana menu (oyun başlatılmadan önce)
  if (!gameStarted) {
    return (
      <div className="w-full max-w-sm mx-auto flex flex-col items-center px-4 py-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">FarBase Drop</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">
          Coinleri birleştir, skor yaz
        </p>

        <div className="w-full bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-400 text-sm text-center mb-3">How to Play</p>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>🤚 Drag left/right to position the coin</p>
            <p>👆 Release to drop</p>
            <p>🔗 Match two same coins to merge</p>
            <p>📈 DOGE → SHIB → SPO → PEPE → SOL → ETH → BTC</p>
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg text-lg transition-colors"
        >
          Play
        </button>

        <p className="text-gray-600 text-xs mt-4">FID: {fid}</p>
      </div>
    );
  }

  // Oyun ekranı
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center px-2">
      <Scoreboard score={liveScore} mergeCount={mergeCount} highestLevel={highestLevel} />

      <div className="relative w-full">
        <GameCanvas
          key={gameKey}
          onMerge={handleMerge}
          onGameOver={handleGameOver}
          gameStarted={gameStarted}
        />

        {gameOver && (
          <GameOver
            score={score}
            mergeCount={mergeCount}
            highestLevel={highestLevel}
            onRestart={restartGame}
          />
        )}
      </div>
    </div>
  );
}
