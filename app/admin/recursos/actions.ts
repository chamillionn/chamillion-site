"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function toggleKronosEnabled(enabled: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient
    .from("site_settings")
    .upsert(
      { key: "kronos_enabled", value: enabled, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  if (error) return { error: error.message };

  revalidatePath("/admin/recursos");
  revalidatePath("/kronos");
  return { success: true };
}
