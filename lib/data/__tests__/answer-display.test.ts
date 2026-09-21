import { describe, it, expect } from "vitest";
import { answerValueToString } from "../answer-display";

describe("answerValueToString", () => {
  it("formats an integer", () => {
    expect(answerValueToString(19, "integer")).toBe("19");
  });

  it("formats an expression from its mobius string", () => {
    expect(answerValueToString({ mobius: "2^100" }, "expression")).toBe("2^100");
  });

  it("formats a set of integers as set(...) syntax", () => {
    expect(answerValueToString([14, 15, 16, 17, 18], "set_of_integers")).toBe(
      "set(14,15,16,17,18)"
    );
  });

  it("formats an empty set", () => {
    expect(answerValueToString([], "set_of_integers")).toBe("set()");
  });

  it("formats a single choice", () => {
    expect(answerValueToString({ choice: "not_surjective" }, "single_choice")).toBe(
      "not_surjective"
    );
  });

  it("formats a multi-select as comma-joined values", () => {
    expect(
      answerValueToString({ selected: ["reflexive", "symmetric"] }, "multi_select")
    ).toBe("reflexive,symmetric");
  });

  it("formats free text", () => {
    expect(answerValueToString({ text: "Bijective" }, "text")).toBe("Bijective");
  });
});

describe("answerValueToString with a dialect", () => {
  it("renders a set in maple brace notation", () => {
    expect(answerValueToString([1, 2, 3], "set_of_integers", "maple")).toBe("{1,2,3}");
  });

  it("renders a set in latex notation", () => {
    expect(answerValueToString([1, 2, 3], "set_of_integers", "latex")).toBe(
      "\\{1,2,3\\}"
    );
  });
});
