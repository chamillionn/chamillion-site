"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { KNOWN_PLATFORMS } from "@/lib/platforms/presets";

export async function createPlatformFromPreset(slug: string, walletAddress: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const preset = KNOWN_PLATFORMS.find((p) => p.slug === slug);
  if (!preset) return { error: "Plataforma desconocida" };

  const wallet = walletAddress || preset.autoWallet?.() || null;

  const { error } = await admin.dataClient.from("platforms").insert({
    name: preset.name,
    type: preset.type,
    url: preset.url,
    wallet_address: wallet,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updatePlatformWallet(id: string, walletAddress: string | null) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient
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
  if (admin.isRemote) return { error: "Modo lectura" };

  // Delete associated positions first (FK has no CASCADE)
  const { error: posErr } = await admin.dataClient
    .from("positions")
    .delete()
    .eq("platform_id", id);

  if (posErr) return { error: posErr.message };

  const { error } = await admin.dataClient.from("platforms").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
