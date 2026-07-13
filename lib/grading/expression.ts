import type { GradeResult } from "./types";

export function normalizeExpression(input: string): string {
  return input.trim().replace(/\s+/g, "").toLowerCase();
}

export function gradeExpression(
  input: string,
  answer: { mobius: string }
): GradeResult {
  const a = normalizeExpression(input);
  const b = normalizeExpression(answer.mobius);
  return { correct: a !== "" && a === b, normalized: input.trim() };
}
