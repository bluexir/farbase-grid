import { NextRequest, NextResponse } from "next/server";
import { getRemainingAttempts } from "@/lib/attempts";
import { kv } from "@vercel/kv";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");
    const mode = searchParams.get("mode");

    if (!fid || !mode) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (mode !== "practice" && mode !== "tournament") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    let remaining = 0;

    if (mode === "practice") {
      // Practice: Günlük 3 deneme
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const dailyKey = `practice:daily:${fid}:${today}`;
      
      const used = await kv.get<number>(dailyKey) || 0;
      remaining = Math.max(0, 3 - used);
    } else {
      // Tournament: Entry bazlı takip
      remaining = await getRemainingAttempts(parseInt(fid), mode);
    }

    return NextResponse.json({ 
      remaining,
      mode 
    });
  } catch (error) {
    console.error("Remaining attempts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
