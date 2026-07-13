import type { Content } from "./types";
import type { LabTest, Question } from "@/lib/data/types";
import { courses, labTests, questions } from "@/lib/data/fixtures";

export function seedContent(): Content {
  return structuredClone({ courses, labTests, questions });
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${prefix}-${rand}`;
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
  const id = newId("test");
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
  const id = newId("q");
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
