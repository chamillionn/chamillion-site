"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

/** Ensure a profile row exists for the authenticated user (fallback if DB trigger hasn't run) */
export async function ensureProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const service = createServiceClient();
    await service.from("profiles").insert({
      id: user.id,
      email: user.email!,
      role: "free",
    });
  }
}
