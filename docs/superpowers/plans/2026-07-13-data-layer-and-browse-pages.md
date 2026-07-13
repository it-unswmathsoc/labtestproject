# Data Layer & Browse Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the scaffold into a visible, clickable lab-test catalogue — home (course grid) → course page → lab-test overview — rendering the real MATH1081 Lab Test 1 content with proper math, driven by an in-app fixture behind a data-access layer shaped exactly like a future `supabase-js` layer.

**Architecture:** Server components with ISR read from `lib/data/queries.ts` — the single data boundary. In Plan 2 those functions return typed fixture data (`lib/data/fixtures.ts`); the function signatures (async, published-filtered) match what real Supabase reads will return, so swapping the implementation later touches only that one file. Mixed prose+math content is rendered by a `<RichText>` component (splits `$…$`/`$$…$$` and renders math via the Plan 1 `renderLatex`); Numbas answers render via `<MobiusAnswer>`. No interactivity yet — the guided step player is Plan 3.

**Tech Stack:** Next.js App Router (server components, ISR), TypeScript, Tailwind CSS, plus the Plan 1 libraries (`lib/grading`, `lib/math`). Vitest for the pure logic; pages verified by `npm run build` + manual `npm run dev`.

**Part of a series:** Plan 2 of 4. Plan 1 (foundation & core libraries) is complete. Plan 3 = Guided Step Player, Plan 4 = Admin Authoring.

**Reference spec:** `docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md`

**Decision recorded:** No live backend for now. Frontend is developed against in-app fixture data so it is presentable immediately; the data-access interface is Supabase-shaped for a later drop-in swap.

---

## File Structure

Created in this plan:

- `lib/data/types.ts` — domain types (`Course`, `LabTest`, `Question`, `QuestionPart`, `Step`, `Hint`) mirroring the schema contract; content fields hold prose-with-`$…$`-math strings.
- `lib/data/answer-display.ts` — `answerValueToMobius()` (structured `AnswerValue` → Numbas display string). Pure, tested.
- `lib/math/richtext.ts` — `parseRichText()` (split a string into text / inline-math / display-math segments). Pure, tested. Re-exported from `lib/math/index.ts`.
- `lib/data/fixtures.ts` — the MATH1081 Lab Test 1 fixture (+ a second course and a draft test to exercise empty/publish states).
- `lib/data/queries.ts` — async, published-filtered data-access functions. The ONLY module pages import for data. Tested.
- `components/math/Latex.tsx` — renders one LaTeX expression (server component).
- `components/math/RichText.tsx` — renders a mixed prose+math string.
- `components/math/MobiusAnswer.tsx` — renders a structured answer value as math.
- `components/ui/Card.tsx`, `components/ui/PageHeader.tsx` — small presentational primitives.
- `app/layout.tsx` (modify) — site header/nav + real metadata.
- `app/page.tsx` (replace) — home course grid.
- `app/courses/[courseCode]/page.tsx` — lab tests for a course.
- `app/tests/[testId]/page.tsx` — lab-test overview (questions + parts + final answers rendered).
- `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` — global boundaries.

Boundaries: `lib/data/queries.ts` is the sole data seam; math rendering lives in `components/math/`; pages only compose. Each file has one responsibility.

---

## Task 1: Domain types

**Files:**
- Create: `lib/data/types.ts`

- [ ] **Step 1: Create the domain types**

Content fields named `*Latex` hold prose that may contain `$…$` (inline) and `$$…$$` (display) math — rendered by `<RichText>`. Answer fields reuse the Plan 1 grading types.

Create `lib/data/types.ts`:
```ts
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";

export interface Course {
  id: string;
  code: string; // "MATH1081"
  name: string; // "Discrete Mathematics"
  description?: string;
  sortOrder: number;
}

export interface LabTest {
  id: string;
  courseId: string;
  name: string; // "Lab Test 1"
  term?: string; // "2026 T1"
  description?: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface Question {
  id: string;
  labTestId: string;
  number: number;
  promptLatex: string;
  noteLatex?: string;
  sortOrder: number;
  parts: QuestionPart[];
}

export interface QuestionPart {
  id: string;
  questionId: string;
  label: string; // "a", "b.i"
  promptLatex: string;
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  sortOrder: number;
  steps: Step[];
}

export interface Step {
  id: string;
  partId: string;
  number: number;
  promptLatex: string;
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  explanationLatex: string;
  sortOrder: number;
  hints: Hint[];
}

export interface Hint {
  id: string;
  stepId: string;
  number: number;
  bodyLatex: string;
  sortOrder: number;
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data/types.ts
git commit -m "feat: add domain types mirroring the schema contract"
```

---

## Task 2: answerValueToMobius() display helper

Converts a stored structured `AnswerValue` into its Numbas display string (the inverse of what the graders parse). Used by `<MobiusAnswer>`.

**Files:**
- Create: `lib/data/answer-display.ts`
- Test: `lib/data/__tests__/answer-display.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/data/__tests__/answer-display.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { answerValueToMobius } from "../answer-display";

describe("answerValueToMobius", () => {
  it("formats an integer", () => {
    expect(answerValueToMobius(19, "integer")).toBe("19");
  });

  it("formats an expression from its mobius string", () => {
    expect(answerValueToMobius({ mobius: "2^100" }, "expression")).toBe("2^100");
  });

  it("formats a set of integers as set(...) syntax", () => {
    expect(answerValueToMobius([14, 15, 16, 17, 18], "set_of_integers")).toBe(
      "set(14,15,16,17,18)"
    );
  });

  it("formats an empty set", () => {
    expect(answerValueToMobius([], "set_of_integers")).toBe("set()");
  });

  it("formats a single choice", () => {
    expect(answerValueToMobius({ choice: "not_surjective" }, "single_choice")).toBe(
      "not_surjective"
    );
  });

  it("formats a multi-select as comma-joined values", () => {
    expect(
      answerValueToMobius({ selected: ["reflexive", "symmetric"] }, "multi_select")
    ).toBe("reflexive,symmetric");
  });

  it("formats free text", () => {
    expect(answerValueToMobius({ text: "Bijective" }, "text")).toBe("Bijective");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/data/__tests__/answer-display.test.ts
```
Expected: FAIL — cannot find module `../answer-display`.

- [ ] **Step 3: Implement the helper**

Create `lib/data/answer-display.ts`:
```ts
import type { AnswerType, AnswerValue } from "@/lib/grading";

/** Convert a stored structured answer value into its Numbas display string. */
export function answerValueToMobius(value: AnswerValue, type: AnswerType): string {
  switch (type) {
    case "integer":
      return String(value as number);
    case "expression":
      return (value as { mobius: string }).mobius;
    case "set_of_integers":
      return `set(${(value as number[]).join(",")})`;
    case "single_choice":
      return (value as { choice: string }).choice;
    case "multi_select":
      return (value as { selected: string[] }).selected.join(",");
    case "text":
      return (value as { text: string }).text;
    default:
      return String(value);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/data/__tests__/answer-display.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/answer-display.ts lib/data/__tests__/answer-display.test.ts
git commit -m "feat: add answerValueToMobius display helper"
```

---

## Task 3: parseRichText() — split prose + math

Splits a content string into ordered segments so `<RichText>` can render prose as text and math via KaTeX. Recognises `$$…$$` (display) and `$…$` (inline).

**Files:**
- Create: `lib/math/richtext.ts`
- Modify: `lib/math/index.ts`
- Test: `lib/math/__tests__/richtext.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/__tests__/richtext.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseRichText } from "../richtext";

describe("parseRichText", () => {
  it("returns a single text segment when there is no math", () => {
    expect(parseRichText("How many students study Maths?")).toEqual([
      { type: "text", value: "How many students study Maths?" },
    ]);
  });

  it("splits inline math delimited by single dollars", () => {
    expect(parseRichText("Find $|B \\cup E|$ now")).toEqual([
      { type: "text", value: "Find " },
      { type: "inlineMath", value: "|B \\cup E|" },
      { type: "text", value: " now" },
    ]);
  });

  it("recognises display math delimited by double dollars", () => {
    expect(parseRichText("$$x^2 + 1$$")).toEqual([
      { type: "displayMath", value: "x^2 + 1" },
    ]);
  });

  it("handles multiple inline segments", () => {
    expect(parseRichText("$a$ and $b$")).toEqual([
      { type: "inlineMath", value: "a" },
      { type: "text", value: " and " },
      { type: "inlineMath", value: "b" },
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseRichText("")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/math/__tests__/richtext.test.ts
```
Expected: FAIL — cannot find module `../richtext`.

- [ ] **Step 3: Implement parseRichText**

Create `lib/math/richtext.ts`:
```ts
export type RichSegment =
  | { type: "text"; value: string }
  | { type: "inlineMath"; value: string }
  | { type: "displayMath"; value: string };

const SEGMENT_RE = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;

export function parseRichText(input: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  SEGMENT_RE.lastIndex = 0;
  while ((match = SEGMENT_RE.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "displayMath", value: match[1] });
    } else {
      segments.push({ type: "inlineMath", value: match[2] });
    }
    lastIndex = SEGMENT_RE.lastIndex;
  }
  if (lastIndex < input.length) {
    segments.push({ type: "text", value: input.slice(lastIndex) });
  }
  return segments;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/math/__tests__/richtext.test.ts
```
Expected: PASS.

- [ ] **Step 5: Re-export from the math barrel**

In `lib/math/index.ts`, add:
```ts
export { parseRichText, type RichSegment } from "./richtext";
```

- [ ] **Step 6: Run the full suite and commit**

Run:
```bash
npm test
```
Expected: all green.

```bash
git add lib/math/richtext.ts lib/math/index.ts lib/math/__tests__/richtext.test.ts
git commit -m "feat: add parseRichText prose+math splitter"
```

---

## Task 4: MATH1081 fixture data

Encodes the fixture the whole app renders. Covers all six answer types, includes a fully-stepped part (Q1a) to demonstrate the step/hint structure for Plan 3, a second course with no tests (empty state), and one unpublished draft test (publish filter).

**Files:**
- Create: `lib/data/fixtures.ts`

- [ ] **Step 1: Create the fixture**

Create `lib/data/fixtures.ts`:
```ts
import type { Course, LabTest, Question } from "./types";

export const courses: Course[] = [
  {
    id: "course-math1081",
    code: "MATH1081",
    name: "Discrete Mathematics",
    description: "Sets, logic, number theory, graphs and combinatorics.",
    sortOrder: 1,
  },
  {
    id: "course-math1141",
    code: "MATH1141",
    name: "Higher Mathematics 1A",
    description: "Calculus and linear algebra (higher stream).",
    sortOrder: 2,
  },
];

export const labTests: LabTest[] = [
  {
    id: "test-1081-lt1",
    courseId: "course-math1081",
    name: "Lab Test 1",
    term: "2026 T1",
    description:
      "Practice questions covering sets, functions and number theory, with guided worked steps.",
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "test-1081-lt2-draft",
    courseId: "course-math1081",
    name: "Lab Test 2",
    term: "2026 T1",
    description: "Draft — not yet released to students.",
    isPublished: false,
    sortOrder: 2,
  },
];

export const questions: Question[] = [
  {
    id: "q-1081-lt1-1",
    labTestId: "test-1081-lt1",
    number: 1,
    promptLatex:
      "In a class of 39 students: 16 study Biology, 21 study English, 10 study both Biology and English, 7 study both Biology and Maths, 12 study both English and Maths, 5 study all three subjects, and 7 study none of these subjects.",
    sortOrder: 1,
    parts: [
      {
        id: "p-1081-lt1-1-a",
        questionId: "q-1081-lt1-1",
        label: "a",
        promptLatex: "How many students study Maths?",
        answerType: "integer",
        answerValue: 19,
        sortOrder: 1,
        steps: [
          {
            id: "s-1081-lt1-1-a-1",
            partId: "p-1081-lt1-1-a",
            number: 1,
            promptLatex:
              "First find $|B \\cup E \\cup M|$: how many students study at least one subject?",
            answerType: "integer",
            answerValue: 32,
            explanationLatex:
              "Since 7 students study none, $|B \\cup E \\cup M| = 39 - 7 = 32$.",
            sortOrder: 1,
            hints: [
              {
                id: "h-1081-lt1-1-a-1-1",
                stepId: "s-1081-lt1-1-a-1",
                number: 1,
                bodyLatex:
                  "The total class size minus those studying none gives the union.",
                sortOrder: 1,
              },
            ],
          },
          {
            id: "s-1081-lt1-1-a-2",
            partId: "p-1081-lt1-1-a",
            number: 2,
            promptLatex:
              "Now solve for $|M|$ using inclusion–exclusion. What is $|M|$?",
            answerType: "integer",
            answerValue: 19,
            explanationLatex:
              "$32 = 16 + 21 + |M| - 10 - 12 - 7 + 5$, so $|M| = 19$.",
            sortOrder: 2,
            hints: [],
          },
        ],
      },
      {
        id: "p-1081-lt1-1-b",
        questionId: "q-1081-lt1-1",
        label: "b",
        promptLatex:
          "Evaluate $|B^c \\cup (E^c \\cap M^c)^c|$.",
        answerType: "integer",
        answerValue: 35,
        sortOrder: 2,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-2",
    labTestId: "test-1081-lt1",
    number: 2,
    promptLatex:
      "For an integer $k$, let $S_k = \\{ n \\in \\mathbb{Z} : \\tfrac{5}{4}k + 2 \\le n \\le \\tfrac{5}{4}k + 12 \\}$.",
    noteLatex: "Recall the Numbas syntax for a set $\\{a,b,c\\}$ is set(a,b,c).",
    sortOrder: 2,
    parts: [
      {
        id: "p-1081-lt1-2-a",
        questionId: "q-1081-lt1-2",
        label: "a",
        promptLatex: "What is $S_5 - S_1$?",
        answerType: "set_of_integers",
        answerValue: [14, 15, 16, 17, 18],
        sortOrder: 1,
        steps: [],
      },
      {
        id: "p-1081-lt1-2-b-i",
        questionId: "q-1081-lt1-2",
        label: "b.i",
        promptLatex: "Find $|\\mathcal{P}(S_1 \\times S_5)|$.",
        answerType: "expression",
        answerValue: { mobius: "2^100" },
        sortOrder: 2,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-3",
    labTestId: "test-1081-lt1",
    number: 3,
    promptLatex:
      "Consider $f : \\mathbb{R}^+_0 \\to \\mathbb{R}$, $f(x) = x(x+4)^2$. Complete the statement to make it logically true.",
    sortOrder: 3,
    parts: [
      {
        id: "p-1081-lt1-3-a",
        questionId: "q-1081-lt1-3",
        label: "a",
        promptLatex:
          "Since the equation $f(x) = a$ has the following number of solutions, we conclude $f$ is:",
        answerType: "single_choice",
        answerValue: { choice: "not_surjective" },
        answerConfig: {
          options: [
            { value: "injective", label: "injective" },
            { value: "surjective", label: "surjective" },
            { value: "not_injective", label: "not injective" },
            { value: "not_surjective", label: "not surjective" },
          ],
        },
        sortOrder: 1,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-4",
    labTestId: "test-1081-lt1",
    number: 4,
    promptLatex:
      "Let $S = \\{0,1,2,3,4,5,6,7\\}$ and $f : S \\to S$ the shift $f(x) = (x+3) \\bmod 8$.",
    sortOrder: 4,
    parts: [
      {
        id: "p-1081-lt1-4-c",
        questionId: "q-1081-lt1-4",
        label: "c",
        promptLatex: "Classify $f$.",
        answerType: "text",
        answerValue: { text: "Bijective" },
        sortOrder: 1,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-8",
    labTestId: "test-1081-lt1",
    number: 8,
    promptLatex:
      "For the arrow diagram shown, indicate whether the relation is reflexive, symmetric, and/or transitive.",
    sortOrder: 5,
    parts: [
      {
        id: "p-1081-lt1-8-a",
        questionId: "q-1081-lt1-8",
        label: "a",
        promptLatex: "Select all properties that hold.",
        answerType: "multi_select",
        answerValue: { selected: ["reflexive", "symmetric", "transitive"] },
        answerConfig: {
          options: [
            { value: "reflexive", label: "Reflexive" },
            { value: "symmetric", label: "Symmetric" },
            { value: "transitive", label: "Transitive" },
          ],
        },
        sortOrder: 1,
        steps: [],
      },
    ],
  },
];
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors (this proves every answer value matches its `answerType`).

- [ ] **Step 3: Commit**

```bash
git add lib/data/fixtures.ts
git commit -m "feat: add MATH1081 Lab Test 1 fixture data"
```

---

## Task 5: Data-access layer (queries)

The single seam pages import. Async and published-filtered so the signatures match a future `supabase-js` implementation. Only published tests (and their questions) are visible; drafts are hidden.

**Files:**
- Create: `lib/data/queries.ts`
- Test: `lib/data/__tests__/queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/data/__tests__/queries.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  getCourses,
  getCourseByCode,
  getLabTestsForCourse,
  getLabTest,
  getQuestionsForTest,
} from "../queries";

describe("data queries", () => {
  it("returns courses sorted by sortOrder", async () => {
    const courses = await getCourses();
    expect(courses.map((c) => c.code)).toEqual(["MATH1081", "MATH1141"]);
  });

  it("looks up a course by code case-insensitively", async () => {
    const course = await getCourseByCode("math1081");
    expect(course?.name).toBe("Discrete Mathematics");
  });

  it("returns null for an unknown course code", async () => {
    expect(await getCourseByCode("MATH9999")).toBeNull();
  });

  it("returns only PUBLISHED lab tests for a course", async () => {
    const tests = await getLabTestsForCourse("course-math1081");
    expect(tests.map((t) => t.name)).toEqual(["Lab Test 1"]);
  });

  it("returns an empty array for a course with no published tests", async () => {
    expect(await getLabTestsForCourse("course-math1141")).toEqual([]);
  });

  it("returns null when fetching an unpublished test by id", async () => {
    expect(await getLabTest("test-1081-lt2-draft")).toBeNull();
  });

  it("returns a published test by id", async () => {
    const test = await getLabTest("test-1081-lt1");
    expect(test?.name).toBe("Lab Test 1");
  });

  it("returns questions for a published test, sorted, with parts", async () => {
    const questions = await getQuestionsForTest("test-1081-lt1");
    expect(questions.map((q) => q.number)).toEqual([1, 2, 3, 4, 8]);
    expect(questions[0].parts.map((p) => p.label)).toEqual(["a", "b"]);
  });

  it("returns no questions for an unpublished test", async () => {
    expect(await getQuestionsForTest("test-1081-lt2-draft")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/data/__tests__/queries.test.ts
```
Expected: FAIL — cannot find module `../queries`.

- [ ] **Step 3: Implement the queries**

Create `lib/data/queries.ts`:
```ts
import type { Course, LabTest, Question } from "./types";
import { courses, labTests, questions } from "./fixtures";

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

export async function getCourses(): Promise<Course[]> {
  return [...courses].sort(bySortOrder);
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  const target = code.toLowerCase();
  return courses.find((c) => c.code.toLowerCase() === target) ?? null;
}

export async function getLabTestsForCourse(courseId: string): Promise<LabTest[]> {
  return labTests
    .filter((t) => t.courseId === courseId && t.isPublished)
    .sort(bySortOrder);
}

export async function getLabTest(testId: string): Promise<LabTest | null> {
  return labTests.find((t) => t.id === testId && t.isPublished) ?? null;
}

export async function getQuestionsForTest(testId: string): Promise<Question[]> {
  const test = await getLabTest(testId);
  if (!test) return [];
  return questions
    .filter((q) => q.labTestId === testId)
    .sort(bySortOrder)
    .map((q) => ({
      ...q,
      parts: [...q.parts].sort(bySortOrder),
    }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/data/__tests__/queries.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/queries.ts lib/data/__tests__/queries.test.ts
git commit -m "feat: add fixture-backed data-access layer (published-filtered)"
```

---

## Task 6: `<Latex>` and `<RichText>` components

Server components (no interactivity). `renderLatex` is pure and returns HTML, so these render on the server for the ISR pages.

**Files:**
- Create: `components/math/Latex.tsx`
- Create: `components/math/RichText.tsx`

- [ ] **Step 1: Create the Latex component**

Create `components/math/Latex.tsx`:
```tsx
import { renderLatex } from "@/lib/math";

export function Latex({
  children,
  display = false,
}: {
  children: string;
  display?: boolean;
}) {
  const { html } = renderLatex(children, display);
  if (display) {
    return (
      <div
        className="my-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 2: Create the RichText component**

Create `components/math/RichText.tsx`:
```tsx
import { parseRichText } from "@/lib/math";
import { Latex } from "./Latex";

export function RichText({ children }: { children: string }) {
  const segments = parseRichText(children);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>;
        }
        return (
          <Latex key={i} display={seg.type === "displayMath"}>
            {seg.value}
          </Latex>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/math/Latex.tsx components/math/RichText.tsx
git commit -m "feat: add Latex and RichText rendering components"
```

---

## Task 7: `<MobiusAnswer>` component

Renders a stored structured answer value as readable math (`answerValueToMobius` → `mobiusToLatex` → `<Latex>`).

**Files:**
- Create: `components/math/MobiusAnswer.tsx`

- [ ] **Step 1: Create the component**

Create `components/math/MobiusAnswer.tsx`:
```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/math/MobiusAnswer.tsx
git commit -m "feat: add MobiusAnswer component"
```

---

## Task 8: UI primitives + layout/nav

**Files:**
- Create: `components/ui/Card.tsx`
- Create: `components/ui/PageHeader.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create the Card primitive**

Create `components/ui/Card.tsx`:
```tsx
import Link from "next/link";

export function Card({
  href,
  title,
  subtitle,
  children,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const inner = (
    <div className="h-full rounded-xl border border-gray-200 p-5 transition hover:border-gray-400 hover:shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      {children ? <div className="mt-3 text-sm text-gray-700">{children}</div> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
```

- [ ] **Step 2: Create the PageHeader primitive**

Create `components/ui/PageHeader.tsx`:
```tsx
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-gray-500">{subtitle}</p> : null}
    </div>
  );
}
```

- [ ] **Step 3: Update the root layout**

Replace the contents of `app/layout.tsx` with (keep the existing font setup lines that create-next-app generated; only the metadata and the body markup change):
```tsx
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MathSoc Lab Test Practice",
  description:
    "Practise UNSW mathematics lab tests with guided steps, hints and worked solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-gray-200">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-semibold text-gray-900">
              MathSoc Lab Test Practice
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```
Note: if create-next-app generated the `Geist`/`Geist_Mono` imports with different variable wiring, preserve its exact font lines and change only `metadata` and the returned markup.

- [ ] **Step 4: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Card.tsx components/ui/PageHeader.tsx app/layout.tsx
git commit -m "feat: add UI primitives and site layout/nav"
```

---

## Task 9: Home page (course grid)

**Files:**
- Replace: `app/page.tsx`

- [ ] **Step 1: Replace the home page**

Replace the entire contents of `app/page.tsx`:
```tsx
import { getCourses } from "@/lib/data/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 3600;

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <div>
      <PageHeader
        title="Choose a course"
        subtitle="Practise past lab tests with guided steps, hints and worked solutions."
      />
      {courses.length === 0 ? (
        <p className="text-gray-500">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              href={`/courses/${course.code}`}
              title={course.code}
              subtitle={course.name}
            >
              {course.description}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manually verify**

Run `npm run dev`, open http://localhost:3000. Expected: a header, "Choose a course", and two course cards (MATH1081, MATH1141). Clicking a card navigates to `/courses/MATH1081` (404 until Task 10 — that's fine for now). Stop the dev server (Ctrl-C).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: home page course grid"
```

---

## Task 10: Course page (lab tests list)

**Files:**
- Create: `app/courses/[courseCode]/page.tsx`

- [ ] **Step 1: Create the course page**

Note: in this Next.js version, dynamic route `params` is a Promise and must be awaited.

Create `app/courses/[courseCode]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getCourseByCode, getLabTestsForCourse } from "@/lib/data/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 3600;

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const { courseCode } = await params;
  const course = await getCourseByCode(courseCode);
  if (!course) notFound();

  const tests = await getLabTestsForCourse(course.id);

  return (
    <div>
      <PageHeader title={`${course.code} — ${course.name}`} subtitle="Lab tests" />
      {tests.length === 0 ? (
        <p className="text-gray-500">No lab tests available yet for this course.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tests.map((test) => (
            <Card
              key={test.id}
              href={`/tests/${test.id}`}
              title={test.name}
              subtitle={test.term}
            >
              {test.description}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manually verify**

`npm run dev`, then:
- http://localhost:3000/courses/MATH1081 → shows "Lab Test 1" (NOT the draft "Lab Test 2").
- http://localhost:3000/courses/MATH1141 → shows the empty state ("No lab tests available yet…").
- http://localhost:3000/courses/NOPE → shows the 404 not-found page.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/courses
git commit -m "feat: course page listing published lab tests"
```

---

## Task 11: Lab-test overview page

Renders the test's questions read-only: number, prompt (RichText), each part's label + prompt + final answer (MobiusAnswer). This is the presentable payoff — real MATH1081 content with rendered math. Interactivity (the step player) is Plan 3; here each question shows a disabled "Practice (coming in the next release)" affordance so the intent is visible without a dead link.

**Files:**
- Create: `app/tests/[testId]/page.tsx`

- [ ] **Step 1: Create the overview page**

Create `app/tests/[testId]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getLabTest, getQuestionsForTest } from "@/lib/data/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/math/RichText";
import { MobiusAnswer } from "@/components/math/MobiusAnswer";

export const revalidate = 3600;

export default async function TestOverviewPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = await getLabTest(testId);
  if (!test) notFound();

  const questions = await getQuestionsForTest(testId);

  return (
    <div>
      <PageHeader
        title={test.name}
        subtitle={[test.term, test.description].filter(Boolean).join(" · ")}
      />
      {questions.length === 0 ? (
        <p className="text-gray-500">This test has no questions yet.</p>
      ) : (
        <ol className="space-y-8">
          {questions.map((q) => (
            <li key={q.id} className="rounded-xl border border-gray-200 p-5">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Question {q.number}
              </h2>
              <div className="mb-4 text-gray-800">
                <RichText>{q.promptLatex}</RichText>
              </div>
              <div className="space-y-3">
                {q.parts.map((part) => (
                  <div key={part.id} className="border-l-2 border-gray-100 pl-4">
                    <div className="text-gray-800">
                      <span className="font-medium">{part.label})</span>{" "}
                      <RichText>{part.promptLatex}</RichText>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Answer:{" "}
                      <MobiusAnswer
                        value={part.answerValue}
                        type={part.answerType}
                        config={part.answerConfig}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled
                className="mt-4 cursor-not-allowed rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-400"
              >
                Practice (coming in the next release)
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manually verify**

`npm run dev`, then http://localhost:3000/tests/test-1081-lt1 → shows Questions 1, 2, 3, 4, 8 with prompts rendered (math like $|B \cup E \cup M|$, $S_k$, $2^{100}$ rendered by KaTeX), each part's answer rendered (e.g. {14, 15, 16, 17, 18}, 2¹⁰⁰, "not surjective", "Bijective", "Reflexive, Symmetric, Transitive"). Also confirm http://localhost:3000/tests/test-1081-lt2-draft → 404 (draft not visible). Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/tests
git commit -m "feat: lab-test overview page rendering questions and answers"
```

---

## Task 12: Global loading / error / not-found boundaries

**Files:**
- Create: `app/loading.tsx`
- Create: `app/error.tsx`
- Create: `app/not-found.tsx`

- [ ] **Step 1: Create loading.tsx**

Create `app/loading.tsx`:
```tsx
export default function Loading() {
  return <p className="text-gray-400">Loading…</p>;
}
```

- [ ] **Step 2: Create error.tsx**

`error.tsx` must be a client component.

Create `app/error.tsx`:
```tsx
"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p className="text-gray-800">Something went wrong loading this page.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-500"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create not-found.tsx**

Create `app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <p className="text-gray-800">We couldn&apos;t find that page.</p>
      <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
        Back to courses
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/loading.tsx app/error.tsx app/not-found.tsx
git commit -m "feat: add global loading, error and not-found boundaries"
```

---

## Task 13: Final verification

- [ ] **Step 1: Full test suite**

Run:
```bash
npm test
```
Expected: all green (Plan 1 suites + `answer-display`, `richtext`, `queries`).

- [ ] **Step 2: Lint and build**

Run:
```bash
npm run lint && npm run build
```
Expected: lint clean; build succeeds.

- [ ] **Step 3: End-to-end manual walkthrough**

`npm run dev` and click through: home → MATH1081 → Lab Test 1 → confirm all five questions render with correct math and answers; visit MATH1141 (empty state); visit a bad URL (not-found). Stop the dev server.

- [ ] **Step 4: Commit any final touch-ups (if needed)**

Only if Step 1–3 required fixes:
```bash
git add -A
git commit -m "fix: address final verification issues"
```

---

## Definition of Done (Plan 2)

- [ ] `npm test`, `npm run lint`, `npm run build` all pass.
- [ ] Home, course, and test-overview pages render from `lib/data/queries.ts` only.
- [ ] MATH1081 Lab Test 1 content renders with correct KaTeX math and correctly-formatted Numbas answers across all six answer types.
- [ ] Draft (unpublished) test is invisible; empty and not-found states work.
- [ ] `lib/data/queries.ts` is the sole data seam and is async + published-filtered, ready for a drop-in `supabase-js` swap.

---

## Known Issues (post-implementation)

- **`notFound()` returns HTTP 200 instead of 404.** On draft/unknown routes the not-found page renders correctly and draft content stays hidden (UX is correct), but the HTTP status is 200 in Next.js 16.2.10. Removing `revalidate` did not change it — it is a framework-level behaviour, not a page-logic bug. Low impact for an internal study tool; revisit when wiring the real backend / SEO matters (candidate: a `middleware.ts` status override or a Next upgrade).

## Roadmap: Plans 3–4 (unchanged)

- **Plan 3 — Guided Step Player**: `components/player/` (`QuestionPlayer`, `StepCard`, per-type `AnswerInput`, `HintStack`, reveal hatches), wiring the Plan 1 `grade()` dispatcher for per-step + final grading, unlimited attempts, no gating, skip-ahead, `localStorage` progress. Mount at `/tests/[testId]/q/[questionId]`; replace the disabled "Practice" button with a real link.
- **Plan 4 — Admin Authoring**: Supabase Auth login + `/admin/*` protection, nested tree editor, typed answer editor with live preview, LaTeX live-preview fields, dnd-kit reordering, mutation functions + validation. This is also where the real `supabase-js` implementation replaces the fixture behind `lib/data/queries.ts`, and the schema migration SQL is authored as the backend contract.
```
