import { NextRequest, NextResponse } from "next/server";
import { getStripe, getOrCreateCustomer, getActivePrices } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Check current role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  if (profile.role === "member" || profile.role === "admin") {
    return NextResponse.json(
      { error: "Ya tienes una suscripcion activa" },
      { status: 400 },
    );
  }

  // Parse priceId from body
  const { priceId } = await req.json();
  if (!priceId || typeof priceId !== "string") {
    return NextResponse.json({ error: "priceId requerido" }, { status: 400 });
  }

  // Validate priceId against configured products — prevents use of arbitrary Stripe prices
  const activePrices = await getActivePrices();
  const allowedPriceIds = new Set(activePrices.map((p) => p.id));
  if (!allowedPriceIds.has(priceId)) {
    return NextResponse.json({ error: "Precio no válido" }, { status: 400 });
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateCustomer(
    user.id,
    user.email ?? "",
    profile.stripe_customer_id,
  );

  // Save stripe_customer_id if new
  if (customerId !== profile.stripe_customer_id) {
    const service = createServiceClient();
    const { error: updateErr } = await service
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
    if (updateErr) {
      console.error("[stripe-checkout] Failed to save customer ID:", updateErr.message);
    }
  }

  // Create Checkout Session
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/cuenta?checkout=success`,
      cancel_url: `${origin}/cuenta?checkout=cancel`,
      locale: "es",
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[stripe-checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
