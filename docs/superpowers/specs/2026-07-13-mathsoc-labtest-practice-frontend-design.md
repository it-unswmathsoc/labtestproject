# UNSW MathSoc Lab Test Practice — Frontend Design

**Date:** 2026-07-13
**Author:** Cheng Hao Li
**Status:** Approved design, pending implementation plan

## Overview

A Next.js web app that lets UNSW students practise mathematics lab tests (e.g.
MATH1081 Lab Test 1, MATH1141 Lab Test 1) as **guided, auto-graded, step-by-step
walkthroughs**. Where the official Numbas/Mobius system only auto-grades a final
answer and offers no worked solutions, this platform breaks each question into
steps the student works through — with per-step auto-grading, optional hints, and
worked explanations — so students learn the *process*, not just check an answer.

An **admin-authenticated** area lets MathSoc create and edit courses, lab tests,
questions, steps, and hints.

### Scope boundaries

- **This project is the Next.js frontend only.** A separate teammate builds the
  Supabase backend (schema, Row-Level Security, auth config). The **table schema
  in this document is the shared contract** between the two.
- The frontend talks to Supabase **directly** via `supabase-js` (no custom API
  layer).
- **Questions are static** (fixed question-bank items) for v1 — no parameterized
  / randomized generation.
- **No student accounts.** Anyone can practise anonymously. Only **admins** log in
  (Supabase Auth). Student progress is optionally persisted in browser
  `localStorage`, never server-side.
- Because this is a study aid, not a proctored exam, **shipping answer keys to the
  client is acceptable** and keeps grading simple.

## Goals

- Deliver the guided, per-step, auto-graded walkthrough that the official system
  lacks.
- Render all mathematics correctly, including Numbas/Mobius answer notation.
- Give non-technical MathSoc admins a clean authoring UI that mirrors the content
  structure.
- Let the frontend and backend teammates work in parallel against a fixed schema
  contract.

## Non-Goals (v1)

- Parameterized/randomized question generation.
- Student accounts, scoring, leaderboards, or server-side progress tracking.
- A custom backend API (direct `supabase-js` only).
- Replicating a full CAS / Numbas expression engine (a small mathjs equivalence
  check inside the numeric/expression grader is the ceiling).

## Architecture & Tech Stack

- **Next.js (App Router) + TypeScript** — latest version.
- **Tailwind CSS** with a small set of reusable UI components. Chosen partly so a
  component library can later be synced to Claude Design.
- **KaTeX** for rendering LaTeX exposition content.
- **`supabase-js`** for all data access and admin auth. Public content is read
  with the anon key, guarded by the teammate's RLS (public `select` on published
  rows; admin-only `insert/update/delete`).
- **dnd-kit** for drag-and-drop reordering in the admin UI (accessible, keyboard-
  and touch-friendly).
- **Client-side grading**: per-answer-type normalizers/validators (see Grading).

### Rendering strategy

- Browse pages (course list, test list, question list) are **server components
  with ISR** — fast, cacheable, shareable links.
- The **step player** and the **admin** area are **client components**
  (interactive state, auth).

### Module boundaries

Each module has one clear purpose, a well-defined interface, and is independently
testable:

- `lib/supabase/` — client setup + typed data-access functions (`getCourses`,
  `getTest`, `getQuestion`, and admin mutations `createTest`, `upsertQuestion`,
  `upsertPart`, `upsertStep`, `upsertHint`, `reorder`, `deleteNode`). **The only
  place that talks to Supabase.**
- `lib/grading/` — one pure normalizer/validator per answer type. No UI, no
  network. Fully unit-testable.
- `lib/math/` — two pure helpers: `renderLatex(str)` (KaTeX) and
  `renderMobiusAnswer(str, answerType)` (Numbas/Mobius answer notation → readable
  math). UI-agnostic.
- `components/player/` — the guided step player UI.
- `components/admin/` — authoring forms and the nested tree editor.
- `app/` — routes/pages wiring the above together.

### Route map

```
/                                     Home — course grid (MATH1081, MATH1141, …)
/courses/[courseCode]                 Lab tests offered for a course
/tests/[testId]                       Test overview — question list + "Start practising"
/tests/[testId]/q/[questionId]        The guided step player for one question
/admin                                Admin dashboard (login-gated)
/admin/tests/new                      Create a lab test
/admin/tests/[testId]                 Edit test → questions → parts → steps → hints
/login                                Admin sign-in (Supabase Auth)
```

## Math Rendering (`lib/math/`)

Two responsibilities:

1. **Exposition content** (question prompts, step sub-goals, hints, worked
   explanations) is authored in **LaTeX** and rendered with **KaTeX**. Covers all
   source notation: set complements, powers, `mod`, `gcd`, unions/intersections,
   etc.
2. **Numbas/Mobius answer notation** has a dedicated formatter so answers *display*
   as proper math even though they're stored/entered in Numbas syntax:
   - `set(14,15,16,17,18)` → **{14, 15, 16, 17, 18}**
   - `2^100` → **2¹⁰⁰**
   - `set()` → **∅**
   - dropdown/classification answers → their human labels

Students still **type in Numbas/Mobius syntax** (matching the real test and grading
exactly), but the shown final answer — and a live preview of their input — render
as readable math via `renderMobiusAnswer`. This mirrors the real Numbas "preview"
button.

Consequence for storage: exposition is stored as **LaTeX strings**; answers are
stored as **Numbas-syntax value + a type**.

## Supabase Schema (shared contract)

Hierarchy: **course → lab_test → question → question_part → step → hint.** A
`question` holds the shared stem; each **part** (`a`, `b.i`, …) has its own final
answer *and* its own ordered **steps**; each step is auto-graded and can carry
ordered **hints**.

```
courses
  id            uuid pk
  code          text unique      -- "MATH1081"
  name          text             -- "Discrete Mathematics"
  description   text null
  sort_order    int

lab_tests
  id            uuid pk
  course_id     uuid fk -> courses
  name          text             -- "Lab Test 1"
  term          text null        -- "2026 T1"
  description   text null        -- intro / ethics note
  is_published  bool             -- draft before releasing to students
  sort_order    int

questions
  id            uuid pk
  lab_test_id   uuid fk -> lab_tests
  number        int              -- Question 1, 2, …
  prompt_latex  text             -- shared stem (e.g. class-of-39-students setup)
  note_latex    text null        -- e.g. "You'll only be asked one of b)/c)"
  sort_order    int

question_parts                    -- a), b), c) … and i, ii, iii
  id            uuid pk
  question_id   uuid fk -> questions
  label         text             -- "a", "b.i", "c.iii"
  prompt_latex  text             -- the part's specific ask
  answer_type   text             -- integer | expression | set_of_integers |
                                 --   single_choice | multi_select | text
  answer_value  jsonb            -- canonical correct answer (shape per type)
  answer_config jsonb null       -- choice options, tolerance, etc.
  sort_order    int

steps                             -- guided walkthrough for ONE part
  id            uuid pk
  part_id       uuid fk -> question_parts
  number        int              -- Step 1, 2, …
  prompt_latex  text             -- sub-goal: "Find |B ∪ E ∪ M|"
  answer_type   text             -- same enum as parts
  answer_value  jsonb            -- expected intermediate answer (auto-graded)
  answer_config jsonb null
  explanation_latex text         -- revealed worked explanation for the step
  sort_order    int

hints                             -- optional, ordered, per step
  id            uuid pk
  step_id       uuid fk -> steps
  number        int              -- Hint 1, 2, …
  body_latex    text
  sort_order    int
```

### Answer type contract (Approach 1: typed answers)

`answer_type` + `answer_value` (jsonb) is used identically for step intermediates
and final part answers. Shapes:

- `integer` → `answer_value: 19`
- `expression` → `answer_value: { "mobius": "2^100" }`
- `set_of_integers` → `answer_value: [14,15,16,17,18]` (`[]` for `set()`)
- `single_choice` → `answer_value: { "choice": "not_surjective" }`
- `multi_select` → `answer_value: { "selected": ["reflexive","symmetric"] }`
- `text` → `answer_value: { "text": "Bijective" }`

`answer_config` carries per-type extras: choice options + labels, numeric
tolerance, set order-insensitivity flag (default `true`).

### Row-Level Security (owned by backend teammate; contract here)

- Anon role: `select` only on rows reachable from a `lab_test` where
  `is_published = true`.
- Authenticated admin: full CRUD on all tables.

## The Guided Step Player (`components/player/`)

Renders one **question part** at a time as an auto-graded walkthrough.

### Behaviour

- **No gating** — all steps are open and expanded by default; the student may
  attempt them in any order and **skip ahead** freely.
- **Unlimited attempts, no scoring.**
- On **Check**: correct → mark step ✓ and reveal its `explanation_latex`;
  incorrect → gentle "not quite, try again," no penalty.
- **Escape hatches, always available:** "Reveal answer" (per step and for the
  final part answer), and "Show hint(s)" — shown only where an admin actually
  wrote hints (a step with none shows no hint control). Hints reveal one at a time
  (progressive).
- **Live math preview** of the current input renders via `renderMobiusAnswer`.
- **Final answer**: after the steps, the student enters the part's final answer
  (same widget/grading) and sees a "solved!" state on success.

### Component tree

```
QuestionPlayer                 -- orchestrates one question_part, owns progress state
├─ Stem (latex)
├─ PartPrompt (latex)
├─ StepList
│  └─ StepCard (per step, expanded by default)
│     ├─ StepPrompt (latex)
│     ├─ AnswerInput           -- switches on answer_type
│     ├─ CheckButton + result feedback
│     ├─ RevealAnswer link
│     ├─ HintStack             -- only if hints.length > 0; progressive reveal
│     └─ Explanation (latex)   -- revealed after correct
└─ FinalAnswer                 -- the part's answer_value; "Reveal answer" hatch
```

### Answer input widgets (one per `answer_type`, paired with a grader)

- `integer` → number/text field → exact match (optional tolerance).
- `expression` → text field (Numbas syntax) → normalized compare; optional mathjs
  equivalence so `2^100` needn't be typed identically.
- `set_of_integers` → text field accepting `set(...)` → parsed to a sorted set,
  order-insensitive compare (`set()` = empty).
- `single_choice` → dropdown/radio from `answer_config.options` → value match.
- `multi_select` → checkboxes → set-equality of selections.
- `text` → text field → normalized string compare.

### Progress state

Kept in the `QuestionPlayer` component (React state), optionally mirrored to
`localStorage` keyed by question id so a refresh doesn't lose place. No server
writes.

## Grading (`lib/grading/`)

Each grader is a pure function:

```
grade(input: string, answer: AnswerValue, config): { correct: boolean, normalized: string }
```

No UI, no network — fully unit-testable against the exact answers from the source
question bank.

## Admin Authoring (`components/admin/`)

Admins sign in (Supabase Auth) and get CRUD over the whole hierarchy. Authoring
**mirrors the schema tree**, so there's no impedance mismatch.

### Navigation

```
/admin                     Dashboard: courses & tests, publish status, "New test"
/admin/tests/[id]          Test editor: metadata + nested tree
                           (question → part → step → hint)
```

### Editing model

- **Nested tree editor**: a live tree on the left (question → part → step → hint),
  a form on the right for the selected node. Add / reorder / delete at each level.
- **Reordering via drag-and-drop (dnd-kit)** at every level; on drop, affected
  rows' `sort_order` values are recomputed and persisted through the `reorder`
  mutation.
- **Every LaTeX field** is a textarea with a **live KaTeX preview** beside it, so
  admins author clean LaTeX and immediately see the rendered math.
- **Typed answer editor** switches on `answer_type`: pick the type, enter the
  canonical answer in the *same widget students use*, see a **live student
  preview** via `renderMobiusAnswer`, and get contextual `answer_config` fields
  (choice options for choice types, tolerance for numeric).
- **Draft/publish**: `is_published` toggle on the test; drafts are invisible to
  anonymous students (RLS + filtered queries).
- **Validation before save**: required LaTeX renders without KaTeX error; answer
  value is well-formed for its type; every step has an expected answer. Errors
  surface inline.
- All mutations go through `lib/supabase/` admin functions.

## Error Handling & Edge Cases

- **Data fetching**: browse pages use `loading.tsx` skeletons and `error.tsx`
  boundaries; a failed Supabase read shows a friendly retry.
- **Empty states**: "No lab tests yet for this course," "This test has no questions
  yet," etc.
- **Admin auth**: unauthenticated visits to `/admin/*` redirect to `/login`;
  expired sessions handled by Supabase Auth refresh; failed mutations surface an
  inline toast and keep form data.
- **KaTeX render errors**: a bad LaTeX string renders as a visible inline error
  marker, never blanking the page.
- **Malformed answer data**: graders are defensive — unparseable stored answer or
  student input returns `correct: false` with a clean message rather than throwing.
- **Content edge cases**: `set()` (empty set / no solutions) grades correctly;
  large answers (`2^100`, six-element sets) covered by typed graders; a part with
  **no steps** (final answer only) works; a step with **no hints** shows no hint
  control; multi-select "minimum mark 0" semantics are moot since we don't score.

## Testing Strategy

Built **test-first** (TDD), graders especially.

- **`lib/grading/` — unit tests (priority).** Every grader tested against the
  actual answers from the source doc: `set(14,15,16,17,18)`, `set()`,
  `set(217,502,787,1072,1357,1642)`, `2^100`, `2^20`, integers, the
  injective/surjective dropdowns, the reflexive/symmetric/transitive multi-select.
- **`lib/math/` — unit tests** for `renderMobiusAnswer` conversions and LaTeX-error
  handling.
- **Component tests** (React Testing Library) for `QuestionPlayer`: check →
  correct/incorrect feedback, reveal-answer, progressive hints, skip-ahead.
- **Seed script** loading MATH1081 Lab Test 1 as real fixture data for manual
  testing and demos.

## Open Questions / Future Work

- Parameterized/randomized questions (Numbas "algorithmic" style).
- Student accounts + progress tracking + scoring.
- Syncing the Tailwind component library to Claude Design.
- Importer to convert existing solution docs (LaTeX/OCR) into schema rows.
