import type { Content } from "./types";
import type { Course, LabTest, Question, QuestionPart, Step, Hint } from "@/lib/data/types";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import { courses, labTests, questions } from "@/lib/data/fixtures";

export function seedContent(): Content {
  return structuredClone({ courses, labTests, questions });
}

/** Ids go straight into `uuid` columns, so they must be valid UUIDs. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Non-secure browser contexts only; Node and jsdom both provide randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createCourse(
  content: Content,
  input: { code: string; name: string; description?: string }
): { content: Content; id: string } {
  const id = newId();
  const sortOrder = content.courses.length
    ? Math.max(...content.courses.map((c) => c.sortOrder)) + 1
    : 1;
  const course: Course = { id, sortOrder, ...input };
  return { content: { ...content, courses: [...content.courses, course] }, id };
}

export function updateCourse(
  content: Content,
  id: string,
  patch: Partial<Omit<Course, "id">>
): Content {
  return {
    ...content,
    courses: content.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
}

/** The database cascades course -> lab_tests -> questions; mirror that locally. */
export function deleteCourse(content: Content, id: string): Content {
  const orphanedTestIds = new Set(
    content.labTests.filter((t) => t.courseId === id).map((t) => t.id)
  );
  return {
    courses: content.courses.filter((c) => c.id !== id),
    labTests: content.labTests.filter((t) => t.courseId !== id),
    questions: content.questions.filter((q) => !orphanedTestIds.has(q.labTestId)),
  };
}

export function createTest(
  content: Content,
  input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
  }
): { content: Content; id: string } {
  const id = newId();
  const siblings = content.labTests.filter((t) => t.courseId === input.courseId);
  const sortOrder = siblings.length
    ? Math.max(...siblings.map((t) => t.sortOrder)) + 1
    : 1;
  const test: LabTest = { id, sortOrder, ...input };
  return { content: { ...content, labTests: [...content.labTests, test] }, id };
}

export function updateTest(
  content: Content,
  id: string,
  patch: Partial<Omit<LabTest, "id">>
): Content {
  return {
    ...content,
    labTests: content.labTests.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
}

export function deleteTest(content: Content, id: string): Content {
  return {
    ...content,
    labTests: content.labTests.filter((t) => t.id !== id),
    questions: content.questions.filter((q) => q.labTestId !== id),
  };
}

export function reorderTests(
  content: Content,
  courseId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    labTests: content.labTests.map((t) =>
      t.courseId === courseId && order.has(t.id)
        ? { ...t, sortOrder: order.get(t.id) as number }
        : t
    ),
  };
}

export function createQuestion(
  content: Content,
  testId: string,
  input: { promptLatex: string; noteLatex?: string }
): { content: Content; id: string } {
  const id = newId();
  const siblings = content.questions.filter((q) => q.labTestId === testId);
  const nextNum = siblings.length
    ? Math.max(...siblings.map((q) => q.number)) + 1
    : 1;
  const sortOrder = siblings.length
    ? Math.max(...siblings.map((q) => q.sortOrder)) + 1
    : 1;
  const question: Question = {
    id,
    labTestId: testId,
    number: nextNum,
    promptLatex: input.promptLatex,
    noteLatex: input.noteLatex,
    sortOrder,
    parts: [],
  };
  return { content: { ...content, questions: [...content.questions, question] }, id };
}

export function updateQuestion(
  content: Content,
  id: string,
  patch: Partial<Omit<Question, "id" | "parts">>
): Content {
  return {
    ...content,
    questions: content.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
  };
}

export function deleteQuestion(content: Content, id: string): Content {
  return {
    ...content,
    questions: content.questions.filter((q) => q.id !== id),
  };
}

export function reorderQuestions(
  content: Content,
  testId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    questions: content.questions.map((q) =>
      q.labTestId === testId && order.has(q.id)
        ? { ...q, sortOrder: order.get(q.id) as number }
        : q
    ),
  };
}

export function createPart(
  content: Content,
  questionId: string,
  input: {
    label: string;
    promptLatex: string;
    imageUrl?: string;
    imageAlt?: string;
    answerType: AnswerType;
    answerValue: AnswerValue;
    answerConfig?: AnswerConfig;
  }
): { content: Content; id: string } {
  const id = newId();
  return {
    content: {
      ...content,
      questions: content.questions.map((q) => {
        if (q.id !== questionId) return q;
        const sortOrder = q.parts.length
          ? Math.max(...q.parts.map((p) => p.sortOrder)) + 1
          : 1;
        const part: QuestionPart = { id, questionId, sortOrder, steps: [], ...input };
        return { ...q, parts: [...q.parts, part] };
      }),
    },
    id,
  };
}

export function updatePart(
  content: Content,
  partId: string,
  patch: Partial<Omit<QuestionPart, "id" | "questionId" | "steps">>
): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)),
    })),
  };
}

export function deletePart(content: Content, partId: string): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.filter((p) => p.id !== partId),
    })),
  };
}

export function reorderParts(
  content: Content,
  questionId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    questions: content.questions.map((q) =>
      q.id !== questionId
        ? q
        : {
            ...q,
            parts: q.parts.map((p) =>
              order.has(p.id) ? { ...p, sortOrder: order.get(p.id) as number } : p
            ),
          }
    ),
  };
}

export function createStep(
  content: Content,
  partId: string,
  input: {
    promptLatex: string;
    answerType: AnswerType;
    answerValue: AnswerValue;
    answerConfig?: AnswerConfig;
    explanationLatex: string;
  }
): { content: Content; id: string } {
  const id = newId();
  return {
    content: {
      ...content,
      questions: content.questions.map((q) => ({
        ...q,
        parts: q.parts.map((p) => {
          if (p.id !== partId) return p;
          const number = p.steps.length
            ? Math.max(...p.steps.map((s) => s.number)) + 1
            : 1;
          const sortOrder = p.steps.length
            ? Math.max(...p.steps.map((s) => s.sortOrder)) + 1
            : 1;
          const step: Step = { id, partId, number, sortOrder, hints: [], ...input };
          return { ...p, steps: [...p.steps, step] };
        }),
      })),
    },
    id,
  };
}

export function updateStep(
  content: Content,
  stepId: string,
  patch: Partial<Omit<Step, "id" | "partId" | "hints">>
): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => ({
        ...p,
        steps: p.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
      })),
    })),
  };
}

export function deleteStep(content: Content, stepId: string): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => {
        if (!p.steps.some((s) => s.id === stepId)) return p;
        const remaining = p.steps
          .filter((s) => s.id !== stepId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s, i) => ({ ...s, number: i + 1, sortOrder: i + 1 }));
        return { ...p, steps: remaining };
      }),
    })),
  };
}

export function reorderSteps(
  content: Content,
  partId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) =>
        p.id !== partId
          ? p
          : {
              ...p,
              steps: p.steps.map((s) =>
                order.has(s.id)
                  ? { ...s, sortOrder: order.get(s.id) as number, number: order.get(s.id) as number }
                  : s
              ),
            }
      ),
    })),
  };
}

function mapSteps(content: Content, fn: (steps: Step[]) => Step[]): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => ({ ...p, steps: fn(p.steps) })),
    })),
  };
}

export function createHint(
  content: Content,
  stepId: string,
  input: { bodyLatex: string }
): { content: Content; id: string } {
  const id = newId();
  const next = mapSteps(content, (steps) =>
    steps.map((s) => {
      if (s.id !== stepId) return s;
      const number = s.hints.length
        ? Math.max(...s.hints.map((h) => h.number)) + 1
        : 1;
      const sortOrder = s.hints.length
        ? Math.max(...s.hints.map((h) => h.sortOrder)) + 1
        : 1;
      const hint: Hint = { id, stepId, number, sortOrder, bodyLatex: input.bodyLatex };
      return { ...s, hints: [...s.hints, hint] };
    })
  );
  return { content: next, id };
}

export function updateHint(
  content: Content,
  hintId: string,
  patch: Partial<Omit<Hint, "id" | "stepId">>
): Content {
  return mapSteps(content, (steps) =>
    steps.map((s) => ({
      ...s,
      hints: s.hints.map((h) => (h.id === hintId ? { ...h, ...patch } : h)),
    }))
  );
}

export function deleteHint(content: Content, hintId: string): Content {
  return mapSteps(content, (steps) =>
    steps.map((s) => {
      if (!s.hints.some((h) => h.id === hintId)) return s;
      const remaining = s.hints
        .filter((h) => h.id !== hintId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((h, i) => ({ ...h, number: i + 1, sortOrder: i + 1 }));
      return { ...s, hints: remaining };
    })
  );
}

export function reorderHints(
  content: Content,
  stepId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return mapSteps(content, (steps) =>
    steps.map((s) =>
      s.id !== stepId
        ? s
        : {
            ...s,
            hints: s.hints.map((h) =>
              order.has(h.id)
                ? { ...h, sortOrder: order.get(h.id) as number, number: order.get(h.id) as number }
                : h
            ),
          }
    )
  );
}
