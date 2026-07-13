import type { AnswerType } from "@/lib/grading";

/** A student's in-progress input: an array for multi_select, a string otherwise. */
export type InputValue = string | string[];

export function emptyInput(type: AnswerType): InputValue {
  return type === "multi_select" ? [] : "";
}
