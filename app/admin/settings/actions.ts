"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function toggleDemoMode(enabled: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const { error } = await admin.supabase
    .from("site_settings")
    .upsert(
      { key: "demo_mode", value: enabled, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
