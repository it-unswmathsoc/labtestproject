// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyntaxBadge } from "../SyntaxBadge";

describe("SyntaxBadge", () => {
  it("names the Numbas dialect", () => {
    render(<SyntaxBadge syntax="numbas" />);
    expect(screen.getByText("Numbas syntax")).toBeInTheDocument();
  });

  it("names the Maple dialect", () => {
    render(<SyntaxBadge syntax="maple" />);
    expect(screen.getByText("Maple syntax")).toBeInTheDocument();
  });

  it("names the LaTeX dialect", () => {
    render(<SyntaxBadge syntax="latex" />);
    expect(screen.getByText("LaTeX syntax")).toBeInTheDocument();
  });

  it("explains itself to assistive technology", () => {
    render(<SyntaxBadge syntax="maple" />);
    expect(screen.getByTitle(/Maple/)).toBeInTheDocument();
  });
});
