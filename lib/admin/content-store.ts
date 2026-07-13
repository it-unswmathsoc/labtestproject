import type { Content } from "./types";
import type { LabTest } from "@/lib/data/types";
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
