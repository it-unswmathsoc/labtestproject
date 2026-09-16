import type { AnswerType, AnswerConfig } from "../grading/types";
import { dialect } from "./syntax";
import type { AnswerSyntax } from "./syntax";

export function answerToLatex(
  value: string,
  type: AnswerType,
  syntax: AnswerSyntax = "numbas",
  config: AnswerConfig = {}
): string {
  const trimmed = value.trim();
  switch (type) {
    case "set_of_integers":
      return dialect(syntax).setToLatex(trimmed);
    case "expression":
      return dialect(syntax).expressionToLatex(trimmed);
    case "single_choice": {
      const opt = config.options?.find((o) => o.value === trimmed);
      return textLatex(opt ? opt.label : trimmed);
    }
    case "multi_select": {
      const labels = trimmed
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => config.options?.find((o) => o.value === v)?.label ?? v);
      return textLatex(labels.join(", "));
    }
    case "integer":
      return trimmed;
    case "text":
    default:
      return textLatex(trimmed);
  }
}

// Assumes `value` is admin-authored plain prose with no LaTeX-special characters
// ({, }, \, $, %, &, ^, ~). If a label ever needs those, escape before wrapping.
function textLatex(value: string): string {
  return `\\text{${value}}`;
}
