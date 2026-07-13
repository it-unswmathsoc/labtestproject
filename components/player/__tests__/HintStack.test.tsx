// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HintStack } from "../HintStack";
import type { Hint } from "@/lib/data/types";

const hints: Hint[] = [
  { id: "h1", stepId: "s1", number: 1, bodyLatex: "First hint", sortOrder: 1 },
  { id: "h2", stepId: "s1", number: 2, bodyLatex: "Second hint", sortOrder: 2 },
];

describe("HintStack", () => {
  it("hides hints until requested, then reveals them one at a time", async () => {
    render(<HintStack hints={hints} />);
    expect(screen.queryByText(/First hint/)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show a hint/i }));
    expect(screen.getByText(/First hint/)).toBeInTheDocument();
    expect(screen.queryByText(/Second hint/)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show another hint/i }));
    expect(screen.getByText(/Second hint/)).toBeInTheDocument();
  });
});
