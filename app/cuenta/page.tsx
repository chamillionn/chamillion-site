import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import CuentaClient from "./cuenta-client";

export const metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const ctx = await requireUser();
  if (!ctx) redirect("/login?next=/cuenta");

  return (
    <CuentaClient
      email={ctx.profile.email}
      displayName={ctx.profile.display_name}
      role={ctx.profile.role}
      subscriptionStatus={ctx.profile.subscription_status}
      stripeCustomerId={ctx.profile.stripe_customer_id}
    />
  );
}
