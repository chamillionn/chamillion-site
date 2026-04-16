import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * GET /api/admin/modal-usage
 * Runs `modal billing report --for "this month" --json` and returns the result.
 * Admin-only.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stdout } = await execAsync(
      'modal billing report --for "this month" --json',
      { timeout: 15_000 },
    );

    const items = JSON.parse(stdout) as {
      "Object ID": string;
      Description: string;
      "Interval Start": string;
      Cost: string;
    }[];

    const totalCost = items.reduce((sum, item) => sum + parseFloat(item.Cost), 0);

    return NextResponse.json({
      items,
      totalCost: totalCost.toFixed(4),
      creditLimit: 30,
      usedPct: ((totalCost / 30) * 100).toFixed(1),
      period: "this month",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch Modal usage" },
      { status: 500 },
    );
  }
}
