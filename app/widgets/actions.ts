"use server";

import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleWidgetPremium(slug: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");

  const supabase = createServiceClient();

  // Read current premium slugs
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_widgets")
    .single();

  const current: string[] = Array.isArray(data?.value) ? (data.value as string[]) : [];

  // Toggle
  const updated = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];

  await supabase.from("site_settings").upsert(
    { key: "premium_widgets", value: updated, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  revalidatePath("/widgets");
}
