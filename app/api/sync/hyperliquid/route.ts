import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { syncPlatform } from "@/lib/sync/engine";
import { HyperliquidAdapter } from "@/lib/sync/adapters/hyperliquid";

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await syncPlatform(HyperliquidAdapter));
}
