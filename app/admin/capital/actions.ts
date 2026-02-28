"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import type { CapitalFlowType } from "@/lib/supabase/types";

const VALID_FLOW_TYPES: CapitalFlowType[] = ["buy", "sell", "deposit_fiat", "withdraw_fiat"];

function safeNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function createCapitalFlow(formData: FormData) {
  const type = formData.get("type") as string;
  if (!VALID_FLOW_TYPES.includes(type as CapitalFlowType)) {
    return { error: `Tipo inválido: ${type}` };
  }

  const amount_eur = Number(formData.get("amount_eur"));
  if (!Number.isFinite(amount_eur) || amount_eur === 0) {
    return { error: "amount_eur debe ser un número válido y distinto de 0" };
  }

  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.supabase.from("capital_flows").insert({
    date: (formData.get("date") as string) || new Date().toISOString(),
    type: type as CapitalFlowType,
    amount_eur,
    asset: (formData.get("asset") as string) || null,
    quantity: safeNumber(formData.get("quantity") as string),
    price_per_unit: safeNumber(formData.get("price_per_unit") as string),
    exchange: (formData.get("exchange") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteCapitalFlow(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { error } = await admin.supabase.from("capital_flows").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
