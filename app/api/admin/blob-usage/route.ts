import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { getBlobStats } from "@/lib/vercel-blob-stats";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getBlobStats();
  return NextResponse.json(stats);
}
