import type { AnswerType, AnswerValue } from "@/lib/grading";

/** Convert a stored structured answer value into its Numbas display string. */
export function answerValueToMobius(value: AnswerValue, type: AnswerType): string {
  switch (type) {
    case "integer":
      return String(value as number);
    case "expression":
      return (value as { mobius: string }).mobius;
    case "set_of_integers":
      return `set(${(value as number[]).join(",")})`;
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
