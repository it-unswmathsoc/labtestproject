import { describe, it, expect } from "vitest";
import { gradeExpression } from "../expression";

describe("gradeExpression with the default numbas syntax", () => {
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

  it("ignores case, because JME is case-insensitive", () => {
    expect(gradeExpression("PI", { mobius: "pi" }).correct).toBe(true);
  });
});

describe("gradeExpression with maple syntax", () => {
  it("accepts explicit multiplication", () => {
    expect(gradeExpression("2*x", { mobius: "2*x" }, "maple").correct).toBe(true);
  });

  it("is case-sensitive, so Pi does not match pi", () => {
    expect(gradeExpression("pi", { mobius: "Pi" }, "maple").correct).toBe(false);
  });

  it("rejects implicit multiplication with a reason", () => {
    const result = gradeExpression("2x", { mobius: "2*x" }, "maple");
    expect(result.correct).toBe(false);
    expect(result.reason).toContain("*");
  });

  it("sets no reason for an answer that is merely wrong", () => {
    expect(gradeExpression("3*x", { mobius: "2*x" }, "maple").reason).toBeUndefined();
  });
});

describe("gradeExpression with latex syntax", () => {
  it("treats x^2 and x^{2} as the same answer", () => {
    expect(gradeExpression("x^2", { mobius: "x^{2}" }, "latex").correct).toBe(true);
  });

  it("does not collapse the space after a control sequence", () => {
    expect(gradeExpression("\\sin x", { mobius: "\\sin x" }, "latex").correct).toBe(true);
  });

  it("rejects a different expression", () => {
    expect(gradeExpression("x^3", { mobius: "x^{2}" }, "latex").correct).toBe(false);
  });
});
