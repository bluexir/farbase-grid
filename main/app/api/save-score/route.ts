import { NextRequest, NextResponse } from "next/server";
import { saveScore } from "@/leaderboard";
import { useAttempt } from "@/lib/attempts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, address, score, mergeCount, highestLevel, mode } = body;

    if (!fid || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Attempt kullan (deneme hakkı azalt)
    const attemptUsed = await useAttempt(fid, mode);
    
    if (!attemptUsed) {
      return NextResponse.json({ error: "No attempts remaining" }, { status: 403 });
    }

    // Score kaydet
    await saveScore(mode, {
      fid,
      address: address || "",
      score,
      mergeCount,
      highestLevel,
      playedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
