import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Stripe constructor — must be a class for `new Stripe()` to work
const mockPricesList = vi.fn();
const mockProductsRetrieve = vi.fn();
const mockCustomersRetrieve = vi.fn();
const mockCustomersCreate = vi.fn();

vi.mock("stripe", () => ({
  default: class MockStripe {
    prices = { list: mockPricesList };
    products = { retrieve: mockProductsRetrieve };
    customers = {
      retrieve: mockCustomersRetrieve,
      create: mockCustomersCreate,
    };
  },
}));

const { getActivePrices, getOrCreateCustomer } = await import("@/lib/stripe");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getActivePrices", () => {
  it("returns sorted prices from multiple products", async () => {
    process.env.STRIPE_PRODUCT_IDS = "prod_1,prod_2";

    mockPricesList
      .mockResolvedValueOnce({ data: [{ id: "price_a", unit_amount: 4900 }] })
      .mockResolvedValueOnce({ data: [{ id: "price_b", unit_amount: 900 }] });

    mockProductsRetrieve
      .mockResolvedValueOnce({ name: "Análisis" })
      .mockResolvedValueOnce({ name: "Lector" });

    const prices = await getActivePrices();
    expect(prices).toHaveLength(2);
    // Sorted by unit_amount ascending
    expect(prices[0].product_name).toBe("Lector");
    expect(prices[1].product_name).toBe("Análisis");
  });

  it("returns empty array when no product IDs configured", async () => {
    process.env.STRIPE_PRODUCT_IDS = "";
    const prices = await getActivePrices();
    expect(prices).toEqual([]);
  });

  it("propagates Stripe API errors", async () => {
    process.env.STRIPE_PRODUCT_IDS = "prod_bad";
    mockPricesList.mockRejectedValue(new Error("No such product"));
    mockProductsRetrieve.mockRejectedValue(new Error("No such product"));
    await expect(getActivePrices()).rejects.toThrow("No such product");
  });
});

describe("getOrCreateCustomer", () => {
  it("returns existing customer ID if valid", async () => {
    mockCustomersRetrieve.mockResolvedValue({ id: "cus_123" });
    const id = await getOrCreateCustomer("user1", "a@b.com", "cus_123");
    expect(id).toBe("cus_123");
    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it("creates new customer if existing ID is invalid", async () => {
    mockCustomersRetrieve.mockRejectedValue(new Error("No such customer"));
    mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
    const id = await getOrCreateCustomer("user1", "a@b.com", "cus_bad");
    expect(id).toBe("cus_new");
  });

  it("creates new customer when no existing ID", async () => {
    mockCustomersCreate.mockResolvedValue({ id: "cus_fresh" });
    const id = await getOrCreateCustomer("user1", "a@b.com", null);
    expect(id).toBe("cus_fresh");
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "a@b.com",
      metadata: { supabase_user_id: "user1" },
    });
  });
});
