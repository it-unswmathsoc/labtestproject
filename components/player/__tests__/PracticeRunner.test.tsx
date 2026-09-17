// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeRunner } from "../PracticeRunner";
import type { LabTest, Question } from "@/lib/data/types";

const test: LabTest = {
  id: "t1",
  courseId: "c1",
  name: "Lab Test 1",
  isPublished: true,
  sortOrder: 1, answerSyntax: "numbas"
};

function makeQuestion(n: number): Question {
  return {
    id: `q${n}`,
    labTestId: "t1",
    number: n,
    promptLatex: `Stem ${n}`,
    sortOrder: n,
    parts: [
      {
        id: `q${n}-a`,
        questionId: `q${n}`,
        label: "a",
        promptLatex: `Part ${n}`,
        answerType: "integer",
        answerValue: n,
        sortOrder: 1,
        steps: [],
      },
    ],
  };
}

const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];

describe("PracticeRunner", () => {
  it("shows the first question with progress", () => {
    render(<PracticeRunner test={test} questions={questions} courseCode="MATH1081" />);
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText("Stem 1")).toBeInTheDocument();
  });

  it("moves forward and back between questions", async () => {
    render(<PracticeRunner test={test} questions={questions} courseCode="MATH1081" />);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/Question 2 of 3/)).toBeInTheDocument();
    expect(screen.getByText("Stem 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
  });

  it("disables Back on the first question", () => {
    render(<PracticeRunner test={test} questions={questions} courseCode="MATH1081" />);
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("reaches the finish screen after the last question and can restart", async () => {
    render(<PracticeRunner test={test} questions={questions} courseCode="MATH1081" />);
    await userEvent.click(screen.getByRole("button", { name: /next/i })); // Q2
    await userEvent.click(screen.getByRole("button", { name: /next/i })); // Q3 (last)
    await userEvent.click(screen.getByRole("button", { name: /finish/i })); // finish
    expect(screen.getByText(/reached the end/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /restart/i }));
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
  });
});
