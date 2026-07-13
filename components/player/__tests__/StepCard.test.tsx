// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepCard } from "../StepCard";
import type { Step } from "@/lib/data/types";

const step: Step = {
  id: "s1",
  partId: "p1",
  number: 1,
  promptLatex: "Find the union size.",
  answerType: "integer",
  answerValue: 32,
  explanationLatex: "It equals 32.",
  sortOrder: 1,
  hints: [
    { id: "h1", stepId: "s1", number: 1, bodyLatex: "Subtract the none-count.", sortOrder: 1 },
  ],
};

describe("StepCard", () => {
  it("marks correct, reveals the explanation, and calls onSolved", async () => {
    const onSolved = vi.fn();
    render(<StepCard step={step} solved={false} onSolved={onSolved} />);

    expect(screen.queryByText(/It equals 32/)).toBeNull();
    await userEvent.type(screen.getByRole("textbox"), "32");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));

    expect(screen.getByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText(/It equals 32/)).toBeInTheDocument();
    expect(onSolved).toHaveBeenCalledOnce();
  });

  it("shows a try-again message on a wrong answer without solving", async () => {
    const onSolved = vi.fn();
    render(<StepCard step={step} solved={false} onSolved={onSolved} />);

    await userEvent.type(screen.getByRole("textbox"), "10");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));

    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("reveals the answer via the reveal hatch", async () => {
    render(<StepCard step={step} solved={false} onSolved={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText(/It equals 32/)).toBeInTheDocument();
  });

  it("shows the checkmark and explanation for an already-solved step", () => {
    render(<StepCard step={step} solved={true} onSolved={vi.fn()} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText(/It equals 32/)).toBeInTheDocument();
  });

  it("does not re-fire onSolved when already solved", async () => {
    const onSolved = vi.fn();
    render(<StepCard step={step} solved={true} onSolved={onSolved} />);
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(onSolved).not.toHaveBeenCalled();
  });
});
