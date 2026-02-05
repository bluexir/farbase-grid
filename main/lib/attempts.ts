import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

/**
 * Attempt tracking sistemi
 * Her 1 USDC ödeme = 3 deneme hakkı
 * Entry bazlı takip
 */

interface AttemptEntry {
  fid: number;
  address: string;
  entryTimestamp: number;
  attemptsUsed: number;
  mode: "practice" | "tournament";
}

export async function createNewEntry(
  fid: number,
  address: string,
  mode: "practice" | "tournament"
): Promise<string> {
  const entryId = `${mode}:entry:${fid}:${Date.now()}`;
  const entry: AttemptEntry = {
    fid,
    address,
    entryTimestamp: Date.now(),
    attemptsUsed: 0,
    mode,
  };
  
  await redis.set(entryId, JSON.stringify(entry));
  await redis.set(`${mode}:active:${fid}`, entryId);
  
  return entryId;
}

export async function getRemainingAttempts(
  fid: number,
  mode: "practice" | "tournament"
): Promise<number> {
  const activeEntryId = await redis.get<string>(`${mode}:active:${fid}`);
  
  if (!activeEntryId) {
    return 0;
  }
  
  const entryStr = await redis.get<string>(activeEntryId);
  
  if (!entryStr) {
    return 0;
  }
  
  const entry = typeof entryStr === 'string' ? JSON.parse(entryStr) : entryStr;
  const remaining = 3 - entry.attemptsUsed;
  return Math.max(0, remaining);
}

export async function useAttempt(
  fid: number,
  mode: "practice" | "tournament"
): Promise<boolean> {
  const activeEntryId = await redis.get<string>(`${mode}:active:${fid}`);
  
  if (!activeEntryId) {
    return false;
  }
  
  const entryStr = await redis.get<string>(activeEntryId);
  
  if (!entryStr) {
    return false;
  }
  
  const entry = typeof entryStr === 'string' ? JSON.parse(entryStr) : entryStr;
  
  if (entry.attemptsUsed >= 3) {
    return false;
  }
  
  entry.attemptsUsed += 1;
  await redis.set(activeEntryId, JSON.stringify(entry));
  
  if (entry.attemptsUsed >= 3) {
    await redis.del(`${mode}:active:${fid}`);
  }
  
  return true;
}

export async function hasActiveEntry(
  fid: number,
  mode: "practice" | "tournament"
): Promise<boolean> {
  const remaining = await getRemainingAttempts(fid, mode);
  return remaining > 0;
}

export async function getTotalEntries(
  fid: number,
  mode: "practice" | "tournament"
): Promise<number> {
  const pattern = `${mode}:entry:${fid}:*`;
  const keys = await redis.keys(pattern);
  return keys.length;
}
