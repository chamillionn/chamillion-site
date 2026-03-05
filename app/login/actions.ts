"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Creates a profile for the authenticated user if one doesn't exist.
 * Uses the service role client to enforce role = "free" server-side,
 * preventing any client-side attempt to self-assign a higher role.
 */
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
