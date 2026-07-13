import { describe, it, expect } from "vitest";
import { answerValueToMobius } from "../answer-display";

describe("answerValueToMobius", () => {
  it("formats an integer", () => {
    expect(answerValueToMobius(19, "integer")).toBe("19");
  });

  it("formats an expression from its mobius string", () => {
    expect(answerValueToMobius({ mobius: "2^100" }, "expression")).toBe("2^100");
  });

  it("formats a set of integers as set(...) syntax", () => {
    expect(answerValueToMobius([14, 15, 16, 17, 18], "set_of_integers")).toBe(
      "set(14,15,16,17,18)"
    );
  });

  it("formats an empty set", () => {
    expect(answerValueToMobius([], "set_of_integers")).toBe("set()");
  });

  it("formats a single choice", () => {
    expect(answerValueToMobius({ choice: "not_surjective" }, "single_choice")).toBe(
      "not_surjective"
    );
  });

  it("formats a multi-select as comma-joined values", () => {
    expect(
      answerValueToMobius({ selected: ["reflexive", "symmetric"] }, "multi_select")
    ).toBe("reflexive,symmetric");
  });

  it("formats free text", () => {
    expect(answerValueToMobius({ text: "Bijective" }, "text")).toBe("Bijective");
  });
});
