import { Redis } from "@upstash/redis";

export interface LeaderboardEntry {
  fid: number;
  address: string;
  score: number;
  mergeCount: number;
  highestLevel: number;
  playedAt: number; // timestamp
}

// Hafta sayısı hesaplama
const REFERENCE_WEEK_START = new Date("2025-02-04T14:00:00Z").getTime();

export function getWeekNumber(): number {
  const now = Date.now();
  const diffMs = now - REFERENCE_WEEK_START;
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks + 1;
}

// Upstash Redis client (env'den)
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;

  // Redis.fromEnv() şu env'leri bekler:
  // UPSTASH_REDIS_REST_URL
  // UPSTASH_REDIS_REST_TOKEN
  _redis = Redis.fromEnv();
  return _redis;
}

// Score kaydet
export async function saveScore(
  mode: "practice" | "tournament",
  entry: LeaderboardEntry
): Promise<void> {
  const redis = getRedis();
  const weekNumber = getWeekNumber();
  const key = `${mode}:week:${weekNumber}:${entry.fid}`;

  const existing = await redis.get<LeaderboardEntry>(key);
  if (existing && existing.score >= entry.score) {
    return;
  }

  await redis.set(key, entry);
}

// Belirli mod için bu hafta Top 5
export async function getTop5(
  mode: "practice" | "tournament"
): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  const weekNumber = getWeekNumber();
  const pattern = `${mode}:week:${weekNumber}:*`;

  // ✅ Upstash redis.keys() generic kabul etmez
  const rawKeys = await redis.keys(pattern);

  // keys bazen string[] döner, bazen unknown olabilir → normalize ediyoruz
  const keys: string[] = Array.isArray(rawKeys)
    ? rawKeys.filter((k): k is string => typeof k === "string")
    : [];

  if (keys.length === 0) return [];

  const entries: LeaderboardEntry[] = [];
  for (const key of keys) {
    const entry = await redis.get<LeaderboardEntry>(key);
    if (entry) entries.push(entry);
  }

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, 5);
}

// Cron için — sadece Tournament Top 5
export async function getTop5Tournament(): Promise<LeaderboardEntry[]> {
  return getTop5("tournament");
}

// Belirli bir oyuncunun bu hafta en yüksek skorunu al
export async function getPlayerBestScore(
  mode: "practice" | "tournament",
  fid: number
): Promise<LeaderboardEntry | null> {
  const redis = getRedis();
  const weekNumber = getWeekNumber();
  const key = `${mode}:week:${weekNumber}:${fid}`;

  const entry = await redis.get<LeaderboardEntry>(key);
  return entry || null;
}
