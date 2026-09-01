import { describe, it, expect } from "vitest";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import {
  toCourse,
  toLabTest,
  toHint,
  toStep,
  toQuestionPart,
  toQuestion,
} from "../mappers";

const baseTimestamps = { created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };

describe("toCourse", () => {
  it("maps snake_case to camelCase and coalesces null description", () => {
    const course = toCourse({
      id: "c-1",
      code: "MATH1081",
      name: "Discrete Mathematics",
      description: null,
      sort_order: 1,
      ...baseTimestamps,
    });
    expect(course).toEqual({
      id: "c-1",
      code: "MATH1081",
      name: "Discrete Mathematics",
      description: undefined,
      sortOrder: 1,
    });
  });

  it("keeps a present description", () => {
    const course = toCourse({
      id: "c-1",
      code: "MATH1081",
      name: "Discrete Mathematics",
      description: "Sets, logic, graphs.",
      sort_order: 1,
      ...baseTimestamps,
    });
    expect(course.description).toBe("Sets, logic, graphs.");
  });
});

describe("toLabTest", () => {
  it("maps fields and coalesces null term/description", () => {
    const test = toLabTest({
      id: "t-1",
      course_id: "c-1",
      name: "Lab Test 1",
      term: null,
      description: null,
      is_published: true,
      sort_order: 1,
      ...baseTimestamps,
    });
    expect(test).toEqual({
      id: "t-1",
      courseId: "c-1",
      name: "Lab Test 1",
      term: undefined,
      description: undefined,
      isPublished: true,
      sortOrder: 1,
    });
  });
});

describe("toHint", () => {
  it("maps fields", () => {
    const hint = toHint({
      id: "h-1",
      step_id: "s-1",
      number: 1,
      body_latex: "Think about it.",
      sort_order: 1,
      ...baseTimestamps,
    });
    expect(hint).toEqual({
      id: "h-1",
      stepId: "s-1",
      number: 1,
      bodyLatex: "Think about it.",
      sortOrder: 1,
    });
  });
});

function stepRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "s-1",
    part_id: "p-1",
    number: 1,
    prompt_latex: "Find x.",
    answer_type: "integer",
    answer_value: 19,
    answer_config: null,
    explanation_latex: "Because.",
    sort_order: 1,
    ...baseTimestamps,
    ...overrides,
  };
}

describe("toStep", () => {
  it("maps a null hints embed to an empty array", () => {
    const step = toStep(stepRow({ hints: null }) as never);
    expect(step.hints).toEqual([]);
  });

  it("maps a missing hints embed to an empty array", () => {
    const step = toStep(stepRow() as never);
    expect(step.hints).toEqual([]);
  });

  it("maps and sorts a present hints embed", () => {
    const step = toStep(
      stepRow({
        hints: [
          { id: "h-2", step_id: "s-1", number: 2, body_latex: "second", sort_order: 2, ...baseTimestamps },
          { id: "h-1", step_id: "s-1", number: 1, body_latex: "first", sort_order: 1, ...baseTimestamps },
        ],
      }) as never
    );
    expect(step.hints.map((h) => h.id)).toEqual(["h-1", "h-2"]);
  });
});

function partRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "p-1",
    question_id: "q-1",
    label: "a",
    prompt_latex: "Find x.",
    image_url: null,
    image_alt: null,
    answer_type: "integer",
    answer_value: 19,
    answer_config: null,
    sort_order: 1,
    ...baseTimestamps,
    ...overrides,
  };
}

describe("toQuestionPart", () => {
  it("maps a null steps embed to an empty array", () => {
    const part = toQuestionPart(partRow({ steps: null }) as never);
    expect(part.steps).toEqual([]);
  });

  it("maps a missing steps embed to an empty array", () => {
    const part = toQuestionPart(partRow() as never);
    expect(part.steps).toEqual([]);
  });

  it("coalesces null imageUrl/imageAlt/answerConfig to undefined", () => {
    const part = toQuestionPart(partRow() as never);
    expect(part.imageUrl).toBeUndefined();
    expect(part.imageAlt).toBeUndefined();
    expect(part.answerConfig).toBeUndefined();
  });

  it("keeps a present image and answer config", () => {
    const part = toQuestionPart(
      partRow({
        image_url: "/questions/x.png",
        image_alt: "diagram",
        answer_config: { options: [{ value: "a", label: "A" }] },
      }) as never
    );
    expect(part.imageUrl).toBe("/questions/x.png");
    expect(part.imageAlt).toBe("diagram");
    expect(part.answerConfig).toEqual({ options: [{ value: "a", label: "A" }] });
  });

  it("maps and sorts a present steps embed", () => {
    const part = toQuestionPart(
      partRow({
        steps: [
          stepRow({ id: "s-2", number: 2, sort_order: 2, hints: null }),
          stepRow({ id: "s-1", number: 1, sort_order: 1, hints: null }),
        ],
      }) as never
    );
    expect(part.steps.map((s) => s.id)).toEqual(["s-1", "s-2"]);
  });
});

function questionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "q-1",
    lab_test_id: "t-1",
    number: 1,
    prompt_latex: "Consider the following.",
    note_latex: null,
    sort_order: 1,
    ...baseTimestamps,
    ...overrides,
  };
}

describe("toQuestion", () => {
  it("maps a null question_parts embed to an empty array", () => {
    const question = toQuestion(questionRow({ question_parts: null }) as never);
    expect(question.parts).toEqual([]);
  });

  it("maps a missing question_parts embed to an empty array", () => {
    const question = toQuestion(questionRow() as never);
    expect(question.parts).toEqual([]);
  });

  it("maps and sorts a full nested tree given out of order", () => {
    const question = toQuestion(
      questionRow({
        question_parts: [
          partRow({
            id: "p-b",
            label: "b",
            sort_order: 2,
            steps: null,
          }),
          partRow({
            id: "p-a",
            label: "a",
            sort_order: 1,
            steps: [
              stepRow({
                id: "s-a-2",
                part_id: "p-a",
                number: 2,
                sort_order: 2,
                hints: [
                  { id: "h-a-2-1", step_id: "s-a-2", number: 1, body_latex: "x", sort_order: 1, ...baseTimestamps },
                ],
              }),
              stepRow({
                id: "s-a-1",
                part_id: "p-a",
                number: 1,
                sort_order: 1,
                hints: null,
              }),
            ],
          }),
        ],
      }) as never
    );

    expect(question.parts.map((p) => p.id)).toEqual(["p-a", "p-b"]);
    expect(question.parts[0].steps.map((s) => s.id)).toEqual(["s-a-1", "s-a-2"]);
    expect(question.parts[0].steps[1].hints.map((h) => h.id)).toEqual(["h-a-2-1"]);
    expect(question.parts[1].steps).toEqual([]);
  });
});

const answerCases: {
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
}[] = [
  { answerType: "integer", answerValue: 19 },
  { answerType: "expression", answerValue: { mobius: "2^100" } },
  { answerType: "set_of_integers", answerValue: [14, 15, 16, 17, 18] },
  {
    answerType: "single_choice",
    answerValue: { choice: "not_surjective" },
    answerConfig: {
      options: [
        { value: "injective", label: "injective" },
        { value: "not_surjective", label: "not surjective" },
      ],
    },
  },
  {
    answerType: "multi_select",
    answerValue: { selected: ["reflexive", "symmetric"] },
    answerConfig: {
      options: [
        { value: "reflexive", label: "Reflexive" },
        { value: "symmetric", label: "Symmetric" },
      ],
    },
  },
  { answerType: "text", answerValue: { text: "Bijective" }, answerConfig: { caseInsensitive: true } },
];

describe.each(answerCases)(
  "answer type %s round-trips through toQuestionPart/toStep",
  ({ answerType, answerValue, answerConfig }) => {
    it("toQuestionPart", () => {
      const part = toQuestionPart(
        partRow({
          answer_type: answerType,
          answer_value: answerValue,
          answer_config: answerConfig ?? null,
        }) as never
      );
      expect(part.answerType).toBe(answerType);
      expect(part.answerValue).toEqual(answerValue);
      expect(part.answerConfig).toEqual(answerConfig);
    });

    it("toStep", () => {
      const step = toStep(
        stepRow({
          answer_type: answerType,
          answer_value: answerValue,
          answer_config: answerConfig ?? null,
          hints: null,
        }) as never
      );
      expect(step.answerType).toBe(answerType);
      expect(step.answerValue).toEqual(answerValue);
      expect(step.answerConfig).toEqual(answerConfig);
    });
  }
);
