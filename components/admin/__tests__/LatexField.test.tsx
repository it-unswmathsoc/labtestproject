// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LatexField } from "../LatexField";

function Harness() {
  const [value, setValue] = useState("");
  return <LatexField label="Prompt" value={value} onChange={setValue} />;
}

describe("LatexField", () => {
  it("edits the value and shows a preview of the text", async () => {
    render(<Harness />);
    const box = screen.getByLabelText("Prompt");
    await userEvent.type(box, "Find x");
    expect(box).toHaveValue("Find x");
    // The preview region echoes the text (RichText renders plain text as-is).
    const previews = screen.getAllByText(/Find x/);
    expect(previews.length).toBeGreaterThanOrEqual(1);
  });
});
