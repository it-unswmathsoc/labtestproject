import type { AnswerConfig, GradeResult } from "./types";

export function gradeText(
  input: string,
  answer: { text: string },
  config: AnswerConfig = {}
): GradeResult {
  const normalize = (s: string) => {
    let out = s.trim().replace(/\s+/g, " ");
    if (config.caseInsensitive) out = out.toLowerCase();
    return out;
  };
  const a = normalize(input);
  const b = normalize(answer.text);
  return { correct: a !== "" && a === b, normalized: input.trim() };
}
