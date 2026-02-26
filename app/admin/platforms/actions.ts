"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { KNOWN_PLATFORMS } from "@/lib/platforms/presets";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createPlatformFromPreset(slug: string, walletAddress: string) {
  const preset = KNOWN_PLATFORMS.find((p) => p.slug === slug);
  if (!preset) return { error: "Plataforma desconocida" };

  const supabase = await createClient();

  const { error } = await (supabase.from("platforms") as any).insert({
    name: preset.name,
    type: preset.type,
    url: preset.url,
    wallet_address: walletAddress,
  });

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updatePlatformWallet(id: string, walletAddress: string | null) {
  const supabase = await createClient();

  const { error } = await (supabase.from("platforms") as any)
    .update({ wallet_address: walletAddress })
    .eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deletePlatform(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("platforms") as any).delete().eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}
