import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase service client — chain builder
const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  update: mockUpdate,
  select: (...args: unknown[]) => {
    mockSelect(...args);
    return { eq: (...eqArgs: unknown[]) => { mockEq(...eqArgs); return { single: mockSingle }; } };
  },
  eq: mockEq,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

// Mock Stripe — constructEvent + getStripe
const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

const { POST } = await import("@/app/api/stripe/webhook/route");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

function makeReq(body: string, sig: string | null = "sig_test") {
  const headers = new Headers();
  if (sig) headers.set("stripe-signature", sig);
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when signature header is missing", async () => {
    const res = await POST(makeReq("{}", null));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing signature");
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const res = await POST(makeReq("{}", "bad_sig"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid signature");
  });

  it("handles checkout.session.completed — upgrades to member", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          metadata: { supabase_user_id: "user_1" },
          customer: "cus_123",
          subscription: "sub_456",
        },
      },
    });

    const res = await POST(makeReq("{}", "valid_sig"));
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "member",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_456",
        subscription_status: "active",
      }),
    );
  });

  it("handles customer.subscription.deleted — downgrades non-admin", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: { customer: "cus_123", id: "sub_456" },
      },
    });

    mockSingle.mockResolvedValue({
      data: { id: "user_1", role: "member" },
    });

    const res = await POST(makeReq("{}", "valid_sig"));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "free",
        subscription_status: "canceled",
      }),
    );
  });

  it("never degrades admin on subscription.deleted", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: { customer: "cus_admin", id: "sub_789" },
      },
    });

    mockSingle.mockResolvedValue({
      data: { id: "admin_1", role: "admin" },
    });

    const res = await POST(makeReq("{}", "valid_sig"));
    expect(res.status).toBe(200);
    // Should NOT set role to "free" for admin
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: "canceled",
        stripe_subscription_id: null,
      }),
    );
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: "free" }),
    );
  });

  it("returns 200 for unknown event types (no retries)", async () => {
    mockConstructEvent.mockReturnValue({
      type: "some.unknown.event",
      data: { object: {} },
    });

    const res = await POST(makeReq("{}", "valid_sig"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });
});
