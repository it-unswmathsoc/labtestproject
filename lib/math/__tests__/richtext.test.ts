import { describe, it, expect } from "vitest";
import { parseRichText } from "../richtext";

describe("parseRichText", () => {
  it("returns a single text segment when there is no math", () => {
    expect(parseRichText("How many students study Maths?")).toEqual([
      { type: "text", value: "How many students study Maths?" },
    ]);
  });

  it("splits inline math delimited by single dollars", () => {
    expect(parseRichText("Find $|B \\cup E|$ now")).toEqual([
      { type: "text", value: "Find " },
      { type: "inlineMath", value: "|B \\cup E|" },
      { type: "text", value: " now" },
    ]);
  });

  it("recognises display math delimited by double dollars", () => {
    expect(parseRichText("$$x^2 + 1$$")).toEqual([
      { type: "displayMath", value: "x^2 + 1" },
    ]);
  });

  it("handles multiple inline segments", () => {
    expect(parseRichText("$a$ and $b$")).toEqual([
      { type: "inlineMath", value: "a" },
      { type: "text", value: " and " },
      { type: "inlineMath", value: "b" },
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseRichText("")).toEqual([]);
  });
});
