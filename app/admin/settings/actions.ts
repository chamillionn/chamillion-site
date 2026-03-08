"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { fetchEurUsdRate, saveCachedRate } from "@/lib/sync/forex";

export async function toggleDemoMode(enabled: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient
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

/** Refresh the EUR/USD rate from ECB and save to site_settings. */
export async function refreshEurUsdRate() {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  try {
    const rate = await fetchEurUsdRate();
    await saveCachedRate(admin.dataClient, rate);
    return { success: true, rate };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al obtener tipo de cambio" };
  }
}
