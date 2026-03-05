"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function togglePostPremium(id: string, premium: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient
    .from("posts")
    .update({ premium })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  return { success: true };
}

export async function togglePostPublished(id: string, published: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.dataClient
    .from("posts")
    .update({ published })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  return { success: true };
}
