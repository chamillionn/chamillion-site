"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function createStrategy(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "El nombre es obligatorio" };

  const { error } = await admin.supabase.from("strategies").insert({
    name,
    status: formData.get("status") as string,
    description: (formData.get("description") as string) || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updateStrategy(id: string, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "El nombre es obligatorio" };

  const { error } = await admin.supabase
    .from("strategies")
    .update({
      name,
      status: formData.get("status") as string,
      description: (formData.get("description") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteStrategy(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.supabase.from("strategies").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
