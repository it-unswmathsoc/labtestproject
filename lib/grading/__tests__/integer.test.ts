import { describe, it, expect } from "vitest";
import { gradeInteger } from "../integer";

describe("gradeInteger", () => {
  it("accepts an exact match (Q1a answer 19)", () => {
    expect(gradeInteger("19", 19).correct).toBe(true);
  });

  it("accepts input with surrounding whitespace", () => {
    expect(gradeInteger("  32 ", 32).correct).toBe(true);
  });

  it("rejects a wrong value", () => {
    expect(gradeInteger("18", 19).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(gradeInteger("", 0).correct).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(gradeInteger("abc", 5).correct).toBe(false);
  });

  it("honours an absolute tolerance", () => {
    expect(gradeInteger("100", 101, { tolerance: 1 }).correct).toBe(true);
    expect(gradeInteger("100", 103, { tolerance: 1 }).correct).toBe(false);
  });

  it("returns the normalized numeric string", () => {
    expect(gradeInteger(" 007 ", 7).normalized).toBe("7");
  });

  it("rejects scientific notation input", () => {
    expect(gradeInteger("1e3", 1000).correct).toBe(false);
  });

  it("rejects decimal input", () => {
    expect(gradeInteger("1.5", 1).correct).toBe(false);
  });

  it("rejects hexadecimal input", () => {
    expect(gradeInteger("0x10", 16).correct).toBe(false);
  });
});
