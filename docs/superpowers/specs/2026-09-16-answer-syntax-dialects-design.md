# Answer Syntax Dialects — Design

**Date:** 2026-09-16
**Author:** Cheng Hao Li
**Status:** Approved design, pending implementation plan

## Overview

Each lab test declares the syntax students must type their answers in: **Numbas**,
**Maple**, or **LaTeX**. An admin picks it once in the lab test editor. The choice
drives three things — how student input is normalised for grading, how the stored
correct answer is rendered to LaTeX for display, and a badge on the lab test page
telling students which syntax to use.

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

- An admin picks the answer syntax once per lab test.
- Students see which syntax a lab test expects before they start.
- Grading and LaTeX rendering both follow that choice.
- Existing MATH1081 content keeps grading identically.
- Dialect-neutral naming throughout the code.

## Non-goals

- **No algebraic or CAS equivalence.** Every expression answer in the current
  question bank is a closed numeric form (`2^100`, `2^20`) or a set literal
  (`set(14,15,16,17,18)`). There are no free variables anywhere, so AST or
  numeric-sampling comparison would add machinery for no behavioural gain.
  Comparison is canonical-string per dialect. Revisit if answers with free
  variables are ever authored.
- **No per-question or per-answer override.** One dialect per lab test. This
  matches reality — MATH1081 is entirely Numbas, MATH1131 entirely Maple — and
  keeps one place to look when an answer grades unexpectedly.
- **No change to the stored answer wire format.** The expression value stays
  `{"mobius": "2^100"}` in `answer_value` jsonb. Renaming that key is a data
  migration with no behavioural benefit.
- No persistent syntax hint under every input, and no expandable cheat sheet. The
  lab test badge plus the on-error hint (below) carry the message.
- Möbius's forgiving (non-Maple) entry mode.
- A rich maths-input widget for students. Input stays a plain text field.

## Data model

The dialect is a property of the lab test, so it needs a migration. It follows the
existing `answer_type` domain pattern in `20260824074047_core_schema.sql`:

```sql
create domain public.answer_syntax as text
  check (value in ('numbas', 'maple', 'latex'));

alter table public.lab_tests
  add column answer_syntax public.answer_syntax not null default 'numbas';
```

`not null default 'numbas'` means every existing row keeps grading exactly as it
does today, and the column is safe to add without backfilling.

Corresponding TypeScript:

```ts
// lib/math/syntax/types.ts
export type AnswerSyntax = "numbas" | "maple" | "latex";

// lib/data/types.ts
export interface LabTest {
  id: string;
  courseId: string;
  name: string;
  term?: string;
  description?: string;
  isPublished: boolean;
  sortOrder: number;
  answerSyntax: AnswerSyntax;   // new
}
```

`AnswerConfig` is **not** changed. `lib/supabase/database.types.ts` is regenerated
via `npm run gen-types`, and `toLabTest()` in `lib/supabase/mappers.ts` maps the
new column.

The dialect is meaningful only for the `expression` and `set_of_integers` answer
types. For `integer`, `single_choice`, `multi_select` and `text` the graders
ignore it.

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

- `normalize(input: string): { value: string; error?: string }` — canonical form
  for comparison, plus a syntax-error message when the input is malformed for the
  dialect. Total; never throws.
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
- Implicit multiplication is malformed. A digit immediately followed by a letter,
  or a letter immediately followed by `(` where the name is not a known function,
  is rejected with a syntax error rather than silently marked wrong. The known
  function list covers at least `sqrt`, `abs`, `exp`, `ln`, `log`, `sin`, `cos`,
  `tan`, `sinh`, `cosh`, `tanh`, `factorial`, `binomial`.

**latex**
- Strip whitespace except where it terminates a control sequence — `\sin x` must
  not collapse to `\sinx`.
- Drop `\left` and `\right`.
- Brace single-character exponents and subscripts to a canonical form, so `x^2`
  and `x^{2}` compare equal.
- Sets: `\{a,b,c\}`; empty set is `\{\}` or `\emptyset`.
- `toLatex()` is pass-through.

## Threading the syntax to the graders

The dialect lives on the lab test but is needed at each answer input, so it is
passed as an **explicit prop** down the player tree:

```
app/tests/[testId]/practice/page.tsx  ─┐
app/tests/[testId]/q/[questionId]/page.tsx ─┤ read test.answerSyntax
                                            ↓
PracticeRunner → QuestionPlayer → PartPlayer → StepCard
                                             → FinalAnswer → grade(..., syntax)
```

Both page entry points already load the lab test, so neither needs a new query.

*Rejected alternative:* stamping `syntax` into every part's and step's
`answerConfig` during mapping. It would avoid touching the player components, but
it fabricates a field the database does not have, and makes the admin editor's
config display lie. *Also rejected:* a React context — the value is static per
page and prop threading keeps the components testable without a provider wrapper.

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
- `grade()` takes an `AnswerSyntax` argument and passes it to the two graders that
  care. Signature: `grade(type, input, answer, config, syntax)`. It defaults to
  `"numbas"` so existing call sites and tests stay valid.
- `gradeExpression` calls `normalizeBySyntax` on both sides and surfaces `reason`
  when the student's input is malformed.
- `gradeSetOfIntegers` calls `parseSetBySyntax`; the sorted-canonical compare after
  parsing is unchanged. Its `normalized` output is emitted in the selected
  dialect's set notation. When `parseSet` returns `null` the grader composes the
  `reason` from the dialect's expected form — e.g. "Numbas sets look like
  `set(1,2,3)`" — so the message lives with the grader rather than being a fourth
  return value on every dialect module.

## Rendering

`mobiusToLatex` becomes `answerToLatex` and takes the syntax explicitly,
dispatching to `toLatexBySyntax` for `expression` and `set_of_integers`. Other
answer types are unaffected.

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
`components/player/FinalAnswer.tsx`, `components/admin/QuestionPreview.tsx`,
`lib/math/index.ts`, `lib/data/answer-display.ts`, and their tests.

## UI

**Admin — `components/admin/TestForm.tsx`**

A syntax `<select>` beside the existing name and term fields:

```
Name   [ Lab Test 1        ]
Term   [ 2026 T1           ]
Syntax [ Numbas         v  ]   Numbas / Maple / LaTeX
```

Help text under the select: "The syntax students must use for expression and set
answers in this test." Changing it does not rewrite existing answers — an author
switching dialect must retype affected answer values. The admin store, its
reducers, and `admin-mutations.ts` carry the new field.

**Student — `app/tests/[testId]/page.tsx`**

A badge next to the lab test title, in the existing `PageHeader`:

```
Lab Test 1            [ Numbas syntax ]
2026 T1 · 7 questions
```

The badge renders for all three dialects, so students never have to infer it.

**Student — on a syntax error**

`StepCard` and `FinalAnswer` render `result.reason` in place of the generic
"Not quite — try again." when it is present.

## Testing

TDD, matching the repo's existing per-module test layout:

- `lib/math/syntax/__tests__/numbas.test.ts` — set round-trip, empty set,
  case-insensitivity, whitespace.
- `lib/math/syntax/__tests__/maple.test.ts` — case **sensitivity** (`Pi` ≠ `pi`),
  brace set notation, implicit multiplication rejected with a reason, and known
  function calls such as `sqrt(2)` and `exp(1)` accepted.
- `lib/math/syntax/__tests__/latex.test.ts` — `\sin x` does not collapse,
  `\left`/`\right` dropped, `x^2` equals `x^{2}`, `\{...\}` sets, `\emptyset`.
- `lib/math/syntax/__tests__/index.test.ts` — dispatch on each dialect.
- Extend `lib/grading/__tests__/expression.test.ts` and `set.test.ts` for each
  dialect, including a regression test that the default `"numbas"` grades exactly
  as the current implementation does.
- `lib/supabase/__tests__/mappers.test.ts` — `toLabTest` maps `answer_syntax`.
- `components/admin/__tests__/TestForm.test.tsx` — the select renders and emits.
- A test that the lab test page renders the badge.
- Update existing tests for the renamed symbols.

`supabase/seed.sql` and `lib/data/fixtures.ts` gain the new field; the MATH1081
seed row is explicitly `'numbas'`.

## Risks

- **Silent behaviour change for existing content.** Mitigated by the `not null
  default 'numbas'` column and an explicit regression test.
- **A lab test whose questions mix dialects cannot be represented.** No current
  test does, and per-answer override is an explicit non-goal. If one appears, the
  fix is to add an optional override in `AnswerConfig` that falls back to the lab
  test value — the dispatcher already takes a syntax argument, so only the
  resolution step changes.
- **Maple's implicit-multiplication rejection could be over-eager** and reject a
  valid function call. Mitigated by the known-function whitelist and its tests.
- **LaTeX normalisation is the loosest of the three** — two visually identical
  LaTeX strings can differ textually. Canonical bracing covers the common case;
  anything beyond it may produce false negatives. Authors should prefer numbas or
  maple where the answer shape allows.
