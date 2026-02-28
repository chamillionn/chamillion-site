import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Stripe webhook handler.
 * Verifies signature, syncs subscription state → profiles table.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        await supabase
          .from("profiles")
          .update({
            role: "member",
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            subscription_status: "active",
            subscribed_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        // Find profile by stripe_customer_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) break;

        // Never degrade admins
        if (profile.role === "admin") {
          await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              stripe_subscription_id: subscription.id,
            })
            .eq("id", profile.id);
          break;
        }

        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        await supabase
          .from("profiles")
          .update({
            role: isActive ? "member" : "free",
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", profile.id);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) break;

        // Never degrade admins
        if (profile.role === "admin") {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "canceled",
              stripe_subscription_id: null,
            })
            .eq("id", profile.id);
          break;
        }

        await supabase
          .from("profiles")
          .update({
            role: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", profile.id);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        // Mark as past_due but keep member access
        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] Error processing event:", err);
  }

  // Always return 200 to prevent Stripe retries
  return NextResponse.json({ received: true });
}
