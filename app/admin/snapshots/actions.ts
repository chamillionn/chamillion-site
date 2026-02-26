"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteSnapshot(id: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from("snapshots") as ReturnType<typeof supabase.from>)
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}
