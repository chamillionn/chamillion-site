import { describe, it, expect } from "vitest";
import { V, steelA, bgCardA } from "@/lib/theme";

describe("V constants", () => {
  it("exports steel blue CSS variable", () => {
    expect(V.steel).toBe("var(--steel-blue)");
  });
  it("exports bg card CSS variable", () => {
    expect(V.bgCard).toBe("var(--bg-card)");
  });
});

describe("steelA", () => {
  it("returns rgba with correct alpha", () => {
    expect(steelA(0.5)).toBe("rgba(var(--steel-blue-rgb), 0.5)");
  });
  it("works with 0 alpha", () => {
    expect(steelA(0)).toBe("rgba(var(--steel-blue-rgb), 0)");
  });
  it("works with 1 alpha", () => {
    expect(steelA(1)).toBe("rgba(var(--steel-blue-rgb), 1)");
  });
});

describe("bgCardA", () => {
  it("returns rgba with correct alpha", () => {
    expect(bgCardA(0.8)).toBe("rgba(var(--bg-card-rgb), 0.8)");
  });
});
