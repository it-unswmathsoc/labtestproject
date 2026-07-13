import { describe, it, expect } from "vitest";
import { createStep, updateStep, deleteStep, reorderSteps } from "../content-store";
import type { Content } from "../types";
import type { QuestionPart } from "@/lib/data/types";

function baseContent(): Content {
  const part: QuestionPart = {
    id: "pa",
    questionId: "q1",
    label: "a",
    promptLatex: "Part a",
    answerType: "integer",
    answerValue: 19,
    sortOrder: 1,
    steps: [
      {
        id: "s1",
        partId: "pa",
        number: 1,
        promptLatex: "Step one",
        answerType: "integer",
        answerValue: 32,
        explanationLatex: "because",
        sortOrder: 1,
        hints: [],
      },
    ],
  };
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [{ id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1 }],
    questions: [
      { id: "q1", labTestId: "t1", number: 1, promptLatex: "One", sortOrder: 1, parts: [part] },
    ],
  };
}

describe("createStep", () => {
  it("appends a step to the part with next number/sortOrder and empty hints", () => {
    const { content, id } = createStep(baseContent(), "pa", {
      promptLatex: "Step two",
      answerType: "integer",
      answerValue: 19,
      explanationLatex: "then",
    });
    const step = content.questions[0].parts[0].steps.find((s) => s.id === id);
    expect(step?.number).toBe(2);
    expect(step?.sortOrder).toBe(2);
    expect(step?.hints).toEqual([]);
    expect(step?.partId).toBe("pa");
  });
});

describe("updateStep", () => {
  it("patches a step's fields", () => {
    const next = updateStep(baseContent(), "s1", {
      promptLatex: "Edited",
      answerValue: 40,
    });
    const step = next.questions[0].parts[0].steps.find((s) => s.id === "s1");
    expect(step?.promptLatex).toBe("Edited");
    expect(step?.answerValue).toBe(40);
  });
});

describe("deleteStep", () => {
  it("removes the step", () => {
    const next = deleteStep(baseContent(), "s1");
    expect(next.questions[0].parts[0].steps.some((s) => s.id === "s1")).toBe(false);
  });
});

describe("reorderSteps", () => {
  it("rewrites sortOrder among a part's steps", () => {
    let c = baseContent();
    const added = createStep(c, "pa", {
      promptLatex: "Step two",
      answerType: "integer",
      answerValue: 19,
      explanationLatex: "then",
    });
    c = added.content;
    const next = reorderSteps(c, "pa", [added.id, "s1"]);
    const steps = next.questions[0].parts[0].steps;
    expect(steps.find((s) => s.id === added.id)?.sortOrder).toBe(1);
    expect(steps.find((s) => s.id === "s1")?.sortOrder).toBe(2);
  });
});
