import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy-initialized Stripe client (avoids build-time crash when env var is missing). */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Fetch active prices for the membership product.
 * Returns prices sorted by unit_amount (cheapest first).
 */
export async function getActivePrices(): Promise<Stripe.Price[]> {
  const prices = await getStripe().prices.list({
    product: process.env.STRIPE_PRODUCT_ID!,
    active: true,
  });

  return prices.data.sort(
    (a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0),
  );
}

/**
 * Get or create a Stripe customer linked to a Supabase user.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  existingCustomerId: string | null,
): Promise<string> {
  if (existingCustomerId) {
    try {
      await getStripe().customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch {
      // Customer deleted in Stripe — create new one
    }
  }

  const customer = await getStripe().customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}
