"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function togglePostPremium(id: string, premium: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const { error } = await admin.supabase
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

  const { error } = await admin.supabase
    .from("posts")
    .update({ published })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  return { success: true };
}
