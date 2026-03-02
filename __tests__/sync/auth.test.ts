import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock requireAdmin
const mockRequireAdmin = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

const { authCheck } = await import("@/lib/sync/types");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SYNC_SECRET = "test-secret-key-123";
});

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/sync", {
    method: "POST",
    headers,
  });
}

describe("authCheck", () => {
  it("accepts valid bearer token", async () => {
    const req = makeRequest({ authorization: "Bearer test-secret-key-123" });
    expect(await authCheck(req)).toBe(true);
  });

  it("rejects invalid bearer token", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const req = makeRequest({ authorization: "Bearer wrong-token-here-123" });
    expect(await authCheck(req)).toBe(false);
  });

  it("rejects bearer with different length", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const req = makeRequest({ authorization: "Bearer short" });
    expect(await authCheck(req)).toBe(false);
  });

  it("falls through to admin session when no bearer", async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: "u1" } });
    const req = makeRequest({});
    expect(await authCheck(req)).toBe(true);
  });

  it("returns false when no auth at all", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const req = makeRequest({});
    expect(await authCheck(req)).toBe(false);
  });

  it("returns false when admin check throws", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("session expired"));
    const req = makeRequest({});
    expect(await authCheck(req)).toBe(false);
  });
});
