import { vi } from "vitest";
import type { Content } from "@/lib/admin/types";

export interface Call {
  table: string;
  op: "insert" | "update" | "delete";
  payload?: Record<string, unknown>;
}

export const calls: Call[] = [];
export const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];

let content: Content = { courses: [], labTests: [], questions: [] };
let failNext = false;

export function seed(next: Content) {
  content = next;
}

export function failNextWrite() {
  failNext = true;
}

export function reset() {
  calls.length = 0;
  rpcCalls.length = 0;
  failNext = false;
}

/** PostgREST builders are thenables that resolve to { data, error }. */
function result(data: unknown) {
  const settle = () => {
    if (failNext) {
      failNext = false;
      return { data: null, error: { message: "write failed" } };
    }
    return { data, error: null };
  };
  const builder = {
    select: () => builder,
    order: () => builder,
    eq: () => builder,
    then: (onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve(settle()).then(onFulfilled),
  };
  return builder;
}

const rowsFor = (table: string) => {
  if (table === "courses") return content.courses.map((c) => ({
    id: c.id, code: c.code, name: c.name,
    description: c.description ?? null, sort_order: c.sortOrder,
  }));
  if (table === "lab_tests") return content.labTests.map((t) => ({
    id: t.id, course_id: t.courseId, name: t.name, term: t.term ?? null,
    description: t.description ?? null, is_published: t.isPublished,
    sort_order: t.sortOrder,
  }));
  if (table === "questions") return content.questions.map((q) => ({
    id: q.id, lab_test_id: q.labTestId, number: q.number,
    prompt_latex: q.promptLatex, note_latex: q.noteLatex ?? null,
    sort_order: q.sortOrder,
    question_parts: q.parts.map((p) => ({
      id: p.id, question_id: p.questionId, label: p.label,
      prompt_latex: p.promptLatex, image_url: p.imageUrl ?? null,
      image_alt: p.imageAlt ?? null, answer_type: p.answerType,
      answer_value: p.answerValue, answer_config: p.answerConfig ?? null,
      sort_order: p.sortOrder,
      steps: p.steps.map((s) => ({
        id: s.id, part_id: s.partId, number: s.number,
        prompt_latex: s.promptLatex, answer_type: s.answerType,
        answer_value: s.answerValue, answer_config: s.answerConfig ?? null,
        explanation_latex: s.explanationLatex, sort_order: s.sortOrder,
        hints: s.hints.map((h) => ({
          id: h.id, step_id: h.stepId, number: h.number,
          body_latex: h.bodyLatex, sort_order: h.sortOrder,
        })),
      })),
    })),
  }));
  return [];
};

export const client = {
  from: (table: string) => ({
    select: () => result(rowsFor(table)),
    insert: (payload: Record<string, unknown>) => {
      calls.push({ table, op: "insert", payload });
      return result(null);
    },
    update: (payload: Record<string, unknown>) => {
      calls.push({ table, op: "update", payload });
      return result(null);
    },
    delete: () => {
      calls.push({ table, op: "delete" });
      return result(null);
    },
  }),
  rpc: (fn: string, args: Record<string, unknown>) => {
    rpcCalls.push({ fn, args });
    return result(null);
  },
};

export const createClient = vi.fn(() => client);
