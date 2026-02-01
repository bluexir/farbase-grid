"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import GameCanvas from "@/components/GameCanvas";
import Scoreboard from "@/components/Scoreboard";
import GameOver from "@/components/GameOver";
import MainMenu from "@/components/MainMenu";
import { getCoinByLevel } from "@/lib/coins";

type Screen = "menu" | "practice" | "tournament" | "leaderboard";

export default function Home() {
  const [fid, setFid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("menu");
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

  const startGame = useCallback((mode: "practice" | "tournament") => {
    setGameOver(false);
    setScore(0);
    setMergeCount(0);
    setHighestLevel(1);
    setScreen(mode);
    setGameKey((prev) => prev + 1);
  }, []);

  const restartGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setMergeCount(0);
    setHighestLevel(1);
    setGameKey((prev) => prev + 1);
  }, []);

  const liveScore = (getCoinByLevel(highestLevel)?.scoreValue || 1) * mergeCount;

  // Loading
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at center, #0a0a1a 0%, #000 100%)",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#00f3ff",
            textShadow: "0 0 20px #00f3ff",
          }}
        >
          FarBase Drop
        </h1>
        <p style={{ color: "#555", marginTop: "8px" }}>Loading...</p>
      </div>
    );
  }

  // Ana Menü
  if (screen === "menu") {
    return (
      <MainMenu
        fid={fid!}
        onPractice={() => startGame("practice")}
        onTournament={() => startGame("tournament")}
        onLeaderboard={() => setScreen("leaderboard")}
      />
    );
  }

  // Leaderboard (şimdilik placeholder)
  if (screen === "leaderboard") {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          background: "radial-gradient(circle at center, #0a0a1a 0%, #000 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "340px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "none",
              border: "none",
              color: "#00f3ff",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <span
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            📊 Leaderboard
          </span>
          <div style={{ width: "60px" }} />
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "340px",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid #333",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#555", fontSize: "0.85rem" }}>
            No scores yet. Play a game first!
          </p>
        </div>
      </div>
    );
  }

  // Oyun Ekranı (practice veya tournament)
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px 0 12px",
        }}
      >
        <button
          onClick={() => setScreen("menu")}
          style={{
            background: "none",
            border: "none",
            color: "#00f3ff",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          ← Menu
        </button>
        <span
          style={{
            color: screen === "tournament" ? "#ff00ff" : "#00f3ff",
            fontSize: "0.7rem",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {screen === "tournament" ? "🏆 Tournament" : "🎮 Practice"}
        </span>
        <div style={{ width: "50px" }} />
      </div>

      {/* Scoreboard */}
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <Scoreboard score={liveScore} mergeCount={mergeCount} highestLevel={highestLevel} />
      </div>

      {/* Game Canvas */}
      <div style={{ position: "relative", width: "360px", flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <GameCanvas
          key={gameKey}
          onMerge={handleMerge}
          onGameOver={handleGameOver}
          gameStarted={true}
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
