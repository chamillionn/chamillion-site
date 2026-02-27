"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { KNOWN_PLATFORMS } from "@/lib/platforms/presets";

export async function createPlatformFromPreset(slug: string, walletAddress: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const preset = KNOWN_PLATFORMS.find((p) => p.slug === slug);
  if (!preset) return { error: "Plataforma desconocida" };

  const { error } = await admin.supabase.from("platforms").insert({
    name: preset.name,
    type: preset.type,
    url: preset.url,
    wallet_address: walletAddress,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updatePlatformWallet(id: string, walletAddress: string | null) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const { error } = await admin.supabase
    .from("platforms")
    .update({ wallet_address: walletAddress })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deletePlatform(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const { error } = await admin.supabase.from("platforms").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
