"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStrategy(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategies").insert({
    name: formData.get("name") as string,
    status: formData.get("status") as string,
    description: (formData.get("description") as string) || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updateStrategy(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("strategies")
    .update({
      name: formData.get("name") as string,
      status: formData.get("status") as string,
      description: (formData.get("description") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteStrategy(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategies").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
