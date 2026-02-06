'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface MainMenuProps {
  fid: number;
  onPractice: () => void;
  onTournament: () => void;
  onLeaderboard: () => void;
}

type AttemptsResponse = {
  mode: "practice" | "tournament";
  remaining: number;
  limit: number;
  isAdmin: boolean;
  resetAt: number | null;
  resetInSeconds: number | null;
};

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0) return `${m} dk`;
  return `${h} sa ${m} dk`;
}

export default function MainMenu({ fid, onPractice, onTournament, onLeaderboard }: MainMenuProps) {
  const [prizePool, setPrizePool] = useState<string>("0");
  const [recommendedApps, setRecommendedApps] = useState<any[]>([]);
  const [practiceAttempts, setPracticeAttempts] = useState<number>(3);
  const [tournamentAttempts, setTournamentAttempts] = useState<number>(0);
  const [practiceResetIn, setPracticeResetIn] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchPrizePool() {
      try {
        const res = await fetch("/api/prize-pool");
        const data = await res.json();
        setPrizePool(data.amount || "0");
      } catch (e) {
        console.error("Failed to fetch prize pool:", e);
      }
    }

    async function fetchRecommendedApps() {
      try {
        const res = await fetch("/recommended-apps.json");
        const data = await res.json();
        setRecommendedApps(data.apps || []);
      } catch (e) {
        console.error("Failed to fetch recommended apps:", e);
      }
    }

    async function fetchAttempts() {
      try {
        const practiceRes = await sdk.quickAuth.fetch("/api/remaining-attempts?mode=practice");
        const practiceData = (await practiceRes.json()) as AttemptsResponse;

        setPracticeAttempts(typeof practiceData.remaining === "number" ? practiceData.remaining : 0);
        setPracticeResetIn(typeof practiceData.resetInSeconds === "number" ? practiceData.resetInSeconds : null);
        setIsAdmin(!!practiceData.isAdmin);

        const tournamentRes = await sdk.quickAuth.fetch("/api/remaining-attempts?mode=tournament");
        const tournamentData = (await tournamentRes.json()) as AttemptsResponse;

        setTournamentAttempts(typeof tournamentData.remaining === "number" ? tournamentData.remaining : 0);
        setIsAdmin((prev) => prev || !!tournamentData.isAdmin);
      } catch (e) {
        console.error("Failed to fetch attempts:", e);
      }
    }

    fetchPrizePool();
    fetchRecommendedApps();
    fetchAttempts();
  }, [fid]);

  const practiceClickable = isAdmin || practiceAttempts > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0a0a1a 0%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#fff',
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#00f3ff',
          textShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff44',
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        FarBase Drop
      </h1>

      <p
        style={{
          color: '#666',
          fontSize: '0.8rem',
          marginBottom: '40px',
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}
      >
        Skill-Based Crypto Merge • Base Mainnet
      </p>

      <div
        style={{
          width: '100%',
          maxWidth: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Practice */}
        <div
          onClick={practiceClickable ? onPractice : undefined}
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #00f3ff',
            borderRadius: '16px',
            padding: '20px',
            cursor: practiceClickable ? 'pointer' : 'not-allowed',
            opacity: practiceClickable ? 1 : 0.5,
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (practiceClickable) {
              e.currentTarget.style.boxShadow = '0 0 20px #00f3ff44';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00f3ff' }}>🎮 Practice</span>
            <span
              style={{
                background: practiceClickable ? '#fff' : '#555',
                color: practiceClickable ? '#000' : '#999',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {isAdmin ? "∞" : `${practiceAttempts}/3`}
            </span>
          </div>

          <p style={{ color: '#666', fontSize: '0.75rem', margin: 0 }}>
            {isAdmin
              ? "Admin test • Unlimited attempts"
              : practiceAttempts > 0
                ? "Daily free attempts • No rewards"
                : `Hak bitti • ${practiceResetIn ? `${formatCountdown(practiceResetIn)} sonra yenilenir` : "Yakında yenilenir"}`}
          </p>
        </div>

        {/* Tournament */}
        <div
          onClick={onTournament}
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #ff00ff',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px #ff00ff44';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ff00ff' }}>🏆 Tournament</span>
            <span
              style={{
                background: tournamentAttempts > 0 || isAdmin ? '#fff' : '#555',
                color: tournamentAttempts > 0 || isAdmin ? '#000' : '#999',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {isAdmin ? "∞" : `${tournamentAttempts}/3`}
            </span>
          </div>
          <p style={{ color: '#666', fontSize: '0.75rem', margin: 0 }}>
            1 USDC Entry • Top 5 Win • 3 attempts per entry
          </p>
        </div>

        {/* Leaderboard */}
        <div
          onClick={onLeaderboard}
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #444',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px #44444444';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>📊 Leaderboard</span>
          </div>
          <p style={{ color: '#666', fontSize: '0.75rem', margin: 0 }}>This week&apos;s rankings • Live updates</p>
        </div>

        {/* Prize Pool */}
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #eab308',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#eab308' }}>💰 Prize Pool</span>
          </div>
          <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0' }}>
            ${prizePool} USDC
          </p>
          <p style={{ color: '#666', fontSize: '0.7rem', margin: 0 }}>Weekly distribution • Top 5 winners</p>
        </div>

        {/* Önerilen Uygulamalar */}
        {recommendedApps.length > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #7c3aed',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#7c3aed' }}>✨ Önerilen Uygulamalar</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommendedApps.map((app, i) => (
                <a
                  key={i}
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(124,58,237,0.35)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{app.name}</div>
                  <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 4 }}>{app.description}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
