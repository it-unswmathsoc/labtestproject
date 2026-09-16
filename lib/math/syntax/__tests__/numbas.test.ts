import { describe, it, expect } from "vitest";
import {
  normalize,
  parseSet,
  formatSet,
  setToLatex,
  expressionToLatex,
} from "../numbas";

describe("numbas normalize", () => {
  it("strips all whitespace", () => {
    expect(normalize(" 2 ^ 100 ").value).toBe("2^100");
  });

  it("lowercases, because JME is case-insensitive by default", () => {
    expect(normalize("Pi").value).toBe("pi");
  });

  it("never reports a syntax error", () => {
    expect(normalize("2x").error).toBeUndefined();
  });
});

describe("numbas parseSet", () => {
  it("parses a populated set", () => {
    expect(parseSet("set(14,15,16,17,18)")).toEqual([14, 15, 16, 17, 18]);
  });

  it("parses the empty set", () => {
    expect(parseSet("set()")).toEqual([]);
  });

  it("tolerates whitespace and is case-insensitive on the keyword", () => {
    expect(parseSet(" SET( 6 , 7 ) ")).toEqual([6, 7]);
  });

  it("parses negative members", () => {
    expect(parseSet("set(-3,4)")).toEqual([-3, 4]);
  });

  it("returns null for brace notation, which belongs to Maple", () => {
    expect(parseSet("{1,2,3}")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseSet("set(1,x)")).toBeNull();
  });
});

describe("numbas formatSet", () => {
  it("renders the canonical set form", () => {
    expect(formatSet([1, 2, 3])).toBe("set(1,2,3)");
  });

  it("renders the empty set", () => {
    expect(formatSet([])).toBe("set()");
  });
});

describe("numbas setToLatex", () => {
  it("renders a populated set", () => {
    expect(setToLatex("set(14,15,16)")).toBe("\\{14,\\ 15,\\ 16\\}");
  });

  it("renders the empty set as \\emptyset", () => {
    expect(setToLatex("set()")).toBe("\\emptyset");
  });

  it("passes unparseable input through untouched", () => {
    expect(setToLatex("14,15")).toBe("14,15");
  });
});

describe("numbas expressionToLatex", () => {
  it("braces an exponent", () => {
    expect(expressionToLatex("2^100")).toBe("2^{100}");
  });

  it("renders * as \\times", () => {
    expect(expressionToLatex("2^4*3")).toBe("2^{4}\\times 3");
  });
});
