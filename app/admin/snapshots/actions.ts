"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { getSnapshotsPaged, getSnapshotPositions } from "@/lib/supabase/queries";
import type { SnapshotSummary, SnapshotPosition } from "@/lib/supabase/types";

export async function loadSnapshotsPage(
  offset: number,
  limit: number,
): Promise<{ rows: SnapshotSummary[]; total: number; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { rows: [], total: 0, error: "Unauthorized" };
  const safeLimit = Math.min(Math.max(limit, 1), 1000);
  const safeOffset = Math.max(offset, 0);
  return getSnapshotsPaged(safeOffset, safeLimit, admin.dataClient);
}

export async function loadSnapshotPositions(
  id: string,
): Promise<{ positions: SnapshotPosition[]; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { positions: [], error: "Unauthorized" };
  const positions = await getSnapshotPositions(id, admin.dataClient);
  return { positions };
}

export async function deleteSnapshots(ids: string[]) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient.from("snapshots").delete().in("id", ids);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, count: ids.length };
}

export async function deleteSnapshot(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient.from("snapshots").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
