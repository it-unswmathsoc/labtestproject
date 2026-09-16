# Answer Syntax Dialects — Design

**Date:** 2026-09-16
**Author:** Cheng Hao Li
**Status:** Approved design, pending implementation plan

## Overview

Question authors choose, per answer, which syntax students must type their answer
in: **Numbas**, **Maple**, or **LaTeX**. The chosen dialect drives three things —
how student input is normalised for grading, how the stored correct answer is
rendered to LaTeX for display, and what syntax hint the student sees.

Today the app hardcodes one dialect (Numbas) and misnames it "Mobius" throughout.
This design adds the other two dialects, makes the choice explicit and
author-controlled, and corrects the naming.

## Background: the three dialects are genuinely different

Research against vendor documentation established that **Möbius syntax is not
Numbas syntax**, and that Möbius itself offers two distinct entry modes:

| | Numbas (JME) | Möbius syntax | Maple syntax (a sub-type within Möbius) |
|---|---|---|---|
| Multiplication | `2x` implicit OK, `2*x` | `2x`, `x y` implicit OK | `*` **required** — `2*x`, never `2x` |
| Sets | `set(1,2,3)` | — | `{1,2,3}` |
| π | `pi` (lowercase) | `Pi` | `Pi` |
| e | `e`, `e^x` | `e`, `e^x` | `exp(1)`, `exp(x)` |
| ln | `ln(x)` | `ln(x)` | `ln(x)` or `log(x)` |
| sinh | `sinh(x)` | `hypsin(x)` | `sinh(x)` |
| Factorial | `fact(n)` or `n!` | `n!` | `n!` / `factorial(n)` |
| Case | insensitive by default | — | **case-sensitive** |

Möbius overlaps Numbas on the surface (`^`, `sqrt`, `abs`, implicit
multiplication) but diverges on constants, hyperbolics, and set notation.

**Decision:** the Möbius-flavoured mode in this app means **strict Maple syntax**
— the Maple-graded sub-type, which is what MATH1131/1141 lab tests enforce.
Möbius's own forgiving entry mode is out of scope; it can be added later as a
fourth dialect if a course needs it.

Sources:
- <https://www.digitaled.com/support/help/admin/Content/INST-AUTHORING/Proper-authoring-math-syntax.htm>
- <https://www.digitaled.com/support/help/instructor/Content/INST-AUTHORING/QUESTION-TYPES/MAPLE-GRADED/Author-Maple-graded-Maple-syntax-question-sub-type.htm>
- <https://docs.numbas.org.uk/en/latest/jme-reference.html>

## Goals

- Authors pick the answer syntax per answer, in the admin UI.
- Grading, LaTeX rendering, and student-facing hints all follow that choice.
- Existing MATH1081 content keeps grading identically, with no data migration.
- Dialect-neutral naming throughout the code.

## Non-goals

- **No algebraic or CAS equivalence.** Every expression answer in the current
  question bank is a closed numeric form (`2^100`, `2^20`) or a set literal
  (`set(14,15,16,17,18)`). There are no free variables anywhere, so AST or
  numeric-sampling comparison would add machinery for no behavioural gain.
  Comparison is canonical-string per dialect. Revisit if answers with free
  variables are ever authored.
- **No change to the stored wire format.** The expression value stays
  `{"mobius": "2^100"}` in `answer_value` jsonb. Renaming that key is a data
  migration with no behavioural benefit.
- Möbius's forgiving (non-Maple) entry mode.
- A rich maths-input widget for students. Input stays a plain text field.

## Data model

`answer_config` is already `jsonb`, so the dialect rides along in `AnswerConfig`
with **no database migration**:

```ts
export type AnswerSyntax = "numbas" | "maple" | "latex";

export interface AnswerConfig {
  tolerance?: number;
  options?: ChoiceOption[];
  caseInsensitive?: boolean;
  /** Syntax students must answer in. Absent means "numbas". */
  syntax?: AnswerSyntax;
}
```

An absent `syntax` resolves to `"numbas"`, so all existing content grades exactly
as it does today.

The dialect is meaningful only for the `expression` and `set_of_integers` answer
types. For `integer`, `single_choice`, `multi_select` and `text` it is ignored,
and the admin UI does not offer it.

## Architecture

New `lib/math/syntax/`, following the existing `lib/grading/` pattern — one pure
module per case behind a dispatcher, no UI or network dependencies:

| File | Exports |
|---|---|
| `types.ts` | `AnswerSyntax` |
| `numbas.ts` | `normalize()`, `toLatex()`, `parseSet()` |
| `maple.ts` | `normalize()`, `toLatex()`, `parseSet()` |
| `latex.ts` | `normalize()`, `toLatex()`, `parseSet()` |
| `index.ts` | `normalizeBySyntax()`, `toLatexBySyntax()`, `parseSetBySyntax()` |

Every dialect module exports the same three functions, so each is understandable
and testable on its own and a fourth dialect is one new file plus one switch arm.

Each function's contract:

- `normalize(input: string): string` — canonical form for comparison. Total; never
  throws. Returns the input trimmed if it cannot be canonicalised.
- `toLatex(input: string, type: AnswerType): string` — display LaTeX.
- `parseSet(input: string): number[] | null` — integers, or `null` if malformed.

## Dialect rules

**numbas**
- Lowercase — JME is case-insensitive by default.
- Strip all whitespace.
- Sets: `set(a,b,c)`; empty set is `set()`.

**maple**
- **Do not lowercase.** Maple is case-sensitive; `Pi` and `pi` are different.
- Strip all whitespace.
- Sets: `{a,b,c}`; empty set is `{}`.
- Implicit multiplication is malformed. A digit immediately followed by a letter
  or `(`, or a letter immediately followed by `(` where the name is not a known
  function, is rejected with a syntax hint rather than silently marked wrong.

**latex**
- Strip whitespace except where it terminates a control sequence — `\sin x` must
  not collapse to `\sinx`.
- Drop `\left` and `\right`.
- Sets: `\{a,b,c\}`; empty set is `\{\}` or `\emptyset`.
- `toLatex()` is pass-through.

## Grading

`GradeResult` gains an optional field:

```ts
export interface GradeResult {
  correct: boolean;
  normalized: string;
  /** Present only when input was malformed for the selected dialect. */
  reason?: string;
}
```

`reason` is set only for a syntax error, never for a merely wrong answer. This
lets the UI distinguish "you typed it wrong" from "that is not the answer":

```
GradeResult { correct: false,
              normalized: "2x",
              reason: "Maple requires * for multiplication: 2*x" }
```

Changes:
- `gradeExpression` takes the config, calls `normalizeBySyntax` on both sides, and
  surfaces `reason` when the student's input is malformed for the dialect.
- `gradeSetOfIntegers` calls `parseSetBySyntax`; the sorted-canonical compare
  after parsing is unchanged. Its `normalized` output is emitted in the selected
  dialect's set notation.
- `grade()` already receives `AnswerConfig` and passes it through unchanged.

## Rendering

`mobiusToLatex` becomes `answerToLatex` and dispatches to `toLatexBySyntax` for
`expression` and `set_of_integers`. All other answer types are unaffected.

## Naming

The `mobius`-named symbols hold Numbas content, and with three dialects the name
is actively wrong. Renamed as part of this work:

| Current | New |
|---|---|
| `mobiusToLatex()` | `answerToLatex()` |
| `answerValueToMobius()` | `answerValueToString()` |
| `<MobiusAnswer />` | `<AnswerLatex />` |
| `lib/math/mobius.ts` | `lib/math/answer-latex.ts` |
| `lib/math/__tests__/mobius.test.ts` | `lib/math/__tests__/answer-latex.test.ts` |
| `components/math/MobiusAnswer.tsx` | `components/math/AnswerLatex.tsx` |

The `{ mobius: string }` value type and its jsonb key are **not** renamed — that
is a data migration for no gain. A comment at the type declaration records why the
key keeps its legacy name.

Call sites to update: `components/player/StepCard.tsx`,
`components/player/FinalAnswer.tsx`,
`components/admin/QuestionPreview.tsx`, `lib/math/index.ts`,
`lib/data/answer-display.ts`, and their tests.

## UI

**Admin** — `AnswerValueEditor` gains a syntax `<select>`, rendered only for
`expression` and `set_of_integers`. The correct-answer field's label and
placeholder track the selection:

| Dialect | Set placeholder | Expression placeholder |
|---|---|---|
| numbas | `set(1,2,3)` | `2^100` |
| maple | `{1,2,3}` | `2*x^2` |
| latex | `\{1,2,3\}` | `2x^{2}` |

Switching dialect does not rewrite an already-entered answer; the author retypes
it. The existing live LaTeX preview picks up the new dialect automatically.

**Student** — `AnswerInput` renders a hint line beneath the field for the
non-default dialects, e.g. "Enter your answer in Maple syntax — use `*` for
multiplication". `StepCard` and `FinalAnswer` already pass `config` down, and both
render `result.reason` in place of the generic "Not quite — try again." when it is
present.

## Testing

TDD, matching the repo's existing per-module test layout:

- `lib/math/syntax/__tests__/numbas.test.ts` — set round-trip, empty set,
  case-insensitivity, whitespace.
- `lib/math/syntax/__tests__/maple.test.ts` — case **sensitivity** (`Pi` ≠ `pi`),
  brace set notation, implicit multiplication rejected with a reason.
- `lib/math/syntax/__tests__/latex.test.ts` — `\sin x` does not collapse,
  `\left`/`\right` dropped, `\{...\}` sets, `\emptyset`.
- `lib/math/syntax/__tests__/index.test.ts` — dispatch, and that an absent
  `syntax` resolves to numbas.
- Extend `lib/grading/__tests__/expression.test.ts` and `set.test.ts` for each
  dialect, including a regression test that existing configs with no `syntax`
  field grade exactly as before.
- Update existing tests for the renamed symbols.

## Risks

- **Silent behaviour change for existing content.** Mitigated by the
  absent-means-numbas default and an explicit regression test.
- **Maple's implicit-multiplication rejection could be over-eager** and reject
  valid input such as a function call `f(x)`. The check must whitelist known
  function names; the test suite covers `sqrt(2)`, `exp(1)`, `sinh(x)`.
- **LaTeX normalisation is the loosest of the three** — two visually identical
  LaTeX strings can differ textually (`x^2` vs `x^{2}`). Normalisation brackets
  single-character exponents and subscripts to a canonical form; anything beyond
  that is accepted as-is and may produce false negatives. Authors should prefer
  numbas or maple where the answer shape allows.
