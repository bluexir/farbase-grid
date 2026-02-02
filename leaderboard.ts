

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

// Vercel KV key formatları:
// tournament:week:{weekNumber}:{fid} → LeaderboardEntry
// practice:week:{weekNumber}:{fid}  → LeaderboardEntry

async function getKV() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

// Score kaydet
export async function saveScore(
  mode: "practice" | "tournament",
  entry: LeaderboardEntry
): Promise<void> {
  const kv = await getKV();
  const weekNumber = getWeekNumber();
  const key = `${mode}:week:${weekNumber}:${entry.fid}`;

  // Mevcut score kontrolü — sadece daha yüksek score kaydet
  const existing = await kv.get<LeaderboardEntry>(key);
  if (existing && existing.score >= entry.score) {
    return; // Mevcut score daha yüksek, kaydetme
  }

  await kv.set(key, entry);
}

// Belirli mod için bu hafta Top 5
export async function getTop5(
  mode: "practice" | "tournament"
): Promise<LeaderboardEntry[]> {
  const kv = await getKV();
  const weekNumber = getWeekNumber();
  const pattern = `${mode}:week:${weekNumber}:*`;

  const keys = await kv.keys(pattern);
  if (keys.length === 0) return [];

  const entries: LeaderboardEntry[] = [];
  for (const key of keys) {
    const entry = await kv.get<LeaderboardEntry>(key);
    if (entry) entries.push(entry);
  }

  // Score göre azalan sıra, Top 5
  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, 5);
}

// Cron için — sadece Tournament Top 5 (address ile)
export async function getTop5Tournament(): Promise<LeaderboardEntry[]> {
  return getTop5("tournament");
}

// Belirli bir oyuncu'nun bu hafta en yüksek scorunu al
export async function getPlayerBestScore(
  mode: "practice" | "tournament",
  fid: number
): Promise<LeaderboardEntry | null> {
  const kv = await getKV();
  const weekNumber = getWeekNumber();
  const key = `${mode}:week:${weekNumber}:${fid}`;

  const entry = await kv.get<LeaderboardEntry>(key);
  return entry || null;
}
