import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getActivePrices
const mockGetActivePrices = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getActivePrices: mockGetActivePrices,
}));

const { GET } = await import("@/app/api/stripe/prices/route");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/stripe/prices", () => {
  it("returns formatted prices", async () => {
    mockGetActivePrices.mockResolvedValue([
      {
        id: "price_1",
        product_name: "Lector",
        unit_amount: 900,
        currency: "eur",
        recurring: { interval: "month", interval_count: 1 },
      },
      {
        id: "price_2",
        product_name: "Análisis",
        unit_amount: 4900,
        currency: "eur",
        recurring: { interval: "month", interval_count: 1 },
      },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: "price_1",
      name: "Lector",
      unitAmount: 900,
      currency: "eur",
      interval: "month",
      intervalCount: 1,
    });
  });

  it("returns 500 on Stripe error", async () => {
    mockGetActivePrices.mockRejectedValue(new Error("Stripe down"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Stripe down");
  });

  it("returns empty array when no products", async () => {
    mockGetActivePrices.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});
