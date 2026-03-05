import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for the authenticated user.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No tienes una suscripcion asociada" },
      { status: 400 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/cuenta`,
  });

  return NextResponse.json({ url: session.url });
}
