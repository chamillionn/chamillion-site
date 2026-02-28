"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function setUserRole(id: string, role: "free" | "member" | "admin") {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  // Requires service role to delete from auth.users
  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(id);

  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
  return { success: true };
}
