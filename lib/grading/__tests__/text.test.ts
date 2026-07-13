import { describe, it, expect } from "vitest";
import { gradeText } from "../text";

describe("gradeText", () => {
  it("accepts an exact match (Q4c answer Bijective)", () => {
    expect(gradeText("Bijective", { text: "Bijective" }).correct).toBe(true);
  });

  it("collapses internal whitespace", () => {
    expect(gradeText("not   surjective", { text: "not surjective" }).correct).toBe(true);
  });

  it("is case-sensitive by default", () => {
    expect(gradeText("bijective", { text: "Bijective" }).correct).toBe(false);
  });

  it("is case-insensitive when configured", () => {
    expect(
      gradeText("bijective", { text: "Bijective" }, { caseInsensitive: true }).correct
    ).toBe(true);
  });

  it("rejects empty input", () => {
    expect(gradeText("", { text: "Bijective" }).correct).toBe(false);
  });
});
