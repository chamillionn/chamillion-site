import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => mockSupabase,
}));

const { captureSnapshot } = await import("@/lib/sync/snapshot");

function chainMock(data: unknown = null, error: unknown = null) {
  const obj: Record<string, unknown> = { data, error };
  obj.select = vi.fn().mockReturnValue(obj);
  obj.single = vi.fn().mockReturnValue(obj);
  obj.order = vi.fn().mockReturnValue(obj);
  obj.upsert = vi.fn().mockReturnValue(obj);
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("captureSnapshot", () => {
  it("returns captured: false when summary query fails", async () => {
    mockFrom.mockReturnValue(chainMock(null, { message: "DB error" }));
    const result = await captureSnapshot();
    expect(result.captured).toBe(false);
    expect(result.error).toContain("DB error");
  });

  it("returns captured: false when no positions", async () => {
    const summaryChain = chainMock({
      total_positions: 0,
      total_value: null,
      total_cost: 0,
    });
    mockFrom.mockReturnValue(summaryChain);
    const result = await captureSnapshot();
    expect(result.captured).toBe(false);
    expect(result.error).toContain("No positions");
  });

  it("captures snapshot on success", async () => {
    const summaryChain = chainMock({
      total_positions: 2,
      total_value: 5000,
      total_cost: 3000,
    });
    const positionsChain = chainMock([
      { id: "1", asset: "ETH", platform_name: "Kraken", strategy_name: null, size: 1, cost_basis: 2000, current_value: 3000, pnl: 1000, roi_pct: 50, allocation_pct: 60 },
      { id: "2", asset: "BTC", platform_name: "Kraken", strategy_name: null, size: 0.1, cost_basis: 1000, current_value: 2000, pnl: 1000, roi_pct: 100, allocation_pct: 40 },
    ]);
    const upsertChain = chainMock(null, null);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return summaryChain;
      if (callCount === 2) return positionsChain;
      return upsertChain;
    });

    const result = await captureSnapshot();
    expect(result.captured).toBe(true);
    expect(result.total_value).toBe(5000);
    expect(result.positions_count).toBe(2);
  });

  it("returns error when insert fails", async () => {
    const summaryChain = chainMock({
      total_positions: 1,
      total_value: 1000,
      total_cost: 500,
    });
    const positionsChain = chainMock([
      { id: "1", asset: "ETH", platform_name: "Kraken", strategy_name: null, size: 1, cost_basis: 500, current_value: 1000, pnl: 500, roi_pct: 100, allocation_pct: 100 },
    ]);
    const upsertChain = chainMock(null, { message: "unique constraint" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return summaryChain;
      if (callCount === 2) return positionsChain;
      return upsertChain;
    });

    const result = await captureSnapshot();
    expect(result.captured).toBe(false);
    expect(result.error).toContain("unique constraint");
  });

  it("snapshot_date is always set", async () => {
    mockFrom.mockReturnValue(chainMock(null, { message: "fail" }));
    const result = await captureSnapshot();
    expect(result.snapshot_date).toBeTruthy();
    expect(new Date(result.snapshot_date).getTime()).not.toBeNaN();
  });
});
