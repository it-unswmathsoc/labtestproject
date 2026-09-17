// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepCard } from "../StepCard";
import type { Step } from "@/lib/data/types";

const step: Step = {
  id: "s1",
  partId: "p1",
  number: 1,
  promptLatex: "Give the set.",
  answerType: "set_of_integers",
  answerValue: [1, 2, 3],
  explanationLatex: "Because.",
  sortOrder: 1,
  hints: [],
};

describe("StepCard answer syntax", () => {
  it("accepts maple brace notation when the test is maple", async () => {
    render(
      <StepCard step={step} solved={false} onSolved={() => {}} answerSyntax="maple" />
    );
    await userEvent.type(screen.getByRole("textbox"), "{{1,2,3}");
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows the syntax reason when notation is wrong for the dialect", async () => {
    render(
      <StepCard step={step} solved={false} onSolved={() => {}} answerSyntax="maple" />
    );
    await userEvent.type(screen.getByRole("textbox"), "set(1,2,3)");
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText(/Sets look like/)).toBeInTheDocument();
  });

  it("still grades as numbas when no syntax is given", async () => {
    render(<StepCard step={step} solved={false} onSolved={() => {}} />);
    await userEvent.type(screen.getByRole("textbox"), "set(1,2,3)");
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});
