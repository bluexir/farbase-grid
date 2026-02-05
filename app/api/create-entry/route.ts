import { NextRequest, NextResponse } from "next/server";
import { createNewEntry } from "@/lib/attempts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, address, mode } = body;

    if (!fid || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (mode !== "practice" && mode !== "tournament") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Yeni entry oluştur (3 deneme hakkı ver)
    const entryId = await createNewEntry(fid, address || "", mode);

    return NextResponse.json({ 
      success: true, 
      entryId,
      attemptsRemaining: 3 
    });
  } catch (error) {
    console.error("Create entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
