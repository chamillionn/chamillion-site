"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createStrategy(formData: FormData) {
  const supabase = await createClient();

  const { error } = await (supabase.from("strategies") as any).insert({
    name: formData.get("name") as string,
    status: formData.get("status") as string,
    description: (formData.get("description") as string) || null,
  });

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updateStrategy(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await (supabase.from("strategies") as any)
    .update({
      name: formData.get("name") as string,
      status: formData.get("status") as string,
      description: (formData.get("description") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteStrategy(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("strategies") as any).delete().eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}
