import type { AnswerType, AnswerValue, AnswerConfig, GradeResult } from "./types";
import type { AnswerSyntax } from "@/lib/math/syntax";
import { gradeInteger } from "./integer";
import { gradeSetOfIntegers } from "./set";
import { gradeExpression } from "./expression";
import { gradeSingleChoice } from "./choice";
import { gradeMultiSelect } from "./multiSelect";
import { gradeText } from "./text";

export function grade(
  type: AnswerType,
  input: string | string[],
  answer: AnswerValue,
  config: AnswerConfig = {},
  syntax: AnswerSyntax = "numbas"
): GradeResult {
  switch (type) {
    case "integer":
      return gradeInteger(input as string, answer as number, config);
    case "set_of_integers":
      return gradeSetOfIntegers(input as string, answer as number[], syntax);
    case "expression":
      return gradeExpression(input as string, answer as { mobius: string }, syntax);
    case "single_choice":
      return gradeSingleChoice(input as string, answer as { choice: string });
    case "multi_select":
      return gradeMultiSelect(input as string[], answer as { selected: string[] });
    case "text":
      return gradeText(input as string, answer as { text: string }, config);
    default:
      return { correct: false, normalized: String(input) };
  }
}

export * from "./types";
