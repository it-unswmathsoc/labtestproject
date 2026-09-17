/** The answer syntax a lab test expects students to type in. */
export type AnswerSyntax = "numbas" | "maple" | "latex";

export interface NormalizeResult {
  /** Canonical form for comparison. Always present, even when `error` is set. */
  value: string;
  /** A syntax-error message, set only when the input is malformed for the dialect. */
  error?: string;
}

/**
 * The functions every dialect module must export. Dialect modules never see an
 * `AnswerType` — the answer-type switch lives in `answerToLatex`.
 */
export interface Dialect {
  normalize(input: string): NormalizeResult;
  parseSet(input: string): number[] | null;
  formatSet(members: number[]): string;
  setToLatex(input: string): string;
  expressionToLatex(input: string): string;
}
