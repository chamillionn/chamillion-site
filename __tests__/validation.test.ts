import { describe, it, expect } from "vitest";
import { requireNumber, safeNumber } from "@/lib/validation";

describe("requireNumber", () => {
  function fd(key: string, value: string): FormData {
    const f = new FormData();
    f.set(key, value);
    return f;
  }

  it("parses a valid integer", () => {
    expect(requireNumber(fd("n", "42"), "n")).toBe(42);
  });
  it("parses a valid float", () => {
    expect(requireNumber(fd("n", "3.14"), "n")).toBe(3.14);
  });
  it("parses zero", () => {
    expect(requireNumber(fd("n", "0"), "n")).toBe(0);
  });
  it("parses negative numbers", () => {
    expect(requireNumber(fd("n", "-5.5"), "n")).toBe(-5.5);
  });
  it("returns 0 for empty string (Number('') === 0)", () => {
    // Note: Number("") === 0 which is finite — no throw
    expect(requireNumber(fd("n", ""), "n")).toBe(0);
  });
  it("throws for non-numeric string", () => {
    expect(() => requireNumber(fd("n", "abc"), "n")).toThrow("n debe ser un número válido");
  });
  it("returns 0 for missing key (Number(null) === 0)", () => {
    // Note: fd.get("n") returns null, Number(null) === 0, which is finite
    expect(requireNumber(new FormData(), "n")).toBe(0);
  });
});

describe("safeNumber", () => {
  it("parses a valid number", () => {
    expect(safeNumber("42")).toBe(42);
  });
  it("parses zero string", () => {
    expect(safeNumber("0")).toBe(0);
  });
  it("returns null for null", () => {
    expect(safeNumber(null)).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(safeNumber("")).toBeNull();
  });
  it("returns null for non-numeric", () => {
    expect(safeNumber("abc")).toBeNull();
  });
  it("returns null for Infinity string", () => {
    expect(safeNumber("Infinity")).toBeNull();
  });
});
