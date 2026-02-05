import { kv } from "@vercel/kv";

/**
 * Attempt tracking sistemi
 * Her 1 USDC ödeme = 3 deneme hakkı
 * Entry bazlı takip (günlük değil)
 */

interface AttemptEntry {
  fid: number;
  address: string;
  entryTimestamp: number;
  attemptsUsed: number; // 0-3 arası
  mode: "practice" | "tournament";
}

/**
 * Yeni entry oluştur (1 USDC ödendi, 3 deneme hakkı verildi)
 */
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
  
  await kv.set(entryId, entry);
  
  // Aktif entry olarak işaretle
  await kv.set(`${mode}:active:${fid}`, entryId);
  
  return entryId;
}

/**
 * Aktif entry'deki kalan deneme hakkını getir
 */
export async function getRemainingAttempts(
  fid: number,
  mode: "practice" | "tournament"
): Promise<number> {
  const activeEntryId = await kv.get<string>(`${mode}:active:${fid}`);
  
  if (!activeEntryId) {
    return 0; // Hiç entry yok
  }
  
  const entry = await kv.get<AttemptEntry>(activeEntryId);
  
  if (!entry) {
    return 0; // Entry bulunamadı
  }
  
  const remaining = 3 - entry.attemptsUsed;
  return Math.max(0, remaining);
}

/**
 * Bir deneme hakkı kullan
 */
export async function useAttempt(
  fid: number,
  mode: "practice" | "tournament"
): Promise<boolean> {
  const activeEntryId = await kv.get<string>(`${mode}:active:${fid}`);
  
  if (!activeEntryId) {
    return false; // Aktif entry yok
  }
  
  const entry = await kv.get<AttemptEntry>(activeEntryId);
  
  if (!entry || entry.attemptsUsed >= 3) {
    return false; // Entry yok veya tüm denemeler bitti
  }
  
  // Deneme sayısını artır
  entry.attemptsUsed += 1;
  await kv.set(activeEntryId, entry);
  
  // Eğer tüm denemeler bittiyse aktif entry'yi sil
  if (entry.attemptsUsed >= 3) {
    await kv.del(`${mode}:active:${fid}`);
  }
  
  return true;
}

/**
 * Aktif entry var mı kontrol et
 */
export async function hasActiveEntry(
  fid: number,
  mode: "practice" | "tournament"
): Promise<boolean> {
  const remaining = await getRemainingAttempts(fid, mode);
  return remaining > 0;
}

/**
 * Toplam kaç entry yapılmış (istatistik için)
 */
export async function getTotalEntries(
  fid: number,
  mode: "practice" | "tournament"
): Promise<number> {
  const pattern = `${mode}:entry:${fid}:*`;
  const keys = await kv.keys(pattern);
  return keys.length;
}
