import { describe, it, expect } from "vitest";
import { parseIntegerSet, gradeSetOfIntegers } from "../set";

describe("parseIntegerSet", () => {
  it("parses a populated set (Q2a answer)", () => {
    expect(parseIntegerSet("set(14,15,16,17,18)")).toEqual([14, 15, 16, 17, 18]);
  });

  it("parses the empty set (Q7b answer)", () => {
    expect(parseIntegerSet("set()")).toEqual([]);
  });

  it("tolerates whitespace and is case-insensitive on the keyword", () => {
    expect(parseIntegerSet(" SET( 6 , 7 ) ")).toEqual([6, 7]);
  });

  it("returns null for non-set syntax", () => {
    expect(parseIntegerSet("14,15,16")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseIntegerSet("set(1,x)")).toBeNull();
  });
});

describe("gradeSetOfIntegers", () => {
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

  it("rejects unparseable input", () => {
    expect(gradeSetOfIntegers("14,15", [14, 15]).correct).toBe(false);
  });

  it("returns a canonical sorted normalized form", () => {
    expect(gradeSetOfIntegers("set(3,1,2)", [1, 2, 3]).normalized).toBe("set(1,2,3)");
  });
});
