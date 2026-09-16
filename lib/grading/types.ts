export type AnswerType =
  | "integer"
  | "expression"
  | "set_of_integers"
  | "single_choice"
  | "multi_select"
  | "text";

export type AnswerValue =
  | number // integer
  | { mobius: string } // expression
  | number[] // set_of_integers
  | { choice: string } // single_choice
  | { selected: string[] } // multi_select
  | { text: string }; // text

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface AnswerConfig {
  /** Absolute tolerance for integer numeric compare. Default 0. */
  tolerance?: number;
  /** Choice options for single_choice / multi_select. */
  options?: ChoiceOption[];
  /** Case-insensitive compare for text. Default false. */
  caseInsensitive?: boolean;
}

export interface GradeResult {
  correct: boolean;
  /** The student input, canonicalized where the grader defines a canonical form, otherwise trimmed. For display/echo. */
  normalized: string;
  /**
   * A syntax-error message, set only when the input was malformed for the lab
   * test's answer syntax — never for an answer that merely turned out wrong.
   * The UI shows this in place of the generic "not quite" message.
   */
  reason?: string;
}
