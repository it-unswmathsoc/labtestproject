import { describe, it, expect } from "vitest";
import { gradeSetOfIntegers } from "../set";

describe("gradeSetOfIntegers with the default numbas syntax", () => {
  it("accepts an exact set (Q7c answer)", () => {
    const r = gradeSetOfIntegers(
      "set(217,502,787,1072,1357,1642)",
      [217, 502, 787, 1072, 1357, 1642]
    );
    expect(r.correct).toBe(true);
  });

  it("is order-insensitive", () => {
    expect(gradeSetOfIntegers("set(18,14,15,17,16)", [14, 15, 16, 17, 18]).correct).toBe(true);
  });

  it("ignores duplicate members", () => {
    expect(gradeSetOfIntegers("set(6,6,7)", [6, 7]).correct).toBe(true);
  });

  it("matches the empty set against []", () => {
    expect(gradeSetOfIntegers("set()", []).correct).toBe(true);
  });

  it("rejects a set with a missing member", () => {
    expect(gradeSetOfIntegers("set(14,15,16)", [14, 15, 16, 17, 18]).correct).toBe(false);
  });

  it("returns a canonical sorted normalized form", () => {
    expect(gradeSetOfIntegers("set(3,1,2)", [1, 2, 3]).normalized).toBe("set(1,2,3)");
  });

  it("explains the expected set notation when input does not parse", () => {
    const r = gradeSetOfIntegers("14,15", [14, 15]);
    expect(r.correct).toBe(false);
    expect(r.reason).toContain("set(1,2,3)");
  });
});

describe("gradeSetOfIntegers with maple syntax", () => {
  it("accepts brace notation", () => {
    expect(gradeSetOfIntegers("{14,15,16}", [14, 15, 16], "maple").correct).toBe(true);
  });

  it("matches the empty set", () => {
    expect(gradeSetOfIntegers("{}", [], "maple").correct).toBe(true);
  });

  it("normalizes to brace notation", () => {
    expect(gradeSetOfIntegers("{3,1,2}", [1, 2, 3], "maple").normalized).toBe("{1,2,3}");
  });

  it("rejects Numbas set() notation with a reason naming brace notation", () => {
    const r = gradeSetOfIntegers("set(1,2,3)", [1, 2, 3], "maple");
    expect(r.correct).toBe(false);
    expect(r.reason).toContain("{1,2,3}");
  });
});

describe("gradeSetOfIntegers with latex syntax", () => {
  it("accepts escaped brace notation", () => {
    expect(gradeSetOfIntegers("\\{14,15\\}", [14, 15], "latex").correct).toBe(true);
  });

  it("accepts \\emptyset for the empty set", () => {
    expect(gradeSetOfIntegers("\\emptyset", [], "latex").correct).toBe(true);
  });

  it("normalizes to escaped brace notation", () => {
    expect(gradeSetOfIntegers("\\{3,1,2\\}", [1, 2, 3], "latex").normalized).toBe("\\{1,2,3\\}");
  });
});
