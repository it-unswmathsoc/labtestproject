import { describe, it, expect } from "vitest";
import {
  normalize,
  parseSet,
  formatSet,
  setToLatex,
  expressionToLatex,
} from "../maple";

describe("maple normalize", () => {
  it("strips all whitespace", () => {
    expect(normalize(" 2 * x ").value).toBe("2*x");
  });

  it("is case-sensitive, because Pi and pi differ in Maple", () => {
    expect(normalize("Pi").value).toBe("Pi");
  });

  it("accepts explicit multiplication without an error", () => {
    expect(normalize("2*x^2").error).toBeUndefined();
  });

  it("rejects a digit followed by a letter", () => {
    const result = normalize("2x");
    expect(result.error).toContain("*");
    expect(result.value).toBe("2x");
  });

  it("rejects a digit followed by an open bracket", () => {
    expect(normalize("2(x+1)").error).toBeDefined();
  });

  it("rejects a close bracket followed by an open bracket", () => {
    expect(normalize("(x+1)(x+2)").error).toBeDefined();
  });

  it("rejects a close bracket followed by a letter or digit", () => {
    expect(normalize("(x+1)2").error).toBeDefined();
    expect(normalize("(x+1)y").error).toBeDefined();
  });

  it("accepts a function call, which Maple reads as application not multiplication", () => {
    expect(normalize("sqrt(2)").error).toBeUndefined();
    expect(normalize("exp(1)").error).toBeUndefined();
    expect(normalize("sinh(x)").error).toBeUndefined();
  });

  it("accepts a user-defined function name", () => {
    expect(normalize("f(x)").error).toBeUndefined();
  });
});

describe("maple parseSet", () => {
  it("parses brace notation", () => {
    expect(parseSet("{1,2,3}")).toEqual([1, 2, 3]);
  });

  it("parses the empty set", () => {
    expect(parseSet("{}")).toEqual([]);
  });

  it("tolerates whitespace", () => {
    expect(parseSet(" { 6 , 7 } ")).toEqual([6, 7]);
  });

  it("parses negative members", () => {
    expect(parseSet("{-3,4}")).toEqual([-3, 4]);
  });

  it("returns null for set() notation, which belongs to Numbas", () => {
    expect(parseSet("set(1,2,3)")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseSet("{1,x}")).toBeNull();
  });
});

describe("maple formatSet", () => {
  it("renders brace notation", () => {
    expect(formatSet([1, 2, 3])).toBe("{1,2,3}");
  });

  it("renders the empty set", () => {
    expect(formatSet([])).toBe("{}");
  });
});

describe("maple setToLatex", () => {
  it("renders a populated set", () => {
    expect(setToLatex("{14,15,16}")).toBe("\\{14,\\ 15,\\ 16\\}");
  });

  it("renders the empty set as \\emptyset", () => {
    expect(setToLatex("{}")).toBe("\\emptyset");
  });

  it("passes unparseable input through untouched", () => {
    expect(setToLatex("14,15")).toBe("14,15");
  });
});

describe("maple expressionToLatex", () => {
  it("braces an exponent", () => {
    expect(expressionToLatex("2^100")).toBe("2^{100}");
  });

  it("renders * as \\times", () => {
    expect(expressionToLatex("2*x^2")).toBe("2\\times x^{2}");
  });
});
