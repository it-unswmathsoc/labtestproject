import { describe, it, expect } from "vitest";
import { grade } from "../index";

describe("grade dispatcher", () => {
  it("routes integer answers", () => {
    expect(grade("integer", "19", 19).correct).toBe(true);
  });

  it("routes set_of_integers answers", () => {
    expect(grade("set_of_integers", "set(6,7)", [6, 7]).correct).toBe(true);
  });

  it("routes expression answers", () => {
    expect(grade("expression", "2^100", { mobius: "2^100" }).correct).toBe(true);
  });

  it("routes single_choice answers", () => {
    expect(grade("single_choice", "injective", { choice: "injective" }).correct).toBe(true);
  });

  it("routes multi_select answers (array input)", () => {
    expect(
      grade("multi_select", ["reflexive", "symmetric"], { selected: ["symmetric", "reflexive"] }).correct
    ).toBe(true);
  });

  it("routes text answers", () => {
    expect(grade("text", "Bijective", { text: "Bijective" }).correct).toBe(true);
  });
});

describe("grade with an answer syntax", () => {
  it("defaults to numbas when no syntax is given", () => {
    expect(grade("set_of_integers", "set(1,2)", [1, 2]).correct).toBe(true);
  });

  it("passes the syntax to the set grader", () => {
    expect(grade("set_of_integers", "{1,2}", [1, 2], {}, "maple").correct).toBe(true);
  });

  it("passes the syntax to the expression grader", () => {
    expect(
      grade("expression", "2*x", { mobius: "2*x" }, {}, "maple").correct
    ).toBe(true);
  });

  it("ignores the syntax for answer types that do not use it", () => {
    expect(grade("integer", "19", 19, {}, "maple").correct).toBe(true);
  });
});
