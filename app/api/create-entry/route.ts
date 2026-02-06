import { NextRequest, NextResponse } from "next/server";
import { requireQuickAuthUser, isInvalidTokenError } from "@/lib/quick-auth-server";
import { createNewEntry } from "@/lib/attempts";

function isAdmin(fid: number): boolean {
  const adminFid = Number(process.env.ADMIN_FID || "0");
  return adminFid > 0 && fid === adminFid;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireQuickAuthUser(req);
    const fid = user.fid;

    const body = await req.json();
    const { address, mode } = body as {
      address?: string;
      mode?: "practice" | "tournament";
    };

    if (!mode) {
      return NextResponse.json({ error: "Missing required field: mode" }, { status: 400 });
    }
    if (mode !== "practice" && mode !== "tournament") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Admin test: tournament entry oluşturmadan da oynayabilir ama tutarlılık için yine de entry açabilir.
    if (mode === "tournament") {
      const entryId = await createNewEntry(fid, address || "", "tournament");
      return NextResponse.json({
        success: true,
        mode,
        entryId,
        attemptsRemaining: isAdmin(fid) ? 999 : 3,
      });
    }

    // practice için entry mantığı yok: günlük counter ile yönetiyoruz
    return NextResponse.json({
      success: true,
      mode,
      attemptsRemaining: isAdmin(fid) ? 999 : 3,
    });
  } catch (e) {
    if (isInvalidTokenError(e)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("create-entry error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
