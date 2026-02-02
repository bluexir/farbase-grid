"use client";

import { getCoinByLevel } from "@/lib/coins";

interface GameOverProps {
  score: number;
  mergeCount: number;
  highestLevel: number;
  onRestart: () => void;
  onCast: () => void;
  scoreSaved: boolean;
}

export default function GameOver({ score, mergeCount, highestLevel, onRestart, onCast, scoreSaved }: GameOverProps) {
  const highestCoin = getCoinByLevel(highestLevel);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-10 rounded-xl px-6">
      <h2 className="text-3xl font-bold text-red-400 mb-6">Game Over</h2>

      <div className="w-full bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Score</span>
          <span className="text-yellow-400 font-bold text-lg">{score}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Merges</span>
          <span className="text-white font-bold text-lg">{mergeCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Best Coin</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: highestCoin?.color || "#C3A634" }}
            />
            <span className="text-white font-bold text-lg">
              {highestCoin?.symbol || "DOGE"}
            </span>
          </div>
        </div>
      </div>

      {/* Score kaydet durumu */}
      <p style={{ fontSize: "0.7rem", color: scoreSaved ? "#00f3ff" : "#555", marginBottom: "12px" }}>
        {scoreSaved ? "✓ Score saved" : "Saving score..."}
      </p>

      {/* Cast Butonu */}
      <button
        onClick={onCast}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          border: "none",
          borderRadius: "10px",
          padding: "12px",
          color: "#fff",
          fontSize: "0.95rem",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        🗣️ Cast Score
      </button>

      {/* Play Again */}
      <button
        onClick={onRestart}
        style={{
          width: "100%",
          background: "#eab308",
          border: "none",
          borderRadius: "10px",
          padding: "12px",
          color: "#000",
          fontSize: "0.95rem",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Play Again
      </button>
    </div>
  );
}
