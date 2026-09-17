import type { GradeResult } from "./types";
import { dialect } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

function canonical(members: number[]): number[] {
  return Array.from(new Set(members)).sort((a, b) => a - b);
}

export function gradeSetOfIntegers(
  input: string,
  answer: number[],
  syntax: AnswerSyntax = "numbas"
): GradeResult {
  const d = dialect(syntax);
  const parsed = d.parseSet(input);
  if (parsed === null) {
    return {
      correct: false,
      normalized: input.trim(),
      reason: `Sets look like ${d.formatSet([1, 2, 3])} in this test.`,
    };
  }
  const student = canonical(parsed);
  const expected = canonical(answer);
  const correct =
    student.length === expected.length && student.every((v, i) => v === expected[i]);
  return { correct, normalized: d.formatSet(student) };
}
