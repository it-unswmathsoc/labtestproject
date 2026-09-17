import type { GradeResult } from "./types";
import { dialect } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

export function gradeExpression(
  input: string,
  answer: { mobius: string },
  syntax: AnswerSyntax = "numbas"
): GradeResult {
  const d = dialect(syntax);
  const student = d.normalize(input);
  const expected = d.normalize(answer.mobius);
  const correct = student.value !== "" && student.value === expected.value;
  return {
    correct,
    normalized: input.trim(),
    // Only surface a syntax complaint when the answer is also wrong; a student
    // who somehow typed the right answer should not be told off for it.
    ...(!correct && student.error ? { reason: student.error } : {}),
  };
}
