import { describe, it, expect } from "vitest";
import { safeFloat, validatePositionRow, assertOk } from "@/lib/sync/validate";
import type { PositionRow } from "@/lib/sync/types";

const validRow: PositionRow = {
  asset: "ETH",
  size: 1.5,
  cost_basis: 2000,
  current_value: 3000,
  notes: "",
};

describe("safeFloat", () => {
  it("parses a valid number", () => {
    expect(safeFloat("42.5")).toBe(42.5);
  });
  it("parses 0", () => {
    expect(safeFloat("0")).toBe(0);
  });
  it("returns null for null", () => {
    expect(safeFloat(null)).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(safeFloat(undefined)).toBeNull();
  });
  it("returns 0 for empty string (Number('') === 0)", () => {
    // Note: Number("") === 0 which is finite — safeFloat returns 0, not null
    expect(safeFloat("")).toBe(0);
  });
  it("returns null for non-numeric string", () => {
    expect(safeFloat("abc")).toBeNull();
  });
  it("returns null for NaN", () => {
    expect(safeFloat(NaN)).toBeNull();
  });
  it("returns null for Infinity", () => {
    expect(safeFloat(Infinity)).toBeNull();
  });
});

describe("validatePositionRow", () => {
  it("returns null for a valid row", () => {
    expect(validatePositionRow(validRow)).toBeNull();
  });
  it("rejects empty asset", () => {
    expect(validatePositionRow({ ...validRow, asset: "" })).toContain("empty asset");
  });
  it("rejects whitespace-only asset", () => {
    expect(validatePositionRow({ ...validRow, asset: "   " })).toContain("empty asset");
  });
  it("rejects size = 0", () => {
    expect(validatePositionRow({ ...validRow, size: 0 })).toContain("invalid size");
  });
  it("rejects NaN size", () => {
    expect(validatePositionRow({ ...validRow, size: NaN })).toContain("invalid size");
  });
  it("rejects Infinity cost_basis", () => {
    expect(validatePositionRow({ ...validRow, cost_basis: Infinity })).toContain("invalid cost_basis");
  });
  it("rejects NaN current_value", () => {
    expect(validatePositionRow({ ...validRow, current_value: NaN })).toContain("invalid current_value");
  });
  it("allows negative size (shorts)", () => {
    expect(validatePositionRow({ ...validRow, size: -1.5 })).toBeNull();
  });
  it("allows zero cost_basis", () => {
    expect(validatePositionRow({ ...validRow, cost_basis: 0 })).toBeNull();
  });
});

describe("assertOk", () => {
  it("does nothing for ok responses", () => {
    const res = { ok: true, status: 200, statusText: "OK" } as Response;
    expect(() => assertOk(res, "test")).not.toThrow();
  });
  it("throws for non-ok responses", () => {
    const res = { ok: false, status: 404, statusText: "Not Found" } as Response;
    expect(() => assertOk(res, "API call")).toThrow("API call: HTTP 404 Not Found");
  });
  it("throws for 500 errors", () => {
    const res = { ok: false, status: 500, statusText: "Internal Server Error" } as Response;
    expect(() => assertOk(res, "sync")).toThrow("sync: HTTP 500");
  });
});
