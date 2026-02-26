"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function requireNumber(fd: FormData, key: string): number {
  const n = Number(fd.get(key));
  if (!Number.isFinite(n)) throw new Error(`${key} debe ser un número válido`);
  return n;
}

export async function createPosition(formData: FormData) {
  try {
    const size = requireNumber(formData, "size");
    const cost_basis = requireNumber(formData, "cost_basis");
    const current_value = requireNumber(formData, "current_value");

    const supabase = await createClient();
    const { error } = await supabase.from("positions").insert({
      asset: formData.get("asset") as string,
      size,
      cost_basis,
      current_value,
      platform_id: (formData.get("platform_id") as string) || null,
      strategy_id: (formData.get("strategy_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
      is_active: true,
      opened_at: (formData.get("opened_at") as string) || new Date().toISOString(),
    });

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updatePosition(id: string, formData: FormData) {
  try {
    const size = requireNumber(formData, "size");
    const cost_basis = requireNumber(formData, "cost_basis");
    const current_value = requireNumber(formData, "current_value");

    const supabase = await createClient();
    const { error } = await supabase
      .from("positions")
      .update({
        asset: formData.get("asset") as string,
        size,
        cost_basis,
        current_value,
        platform_id: (formData.get("platform_id") as string) || null,
        strategy_id: (formData.get("strategy_id") as string) || null,
        notes: (formData.get("notes") as string) || null,
        opened_at: (formData.get("opened_at") as string) || undefined,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function closePosition(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function reopenPosition(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .update({ is_active: true, closed_at: null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deletePosition(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("positions").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
