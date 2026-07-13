import type { GradeResult } from "./types";

function canonical(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
}

export function gradeMultiSelect(
  input: string[],
  answer: { selected: string[] }
): GradeResult {
  const a = canonical(input);
  const b = canonical(answer.selected);
  const correct = a.length === b.length && a.every((v, i) => v === b[i]);
  return { correct, normalized: a.join(",") };
}
