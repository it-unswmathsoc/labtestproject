import type { AnswerType, AnswerConfig } from "../grading/types";

export function mobiusToLatex(
  value: string,
  type: AnswerType,
  config: AnswerConfig = {}
): string {
  const trimmed = value.trim();
  switch (type) {
    case "set_of_integers":
      return setToLatex(trimmed);
    case "expression":
      return exponentToLatex(trimmed);
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

function setToLatex(value: string): string {
  const match = /^set\(\s*(.*?)\s*\)$/i.exec(value);
  if (!match) return value;
  const inner = match[1].trim();
  if (inner === "") return "\\emptyset";
  const parts = inner.split(",").map((p) => p.trim());
  return `\\{${parts.join(",\\ ")}\\}`;
}

function exponentToLatex(value: string): string {
  return value.replace(/\^(-?\d+)/g, "^{$1}").replace(/\*/g, "\\times ");
}

function textLatex(value: string): string {
  return `\\text{${value}}`;
}
