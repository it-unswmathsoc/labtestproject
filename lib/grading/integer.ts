import type { AnswerConfig, GradeResult } from "./types";

export function gradeInteger(
  input: string,
  answer: number,
  config: AnswerConfig = {}
): GradeResult {
  const trimmed = input.trim();
  const parsed = Number(trimmed);
  if (trimmed === "" || Number.isNaN(parsed)) {
    return { correct: false, normalized: trimmed };
  }
  const tolerance = config.tolerance ?? 0;
  const correct = Math.abs(parsed - answer) <= tolerance;
  return { correct, normalized: String(parsed) };
}
