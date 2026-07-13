import { describe, it, expect } from "vitest";
import {
  createPart,
  updatePart,
  deletePart,
  reorderParts,
} from "../content-store";
import type { Content } from "../types";
import type { QuestionPart } from "@/lib/data/types";

function baseContent(): Content {
  const partA: QuestionPart = {
    id: "pa",
    questionId: "q1",
    label: "a",
    promptLatex: "Part a",
    answerType: "integer",
    answerValue: 1,
    sortOrder: 1,
    steps: [],
  };
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [
      { id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1 },
    ],
    questions: [
      { id: "q1", labTestId: "t1", number: 1, promptLatex: "One", sortOrder: 1, parts: [partA] },
    ],
  };
}

describe("createPart", () => {
  it("appends a part to the question with the next sortOrder and empty steps", () => {
    const { content, id } = createPart(baseContent(), "q1", {
      label: "b",
      promptLatex: "Part b",
      answerType: "text",
      answerValue: { text: "Bijective" },
    });
    const q = content.questions.find((x) => x.id === "q1");
    const p = q?.parts.find((x) => x.id === id);
    expect(p?.label).toBe("b");
    expect(p?.sortOrder).toBe(2);
    expect(p?.steps).toEqual([]);
    expect(p?.questionId).toBe("q1");
  });
});

describe("updatePart", () => {
  it("patches the named part's fields", () => {
    const next = updatePart(baseContent(), "pa", {
      promptLatex: "Edited",
      answerType: "set_of_integers",
      answerValue: [1, 2, 3],
    });
    const p = next.questions[0].parts.find((x) => x.id === "pa");
    expect(p?.promptLatex).toBe("Edited");
    expect(p?.answerType).toBe("set_of_integers");
    expect(p?.answerValue).toEqual([1, 2, 3]);
  });
});

describe("deletePart", () => {
  it("removes the part", () => {
    const next = deletePart(baseContent(), "pa");
    expect(next.questions[0].parts.some((x) => x.id === "pa")).toBe(false);
  });
});

describe("reorderParts", () => {
  it("rewrites sortOrder among a question's parts", () => {
    let c = baseContent();
    const added = createPart(c, "q1", {
      label: "b",
      promptLatex: "Part b",
      answerType: "integer",
      answerValue: 2,
    });
    c = added.content;
    const next = reorderParts(c, "q1", [added.id, "pa"]);
    expect(next.questions[0].parts.find((x) => x.id === added.id)?.sortOrder).toBe(1);
    expect(next.questions[0].parts.find((x) => x.id === "pa")?.sortOrder).toBe(2);
  });
});
