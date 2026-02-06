import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface AttemptEntry {
  fid: number;
  address: string;
  entryTimestamp: number;
  attemptsUsed: number;
  mode: "practice" | "tournament";
}

function isAdmin(fid: number): boolean {
  const adminFid = Number(process.env.ADMIN_FID || "0");
  return adminFid > 0 && fid === adminFid;
}

export async function createNewEntry(
  fid: number,
  address: string,
  mode: "practice" | "tournament"
): Promise<string> {
  // Admin test: entry oluşturmak zorunda değil ama tutarlılık için yine de oluşturabiliriz.
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

export async function getRemainingAttemptsTournament(fid: number): Promise<number> {
  if (isAdmin(fid)) return 999;

  const activeEntryId = await redis.get<string>(`tournament:active:${fid}`);
  if (!activeEntryId) return 0;

  const entryStr = await redis.get<string>(activeEntryId);
  if (!entryStr) return 0;

  const entry = typeof entryStr === "string" ? JSON.parse(entryStr) : entryStr;
  const remaining = 3 - Number(entry.attemptsUsed || 0);
  return Math.max(0, remaining);
}

export async function useTournamentAttempt(fid: number): Promise<boolean> {
  if (isAdmin(fid)) return true;

  const activeEntryId = await redis.get<string>(`tournament:active:${fid}`);
  if (!activeEntryId) return false;

  const entryStr = await redis.get<string>(activeEntryId);
  if (!entryStr) return false;

  const entry = typeof entryStr === "string" ? JSON.parse(entryStr) : entryStr;

  const used = Number(entry.attemptsUsed || 0);
  if (used >= 3) return false;

  entry.attemptsUsed = used + 1;
  await redis.set(activeEntryId, JSON.stringify(entry));

  if (entry.attemptsUsed >= 3) {
    await redis.del(`tournament:active:${fid}`);
  }

  return true;
}
