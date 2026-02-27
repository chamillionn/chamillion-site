"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDisplayName(formData: FormData) {
  const displayName = (formData.get("display_name") as string)?.trim() || null;

  if (displayName && displayName.length > 50) {
    return { error: "Nombre demasiado largo (max 50 caracteres)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/cuenta");
  return { success: true };
}
