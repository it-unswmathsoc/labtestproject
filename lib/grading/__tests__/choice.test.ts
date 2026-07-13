import { describe, it, expect } from "vitest";
import { gradeSingleChoice } from "../choice";

describe("gradeSingleChoice", () => {
  it("accepts the matching choice value (Q3a not_surjective)", () => {
    expect(
      gradeSingleChoice("not_surjective", { choice: "not_surjective" }).correct
    ).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    expect(gradeSingleChoice("  not_injective ", { choice: "not_injective" }).correct).toBe(true);
  });

  it("rejects a different choice", () => {
    expect(gradeSingleChoice("injective", { choice: "not_surjective" }).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(gradeSingleChoice("", { choice: "injective" }).correct).toBe(false);
  });
});
