import { answerToLatex } from "@/lib/math";
import { answerValueToString } from "@/lib/data/answer-display";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import type { AnswerSyntax } from "@/lib/math/syntax";
import { Latex } from "./Latex";

export function AnswerLatex({
  value,
  type,
  syntax = "numbas",
  config,
}: {
  value: AnswerValue;
  type: AnswerType;
  syntax?: AnswerSyntax;
  config?: AnswerConfig;
}) {
  const display = answerValueToString(value, type, syntax);
  return <Latex>{answerToLatex(display, type, syntax, config)}</Latex>;
}
