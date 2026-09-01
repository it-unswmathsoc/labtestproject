// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RichText } from "@/components/math/RichText";
import { PageHeader } from "../PageHeader";
import { Card } from "../Card";

// Display math renders as a block element. Nesting it in a <p> makes the browser
// parser reparent it, which breaks hydration — so no wrapper here may be a <p>.
const DISPLAY = "Prove $$x^2$$ carefully.";
const hasDivInsideP = (html: string) =>
  /<p[^>]*>(?:(?!<\/p>)[\s\S])*?<div/.test(html);

describe("display math in lab test fields", () => {
  it("does not nest a block inside a <p> in PageHeader", () => {
    const html = renderToStaticMarkup(
      <PageHeader title="x" subtitle={<RichText>{DISPLAY}</RichText>} />
    );
    expect(hasDivInsideP(html)).toBe(false);
  });

  it("does not nest a block inside a <p> in Card", () => {
    const html = renderToStaticMarkup(
      <Card title="x" subtitle={<RichText>{DISPLAY}</RichText>} />
    );
    expect(hasDivInsideP(html)).toBe(false);
  });
});
