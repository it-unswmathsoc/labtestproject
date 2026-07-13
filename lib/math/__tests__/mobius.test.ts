import { describe, it, expect } from "vitest";
import { mobiusToLatex } from "../mobius";

describe("mobiusToLatex", () => {
  it("renders a populated set as LaTeX braces", () => {
    expect(mobiusToLatex("set(14,15,16,17,18)", "set_of_integers")).toBe(
      "\\{14,\\ 15,\\ 16,\\ 17,\\ 18\\}"
    );
  });

  it("renders the empty set as emptyset", () => {
    expect(mobiusToLatex("set()", "set_of_integers")).toBe("\\emptyset");
  });

  it("renders a power with braced exponent", () => {
    expect(mobiusToLatex("2^100", "expression")).toBe("2^{100}");
  });

  it("renders multiplication as \\times", () => {
    expect(mobiusToLatex("2^4*3", "expression")).toBe("2^{4}\\times 3");
  });

  it("passes an integer through unchanged", () => {
    expect(mobiusToLatex("19", "integer")).toBe("19");
  });

  it("maps a single_choice value to its option label", () => {
    expect(
      mobiusToLatex("not_surjective", "single_choice", {
        options: [
          { value: "injective", label: "injective" },
          { value: "not_surjective", label: "not surjective" },
        ],
      })
    ).toBe("\\text{not surjective}");
  });

  it("maps multi_select values to a joined label list", () => {
    expect(
      mobiusToLatex("reflexive,symmetric", "multi_select", {
        options: [
          { value: "reflexive", label: "Reflexive" },
          { value: "symmetric", label: "Symmetric" },
        ],
      })
    ).toBe("\\text{Reflexive, Symmetric}");
  });

  it("wraps free text in \\text", () => {
    expect(mobiusToLatex("Bijective", "text")).toBe("\\text{Bijective}");
  });
});
