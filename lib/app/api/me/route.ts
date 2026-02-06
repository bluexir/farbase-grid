import { NextResponse } from "next/server";
import { requireQuickAuthUser, isInvalidTokenError } from "@/lib/quick-auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireQuickAuthUser(request);
    return NextResponse.json({ fid: user.fid }, { status: 200 });
  } catch (e) {
    if (isInvalidTokenError(e)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("ME error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
