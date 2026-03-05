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
 * Fetch active prices for all membership products.
 * Returns prices sorted by unit_amount (cheapest first), with product name.
 */
export async function getActivePrices(): Promise<
  (Stripe.Price & { product_name: string })[]
> {
  const productIds = (process.env.STRIPE_PRODUCT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const results = await Promise.all(
    productIds.map(async (productId) => {
      const [prices, product] = await Promise.all([
        getStripe().prices.list({ product: productId, active: true }),
        getStripe().products.retrieve(productId),
      ]);
      const defaultPriceId = typeof product.default_price === "string"
        ? product.default_price
        : product.default_price?.id;
      // If a default price is set, only return that one
      const filtered = defaultPriceId
        ? prices.data.filter((p) => p.id === defaultPriceId)
        : prices.data;
      return (filtered.length > 0 ? filtered : prices.data).map((p) => ({
        ...p,
        product_name: product.name,
      }));
    }),
  );

  return results.flat().sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0));
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
