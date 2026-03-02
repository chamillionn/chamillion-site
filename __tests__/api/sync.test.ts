import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock authCheck
const mockAuthCheck = vi.fn();

vi.mock("@/lib/sync/types", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/sync/types")>();
  return { ...original, authCheck: mockAuthCheck };
});

// Mock syncPlatform
const mockSyncPlatform = vi.fn();

vi.mock("@/lib/sync/engine", () => ({
  syncPlatform: mockSyncPlatform,
}));

// Mock captureSnapshot
const mockCaptureSnapshot = vi.fn();

vi.mock("@/lib/sync/snapshot", () => ({
  captureSnapshot: mockCaptureSnapshot,
}));

// Mock adapters — minimal stubs
vi.mock("@/lib/sync/adapters/hyperliquid", () => ({
  HyperliquidAdapter: { platformName: "Hyperliquid", fetchPositions: vi.fn() },
}));
vi.mock("@/lib/sync/adapters/polymarket", () => ({
  PolymarketAdapter: { platformName: "Polymarket", fetchPositions: vi.fn() },
}));
vi.mock("@/lib/sync/adapters/fakedex", () => ({
  FakeDexAdapter: { platformName: "FakeDex", fetchPositions: vi.fn() },
}));

const { GET } = await import("@/app/api/sync/route");

beforeEach(() => {
  vi.clearAllMocks();
});

function makeReq(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/sync", { headers });
}

describe("GET /api/sync", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthCheck.mockResolvedValue(false);

    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("syncs all platforms when authenticated with bearer token", async () => {
    mockAuthCheck.mockResolvedValue(true);
    mockSyncPlatform.mockResolvedValue({
      platform: "test",
      updated: 2,
      deactivated: 0,
      errors: [],
      timestamp: "2025-01-01T00:00:00Z",
    });
    mockCaptureSnapshot.mockResolvedValue({
      captured: true,
      snapshot_date: "2025-01-01",
      total_value: 10000,
      positions_count: 5,
    });

    const res = await GET(makeReq({ authorization: "Bearer test_secret" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toBeDefined();
    expect(json.snapshot).toBeDefined();
    expect(json.totalUpdated).toBeGreaterThanOrEqual(0);
    expect(json.timestamp).toBeDefined();
  });

  it("handles snapshot failure gracefully", async () => {
    mockAuthCheck.mockResolvedValue(true);
    mockSyncPlatform.mockResolvedValue({
      platform: "test",
      updated: 0,
      deactivated: 0,
      errors: [],
      timestamp: "2025-01-01T00:00:00Z",
    });
    mockCaptureSnapshot.mockRejectedValue(new Error("DB connection failed"));

    const res = await GET(makeReq({ authorization: "Bearer test_secret" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.snapshot.captured).toBe(false);
    expect(json.snapshot.error).toBe("DB connection failed");
  });
});
