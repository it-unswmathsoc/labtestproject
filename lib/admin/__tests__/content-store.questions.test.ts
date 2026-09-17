import { describe, it, expect } from "vitest";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../content-store";
import type { Content } from "../types";

function baseContent(): Content {
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [
      { id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1, answerSyntax: "numbas" },
    ],
    questions: [
      { id: "q1", labTestId: "t1", number: 1, promptLatex: "One", sortOrder: 1, parts: [] },
      { id: "q2", labTestId: "t1", number: 2, promptLatex: "Two", sortOrder: 2, parts: [] },
    ],
  };
}

describe("createQuestion", () => {
  it("appends a question with the next number and sortOrder", () => {
    const { content, id } = createQuestion(baseContent(), "t1", { promptLatex: "Three" });
    const q = content.questions.find((x) => x.id === id);
    expect(q?.number).toBe(3);
    expect(q?.sortOrder).toBe(3);
    expect(q?.parts).toEqual([]);
    expect(q?.labTestId).toBe("t1");
  });

  it("numbers the first question of a test as 1", () => {
    const { content, id } = createQuestion(baseContent(), "t2", { promptLatex: "First" });
    expect(content.questions.find((x) => x.id === id)?.number).toBe(1);
  });
});

describe("updateQuestion", () => {
  it("patches stem and note", () => {
    const next = updateQuestion(baseContent(), "q1", {
      promptLatex: "Edited",
      noteLatex: "note",
    });
    const q = next.questions.find((x) => x.id === "q1");
    expect(q?.promptLatex).toBe("Edited");
    expect(q?.noteLatex).toBe("note");
  });
});

describe("deleteQuestion", () => {
  it("removes the question", () => {
    const next = deleteQuestion(baseContent(), "q1");
    expect(next.questions.some((x) => x.id === "q1")).toBe(false);
    expect(next.questions.some((x) => x.id === "q2")).toBe(true);
  });
});

describe("reorderQuestions", () => {
  it("rewrites sortOrder within the test", () => {
    const next = reorderQuestions(baseContent(), "t1", ["q2", "q1"]);
    expect(next.questions.find((x) => x.id === "q2")?.sortOrder).toBe(1);
    expect(next.questions.find((x) => x.id === "q1")?.sortOrder).toBe(2);
  });
});
