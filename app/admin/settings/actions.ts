"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function toggleDemoMode(enabled: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const { error } = await admin.supabase
    .from("site_settings")
    .update({ value: enabled, updated_at: new Date().toISOString() })
    .eq("key", "demo_mode");

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
