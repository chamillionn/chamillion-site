import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { syncPlatform } from "@/lib/sync/engine";
import { DefiWalletAdapter } from "@/lib/sync/adapters/defi-wallet";

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await syncPlatform(DefiWalletAdapter));
}
