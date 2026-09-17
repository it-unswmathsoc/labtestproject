import type { AnswerSyntax, Dialect } from "./types";
import * as numbas from "./numbas";
import * as maple from "./maple";
import * as latex from "./latex";

export type { AnswerSyntax, Dialect, NormalizeResult } from "./types";

const DIALECTS: Record<AnswerSyntax, Dialect> = { numbas, maple, latex };

/** Display order for dropdowns; numbas first because it is the default. */
export const ANSWER_SYNTAXES: AnswerSyntax[] = ["numbas", "maple", "latex"];

export const SYNTAX_LABELS: Record<AnswerSyntax, string> = {
  numbas: "Numbas",
  maple: "Maple",
  latex: "LaTeX",
};

/**
 * Falls back to latex rather than throwing: a row written by an older client,
 * or a hand-edited config, should still grade rather than crash the page.
 */
export function dialect(syntax: AnswerSyntax): Dialect {
  return DIALECTS[syntax] ?? DIALECTS.latex;
}
