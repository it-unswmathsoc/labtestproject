import type { AnswerConfig, GradeResult } from "./types";

export function gradeInteger(
  input: string,
  answer: number,
  config: AnswerConfig = {}
): GradeResult {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return { correct: false, normalized: trimmed };
  }
  const parsed = Number(trimmed);
  const tolerance = config.tolerance ?? 0;
  const correct = Math.abs(parsed - answer) <= tolerance;
  return { correct, normalized: String(parsed) };
}
