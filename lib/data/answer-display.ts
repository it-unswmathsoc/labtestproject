import type { AnswerType, AnswerValue } from "@/lib/grading";
import { dialect } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

/** Convert a stored structured answer value into its display string for a dialect. */
export function answerValueToString(
  value: AnswerValue,
  type: AnswerType,
  syntax: AnswerSyntax = "numbas"
): string {
  switch (type) {
    case "integer":
      return String(value as number);
    case "expression":
      return (value as { mobius: string }).mobius;
    case "set_of_integers":
      return dialect(syntax).formatSet(value as number[]);
    case "single_choice":
      return (value as { choice: string }).choice;
    case "multi_select":
      return (value as { selected: string[] }).selected.join(",");
    case "text":
      return (value as { text: string }).text;
    default:
      return String(value);
  }
}
