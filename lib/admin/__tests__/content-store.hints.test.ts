import { describe, it, expect } from "vitest";
import { createHint, updateHint, deleteHint, reorderHints } from "../content-store";
import type { Content } from "../types";

function baseContent(): Content {
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [{ id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1, answerSyntax: "numbas" }],
    questions: [
      {
        id: "q1",
        labTestId: "t1",
        number: 1,
        promptLatex: "One",
        sortOrder: 1,
        parts: [
          {
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
                hints: [
                  { id: "h1", stepId: "s1", number: 1, bodyLatex: "First", sortOrder: 1 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

const step = (c: Content) => c.questions[0].parts[0].steps[0];

describe("createHint", () => {
  it("appends a hint to the step with next number/sortOrder", () => {
    const { content, id } = createHint(baseContent(), "s1", { bodyLatex: "Second" });
    const h = step(content).hints.find((x) => x.id === id);
    expect(h?.number).toBe(2);
    expect(h?.sortOrder).toBe(2);
    expect(h?.stepId).toBe("s1");
  });
});

describe("updateHint", () => {
  it("patches a hint body", () => {
    const next = updateHint(baseContent(), "h1", { bodyLatex: "Edited" });
    expect(step(next).hints.find((x) => x.id === "h1")?.bodyLatex).toBe("Edited");
  });
});

describe("deleteHint", () => {
  it("removes the hint", () => {
    const next = deleteHint(baseContent(), "h1");
    expect(step(next).hints.some((x) => x.id === "h1")).toBe(false);
  });
});

describe("reorderHints", () => {
  it("rewrites sortOrder among a step's hints", () => {
    let c = baseContent();
    const added = createHint(c, "s1", { bodyLatex: "Second" });
    c = added.content;
    const next = reorderHints(c, "s1", [added.id, "h1"]);
    expect(step(next).hints.find((x) => x.id === added.id)?.sortOrder).toBe(1);
    expect(step(next).hints.find((x) => x.id === "h1")?.sortOrder).toBe(2);
  });
});

describe("hint renumbering", () => {
  it("renumbers remaining hints after a delete", () => {
    let c = baseContent();
    const two = createHint(c, "s1", { bodyLatex: "two" });
    c = two.content;
    const three = createHint(c, "s1", { bodyLatex: "three" });
    c = three.content;
    const next = deleteHint(c, "h1");
    const hints = [...step(next).hints].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(hints.map((h) => h.number)).toEqual([1, 2]);
  });

  it("renumbers hints to match a reorder", () => {
    let c = baseContent();
    const two = createHint(c, "s1", { bodyLatex: "two" });
    c = two.content;
    const next = reorderHints(c, "s1", [two.id, "h1"]);
    expect(step(next).hints.find((h) => h.id === two.id)?.number).toBe(1);
    expect(step(next).hints.find((h) => h.id === "h1")?.number).toBe(2);
  });
});
