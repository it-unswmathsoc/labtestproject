// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinalAnswer } from "../FinalAnswer";
import type { QuestionPart } from "@/lib/data/types";

const part: QuestionPart = {
  id: "p1",
  questionId: "q1",
  label: "a",
  promptLatex: "How many study Maths?",
  answerType: "integer",
  answerValue: 19,
  sortOrder: 1,
  steps: [],
};

describe("FinalAnswer", () => {
  it("solves on the correct final answer and calls onSolved", async () => {
    const onSolved = vi.fn();
    render(<FinalAnswer part={part} solved={false} onSolved={onSolved} />);
    await userEvent.type(screen.getByRole("textbox"), "19");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText(/solved/i)).toBeInTheDocument();
    expect(onSolved).toHaveBeenCalledOnce();
  });

  it("rejects a wrong final answer", async () => {
    render(<FinalAnswer part={part} solved={false} onSolved={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "20");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
  });
});
