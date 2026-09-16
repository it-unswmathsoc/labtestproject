import { describe, it, expect } from "vitest";
import { answerToLatex } from "../answer-latex";

describe("answerToLatex with the default numbas syntax", () => {
  it("renders a set", () => {
    expect(answerToLatex("set(14,15,16,17,18)", "set_of_integers")).toBe(
      "\\{14,\\ 15,\\ 16,\\ 17,\\ 18\\}"
    );
  });

  it("renders the empty set", () => {
    expect(answerToLatex("set()", "set_of_integers")).toBe("\\emptyset");
  });

  it("braces an exponent", () => {
    expect(answerToLatex("2^100", "expression")).toBe("2^{100}");
  });

  it("renders multiplication", () => {
    expect(answerToLatex("2^4*3", "expression")).toBe("2^{4}\\times 3");
  });

  it("passes an integer through", () => {
    expect(answerToLatex("19", "integer")).toBe("19");
  });

  it("renders a single choice label as text", () => {
    expect(
      answerToLatex("not_surjective", "single_choice", "numbas", {
        options: [{ value: "not_surjective", label: "Not surjective" }],
      })
    ).toBe("\\text{Not surjective}");
  });

  it("renders multi-select labels as text", () => {
    expect(
      answerToLatex("reflexive,symmetric", "multi_select", "numbas", {
        options: [
          { value: "reflexive", label: "Reflexive" },
          { value: "symmetric", label: "Symmetric" },
        ],
      })
    ).toBe("\\text{Reflexive, Symmetric}");
  });

  it("wraps text", () => {
    expect(answerToLatex("Bijective", "text")).toBe("\\text{Bijective}");
  });
});

describe("answerToLatex with maple syntax", () => {
  it("renders a brace set", () => {
    expect(answerToLatex("{14,15}", "set_of_integers", "maple")).toBe(
      "\\{14,\\ 15\\}"
    );
  });

  it("renders multiplication", () => {
    expect(answerToLatex("2*x^2", "expression", "maple")).toBe("2\\times x^{2}");
  });
});

describe("answerToLatex with latex syntax", () => {
  it("passes a set through untouched", () => {
    expect(answerToLatex("\\{1,2,3\\}", "set_of_integers", "latex")).toBe(
      "\\{1,2,3\\}"
    );
  });

  it("passes an expression through untouched", () => {
    expect(answerToLatex("\\frac{1}{2}", "expression", "latex")).toBe("\\frac{1}{2}");
  });
});
