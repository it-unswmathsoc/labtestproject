import { describe, it, expect } from "vitest";
import {
  normalize,
  parseSet,
  formatSet,
  setToLatex,
  expressionToLatex,
} from "../latex";

describe("latex normalize", () => {
  it("strips insignificant whitespace", () => {
    expect(normalize(" 2 + 3 ").value).toBe("2+3");
  });

  it("keeps the space that terminates a control sequence", () => {
    expect(normalize("\\sin x").value).toBe("\\sin x");
  });

  it("collapses repeated whitespace after a control sequence to one space", () => {
    expect(normalize("\\sin   x").value).toBe("\\sin x");
  });

  it("drops a control-sequence space when a non-letter follows", () => {
    expect(normalize("\\pi + 1").value).toBe("\\pi+1");
  });

  it("drops \\left and \\right", () => {
    expect(normalize("\\left(x+1\\right)").value).toBe("(x+1)");
  });

  it("braces a single-character exponent so x^2 equals x^{2}", () => {
    expect(normalize("x^2").value).toBe(normalize("x^{2}").value);
  });

  it("braces a single-character subscript", () => {
    expect(normalize("S_1").value).toBe("S_{1}");
  });

  it("is case-sensitive", () => {
    expect(normalize("\\Pi").value).toBe("\\Pi");
  });

  it("never reports a syntax error", () => {
    expect(normalize("x^2").error).toBeUndefined();
  });
});

describe("latex parseSet", () => {
  it("parses escaped brace notation", () => {
    expect(parseSet("\\{1,2,3\\}")).toEqual([1, 2, 3]);
  });

  it("parses the empty escaped braces", () => {
    expect(parseSet("\\{\\}")).toEqual([]);
  });

  it("parses \\emptyset as the empty set", () => {
    expect(parseSet("\\emptyset")).toEqual([]);
  });

  it("tolerates whitespace", () => {
    expect(parseSet(" \\{ 6 , 7 \\} ")).toEqual([6, 7]);
  });

  it("parses negative members", () => {
    expect(parseSet("\\{-3,4\\}")).toEqual([-3, 4]);
  });

  it("returns null for bare braces, which belong to Maple", () => {
    expect(parseSet("{1,2,3}")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseSet("\\{1,x\\}")).toBeNull();
  });
});

describe("latex formatSet", () => {
  it("renders escaped brace notation", () => {
    expect(formatSet([1, 2, 3])).toBe("\\{1,2,3\\}");
  });

  it("renders the empty set as \\emptyset", () => {
    expect(formatSet([])).toBe("\\emptyset");
  });
});

describe("latex setToLatex", () => {
  it("passes input through, because it is already LaTeX", () => {
    expect(setToLatex("\\{1,2,3\\}")).toBe("\\{1,2,3\\}");
  });
});

describe("latex expressionToLatex", () => {
  it("passes input through, because it is already LaTeX", () => {
    expect(expressionToLatex("\\frac{1}{2}")).toBe("\\frac{1}{2}");
  });
});
