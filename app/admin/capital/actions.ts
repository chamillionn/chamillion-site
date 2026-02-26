"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createCapitalFlow(formData: FormData) {
  const supabase = await createClient();

  const quantity = formData.get("quantity") as string;
  const pricePerUnit = formData.get("price_per_unit") as string;

  const { error } = await (supabase.from("capital_flows") as any).insert({
    date: (formData.get("date") as string) || new Date().toISOString(),
    type: formData.get("type") as string,
    amount_eur: Number(formData.get("amount_eur")),
    asset: (formData.get("asset") as string) || null,
    quantity: quantity ? Number(quantity) : null,
    price_per_unit: pricePerUnit ? Number(pricePerUnit) : null,
    exchange: (formData.get("exchange") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteCapitalFlow(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("capital_flows") as any).delete().eq("id", id);

  if (error) return { error: (error as any).message };

  revalidatePath("/admin");
  return { success: true };
}
