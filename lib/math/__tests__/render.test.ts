import { describe, it, expect } from "vitest";
import { renderLatex } from "../render";

describe("renderLatex", () => {
  it("renders valid LaTeX to KaTeX HTML with no error", () => {
    const r = renderLatex("x^2");
    expect(r.error).toBe(false);
    expect(r.html).toContain("katex");
  });

  it("flags invalid LaTeX as an error without throwing", () => {
    const r = renderLatex("\\frac{");
    expect(r.error).toBe(true);
    expect(r.html).toContain("katex-error");
  });

  it("escapes angle brackets in the error fallback", () => {
    const r = renderLatex("\\frac{<script>");
    expect(r.error).toBe(true);
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
  });

  it("supports display mode", () => {
    const r = renderLatex("\\sum_{i=1}^n i", true);
    expect(r.error).toBe(false);
    expect(r.html).toContain("katex");
  });
});
