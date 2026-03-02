import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlatformAdapter, PositionRow } from "@/lib/sync/types";

// Mock Supabase
const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => mockSupabase,
}));

// Import after mocking
const { syncPlatform } = await import("@/lib/sync/engine");

function makeAdapter(overrides?: Partial<PlatformAdapter>): PlatformAdapter {
  return {
    platformName: "TestPlatform",
    fetchPositions: vi.fn().mockResolvedValue({
      positions: [
        { asset: "ETH", size: 1, cost_basis: 2000, current_value: 3000, notes: "" },
      ],
      warnings: [],
    }),
    ...overrides,
  };
}

function chainMock(data: unknown = null, error: unknown = null) {
  const obj: Record<string, unknown> = { data, error };
  obj.select = vi.fn().mockReturnValue(obj);
  obj.eq = vi.fn().mockReturnValue(obj);
  obj.limit = vi.fn().mockReturnValue(obj);
  obj.insert = vi.fn().mockReturnValue(obj);
  obj.update = vi.fn().mockReturnValue(obj);
  obj.delete = vi.fn().mockReturnValue(obj);
  obj.in = vi.fn().mockReturnValue(obj);
  obj.order = vi.fn().mockReturnValue(obj);
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncPlatform", () => {
  it("returns error when platform has no wallet", async () => {
    mockFrom.mockReturnValue(chainMock([{ id: "p1", wallet_address: null }]));
    const result = await syncPlatform(makeAdapter());
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("wallet address");
    expect(result.updated).toBe(0);
  });

  it("returns error when platform not found", async () => {
    mockFrom.mockReturnValue(chainMock([]));
    const result = await syncPlatform(makeAdapter());
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error on fetch timeout", async () => {
    const adapter = makeAdapter({
      fetchPositions: vi.fn().mockRejectedValue(new Error("aborted")),
    });
    // First call: platforms lookup
    const platformChain = chainMock([{ id: "p1", wallet_address: "0x123" }]);
    // Second call: existing positions
    const positionsChain = chainMock([]);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? platformChain : positionsChain;
    });

    const result = await syncPlatform(adapter);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.updated).toBe(0);
  });

  it("reports validation errors but continues", async () => {
    const adapter = makeAdapter({
      fetchPositions: vi.fn().mockResolvedValue({
        positions: [
          { asset: "", size: 1, cost_basis: 100, current_value: 100, notes: "" },
          { asset: "ETH", size: 1, cost_basis: 100, current_value: 200, notes: "" },
        ],
        warnings: [],
      }),
    });

    const platformChain = chainMock([{ id: "p1", wallet_address: "0x123" }]);
    const positionsChain = chainMock([]);
    const upsertChain = chainMock(null, null);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return platformChain;
      if (callCount === 2) return positionsChain;
      return upsertChain;
    });

    const result = await syncPlatform(adapter);
    expect(result.errors.some((e) => e.includes("empty asset"))).toBe(true);
    expect(result.updated).toBe(1); // only ETH succeeded
  });

  it("includes adapter warnings in result", async () => {
    const adapter = makeAdapter({
      fetchPositions: vi.fn().mockResolvedValue({
        positions: [],
        warnings: ["API rate limited"],
      }),
    });

    const platformChain = chainMock([{ id: "p1", wallet_address: "0x123" }]);
    const positionsChain = chainMock([]);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? platformChain : positionsChain;
    });

    const result = await syncPlatform(adapter);
    expect(result.errors).toContain("API rate limited");
  });

  it("sets platform name and timestamp", async () => {
    mockFrom.mockReturnValue(chainMock([]));
    const result = await syncPlatform(makeAdapter());
    expect(result.platform).toBe("TestPlatform");
    expect(result.timestamp).toBeTruthy();
  });
});
