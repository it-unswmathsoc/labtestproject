// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionPreview } from "../QuestionPreview";
import type { Question } from "@/lib/data/types";

const question: Question = {
  id: "q1",
  labTestId: "t1",
  number: 1,
  promptLatex: "The stem",
  sortOrder: 1,
  parts: [
    {
      id: "pa",
      questionId: "q1",
      label: "a",
      promptLatex: "The part",
      answerType: "integer",
      answerValue: 19,
      sortOrder: 1,
      steps: [
        {
          id: "s1",
          partId: "pa",
          number: 1,
          promptLatex: "The sub-goal",
          answerType: "integer",
          answerValue: 32,
          explanationLatex: "The explanation",
          sortOrder: 1,
          hints: [
            { id: "h1", stepId: "s1", number: 1, bodyLatex: "The hint", sortOrder: 1 },
          ],
        },
      ],
    },
  ],
};

describe("QuestionPreview", () => {
  it("renders the stem, part, step, explanation and hint", () => {
    render(<QuestionPreview question={question} />);
    expect(screen.getByText(/The stem/)).toBeInTheDocument();
    expect(screen.getByText(/The part/)).toBeInTheDocument();
    expect(screen.getByText(/The sub-goal/)).toBeInTheDocument();
    expect(screen.getByText(/The explanation/)).toBeInTheDocument();
    expect(screen.getByText(/The hint/)).toBeInTheDocument();
  });
});
