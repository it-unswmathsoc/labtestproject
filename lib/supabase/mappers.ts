import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import type { Course, LabTest, Question, QuestionPart, Step, Hint } from "@/lib/data/types";
import type { Database } from "./database.types";
import { ANSWER_SYNTAXES } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** PostgREST embeds can come back null or absent; never sort one directly. */
function sorted<T extends { sort_order: number }>(rows: T[] | null | undefined): T[] {
  return (rows ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
}

/** A row predating the column, or hand-edited, must still render rather than crash. */
function toAnswerSyntax(value: string | null | undefined): AnswerSyntax {
  return ANSWER_SYNTAXES.includes(value as AnswerSyntax)
    ? (value as AnswerSyntax)
    : "numbas";
}

export function toCourse(row: Row<"courses">): Course {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    sortOrder: row.sort_order,
  };
}

export function toLabTest(row: Row<"lab_tests">): LabTest {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    term: row.term ?? undefined,
    description: row.description ?? undefined,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    answerSyntax: toAnswerSyntax(row.answer_syntax),
  };
}

export function toHint(row: Row<"hints">): Hint {
  return {
    id: row.id,
    stepId: row.step_id,
    number: row.number,
    bodyLatex: row.body_latex,
    sortOrder: row.sort_order,
  };
}

type StepRow = Row<"steps"> & { hints?: Row<"hints">[] | null };

export function toStep(row: StepRow): Step {
  return {
    id: row.id,
    partId: row.part_id,
    number: row.number,
    promptLatex: row.prompt_latex,
    answerType: row.answer_type as AnswerType,
    answerValue: row.answer_value as AnswerValue,
    answerConfig: (row.answer_config as AnswerConfig | null) ?? undefined,
    explanationLatex: row.explanation_latex,
    sortOrder: row.sort_order,
    hints: sorted(row.hints).map(toHint),
  };
}

type PartRow = Row<"question_parts"> & { steps?: StepRow[] | null };

export function toQuestionPart(row: PartRow): QuestionPart {
  return {
    id: row.id,
    questionId: row.question_id,
    label: row.label,
    promptLatex: row.prompt_latex,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    answerType: row.answer_type as AnswerType,
    answerValue: row.answer_value as AnswerValue,
    answerConfig: (row.answer_config as AnswerConfig | null) ?? undefined,
    sortOrder: row.sort_order,
    steps: sorted(row.steps).map(toStep),
  };
}

type QuestionRow = Row<"questions"> & { question_parts?: PartRow[] | null };

export function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    labTestId: row.lab_test_id,
    number: row.number,
    promptLatex: row.prompt_latex,
    noteLatex: row.note_latex ?? undefined,
    sortOrder: row.sort_order,
    parts: sorted(row.question_parts).map(toQuestionPart),
  };
}

/** Nested select shared by every question read. */
export const QUESTION_TREE_SELECT =
  "*, question_parts(*, steps(*, hints(*)))" as const;
