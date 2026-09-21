import type { Course, LabTest, Question, QuestionPart, Step, Hint } from "@/lib/data/types";
import type { Content } from "@/lib/admin/types";
import type { Json } from "./database.types";
import { createClient } from "./client";
import { toCourse, toLabTest, toQuestion, QUESTION_TREE_SELECT } from "./mappers";
import { MutationQueue } from "./mutation-queue";

const supabase = () => createClient();

type Result = { error: { message: string } | null };

async function exec(query: PromiseLike<Result>): Promise<void> {
  const { error } = await query;
  if (error) throw new Error(error.message);
}

function orThrow({ error }: Result) {
  if (error) throw new Error(error.message);
}

/** Domain answer types are JSON-serialisable but lack Json's index signature. */
const asJson = (value: unknown) => value as Json;

/** Admins are authenticated, so RLS shows them drafts too. */
export async function fetchContent(): Promise<Content> {
  const client = supabase();
  const [courses, labTests, questions] = await Promise.all([
    client.from("courses").select("*").order("sort_order"),
    client.from("lab_tests").select("*").order("sort_order"),
    client.from("questions").select(QUESTION_TREE_SELECT).order("sort_order"),
  ]);

  orThrow(courses);
  orThrow(labTests);
  orThrow(questions);

  return {
    courses: (courses.data ?? []).map(toCourse),
    labTests: (labTests.data ?? []).map(toLabTest),
    questions: (questions.data ?? []).map(toQuestion),
  };
}

export const insertCourse = (course: Course) =>
  exec(
    supabase()
      .from("courses")
      .insert({
        id: course.id,
        code: course.code,
        name: course.name,
        description: course.description ?? null,
        sort_order: course.sortOrder,
      })
  );

export const updateCourse = (id: string, patch: Partial<Course>) =>
  exec(
    supabase()
      .from("courses")
      .update({
        ...(patch.code !== undefined && { code: patch.code }),
        ...(patch.name !== undefined && { name: patch.name }),
        ...("description" in patch && { description: patch.description ?? null }),
        ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
      })
      .eq("id", id)
  );

export const insertLabTest = (test: LabTest) =>
  exec(
    supabase()
      .from("lab_tests")
      .insert({
        id: test.id,
        course_id: test.courseId,
        name: test.name,
        term: test.term ?? null,
        description: test.description ?? null,
        is_published: test.isPublished,
        sort_order: test.sortOrder,
        answer_syntax: test.answerSyntax,
      })
  );

export const updateLabTest = (id: string, patch: Partial<LabTest>) =>
  exec(
    supabase()
      .from("lab_tests")
      .update({
        ...(patch.courseId !== undefined && { course_id: patch.courseId }),
        ...(patch.name !== undefined && { name: patch.name }),
        ...("term" in patch && { term: patch.term ?? null }),
        ...("description" in patch && { description: patch.description ?? null }),
        ...(patch.isPublished !== undefined && { is_published: patch.isPublished }),
        ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
        ...(patch.answerSyntax !== undefined && { answer_syntax: patch.answerSyntax }),
      })
      .eq("id", id)
  );

export const insertQuestion = (question: Question) =>
  exec(
    supabase()
      .from("questions")
      .insert({
        id: question.id,
        lab_test_id: question.labTestId,
        number: question.number,
        prompt_latex: question.promptLatex,
        note_latex: question.noteLatex ?? null,
        sort_order: question.sortOrder,
      })
  );

export const updateQuestion = (id: string, patch: Partial<Question>) =>
  exec(
    supabase()
      .from("questions")
      .update({
        ...(patch.number !== undefined && { number: patch.number }),
        ...(patch.promptLatex !== undefined && { prompt_latex: patch.promptLatex }),
        ...("noteLatex" in patch && { note_latex: patch.noteLatex ?? null }),
        ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
      })
      .eq("id", id)
  );

export const insertPart = (part: QuestionPart) =>
  exec(
    supabase()
      .from("question_parts")
      .insert({
        id: part.id,
        question_id: part.questionId,
        label: part.label,
        prompt_latex: part.promptLatex,
        image_url: part.imageUrl ?? null,
        image_alt: part.imageAlt ?? null,
        answer_type: part.answerType,
        answer_value: asJson(part.answerValue),
        answer_config: asJson(part.answerConfig ?? null),
        sort_order: part.sortOrder,
      })
  );

export const updatePart = (id: string, patch: Partial<QuestionPart>) =>
  exec(
    supabase()
      .from("question_parts")
      .update({
        ...(patch.label !== undefined && { label: patch.label }),
        ...(patch.promptLatex !== undefined && { prompt_latex: patch.promptLatex }),
        ...("imageUrl" in patch && { image_url: patch.imageUrl ?? null }),
        ...("imageAlt" in patch && { image_alt: patch.imageAlt ?? null }),
        ...(patch.answerType !== undefined && { answer_type: patch.answerType }),
        ...(patch.answerValue !== undefined && { answer_value: asJson(patch.answerValue) }),
        ...("answerConfig" in patch && { answer_config: asJson(patch.answerConfig ?? null) }),
        ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
      })
      .eq("id", id)
  );

export const insertStep = (step: Step) =>
  exec(
    supabase()
      .from("steps")
      .insert({
        id: step.id,
        part_id: step.partId,
        number: step.number,
        prompt_latex: step.promptLatex,
        answer_type: step.answerType,
        answer_value: asJson(step.answerValue),
        answer_config: asJson(step.answerConfig ?? null),
        explanation_latex: step.explanationLatex,
        sort_order: step.sortOrder,
      })
  );

export const updateStep = (id: string, patch: Partial<Step>) =>
  exec(
    supabase()
      .from("steps")
      .update({
        ...(patch.number !== undefined && { number: patch.number }),
        ...(patch.promptLatex !== undefined && { prompt_latex: patch.promptLatex }),
        ...(patch.answerType !== undefined && { answer_type: patch.answerType }),
        ...(patch.answerValue !== undefined && { answer_value: asJson(patch.answerValue) }),
        ...("answerConfig" in patch && { answer_config: asJson(patch.answerConfig ?? null) }),
        ...(patch.explanationLatex !== undefined && {
          explanation_latex: patch.explanationLatex,
        }),
        ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
      })
      .eq("id", id)
  );

export const insertHint = (hint: Hint) =>
  exec(
    supabase()
      .from("hints")
      .insert({
        id: hint.id,
        step_id: hint.stepId,
        number: hint.number,
        body_latex: hint.bodyLatex,
        sort_order: hint.sortOrder,
      })
  );

export const updateHint = (id: string, patch: Partial<Hint>) =>
  exec(
    supabase()
      .from("hints")
      .update({
        ...(patch.number !== undefined && { number: patch.number }),
        ...(patch.bodyLatex !== undefined && { body_latex: patch.bodyLatex }),
        ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
      })
      .eq("id", id)
  );

type Table =
  | "courses"
  | "lab_tests"
  | "questions"
  | "question_parts"
  | "steps"
  | "hints";

/** Children go with the row; the database cascades. */
export const deleteRow = (table: Table, id: string) =>
  exec(
    supabase().from(table).delete().eq("id", id)
  );

type ReorderRpc =
  | "reorder_lab_tests"
  | "reorder_questions"
  | "reorder_parts"
  | "reorder_steps"
  | "reorder_hints";

const REORDER_PARENT_ARG: Record<ReorderRpc, string> = {
  reorder_lab_tests: "p_course_id",
  reorder_questions: "p_lab_test_id",
  reorder_parts: "p_question_id",
  reorder_steps: "p_part_id",
  reorder_hints: "p_step_id",
};

export const reorder = (rpc: ReorderRpc, parentId: string, orderedIds: string[]) =>
  exec(
    supabase()
      .rpc(rpc, { [REORDER_PARENT_ARG[rpc]]: parentId, p_ids: orderedIds } as never)
  );

export { MutationQueue };
