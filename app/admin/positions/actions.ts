"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createPosition(formData: FormData) {
  const supabase = await createClient();

  const { error } = await (supabase.from("positions") as any).insert({
    asset: formData.get("asset") as string,
    size: Number(formData.get("size")),
    cost_basis: Number(formData.get("cost_basis")),
    current_value: Number(formData.get("current_value")),
    platform_id: (formData.get("platform_id") as string) || null,
    strategy_id: (formData.get("strategy_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
    is_active: true,
    opened_at: (formData.get("opened_at") as string) || new Date().toISOString(),
  });

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updatePosition(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await (supabase.from("positions") as any)
    .update({
      asset: formData.get("asset") as string,
      size: Number(formData.get("size")),
      cost_basis: Number(formData.get("cost_basis")),
      current_value: Number(formData.get("current_value")),
      platform_id: (formData.get("platform_id") as string) || null,
      strategy_id: (formData.get("strategy_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
      opened_at: (formData.get("opened_at") as string) || undefined,
    })
    .eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function closePosition(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("positions") as any)
    .update({
      is_active: false,
      closed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function reopenPosition(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("positions") as any)
    .update({
      is_active: true,
      closed_at: null,
    })
    .eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deletePosition(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("positions") as any).delete().eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}
