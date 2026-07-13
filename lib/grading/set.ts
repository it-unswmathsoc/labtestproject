import type { GradeResult } from "./types";

/** Parse Numbas `set(a,b,c)` syntax into a number array, or null if malformed. */
export function parseIntegerSet(input: string): number[] | null {
  const match = /^set\(\s*(.*?)\s*\)$/i.exec(input.trim());
  if (!match) return null;
  const inner = match[1].trim();
  if (inner === "") return [];
  const parts = inner.split(",").map((p) => p.trim());
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    nums.push(Number(part));
  }
  return nums;
}

function canonical(arr: number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

export function gradeSetOfIntegers(input: string, answer: number[]): GradeResult {
  const parsed = parseIntegerSet(input);
  if (parsed === null) {
    return { correct: false, normalized: input.trim() };
  }
  const a = canonical(parsed);
  const b = canonical(answer);
  const correct = a.length === b.length && a.every((v, i) => v === b[i]);
  return { correct, normalized: `set(${a.join(",")})` };
}
