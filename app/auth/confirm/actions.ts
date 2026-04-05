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

/** Create a pending login entry for cross-device polling. Returns the row id. */
export async function createPendingLogin(email: string): Promise<string> {
  const service = createServiceClient();

  // Clean up expired rows
  await service
    .from("pending_logins")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await service
    .from("pending_logins")
    .insert({ email })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create pending login");
  return data.id;
}

/**
 * After OTP verification on any device, generate a transfer token so the
 * original device (the one that requested the magic link) can authenticate too.
 * Uses admin.generateLink to create a single-use token for the original device.
 */
export async function completeTransfer(email: string) {
  const service = createServiceClient();

  // Find the most recent non-verified pending login for this email
  const { data: pending } = await service
    .from("pending_logins")
    .select("id")
    .eq("email", email)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!pending) return;

  // Generate a new magic link token for the original device
  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData?.properties?.hashed_token) return;

  await service
    .from("pending_logins")
    .update({
      token_hash: linkData.properties.hashed_token,
      verified_at: new Date().toISOString(),
    })
    .eq("id", pending.id);
}
