import { mobiusToLatex } from "@/lib/math";
import { answerValueToMobius } from "@/lib/data/answer-display";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import { Latex } from "./Latex";

export function MobiusAnswer({
  value,
  type,
  config,
}: {
  value: AnswerValue;
  type: AnswerType;
  config?: AnswerConfig;
}) {
  const mobius = answerValueToMobius(value, type);
  return <Latex>{mobiusToLatex(mobius, type, config)}</Latex>;
}
