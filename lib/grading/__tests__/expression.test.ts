import { describe, it, expect } from "vitest";
import { normalizeExpression, gradeExpression } from "../expression";

describe("normalizeExpression", () => {
  it("strips all whitespace and lowercases", () => {
    expect(normalizeExpression(" 2 ^ 100 ")).toBe("2^100");
  });
});

describe("gradeExpression", () => {
  it("accepts an exact power (Q2b.i answer 2^100)", () => {
    expect(gradeExpression("2^100", { mobius: "2^100" }).correct).toBe(true);
  });

  it("accepts a match despite spacing differences (2^20)", () => {
    expect(gradeExpression(" 2 ^ 20", { mobius: "2^20" }).correct).toBe(true);
  });

  it("rejects a different exponent", () => {
    expect(gradeExpression("2^99", { mobius: "2^100" }).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(gradeExpression("", { mobius: "2^100" }).correct).toBe(false);
  });

  it("preserves the raw trimmed input in normalized", () => {
    expect(gradeExpression("  2^100 ", { mobius: "2^100" }).normalized).toBe("2^100");
  });
});
