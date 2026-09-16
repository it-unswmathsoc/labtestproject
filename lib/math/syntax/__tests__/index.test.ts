import { describe, it, expect } from "vitest";
import { dialect, SYNTAX_LABELS, ANSWER_SYNTAXES } from "../index";
import type { AnswerSyntax } from "../types";

describe("dialect", () => {
  it("returns the Numbas module for numbas", () => {
    expect(dialect("numbas").formatSet([1, 2])).toBe("set(1,2)");
  });

  it("returns the Maple module for maple", () => {
    expect(dialect("maple").formatSet([1, 2])).toBe("{1,2}");
  });

  it("returns the LaTeX module for latex", () => {
    expect(dialect("latex").formatSet([1, 2])).toBe("\\{1,2\\}");
  });

  it("falls back to latex for an unknown syntax", () => {
    expect(dialect("nonsense" as AnswerSyntax).formatSet([1, 2])).toBe("\\{1,2\\}");
  });
});

describe("SYNTAX_LABELS", () => {
  it("has a human label for every syntax", () => {
    expect(SYNTAX_LABELS).toEqual({
      numbas: "Numbas",
      maple: "Maple",
      latex: "LaTeX",
    });
  });
});

describe("ANSWER_SYNTAXES", () => {
  it("lists every syntax, for building dropdowns", () => {
    expect(ANSWER_SYNTAXES).toEqual(["numbas", "maple", "latex"]);
  });
});
