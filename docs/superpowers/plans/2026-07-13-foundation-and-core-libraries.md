# Foundation & Core Libraries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js + TypeScript + Tailwind project and build the two pure, fully-tested core libraries every later plan depends on: `lib/grading/` (typed answer graders) and `lib/math/` (LaTeX + Numbas/Mobius answer rendering).

**Architecture:** Next.js App Router app with a strict module boundary: pure logic lives in `lib/` with zero UI/network dependencies so it can be unit-tested in isolation. Grading is one pure function per answer type behind a single `grade()` dispatcher. Math rendering is two pure helpers — `mobiusToLatex()` (Numbas answer syntax → LaTeX) and `renderLatex()` (LaTeX → HTML via KaTeX).

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, KaTeX, Vitest (unit tests). Package manager: npm.

**Part of a series:** This is Plan 1 of 4. Plan 2 = Data Layer & Browse Pages, Plan 3 = Guided Step Player, Plan 4 = Admin Authoring. See the roadmap at the end.

**Reference spec:** `docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md`

---

## File Structure

Files created in this plan:

- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/` — Next.js scaffold (Task 1).
- `vitest.config.ts` — test runner config (Task 2).
- `lib/grading/types.ts` — shared answer types (`AnswerType`, `AnswerValue`, `AnswerConfig`, `GradeResult`).
- `lib/grading/integer.ts`, `set.ts`, `expression.ts`, `choice.ts`, `multiSelect.ts`, `text.ts` — one grader per answer type.
- `lib/grading/index.ts` — `grade()` dispatcher + re-exports.
- `lib/math/mobius.ts` — `mobiusToLatex()`.
- `lib/math/render.ts` — `renderLatex()`.
- `lib/**/__tests__/*.test.ts` — colocated unit tests.

Each grader is one file with one responsibility. The dispatcher is the only thing later code imports for grading; individual graders stay internal but exported for direct testing.

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`

- [ ] **Step 1: Run create-next-app in the current directory**

The repo already contains `docs/` and a source `.md` file; create-next-app coexists with those (it only refuses if *conflicting* files like `package.json` already exist).

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm
```
When prompted about Turbopack, accept the default (Yes). If it warns the directory is not empty, choose to proceed — the existing `docs/`, `.git/`, and `MATH1081__Lab_Test_1 2026.md` do not conflict.

- [ ] **Step 2: Verify the dev toolchain builds**

Run:
```bash
npm run build
```
Expected: build completes successfully with a default home page compiled.

- [ ] **Step 3: Add KaTeX and its stylesheet import**

Run:
```bash
npm install katex
npm install -D @types/katex
```

Then add the KaTeX stylesheet import at the top of `app/layout.tsx` (first import line):
```tsx
import "katex/dist/katex.min.css";
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind + KaTeX"
```

---

## Task 2: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script)
- Create: `lib/__tests__/smoke.test.ts`

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to the `"scripts"` object:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test**

Create `lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("test runner", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run:
```bash
npm test
```
Expected: PASS — 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Vitest test runner"
```

---

## Task 3: Grading types + integer grader

**Files:**
- Create: `lib/grading/types.ts`
- Create: `lib/grading/integer.ts`
- Test: `lib/grading/__tests__/integer.test.ts`

- [ ] **Step 1: Define the shared types**

Create `lib/grading/types.ts`:
```ts
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
  /** Absolute tolerance for integer/expression numeric compare. Default 0. */
  tolerance?: number;
  /** Choice options for single_choice / multi_select. */
  options?: ChoiceOption[];
  /** Case-insensitive compare for text. Default false. */
  caseInsensitive?: boolean;
}

export interface GradeResult {
  correct: boolean;
  /** The student input after normalization, for display/echo. */
  normalized: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `lib/grading/__tests__/integer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { gradeInteger } from "../integer";

describe("gradeInteger", () => {
  it("accepts an exact match (Q1a answer 19)", () => {
    expect(gradeInteger("19", 19).correct).toBe(true);
  });

  it("accepts input with surrounding whitespace", () => {
    expect(gradeInteger("  32 ", 32).correct).toBe(true);
  });

  it("rejects a wrong value", () => {
    expect(gradeInteger("18", 19).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(gradeInteger("", 0).correct).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(gradeInteger("abc", 5).correct).toBe(false);
  });

  it("honours an absolute tolerance", () => {
    expect(gradeInteger("100", 101, { tolerance: 1 }).correct).toBe(true);
    expect(gradeInteger("100", 103, { tolerance: 1 }).correct).toBe(false);
  });

  it("returns the normalized numeric string", () => {
    expect(gradeInteger(" 007 ", 7).normalized).toBe("7");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/integer.test.ts
```
Expected: FAIL — cannot find module `../integer`.

- [ ] **Step 4: Implement the integer grader**

Create `lib/grading/integer.ts`:
```ts
import type { AnswerConfig, GradeResult } from "./types";

export function gradeInteger(
  input: string,
  answer: number,
  config: AnswerConfig = {}
): GradeResult {
  const trimmed = input.trim();
  const parsed = Number(trimmed);
  if (trimmed === "" || Number.isNaN(parsed)) {
    return { correct: false, normalized: trimmed };
  }
  const tolerance = config.tolerance ?? 0;
  const correct = Math.abs(parsed - answer) <= tolerance;
  return { correct, normalized: String(parsed) };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/integer.test.ts
```
Expected: PASS — 7 tests passed.

- [ ] **Step 6: Commit**

```bash
git add lib/grading/types.ts lib/grading/integer.ts lib/grading/__tests__/integer.test.ts
git commit -m "feat: add typed answer types and integer grader"
```

---

## Task 4: set_of_integers grader

**Files:**
- Create: `lib/grading/set.ts`
- Test: `lib/grading/__tests__/set.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/set.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseIntegerSet, gradeSetOfIntegers } from "../set";

describe("parseIntegerSet", () => {
  it("parses a populated set (Q2a answer)", () => {
    expect(parseIntegerSet("set(14,15,16,17,18)")).toEqual([14, 15, 16, 17, 18]);
  });

  it("parses the empty set (Q7b answer)", () => {
    expect(parseIntegerSet("set()")).toEqual([]);
  });

  it("tolerates whitespace and is case-insensitive on the keyword", () => {
    expect(parseIntegerSet(" SET( 6 , 7 ) ")).toEqual([6, 7]);
  });

  it("returns null for non-set syntax", () => {
    expect(parseIntegerSet("14,15,16")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseIntegerSet("set(1,x)")).toBeNull();
  });
});

describe("gradeSetOfIntegers", () => {
  it("accepts an exact set (Q7c answer)", () => {
    const r = gradeSetOfIntegers(
      "set(217,502,787,1072,1357,1642)",
      [217, 502, 787, 1072, 1357, 1642]
    );
    expect(r.correct).toBe(true);
  });

  it("is order-insensitive", () => {
    expect(gradeSetOfIntegers("set(18,14,15,17,16)", [14, 15, 16, 17, 18]).correct).toBe(true);
  });

  it("ignores duplicate members", () => {
    expect(gradeSetOfIntegers("set(6,6,7)", [6, 7]).correct).toBe(true);
  });

  it("matches the empty set against []", () => {
    expect(gradeSetOfIntegers("set()", []).correct).toBe(true);
  });

  it("rejects a set with a missing member", () => {
    expect(gradeSetOfIntegers("set(14,15,16)", [14, 15, 16, 17, 18]).correct).toBe(false);
  });

  it("rejects unparseable input", () => {
    expect(gradeSetOfIntegers("14,15", [14, 15]).correct).toBe(false);
  });

  it("returns a canonical sorted normalized form", () => {
    expect(gradeSetOfIntegers("set(3,1,2)", [1, 2, 3]).normalized).toBe("set(1,2,3)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/set.test.ts
```
Expected: FAIL — cannot find module `../set`.

- [ ] **Step 3: Implement the set grader**

Create `lib/grading/set.ts`:
```ts
import type { GradeResult } from "./types";

/** Parse Numbas `set(a,b,c)` syntax into a number array, or null if malformed. */
export function parseIntegerSet(input: string): number[] | null {
  const match = /^set\(\s*(.*?)\s*\)$/i.exec(input.trim());
  if (!match) return null;
  const inner = match[1].trim();
  if (inner === "") return [];
  const parts = inner.split(",").map((p) => p.trim());
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    nums.push(Number(part));
  }
  return nums;
}

function canonical(arr: number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

export function gradeSetOfIntegers(input: string, answer: number[]): GradeResult {
  const parsed = parseIntegerSet(input);
  if (parsed === null) {
    return { correct: false, normalized: input.trim() };
  }
  const a = canonical(parsed);
  const b = canonical(answer);
  const correct = a.length === b.length && a.every((v, i) => v === b[i]);
  return { correct, normalized: `set(${a.join(",")})` };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/set.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/set.ts lib/grading/__tests__/set.test.ts
git commit -m "feat: add set_of_integers grader with Numbas set() parser"
```

---

## Task 5: expression grader

Note: mathjs numeric-equivalence is intentionally deferred (spec lists it as optional "later"). v1 uses whitespace/case-normalized string comparison, which correctly handles the source answers `2^100`, `2^20`.

**Files:**
- Create: `lib/grading/expression.ts`
- Test: `lib/grading/__tests__/expression.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/expression.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeExpression, gradeExpression } from "../expression";

describe("normalizeExpression", () => {
  it("strips all whitespace and lowercases", () => {
    expect(normalizeExpression(" 2 ^ 100 ")).toBe("2^100");
  });
});

describe("gradeExpression", () => {
  it("accepts an exact power (Q2b.i answer 2^100)", () => {
    expect(gradeExpression("2^100", { mobius: "2^100" }).correct).toBe(true);
  });

  it("accepts a match despite spacing differences (2^20)", () => {
    expect(gradeExpression(" 2 ^ 20", { mobius: "2^20" }).correct).toBe(true);
  });

  it("rejects a different exponent", () => {
    expect(gradeExpression("2^99", { mobius: "2^100" }).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(gradeExpression("", { mobius: "2^100" }).correct).toBe(false);
  });

  it("preserves the raw trimmed input in normalized", () => {
    expect(gradeExpression("  2^100 ", { mobius: "2^100" }).normalized).toBe("2^100");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/expression.test.ts
```
Expected: FAIL — cannot find module `../expression`.

- [ ] **Step 3: Implement the expression grader**

Create `lib/grading/expression.ts`:
```ts
import type { GradeResult } from "./types";

export function normalizeExpression(input: string): string {
  return input.trim().replace(/\s+/g, "").toLowerCase();
}

export function gradeExpression(
  input: string,
  answer: { mobius: string }
): GradeResult {
  const a = normalizeExpression(input);
  const b = normalizeExpression(answer.mobius);
  return { correct: a !== "" && a === b, normalized: input.trim() };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/expression.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/expression.ts lib/grading/__tests__/expression.test.ts
git commit -m "feat: add expression grader (normalized string compare)"
```

---

## Task 6: single_choice grader

**Files:**
- Create: `lib/grading/choice.ts`
- Test: `lib/grading/__tests__/choice.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/choice.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { gradeSingleChoice } from "../choice";

describe("gradeSingleChoice", () => {
  it("accepts the matching choice value (Q3a not_surjective)", () => {
    expect(
      gradeSingleChoice("not_surjective", { choice: "not_surjective" }).correct
    ).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    expect(gradeSingleChoice("  not_injective ", { choice: "not_injective" }).correct).toBe(true);
  });

  it("rejects a different choice", () => {
    expect(gradeSingleChoice("injective", { choice: "not_surjective" }).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(gradeSingleChoice("", { choice: "injective" }).correct).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/choice.test.ts
```
Expected: FAIL — cannot find module `../choice`.

- [ ] **Step 3: Implement the single_choice grader**

Create `lib/grading/choice.ts`:
```ts
import type { GradeResult } from "./types";

export function gradeSingleChoice(
  input: string,
  answer: { choice: string }
): GradeResult {
  const normalized = input.trim();
  return { correct: normalized !== "" && normalized === answer.choice, normalized };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/choice.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/choice.ts lib/grading/__tests__/choice.test.ts
git commit -m "feat: add single_choice grader"
```

---

## Task 7: multi_select grader

Input is an array of selected option values (the reflexive/symmetric/transitive checkboxes). Grading is set-equality — order and duplicates ignored.

**Files:**
- Create: `lib/grading/multiSelect.ts`
- Test: `lib/grading/__tests__/multiSelect.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/multiSelect.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { gradeMultiSelect } from "../multiSelect";

describe("gradeMultiSelect", () => {
  it("accepts the exact selection (Q8a reflexive/symmetric/transitive)", () => {
    const r = gradeMultiSelect(
      ["reflexive", "symmetric", "transitive"],
      { selected: ["reflexive", "symmetric", "transitive"] }
    );
    expect(r.correct).toBe(true);
  });

  it("is order-insensitive", () => {
    expect(
      gradeMultiSelect(["symmetric", "reflexive"], { selected: ["reflexive", "symmetric"] }).correct
    ).toBe(true);
  });

  it("accepts an empty selection matching an empty answer", () => {
    expect(gradeMultiSelect([], { selected: [] }).correct).toBe(true);
  });

  it("rejects a superset selection", () => {
    expect(
      gradeMultiSelect(["reflexive", "symmetric"], { selected: ["reflexive"] }).correct
    ).toBe(false);
  });

  it("rejects a missing member", () => {
    expect(
      gradeMultiSelect(["reflexive"], { selected: ["reflexive", "symmetric"] }).correct
    ).toBe(false);
  });

  it("returns a sorted comma-joined normalized form", () => {
    expect(
      gradeMultiSelect(["transitive", "reflexive"], { selected: ["reflexive", "transitive"] }).normalized
    ).toBe("reflexive,transitive");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/multiSelect.test.ts
```
Expected: FAIL — cannot find module `../multiSelect`.

- [ ] **Step 3: Implement the multi_select grader**

Create `lib/grading/multiSelect.ts`:
```ts
import type { GradeResult } from "./types";

function canonical(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
}

export function gradeMultiSelect(
  input: string[],
  answer: { selected: string[] }
): GradeResult {
  const a = canonical(input);
  const b = canonical(answer.selected);
  const correct = a.length === b.length && a.every((v, i) => v === b[i]);
  return { correct, normalized: a.join(",") };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/multiSelect.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/multiSelect.ts lib/grading/__tests__/multiSelect.test.ts
git commit -m "feat: add multi_select grader"
```

---

## Task 8: text grader

**Files:**
- Create: `lib/grading/text.ts`
- Test: `lib/grading/__tests__/text.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/text.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { gradeText } from "../text";

describe("gradeText", () => {
  it("accepts an exact match (Q4c answer Bijective)", () => {
    expect(gradeText("Bijective", { text: "Bijective" }).correct).toBe(true);
  });

  it("collapses internal whitespace", () => {
    expect(gradeText("not   surjective", { text: "not surjective" }).correct).toBe(true);
  });

  it("is case-sensitive by default", () => {
    expect(gradeText("bijective", { text: "Bijective" }).correct).toBe(false);
  });

  it("is case-insensitive when configured", () => {
    expect(
      gradeText("bijective", { text: "Bijective" }, { caseInsensitive: true }).correct
    ).toBe(true);
  });

  it("rejects empty input", () => {
    expect(gradeText("", { text: "Bijective" }).correct).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/text.test.ts
```
Expected: FAIL — cannot find module `../text`.

- [ ] **Step 3: Implement the text grader**

Create `lib/grading/text.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/text.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/text.ts lib/grading/__tests__/text.test.ts
git commit -m "feat: add text grader"
```

---

## Task 9: grade() dispatcher

Single entry point that later plans import. Dispatches on `AnswerType` to the correct grader. `multi_select` takes a `string[]` input; all others take `string`.

**Files:**
- Create: `lib/grading/index.ts`
- Test: `lib/grading/__tests__/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/grading/__tests__/index.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { grade } from "../index";

describe("grade dispatcher", () => {
  it("routes integer answers", () => {
    expect(grade("integer", "19", 19).correct).toBe(true);
  });

  it("routes set_of_integers answers", () => {
    expect(grade("set_of_integers", "set(6,7)", [6, 7]).correct).toBe(true);
  });

  it("routes expression answers", () => {
    expect(grade("expression", "2^100", { mobius: "2^100" }).correct).toBe(true);
  });

  it("routes single_choice answers", () => {
    expect(grade("single_choice", "injective", { choice: "injective" }).correct).toBe(true);
  });

  it("routes multi_select answers (array input)", () => {
    expect(
      grade("multi_select", ["reflexive", "symmetric"], { selected: ["symmetric", "reflexive"] }).correct
    ).toBe(true);
  });

  it("routes text answers", () => {
    expect(grade("text", "Bijective", { text: "Bijective" }).correct).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/grading/__tests__/index.test.ts
```
Expected: FAIL — cannot find module `../index`.

- [ ] **Step 3: Implement the dispatcher**

Create `lib/grading/index.ts`:
```ts
import type { AnswerType, AnswerValue, AnswerConfig, GradeResult } from "./types";
import { gradeInteger } from "./integer";
import { gradeSetOfIntegers } from "./set";
import { gradeExpression } from "./expression";
import { gradeSingleChoice } from "./choice";
import { gradeMultiSelect } from "./multiSelect";
import { gradeText } from "./text";

export function grade(
  type: AnswerType,
  input: string | string[],
  answer: AnswerValue,
  config: AnswerConfig = {}
): GradeResult {
  switch (type) {
    case "integer":
      return gradeInteger(input as string, answer as number, config);
    case "set_of_integers":
      return gradeSetOfIntegers(input as string, answer as number[]);
    case "expression":
      return gradeExpression(input as string, answer as { mobius: string });
    case "single_choice":
      return gradeSingleChoice(input as string, answer as { choice: string });
    case "multi_select":
      return gradeMultiSelect(input as string[], answer as { selected: string[] });
    case "text":
      return gradeText(input as string, answer as { text: string }, config);
    default:
      return { correct: false, normalized: String(input) };
  }
}

export * from "./types";
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/grading/__tests__/index.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Run the full grading suite**

Run:
```bash
npm test
```
Expected: PASS — all grading + smoke tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/grading/index.ts lib/grading/__tests__/index.test.ts
git commit -m "feat: add grade() dispatcher over all answer types"
```

---

## Task 10: mobiusToLatex() — Numbas answer syntax → LaTeX

**Files:**
- Create: `lib/math/mobius.ts`
- Test: `lib/math/__tests__/mobius.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/__tests__/mobius.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mobiusToLatex } from "../mobius";

describe("mobiusToLatex", () => {
  it("renders a populated set as LaTeX braces", () => {
    expect(mobiusToLatex("set(14,15,16,17,18)", "set_of_integers")).toBe(
      "\\{14,\\ 15,\\ 16,\\ 17,\\ 18\\}"
    );
  });

  it("renders the empty set as emptyset", () => {
    expect(mobiusToLatex("set()", "set_of_integers")).toBe("\\emptyset");
  });

  it("renders a power with braced exponent", () => {
    expect(mobiusToLatex("2^100", "expression")).toBe("2^{100}");
  });

  it("renders multiplication as \\times", () => {
    expect(mobiusToLatex("2^4*3", "expression")).toBe("2^{4}\\times 3");
  });

  it("passes an integer through unchanged", () => {
    expect(mobiusToLatex("19", "integer")).toBe("19");
  });

  it("maps a single_choice value to its option label", () => {
    expect(
      mobiusToLatex("not_surjective", "single_choice", {
        options: [
          { value: "injective", label: "injective" },
          { value: "not_surjective", label: "not surjective" },
        ],
      })
    ).toBe("\\text{not surjective}");
  });

  it("maps multi_select values to a joined label list", () => {
    expect(
      mobiusToLatex("reflexive,symmetric", "multi_select", {
        options: [
          { value: "reflexive", label: "Reflexive" },
          { value: "symmetric", label: "Symmetric" },
        ],
      })
    ).toBe("\\text{Reflexive, Symmetric}");
  });

  it("wraps free text in \\text", () => {
    expect(mobiusToLatex("Bijective", "text")).toBe("\\text{Bijective}");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/math/__tests__/mobius.test.ts
```
Expected: FAIL — cannot find module `../mobius`.

- [ ] **Step 3: Implement mobiusToLatex**

Create `lib/math/mobius.ts`:
```ts
import type { AnswerType, AnswerConfig } from "../grading/types";

export function mobiusToLatex(
  value: string,
  type: AnswerType,
  config: AnswerConfig = {}
): string {
  const trimmed = value.trim();
  switch (type) {
    case "set_of_integers":
      return setToLatex(trimmed);
    case "expression":
      return exponentToLatex(trimmed);
    case "single_choice": {
      const opt = config.options?.find((o) => o.value === trimmed);
      return textLatex(opt ? opt.label : trimmed);
    }
    case "multi_select": {
      const labels = trimmed
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => config.options?.find((o) => o.value === v)?.label ?? v);
      return textLatex(labels.join(", "));
    }
    case "integer":
      return trimmed;
    case "text":
    default:
      return textLatex(trimmed);
  }
}

function setToLatex(value: string): string {
  const match = /^set\(\s*(.*?)\s*\)$/i.exec(value);
  if (!match) return value;
  const inner = match[1].trim();
  if (inner === "") return "\\emptyset";
  const parts = inner.split(",").map((p) => p.trim());
  return `\\{${parts.join(",\\ ")}\\}`;
}

function exponentToLatex(value: string): string {
  return value.replace(/\^(-?\d+)/g, "^{$1}").replace(/\*/g, "\\times ");
}

function textLatex(value: string): string {
  return `\\text{${value}}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/math/__tests__/mobius.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/math/mobius.ts lib/math/__tests__/mobius.test.ts
git commit -m "feat: add mobiusToLatex Numbas-answer-to-LaTeX converter"
```

---

## Task 11: renderLatex() — LaTeX → HTML via KaTeX

Wraps `katex.renderToString`. On invalid LaTeX it never throws: it returns an escaped inline error marker and `error: true`, so a bad string is visible (for admins) but never blanks the page (for students).

**Files:**
- Create: `lib/math/render.ts`
- Test: `lib/math/__tests__/render.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/__tests__/render.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { renderLatex } from "../render";

describe("renderLatex", () => {
  it("renders valid LaTeX to KaTeX HTML with no error", () => {
    const r = renderLatex("x^2");
    expect(r.error).toBe(false);
    expect(r.html).toContain("katex");
  });

  it("flags invalid LaTeX as an error without throwing", () => {
    const r = renderLatex("\\frac{");
    expect(r.error).toBe(true);
    expect(r.html).toContain("katex-error");
  });

  it("escapes angle brackets in the error fallback", () => {
    const r = renderLatex("\\frac{<script>");
    expect(r.error).toBe(true);
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
  });

  it("supports display mode", () => {
    const r = renderLatex("\\sum_{i=1}^n i", true);
    expect(r.error).toBe(false);
    expect(r.html).toContain("katex");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/math/__tests__/render.test.ts
```
Expected: FAIL — cannot find module `../render`.

- [ ] **Step 3: Implement renderLatex**

Create `lib/math/render.ts`:
```ts
import katex from "katex";

export interface RenderResult {
  html: string;
  error: boolean;
}

export function renderLatex(latex: string, displayMode = false): RenderResult {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: true,
      displayMode,
    });
    return { html, error: false };
  } catch {
    const safe = latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return {
      html: `<span class="katex-error" title="Invalid LaTeX">${safe}</span>`,
      error: true,
    };
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/math/__tests__/render.test.ts
```
Expected: PASS — all tests passed.

- [ ] **Step 5: Run the full suite and lint**

Run:
```bash
npm test && npm run lint
```
Expected: all tests PASS; lint reports no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/math/render.ts lib/math/__tests__/render.test.ts
git commit -m "feat: add renderLatex KaTeX wrapper with safe error fallback"
```

---

## Definition of Done (Plan 1)

- [ ] `npm run build` succeeds.
- [ ] `npm test` runs green across all grading and math suites.
- [ ] `lib/grading/` exports a `grade(type, input, answer, config)` dispatcher covering all six answer types, each with dedicated unit tests derived from the real MATH1081 answers.
- [ ] `lib/math/` exports `mobiusToLatex()` and `renderLatex()`, both unit-tested.
- [ ] No UI or network code exists in `lib/` — these modules are pure and importable by later plans.

---

## Roadmap: Plans 2–4 (to be written after Plan 1)

**Plan 2 — Data Layer & Browse Pages**
- TypeScript types mirroring the schema contract (`lib/supabase/types.ts`).
- Local Supabase via `npx supabase init` + a migration encoding the contract schema + a seed loading MATH1081 Lab Test 1 as fixture data (shareable with the backend teammate).
- `lib/supabase/client.ts` + read functions (`getCourses`, `getCourse`, `getTest`, `getQuestion`) — the sole Supabase boundary.
- Server-component browse pages with ISR: home (`/`), course (`/courses/[courseCode]`), test overview (`/tests/[testId]`), plus `loading.tsx` / `error.tsx` / empty states.
- A `<Latex>` and `<MobiusAnswer>` React component wrapping the Plan 1 renderers.

**Plan 3 — Guided Step Player**
- `components/player/` — `QuestionPlayer`, `StepCard`, `AnswerInput` (widget per `answer_type`), `HintStack`, reveal-answer hatches.
- Wire the `grade()` dispatcher for per-step and final-answer checking; unlimited attempts, no gating, skip-ahead.
- `localStorage` progress persistence keyed by question id.
- React Testing Library component tests for check/feedback/reveal/hints/skip.
- Mount at `/tests/[testId]/q/[questionId]`.

**Plan 4 — Admin Authoring**
- Supabase Auth admin login (`/login`) + route protection for `/admin/*`.
- Admin dashboard + nested tree editor (question → part → step → hint).
- Typed answer editor (reuses the student widgets) with live `renderMobiusAnswer` preview.
- LaTeX fields with live KaTeX preview.
- dnd-kit drag-and-drop reordering at every level, persisting `sort_order`.
- Admin mutation functions in `lib/supabase/` + pre-save validation.
