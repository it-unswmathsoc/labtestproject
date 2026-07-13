import type { GradeResult } from "./types";

export function gradeSingleChoice(
  input: string,
  answer: { choice: string }
): GradeResult {
  const normalized = input.trim();
  return { correct: normalized !== "" && normalized === answer.choice, normalized };
}
