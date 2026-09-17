import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import type { AnswerSyntax } from "@/lib/math/syntax";

export interface Course {
  id: string;
  code: string; // "MATH1081"
  name: string; // "Discrete Mathematics"
  description?: string;
  sortOrder: number;
}

export interface LabTest {
  id: string;
  courseId: string;
  name: string; // "Lab Test 1"
  term?: string; // "2026 T1"
  description?: string;
  isPublished: boolean;
  sortOrder: number;
  /** The syntax students must answer in. Defaults to numbas for older rows. */
  answerSyntax: AnswerSyntax;
}

export interface Question {
  id: string;
  labTestId: string;
  number: number;
  promptLatex: string;
  noteLatex?: string;
  sortOrder: number;
  parts: QuestionPart[];
}

export interface QuestionPart {
  id: string;
  questionId: string;
  label: string; // "a", "b.i"
  promptLatex: string;
  imageUrl?: string; // optional diagram (e.g. an arrow diagram), served from /public
  imageAlt?: string;
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  sortOrder: number;
  steps: Step[];
}

export interface Step {
  id: string;
  partId: string;
  number: number;
  promptLatex: string;
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  explanationLatex: string;
  sortOrder: number;
  hints: Hint[];
}

export interface Hint {
  id: string;
  stepId: string;
  number: number;
  bodyLatex: string;
  sortOrder: number;
}
