"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getStripe } from "@/lib/stripe";

export async function updateDisplayName(formData: FormData) {
  const displayName = (formData.get("display_name") as string)?.trim() || null;

  if (displayName && displayName.length > 50) {
    return { error: "Nombre demasiado largo (max 50 caracteres)" };
  }

  // Authenticate via anon client, then write via service role to enforce
  // that only display_name is updated — prevents direct-API role escalation.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/cuenta");
  return { success: true };
}

/**
 * Self-service account deletion (GDPR Art. 17).
 * Cancels Stripe subscription, deletes auth user (cascades to profile).
 */
export async function deleteOwnAccount(confirmEmail: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Require email confirmation to prevent accidental deletion
  if (confirmEmail !== user.email) {
    return { error: "El email no coincide" };
  }

  const service = createServiceClient();

  // Fetch profile to get Stripe IDs
  const { data: profile } = await service
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, role")
    .eq("id", user.id)
    .single();

  // Prevent admin self-deletion
  if (profile?.role === "admin") {
    return { error: "Los administradores no pueden eliminarse a si mismos" };
  }

  // Cancel active Stripe subscription if exists
  if (profile?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      // Subscription may already be canceled — proceed with deletion
    }
  }

  // Delete from auth.users (cascades to profiles via FK)
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  return { success: true };
}
