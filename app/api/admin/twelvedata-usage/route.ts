import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { getTwelveUsage, isTwelveBlocked } from "@/lib/twelvedata-usage";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await getTwelveUsage(true);
  const block = isTwelveBlocked();

  if (!usage) {
    return NextResponse.json({
      available: false,
      block,
    });
  }

  return NextResponse.json({
    available: true,
    usage,
    block,
  });
}
