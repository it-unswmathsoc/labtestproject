# Answer Syntax Dialects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin choose Numbas, Maple, or LaTeX answer syntax once per lab test, so grading, LaTeX rendering and a student-facing badge all follow that choice.

**Architecture:** A new pure `lib/math/syntax/` package holds one module per dialect, each exporting the same five functions behind a `dialect()` lookup. The chosen syntax is a new `answer_syntax` column on `lab_tests`, threaded as an explicit prop from the two page entry points down the player tree to `grade()`. Existing `mobius`-named symbols are renamed to dialect-neutral ones.

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind, Supabase (Postgres + PostgREST), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-16-answer-syntax-dialects-design.md`

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `lib/math/syntax/types.ts` | `AnswerSyntax`, `NormalizeResult` types only |
| `lib/math/syntax/numbas.ts` | Numbas/JME dialect: the five functions |
| `lib/math/syntax/maple.ts` | Maple dialect: the five functions |
| `lib/math/syntax/latex.ts` | LaTeX dialect: the five functions |
| `lib/math/syntax/index.ts` | `dialect()` lookup, `SYNTAX_LABELS`, re-exports |
| `lib/math/answer-latex.ts` | `answerToLatex()` (renamed from `mobius.ts`) |
| `components/math/AnswerLatex.tsx` | Renamed from `MobiusAnswer.tsx` |
| `supabase/migrations/20260916000000_lab_test_answer_syntax.sql` | The `answer_syntax` domain + column |
| `components/ui/SyntaxBadge.tsx` | The student-facing badge |

**Modified:** `lib/grading/types.ts`, `lib/grading/expression.ts`, `lib/grading/set.ts`, `lib/grading/index.ts`, `lib/math/index.ts`, `lib/data/types.ts`, `lib/data/fixtures.ts`, `lib/data/answer-display.ts`, `lib/supabase/mappers.ts`, `lib/supabase/admin-mutations.ts`, `lib/supabase/database.types.ts`, `lib/admin/content-store.ts`, `components/admin/AdminStoreProvider.tsx`, `components/admin/TestForm.tsx`, `components/admin/QuestionsEditor.tsx`, `components/admin/QuestionEditor.tsx`, `components/admin/QuestionPreview.tsx`, `components/player/{PracticeRunner,QuestionPlayer,PartPlayer,StepCard,FinalAnswer}.tsx`, `app/tests/[testId]/page.tsx`, `app/tests/[testId]/practice/page.tsx`, `app/tests/[testId]/q/[questionId]/page.tsx`, `app/admin/tests/new/page.tsx`, `app/admin/tests/[id]/page.tsx`, `supabase/seed.sql`.

**Deleted:** `lib/math/mobius.ts`, `lib/math/__tests__/mobius.test.ts`, `components/math/MobiusAnswer.tsx` (all replaced by renames).

**Order rationale:** Tasks 1–4 build the pure dialect layer with no dependencies. Tasks 5–8 wire it into grading and rendering, still pure. Task 9 adds the database column and data types. Tasks 10–12 do the admin UI, Tasks 13–15 the student UI. Every task ends green and committable.

---

## Task 1: Dialect types and the Numbas module

The Numbas module encodes today's behaviour, so its tests are the regression net for every later task.

**Files:**
- Create: `lib/math/syntax/types.ts`
- Create: `lib/math/syntax/numbas.ts`
- Test: `lib/math/syntax/__tests__/numbas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/syntax/__tests__/numbas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  normalize,
  parseSet,
  formatSet,
  setToLatex,
  expressionToLatex,
} from "../numbas";

describe("numbas normalize", () => {
  it("strips all whitespace", () => {
    expect(normalize(" 2 ^ 100 ").value).toBe("2^100");
  });

  it("lowercases, because JME is case-insensitive by default", () => {
    expect(normalize("Pi").value).toBe("pi");
  });

  it("never reports a syntax error", () => {
    expect(normalize("2x").error).toBeUndefined();
  });
});

describe("numbas parseSet", () => {
  it("parses a populated set", () => {
    expect(parseSet("set(14,15,16,17,18)")).toEqual([14, 15, 16, 17, 18]);
  });

  it("parses the empty set", () => {
    expect(parseSet("set()")).toEqual([]);
  });

  it("tolerates whitespace and is case-insensitive on the keyword", () => {
    expect(parseSet(" SET( 6 , 7 ) ")).toEqual([6, 7]);
  });

  it("parses negative members", () => {
    expect(parseSet("set(-3,4)")).toEqual([-3, 4]);
  });

  it("returns null for brace notation, which belongs to Maple", () => {
    expect(parseSet("{1,2,3}")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseSet("set(1,x)")).toBeNull();
  });
});

describe("numbas formatSet", () => {
  it("renders the canonical set form", () => {
    expect(formatSet([1, 2, 3])).toBe("set(1,2,3)");
  });

  it("renders the empty set", () => {
    expect(formatSet([])).toBe("set()");
  });
});

describe("numbas setToLatex", () => {
  it("renders a populated set", () => {
    expect(setToLatex("set(14,15,16)")).toBe("\\{14,\\ 15,\\ 16\\}");
  });

  it("renders the empty set as \\emptyset", () => {
    expect(setToLatex("set()")).toBe("\\emptyset");
  });

  it("passes unparseable input through untouched", () => {
    expect(setToLatex("14,15")).toBe("14,15");
  });
});

describe("numbas expressionToLatex", () => {
  it("braces an exponent", () => {
    expect(expressionToLatex("2^100")).toBe("2^{100}");
  });

  it("renders * as \\times", () => {
    expect(expressionToLatex("2^4*3")).toBe("2^{4}\\times 3");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/math/syntax/__tests__/numbas.test.ts`
Expected: FAIL — `Failed to resolve import "../numbas"`.

- [ ] **Step 3: Write the types**

Create `lib/math/syntax/types.ts`:

```ts
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
```

- [ ] **Step 4: Write the Numbas module**

Create `lib/math/syntax/numbas.ts`:

```ts
import type { NormalizeResult } from "./types";

/** JME is case-insensitive by default, so `Pi` and `pi` are the same name. */
export function normalize(input: string): NormalizeResult {
  return { value: input.replace(/\s+/g, "").toLowerCase() };
}

export function parseSet(input: string): number[] | null {
  const match = /^set\(\s*(.*?)\s*\)$/i.exec(input.trim());
  if (!match) return null;
  const inner = match[1].trim();
  if (inner === "") return [];
  const members: number[] = [];
  for (const part of inner.split(",")) {
    const token = part.trim();
    if (!/^-?\d+$/.test(token)) return null;
    members.push(Number(token));
  }
  return members;
}

export function formatSet(members: number[]): string {
  return `set(${members.join(",")})`;
}

export function setToLatex(input: string): string {
  const members = parseSet(input);
  if (members === null) return input;
  if (members.length === 0) return "\\emptyset";
  return `\\{${members.join(",\\ ")}\\}`;
}

export function expressionToLatex(input: string): string {
  return input.replace(/\^(-?\d+)/g, "^{$1}").replace(/\*/g, "\\times ");
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/math/syntax/__tests__/numbas.test.ts`
Expected: PASS — 16 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/math/syntax/types.ts lib/math/syntax/numbas.ts lib/math/syntax/__tests__/numbas.test.ts
git commit -m "feat: add Numbas dialect module for answer syntax"
```

---

## Task 2: The Maple dialect module

**Files:**
- Create: `lib/math/syntax/maple.ts`
- Test: `lib/math/syntax/__tests__/maple.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/syntax/__tests__/maple.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  normalize,
  parseSet,
  formatSet,
  setToLatex,
  expressionToLatex,
} from "../maple";

describe("maple normalize", () => {
  it("strips all whitespace", () => {
    expect(normalize(" 2 * x ").value).toBe("2*x");
  });

  it("is case-sensitive, because Pi and pi differ in Maple", () => {
    expect(normalize("Pi").value).toBe("Pi");
  });

  it("accepts explicit multiplication without an error", () => {
    expect(normalize("2*x^2").error).toBeUndefined();
  });

  it("rejects a digit followed by a letter", () => {
    const result = normalize("2x");
    expect(result.error).toContain("*");
    expect(result.value).toBe("2x");
  });

  it("rejects a digit followed by an open bracket", () => {
    expect(normalize("2(x+1)").error).toBeDefined();
  });

  it("rejects a close bracket followed by an open bracket", () => {
    expect(normalize("(x+1)(x+2)").error).toBeDefined();
  });

  it("rejects a close bracket followed by a letter or digit", () => {
    expect(normalize("(x+1)2").error).toBeDefined();
    expect(normalize("(x+1)y").error).toBeDefined();
  });

  it("accepts a function call, which Maple reads as application not multiplication", () => {
    expect(normalize("sqrt(2)").error).toBeUndefined();
    expect(normalize("exp(1)").error).toBeUndefined();
    expect(normalize("sinh(x)").error).toBeUndefined();
  });

  it("accepts a user-defined function name", () => {
    expect(normalize("f(x)").error).toBeUndefined();
  });
});

describe("maple parseSet", () => {
  it("parses brace notation", () => {
    expect(parseSet("{1,2,3}")).toEqual([1, 2, 3]);
  });

  it("parses the empty set", () => {
    expect(parseSet("{}")).toEqual([]);
  });

  it("tolerates whitespace", () => {
    expect(parseSet(" { 6 , 7 } ")).toEqual([6, 7]);
  });

  it("parses negative members", () => {
    expect(parseSet("{-3,4}")).toEqual([-3, 4]);
  });

  it("returns null for set() notation, which belongs to Numbas", () => {
    expect(parseSet("set(1,2,3)")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseSet("{1,x}")).toBeNull();
  });
});

describe("maple formatSet", () => {
  it("renders brace notation", () => {
    expect(formatSet([1, 2, 3])).toBe("{1,2,3}");
  });

  it("renders the empty set", () => {
    expect(formatSet([])).toBe("{}");
  });
});

describe("maple setToLatex", () => {
  it("renders a populated set", () => {
    expect(setToLatex("{14,15,16}")).toBe("\\{14,\\ 15,\\ 16\\}");
  });

  it("renders the empty set as \\emptyset", () => {
    expect(setToLatex("{}")).toBe("\\emptyset");
  });

  it("passes unparseable input through untouched", () => {
    expect(setToLatex("14,15")).toBe("14,15");
  });
});

describe("maple expressionToLatex", () => {
  it("braces an exponent", () => {
    expect(expressionToLatex("2^100")).toBe("2^{100}");
  });

  it("renders * as \\times", () => {
    expect(expressionToLatex("2*x^2")).toBe("2\\times x^{2}");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/math/syntax/__tests__/maple.test.ts`
Expected: FAIL — `Failed to resolve import "../maple"`.

- [ ] **Step 3: Write the Maple module**

Create `lib/math/syntax/maple.ts`:

```ts
import type { NormalizeResult } from "./types";

/**
 * The four unambiguous implicit-multiplication patterns Maple rejects. A name
 * followed by "(" is deliberately absent: Maple reads `f(x)` and `sqrt(2)` as
 * function application, so flagging it would reject valid input.
 */
const IMPLICIT_MULTIPLICATION: { pattern: RegExp; example: string }[] = [
  { pattern: /\d[A-Za-z]/, example: "2*x, not 2x" },
  { pattern: /\d\(/, example: "2*(x+1), not 2(x+1)" },
  { pattern: /\)\(/, example: "(x+1)*(x+2), not (x+1)(x+2)" },
  { pattern: /\)[A-Za-z0-9]/, example: "(x+1)*2, not (x+1)2" },
];

/** Maple is case-sensitive, so this deliberately does not lowercase. */
export function normalize(input: string): NormalizeResult {
  const value = input.replace(/\s+/g, "");
  for (const { pattern, example } of IMPLICIT_MULTIPLICATION) {
    if (pattern.test(value)) {
      return {
        value,
        error: `Maple needs an explicit * for multiplication — write ${example}.`,
      };
    }
  }
  return { value };
}

export function parseSet(input: string): number[] | null {
  const match = /^\{\s*(.*?)\s*\}$/.exec(input.trim());
  if (!match) return null;
  const inner = match[1].trim();
  if (inner === "") return [];
  const members: number[] = [];
  for (const part of inner.split(",")) {
    const token = part.trim();
    if (!/^-?\d+$/.test(token)) return null;
    members.push(Number(token));
  }
  return members;
}

export function formatSet(members: number[]): string {
  return `{${members.join(",")}}`;
}

export function setToLatex(input: string): string {
  const members = parseSet(input);
  if (members === null) return input;
  if (members.length === 0) return "\\emptyset";
  return `\\{${members.join(",\\ ")}\\}`;
}

export function expressionToLatex(input: string): string {
  return input.replace(/\^(-?\d+)/g, "^{$1}").replace(/\*/g, "\\times ");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/math/syntax/__tests__/maple.test.ts`
Expected: PASS — 21 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/math/syntax/maple.ts lib/math/syntax/__tests__/maple.test.ts
git commit -m "feat: add Maple dialect module with implicit-multiplication detection"
```

---

## Task 3: The LaTeX dialect module

The subtlety here is whitespace: `\sin x` must not collapse to `\sinx`, but `2 + 3` must collapse to `2+3`.

**Files:**
- Create: `lib/math/syntax/latex.ts`
- Test: `lib/math/syntax/__tests__/latex.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/syntax/__tests__/latex.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  normalize,
  parseSet,
  formatSet,
  setToLatex,
  expressionToLatex,
} from "../latex";

describe("latex normalize", () => {
  it("strips insignificant whitespace", () => {
    expect(normalize(" 2 + 3 ").value).toBe("2+3");
  });

  it("keeps the space that terminates a control sequence", () => {
    expect(normalize("\\sin x").value).toBe("\\sin x");
  });

  it("collapses repeated whitespace after a control sequence to one space", () => {
    expect(normalize("\\sin   x").value).toBe("\\sin x");
  });

  it("drops a control-sequence space when a non-letter follows", () => {
    expect(normalize("\\pi + 1").value).toBe("\\pi+1");
  });

  it("drops \\left and \\right", () => {
    expect(normalize("\\left(x+1\\right)").value).toBe("(x+1)");
  });

  it("braces a single-character exponent so x^2 equals x^{2}", () => {
    expect(normalize("x^2").value).toBe(normalize("x^{2}").value);
  });

  it("braces a single-character subscript", () => {
    expect(normalize("S_1").value).toBe("S_{1}");
  });

  it("is case-sensitive", () => {
    expect(normalize("\\Pi").value).toBe("\\Pi");
  });

  it("never reports a syntax error", () => {
    expect(normalize("x^2").error).toBeUndefined();
  });
});

describe("latex parseSet", () => {
  it("parses escaped brace notation", () => {
    expect(parseSet("\\{1,2,3\\}")).toEqual([1, 2, 3]);
  });

  it("parses the empty escaped braces", () => {
    expect(parseSet("\\{\\}")).toEqual([]);
  });

  it("parses \\emptyset as the empty set", () => {
    expect(parseSet("\\emptyset")).toEqual([]);
  });

  it("tolerates whitespace", () => {
    expect(parseSet(" \\{ 6 , 7 \\} ")).toEqual([6, 7]);
  });

  it("parses negative members", () => {
    expect(parseSet("\\{-3,4\\}")).toEqual([-3, 4]);
  });

  it("returns null for bare braces, which belong to Maple", () => {
    expect(parseSet("{1,2,3}")).toBeNull();
  });

  it("returns null for non-integer members", () => {
    expect(parseSet("\\{1,x\\}")).toBeNull();
  });
});

describe("latex formatSet", () => {
  it("renders escaped brace notation", () => {
    expect(formatSet([1, 2, 3])).toBe("\\{1,2,3\\}");
  });

  it("renders the empty set as \\emptyset", () => {
    expect(formatSet([])).toBe("\\emptyset");
  });
});

describe("latex setToLatex", () => {
  it("passes input through, because it is already LaTeX", () => {
    expect(setToLatex("\\{1,2,3\\}")).toBe("\\{1,2,3\\}");
  });
});

describe("latex expressionToLatex", () => {
  it("passes input through, because it is already LaTeX", () => {
    expect(expressionToLatex("\\frac{1}{2}")).toBe("\\frac{1}{2}");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/math/syntax/__tests__/latex.test.ts`
Expected: FAIL — `Failed to resolve import "../latex"`.

- [ ] **Step 3: Write the LaTeX module**

Create `lib/math/syntax/latex.ts`:

```ts
import type { NormalizeResult } from "./types";

export function normalize(input: string): NormalizeResult {
  let value = input.replace(/\\left|\\right/g, "");
  // Collapse whitespace, keeping exactly one space where it is the thing that
  // ends a control sequence before a letter (`\sin x`), dropping it elsewhere.
  value = value.replace(/\s+/g, (match, offset: number, whole: string) => {
    const before = whole.slice(0, offset);
    const after = whole.slice(offset + match.length);
    return /\\[A-Za-z]+$/.test(before) && /^[A-Za-z]/.test(after) ? " " : "";
  });
  // Brace bare single-character scripts so x^2 and x^{2} compare equal.
  value = value.replace(/([_^])([A-Za-z0-9])/g, "$1{$2}");
  return { value };
}

export function parseSet(input: string): number[] | null {
  const trimmed = input.trim();
  if (trimmed === "\\emptyset") return [];
  const match = /^\\\{\s*(.*?)\s*\\\}$/.exec(trimmed);
  if (!match) return null;
  const inner = match[1].trim();
  if (inner === "") return [];
  const members: number[] = [];
  for (const part of inner.split(",")) {
    const token = part.trim();
    if (!/^-?\d+$/.test(token)) return null;
    members.push(Number(token));
  }
  return members;
}

export function formatSet(members: number[]): string {
  if (members.length === 0) return "\\emptyset";
  return `\\{${members.join(",")}\\}`;
}

/** Input is already LaTeX, so rendering is the identity. */
export function setToLatex(input: string): string {
  return input;
}

export function expressionToLatex(input: string): string {
  return input;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/math/syntax/__tests__/latex.test.ts`
Expected: PASS — 20 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/math/syntax/latex.ts lib/math/syntax/__tests__/latex.test.ts
git commit -m "feat: add LaTeX dialect module for answer syntax"
```

---

## Task 4: The dialect dispatcher

**Files:**
- Create: `lib/math/syntax/index.ts`
- Test: `lib/math/syntax/__tests__/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/math/syntax/__tests__/index.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { dialect, SYNTAX_LABELS, ANSWER_SYNTAXES } from "../index";
import type { AnswerSyntax } from "../types";

describe("dialect", () => {
  it("returns the Numbas module for numbas", () => {
    expect(dialect("numbas").formatSet([1, 2])).toBe("set(1,2)");
  });

  it("returns the Maple module for maple", () => {
    expect(dialect("maple").formatSet([1, 2])).toBe("{1,2}");
  });

  it("returns the LaTeX module for latex", () => {
    expect(dialect("latex").formatSet([1, 2])).toBe("\\{1,2\\}");
  });

  it("falls back to numbas for an unknown syntax", () => {
    expect(dialect("nonsense" as AnswerSyntax).formatSet([1, 2])).toBe("set(1,2)");
  });
});

describe("SYNTAX_LABELS", () => {
  it("has a human label for every syntax", () => {
    expect(SYNTAX_LABELS).toEqual({
      numbas: "Numbas",
      maple: "Maple",
      latex: "LaTeX",
    });
  });
});

describe("ANSWER_SYNTAXES", () => {
  it("lists every syntax, for building dropdowns", () => {
    expect(ANSWER_SYNTAXES).toEqual(["numbas", "maple", "latex"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/math/syntax/__tests__/index.test.ts`
Expected: FAIL — `Failed to resolve import "../index"`.

- [ ] **Step 3: Write the dispatcher**

Create `lib/math/syntax/index.ts`:

```ts
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
 * Falls back to numbas rather than throwing: a row written by an older client,
 * or a hand-edited config, should still grade rather than crash the page.
 */
export function dialect(syntax: AnswerSyntax): Dialect {
  return DIALECTS[syntax] ?? DIALECTS.numbas;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/math/syntax/__tests__/index.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/math/syntax/index.ts lib/math/syntax/__tests__/index.test.ts
git commit -m "feat: add answer syntax dialect dispatcher"
```

---

## Task 5: Add `reason` to `GradeResult`

A standalone type change, so the two grader tasks that follow stay focused.

**Files:**
- Modify: `lib/grading/types.ts`

- [ ] **Step 1: Add the field**

In `lib/grading/types.ts`, replace the `GradeResult` interface with:

```ts
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
```

- [ ] **Step 2: Verify the project still typechecks**

Run: `npm run tsc`
Expected: PASS, no output. The field is optional, so no existing code breaks.

- [ ] **Step 3: Commit**

```bash
git add lib/grading/types.ts
git commit -m "feat: add optional reason to GradeResult for syntax errors"
```

---

## Task 6: Make expression grading syntax-aware

**Files:**
- Modify: `lib/grading/expression.ts`
- Test: `lib/grading/__tests__/expression.test.ts`

- [ ] **Step 1: Write the failing test**

Replace the whole of `lib/grading/__tests__/expression.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { gradeExpression } from "../expression";

describe("gradeExpression with the default numbas syntax", () => {
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

  it("ignores case, because JME is case-insensitive", () => {
    expect(gradeExpression("PI", { mobius: "pi" }).correct).toBe(true);
  });
});

describe("gradeExpression with maple syntax", () => {
  it("accepts explicit multiplication", () => {
    expect(gradeExpression("2*x", { mobius: "2*x" }, "maple").correct).toBe(true);
  });

  it("is case-sensitive, so Pi does not match pi", () => {
    expect(gradeExpression("pi", { mobius: "Pi" }, "maple").correct).toBe(false);
  });

  it("rejects implicit multiplication with a reason", () => {
    const result = gradeExpression("2x", { mobius: "2*x" }, "maple");
    expect(result.correct).toBe(false);
    expect(result.reason).toContain("*");
  });

  it("sets no reason for an answer that is merely wrong", () => {
    expect(gradeExpression("3*x", { mobius: "2*x" }, "maple").reason).toBeUndefined();
  });
});

describe("gradeExpression with latex syntax", () => {
  it("treats x^2 and x^{2} as the same answer", () => {
    expect(gradeExpression("x^2", { mobius: "x^{2}" }, "latex").correct).toBe(true);
  });

  it("does not collapse the space after a control sequence", () => {
    expect(gradeExpression("\\sin x", { mobius: "\\sin x" }, "latex").correct).toBe(true);
  });

  it("rejects a different expression", () => {
    expect(gradeExpression("x^3", { mobius: "x^{2}" }, "latex").correct).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/grading/__tests__/expression.test.ts`
Expected: FAIL — `gradeExpression` takes two arguments, so the maple and latex cases fail (and the removed `normalizeExpression` import is gone).

- [ ] **Step 3: Rewrite the grader**

Replace the whole of `lib/grading/expression.ts` with:

```ts
import type { GradeResult } from "./types";
import { dialect } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

export function gradeExpression(
  input: string,
  answer: { mobius: string },
  syntax: AnswerSyntax = "numbas"
): GradeResult {
  const d = dialect(syntax);
  const student = d.normalize(input);
  const expected = d.normalize(answer.mobius);
  const correct = student.value !== "" && student.value === expected.value;
  return {
    correct,
    normalized: input.trim(),
    // Only surface a syntax complaint when the answer is also wrong; a student
    // who somehow typed the right answer should not be told off for it.
    ...(!correct && student.error ? { reason: student.error } : {}),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/grading/__tests__/expression.test.ts`
Expected: PASS — 13 tests.

- [ ] **Step 5: Check nothing else imported the removed helper**

Run: `grep -rn "normalizeExpression" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: no output. If there is any, update those call sites to use `dialect(syntax).normalize`.

- [ ] **Step 6: Commit**

```bash
git add lib/grading/expression.ts lib/grading/__tests__/expression.test.ts
git commit -m "feat: grade expressions against the lab test's answer syntax"
```

---

## Task 7: Make set grading syntax-aware

**Files:**
- Modify: `lib/grading/set.ts`
- Test: `lib/grading/__tests__/set.test.ts`

- [ ] **Step 1: Write the failing test**

Replace the whole of `lib/grading/__tests__/set.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { gradeSetOfIntegers } from "../set";

describe("gradeSetOfIntegers with the default numbas syntax", () => {
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

  it("returns a canonical sorted normalized form", () => {
    expect(gradeSetOfIntegers("set(3,1,2)", [1, 2, 3]).normalized).toBe("set(1,2,3)");
  });

  it("explains the expected set notation when input does not parse", () => {
    const r = gradeSetOfIntegers("14,15", [14, 15]);
    expect(r.correct).toBe(false);
    expect(r.reason).toContain("set(1,2,3)");
  });
});

describe("gradeSetOfIntegers with maple syntax", () => {
  it("accepts brace notation", () => {
    expect(gradeSetOfIntegers("{14,15,16}", [14, 15, 16], "maple").correct).toBe(true);
  });

  it("matches the empty set", () => {
    expect(gradeSetOfIntegers("{}", [], "maple").correct).toBe(true);
  });

  it("normalizes to brace notation", () => {
    expect(gradeSetOfIntegers("{3,1,2}", [1, 2, 3], "maple").normalized).toBe("{1,2,3}");
  });

  it("rejects Numbas set() notation with a reason naming brace notation", () => {
    const r = gradeSetOfIntegers("set(1,2,3)", [1, 2, 3], "maple");
    expect(r.correct).toBe(false);
    expect(r.reason).toContain("{1,2,3}");
  });
});

describe("gradeSetOfIntegers with latex syntax", () => {
  it("accepts escaped brace notation", () => {
    expect(gradeSetOfIntegers("\\{14,15\\}", [14, 15], "latex").correct).toBe(true);
  });

  it("accepts \\emptyset for the empty set", () => {
    expect(gradeSetOfIntegers("\\emptyset", [], "latex").correct).toBe(true);
  });

  it("normalizes to escaped brace notation", () => {
    expect(gradeSetOfIntegers("\\{3,1,2\\}", [1, 2, 3], "latex").normalized).toBe("\\{1,2,3\\}");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/grading/__tests__/set.test.ts`
Expected: FAIL — `gradeSetOfIntegers` takes two arguments, and there is no `reason`.

- [ ] **Step 3: Rewrite the grader**

Replace the whole of `lib/grading/set.ts` with:

```ts
import type { GradeResult } from "./types";
import { dialect } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

function canonical(members: number[]): number[] {
  return Array.from(new Set(members)).sort((a, b) => a - b);
}

export function gradeSetOfIntegers(
  input: string,
  answer: number[],
  syntax: AnswerSyntax = "numbas"
): GradeResult {
  const d = dialect(syntax);
  const parsed = d.parseSet(input);
  if (parsed === null) {
    return {
      correct: false,
      normalized: input.trim(),
      reason: `Sets look like ${d.formatSet([1, 2, 3])} in this test.`,
    };
  }
  const student = canonical(parsed);
  const expected = canonical(answer);
  const correct =
    student.length === expected.length && student.every((v, i) => v === expected[i]);
  return { correct, normalized: d.formatSet(student) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/grading/__tests__/set.test.ts`
Expected: PASS — 14 tests.

- [ ] **Step 5: Repoint the one remaining `parseIntegerSet` caller**

`parseIntegerSet` was exported from `lib/grading/set.ts` and is imported by
`components/admin/AnswerValueEditor.tsx`. Confirm the call site:

Run: `grep -rn "parseIntegerSet" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: one hit in `components/admin/AnswerValueEditor.tsx`.

In `components/admin/AnswerValueEditor.tsx`, replace the import:

```ts
import { parseIntegerSet } from "@/lib/grading/set";
```

with:

```ts
import { dialect } from "@/lib/math/syntax";
```

and replace each `parseIntegerSet(` call with `dialect("numbas").parseSet(`.
Task 11 replaces that hardcoded `"numbas"` with the lab test's syntax; until then
it preserves today's exact behaviour.

- [ ] **Step 6: Verify the project typechecks and the suite is green**

Run: `npm run tsc && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/grading/set.ts lib/grading/__tests__/set.test.ts components/admin/AnswerValueEditor.tsx
git commit -m "feat: grade integer sets against the lab test's answer syntax"
```

---

## Task 8: Thread syntax through `grade()`

**Files:**
- Modify: `lib/grading/index.ts`
- Test: `lib/grading/__tests__/index.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/grading/__tests__/index.test.ts`:

```ts
describe("grade with an answer syntax", () => {
  it("defaults to numbas when no syntax is given", () => {
    expect(grade("set_of_integers", "set(1,2)", [1, 2]).correct).toBe(true);
  });

  it("passes the syntax to the set grader", () => {
    expect(grade("set_of_integers", "{1,2}", [1, 2], {}, "maple").correct).toBe(true);
  });

  it("passes the syntax to the expression grader", () => {
    expect(
      grade("expression", "2*x", { mobius: "2*x" }, {}, "maple").correct
    ).toBe(true);
  });

  it("ignores the syntax for answer types that do not use it", () => {
    expect(grade("integer", "19", 19, {}, "maple").correct).toBe(true);
  });
});
```

Make sure the file's existing import line includes `describe`, `it` and `expect`
from `vitest` and `grade` from `../index` — it already does.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/grading/__tests__/index.test.ts`
Expected: FAIL — `grade` takes four arguments, so the maple cases grade as numbas and return `correct: false`.

- [ ] **Step 3: Update the dispatcher**

In `lib/grading/index.ts`, add the import and extend the signature:

```ts
import type { AnswerType, AnswerValue, AnswerConfig, GradeResult } from "./types";
import type { AnswerSyntax } from "@/lib/math/syntax";
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
  config: AnswerConfig = {},
  syntax: AnswerSyntax = "numbas"
): GradeResult {
  switch (type) {
    case "integer":
      return gradeInteger(input as string, answer as number, config);
    case "set_of_integers":
      return gradeSetOfIntegers(input as string, answer as number[], syntax);
    case "expression":
      return gradeExpression(input as string, answer as { mobius: string }, syntax);
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

Run: `npx vitest run lib/grading/__tests__/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/grading/index.ts lib/grading/__tests__/index.test.ts
git commit -m "feat: accept an answer syntax in the grade() dispatcher"
```

---

## Task 9: Rename the `mobius` symbols and make rendering syntax-aware

**Files:**
- Create: `lib/math/answer-latex.ts` (replaces `lib/math/mobius.ts`)
- Create: `components/math/AnswerLatex.tsx` (replaces `components/math/MobiusAnswer.tsx`)
- Create: `lib/math/__tests__/answer-latex.test.ts` (replaces `lib/math/__tests__/mobius.test.ts`)
- Modify: `lib/math/index.ts`, `lib/data/answer-display.ts`, `lib/data/__tests__/answer-display.test.ts`
- Delete: `lib/math/mobius.ts`, `lib/math/__tests__/mobius.test.ts`, `components/math/MobiusAnswer.tsx`

- [ ] **Step 1: Move the files with git so history is preserved**

```bash
git mv lib/math/mobius.ts lib/math/answer-latex.ts
git mv lib/math/__tests__/mobius.test.ts lib/math/__tests__/answer-latex.test.ts
git mv components/math/MobiusAnswer.tsx components/math/AnswerLatex.tsx
```

- [ ] **Step 2: Write the failing test**

Replace the whole of `lib/math/__tests__/answer-latex.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { answerToLatex } from "../answer-latex";

describe("answerToLatex with the default numbas syntax", () => {
  it("renders a set", () => {
    expect(answerToLatex("set(14,15,16,17,18)", "set_of_integers")).toBe(
      "\\{14,\\ 15,\\ 16,\\ 17,\\ 18\\}"
    );
  });

  it("renders the empty set", () => {
    expect(answerToLatex("set()", "set_of_integers")).toBe("\\emptyset");
  });

  it("braces an exponent", () => {
    expect(answerToLatex("2^100", "expression")).toBe("2^{100}");
  });

  it("renders multiplication", () => {
    expect(answerToLatex("2^4*3", "expression")).toBe("2^{4}\\times 3");
  });

  it("passes an integer through", () => {
    expect(answerToLatex("19", "integer")).toBe("19");
  });

  it("renders a single choice label as text", () => {
    expect(
      answerToLatex("not_surjective", "single_choice", "numbas", {
        options: [{ value: "not_surjective", label: "Not surjective" }],
      })
    ).toBe("\\text{Not surjective}");
  });

  it("renders multi-select labels as text", () => {
    expect(
      answerToLatex("reflexive,symmetric", "multi_select", "numbas", {
        options: [
          { value: "reflexive", label: "Reflexive" },
          { value: "symmetric", label: "Symmetric" },
        ],
      })
    ).toBe("\\text{Reflexive, Symmetric}");
  });

  it("wraps text", () => {
    expect(answerToLatex("Bijective", "text")).toBe("\\text{Bijective}");
  });
});

describe("answerToLatex with maple syntax", () => {
  it("renders a brace set", () => {
    expect(answerToLatex("{14,15}", "set_of_integers", "maple")).toBe(
      "\\{14,\\ 15\\}"
    );
  });

  it("renders multiplication", () => {
    expect(answerToLatex("2*x^2", "expression", "maple")).toBe("2\\times x^{2}");
  });
});

describe("answerToLatex with latex syntax", () => {
  it("passes a set through untouched", () => {
    expect(answerToLatex("\\{1,2,3\\}", "set_of_integers", "latex")).toBe(
      "\\{1,2,3\\}"
    );
  });

  it("passes an expression through untouched", () => {
    expect(answerToLatex("\\frac{1}{2}", "expression", "latex")).toBe("\\frac{1}{2}");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/math/__tests__/answer-latex.test.ts`
Expected: FAIL — `answerToLatex` is not exported.

- [ ] **Step 4: Rewrite the renderer**

Replace the whole of `lib/math/answer-latex.ts` with:

```ts
import type { AnswerType, AnswerConfig } from "../grading/types";
import { dialect } from "./syntax";
import type { AnswerSyntax } from "./syntax";

export function answerToLatex(
  value: string,
  type: AnswerType,
  syntax: AnswerSyntax = "numbas",
  config: AnswerConfig = {}
): string {
  const trimmed = value.trim();
  switch (type) {
    case "set_of_integers":
      return dialect(syntax).setToLatex(trimmed);
    case "expression":
      return dialect(syntax).expressionToLatex(trimmed);
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

// Assumes `value` is admin-authored plain prose with no LaTeX-special characters
// ({, }, \, $, %, &, ^, ~). If a label ever needs those, escape before wrapping.
function textLatex(value: string): string {
  return `\\text{${value}}`;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/math/__tests__/answer-latex.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 6: Update the barrel and the display helper**

Replace the whole of `lib/math/index.ts` with:

```ts
export { answerToLatex } from "./answer-latex";
export { renderLatex, type RenderResult } from "./render";
export { parseRichText, type RichSegment } from "./richtext";
export { dialect, SYNTAX_LABELS, ANSWER_SYNTAXES, type AnswerSyntax } from "./syntax";
```

In `lib/data/answer-display.ts`, rename the function and make its set output
dialect-aware. Replace the whole file with:

```ts
import type { AnswerType, AnswerValue } from "@/lib/grading";
import { dialect } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

/** Convert a stored structured answer value into its display string for a dialect. */
export function answerValueToString(
  value: AnswerValue,
  type: AnswerType,
  syntax: AnswerSyntax = "numbas"
): string {
  switch (type) {
    case "integer":
      return String(value as number);
    case "expression":
      return (value as { mobius: string }).mobius;
    case "set_of_integers":
      return dialect(syntax).formatSet(value as number[]);
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

- [ ] **Step 7: Update the answer-display test**

In `lib/data/__tests__/answer-display.test.ts`, change the import and every call
from `answerValueToMobius` to `answerValueToString`, then append:

```ts
describe("answerValueToString with a dialect", () => {
  it("renders a set in maple brace notation", () => {
    expect(answerValueToString([1, 2, 3], "set_of_integers", "maple")).toBe("{1,2,3}");
  });

  it("renders a set in latex notation", () => {
    expect(answerValueToString([1, 2, 3], "set_of_integers", "latex")).toBe(
      "\\{1,2,3\\}"
    );
  });
});
```

- [ ] **Step 8: Rewrite the component**

Replace the whole of `components/math/AnswerLatex.tsx` with:

```tsx
import { answerToLatex } from "@/lib/math";
import { answerValueToString } from "@/lib/data/answer-display";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import type { AnswerSyntax } from "@/lib/math/syntax";
import { Latex } from "./Latex";

export function AnswerLatex({
  value,
  type,
  syntax = "numbas",
  config,
}: {
  value: AnswerValue;
  type: AnswerType;
  syntax?: AnswerSyntax;
  config?: AnswerConfig;
}) {
  const display = answerValueToString(value, type, syntax);
  return <Latex>{answerToLatex(display, type, syntax, config)}</Latex>;
}
```

- [ ] **Step 9: Update the three call sites**

In `components/player/StepCard.tsx`, `components/player/FinalAnswer.tsx` and
`components/admin/QuestionPreview.tsx`, change the import from:

```tsx
import { MobiusAnswer } from "@/components/math/MobiusAnswer";
```

to:

```tsx
import { AnswerLatex } from "@/components/math/AnswerLatex";
```

and rename every `<MobiusAnswer` JSX tag to `<AnswerLatex`. Leave the props as
they are; later tasks add `syntax`.

- [ ] **Step 10: Verify no `mobius` identifier survives outside the wire format**

Run: `grep -rn "mobiusToLatex\|answerValueToMobius\|MobiusAnswer" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: no output.

Run: `grep -rn "mobius" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: only `{ mobius: string }` type positions and `.mobius` property reads —
the wire format, which the spec deliberately keeps.

- [ ] **Step 11: Document why the wire key keeps its name**

In `lib/grading/types.ts`, replace the `AnswerValue` expression line:

```ts
  | { mobius: string } // expression
```

with:

```ts
  // The key is "mobius" for historical reasons only — it holds an answer in
  // whatever syntax the lab test declares, not Mobius syntax specifically.
  // Renaming it would be a data migration of every stored answer_value, for no
  // behavioural gain. See docs/superpowers/specs/2026-09-16-answer-syntax-dialects-design.md.
  | { mobius: string } // expression
```

- [ ] **Step 12: Run the full suite**

Run: `npm run tsc && npx vitest run`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add -A lib/math lib/data components/math components/player components/admin lib/grading/types.ts
git commit -m "refactor: rename mobius symbols and make LaTeX rendering syntax-aware"
```

---

## Task 10: Add the `answer_syntax` column and data types

**Files:**
- Create: `supabase/migrations/20260916000000_lab_test_answer_syntax.sql`
- Modify: `lib/data/types.ts`, `lib/supabase/mappers.ts`, `lib/supabase/database.types.ts`, `lib/data/fixtures.ts`, `supabase/seed.sql`
- Test: `lib/supabase/__tests__/mappers.test.ts`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260916000000_lab_test_answer_syntax.sql`:

```sql
-- The answer syntax a lab test expects students to type in.
-- Mirrors lib/math/syntax/types.ts:
--   numbas -> set(1,2,3), case-insensitive, implicit multiplication allowed
--   maple  -> {1,2,3},    case-sensitive,   explicit * required
--   latex  -> \{1,2,3\},  case-sensitive
create domain public.answer_syntax as text
  check (value in ('numbas', 'maple', 'latex'));

-- Defaulted, so existing rows keep grading exactly as they did before.
alter table public.lab_tests
  add column answer_syntax public.answer_syntax not null default 'numbas';
```

- [ ] **Step 2: Apply the migration and regenerate types**

```bash
npm run db:reset:local
npm run gen-types
```

Expected: `lib/supabase/database.types.ts` now has `answer_syntax: string` in the
`lab_tests` `Row` type, and `answer_syntax?: string` in `Insert` and `Update`.

If the local Supabase stack is not running, hand-edit
`lib/supabase/database.types.ts` instead: add `answer_syntax: string` to the
`lab_tests` `Row`, and `answer_syntax?: string` to its `Insert` and `Update`.

- [ ] **Step 3: Write the failing mapper test**

Append to `lib/supabase/__tests__/mappers.test.ts`:

```ts
describe("toLabTest answer syntax", () => {
  const row = {
    id: "t1",
    course_id: "c1",
    name: "Lab Test 1",
    term: null,
    description: null,
    is_published: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("maps the stored syntax", () => {
    expect(toLabTest({ ...row, answer_syntax: "maple" } as never).answerSyntax).toBe(
      "maple"
    );
  });

  it("falls back to numbas for a row without one", () => {
    expect(toLabTest(row as never).answerSyntax).toBe("numbas");
  });

  it("falls back to numbas for an unrecognised value", () => {
    expect(toLabTest({ ...row, answer_syntax: "wat" } as never).answerSyntax).toBe(
      "numbas"
    );
  });
});
```

Make sure `toLabTest` is in the file's import from `../mappers`.

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run lib/supabase/__tests__/mappers.test.ts`
Expected: FAIL — `answerSyntax` is undefined.

- [ ] **Step 5: Add the field to the domain type**

In `lib/data/types.ts`, add the import at the top:

```ts
import type { AnswerSyntax } from "@/lib/math/syntax";
```

and add the field to `LabTest`:

```ts
export interface LabTest {
  id: string;
  courseId: string;
  name: string; // "Lab Test 1"
  term?: string; // "2026 T1"
  description?: string;
  isPublished: boolean;
  sortOrder: number;
  /** The syntax students must answer in. Defaults to numbas for older rows. */
  answerSyntax: AnswerSyntax;
}
```

- [ ] **Step 6: Map the column**

In `lib/supabase/mappers.ts`, add the imports:

```ts
import { ANSWER_SYNTAXES } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";
```

add this helper next to `sorted()`:

```ts
/** A row predating the column, or hand-edited, must still render rather than crash. */
function toAnswerSyntax(value: string | null | undefined): AnswerSyntax {
  return ANSWER_SYNTAXES.includes(value as AnswerSyntax)
    ? (value as AnswerSyntax)
    : "numbas";
}
```

and replace `toLabTest` with:

```ts
export function toLabTest(row: Row<"lab_tests">): LabTest {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    term: row.term ?? undefined,
    description: row.description ?? undefined,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    answerSyntax: toAnswerSyntax(row.answer_syntax),
  };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run lib/supabase/__tests__/mappers.test.ts`
Expected: PASS.

- [ ] **Step 8: Update the fixtures**

In `lib/data/fixtures.ts`, add `answerSyntax: "numbas",` to both entries in the
`labTests` array — after `sortOrder` in each.

- [ ] **Step 9: Update the seed**

In `supabase/seed.sql`, change the lab test insert to name the new column:

```sql
insert into public.lab_tests (id, course_id, name, term, description, is_published, sort_order, answer_syntax) values
  ('7e570000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000001081',
   'Lab Test 1', '2026 T1',
   'Practice questions covering sets, functions and number theory, with guided worked steps.',
   true, 1, 'numbas'),
  ('7e570000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000001081',
   'Lab Test 2', '2026 T1', 'Draft — not yet released to students.', false, 2, 'numbas');
```

- [ ] **Step 10: Fix the `LabTest` literals the new required field breaks**

`answerSyntax` is required on `LabTest`, so every object literal of that type
must gain it. Add `answerSyntax: "numbas",` to the lab test literal(s) in each of:

- `components/player/__tests__/PracticeRunner.test.tsx` (the literal around line 12)
- `components/admin/__tests__/AdminStoreProvider.test.tsx`
- `lib/admin/__tests__/content-store.tests.test.ts`
- `lib/admin/__tests__/content-store.questions.test.ts`
- `lib/admin/__tests__/content-store.parts.test.ts`
- `lib/admin/__tests__/content-store.steps.test.ts`
- `lib/admin/__tests__/content-store.hints.test.ts`

Some of those files build lab tests through a helper rather than inline; add the
field wherever the `LabTest` object is actually constructed.

- [ ] **Step 11: Verify the whole suite**

Run: `npm run tsc && npx vitest run`
Expected: PASS. If `tsc` still reports a missing `answerSyntax`, add
`answerSyntax: "numbas"` to the literal it names.

- [ ] **Step 12: Commit**

```bash
git add -A supabase lib components
git commit -m "feat: add answer_syntax column to lab_tests"
```

---

## Task 11: Let admins pick the syntax in the lab test form

**Files:**
- Modify: `lib/admin/content-store.ts`, `components/admin/AdminStoreProvider.tsx`, `lib/supabase/admin-mutations.ts`, `components/admin/TestForm.tsx`, `app/admin/tests/new/page.tsx`, `app/admin/tests/[id]/page.tsx`
- Test: `lib/admin/__tests__/content-store.tests.test.ts`

- [ ] **Step 1: Write the failing store test**

Append to `lib/admin/__tests__/content-store.tests.test.ts`:

```ts
describe("createTest answer syntax", () => {
  it("stores the chosen syntax", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 3",
      isPublished: false,
      answerSyntax: "maple",
    });
    expect(content.labTests.find((t) => t.id === id)?.answerSyntax).toBe("maple");
  });

  it("defaults to numbas when none is given", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 4",
      isPublished: false,
    });
    expect(content.labTests.find((t) => t.id === id)?.answerSyntax).toBe("numbas");
  });
});
```

`baseContent()` and the course id `c1` are the helpers this file already defines
at its top — reuse them rather than adding new ones.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/admin/__tests__/content-store.tests.test.ts`
Expected: FAIL — `answerSyntax` is not accepted by `createTest`, and the created test has no such field.

- [ ] **Step 3: Update the reducer**

In `lib/admin/content-store.ts`, add the import:

```ts
import type { AnswerSyntax } from "@/lib/math/syntax";
```

and change `createTest`'s input type and body:

```ts
export function createTest(
  content: Content,
  input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
    answerSyntax?: AnswerSyntax;
  }
): { content: Content; id: string } {
  const id = newId();
  const siblings = content.labTests.filter((t) => t.courseId === input.courseId);
  const sortOrder = siblings.length
    ? Math.max(...siblings.map((t) => t.sortOrder)) + 1
    : 1;
  const test: LabTest = { id, sortOrder, answerSyntax: "numbas", ...input };
  return { content: { ...content, labTests: [...content.labTests, test] }, id };
}
```

Note the spread order: `...input` comes last, so an explicit `answerSyntax`
overrides the default, and an `undefined` one does not reach the object because
the caller omits the key entirely.

If a caller might pass `answerSyntax: undefined` explicitly, the spread would
overwrite the default with `undefined`. Guard against that by using:

```ts
  const test: LabTest = {
    id,
    sortOrder,
    ...input,
    answerSyntax: input.answerSyntax ?? "numbas",
  };
```

Use this second form — it is correct under both call styles.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/admin/__tests__/content-store.tests.test.ts`
Expected: PASS.

- [ ] **Step 5: Widen the store interface**

In `components/admin/AdminStoreProvider.tsx`, add the import:

```ts
import type { AnswerSyntax } from "@/lib/math/syntax";
```

and add `answerSyntax?: AnswerSyntax;` to the `addTest` input type in the
`AdminStore` interface:

```ts
  addTest: (input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
    answerSyntax?: AnswerSyntax;
  }) => string;
```

`editTest` already takes `Partial<Omit<LabTest, "id">>`, so it accepts the new
field with no change.

- [ ] **Step 6: Persist the column**

In `lib/supabase/admin-mutations.ts`, add `answer_syntax` to `insertLabTest`:

```ts
export const insertLabTest = (test: LabTest) =>
  exec(
    supabase()
      .from("lab_tests")
      .insert({
        id: test.id,
        course_id: test.courseId,
        name: test.name,
        term: test.term ?? null,
        description: test.description ?? null,
        is_published: test.isPublished,
        sort_order: test.sortOrder,
        answer_syntax: test.answerSyntax,
      })
  );
```

and to `updateLabTest`, inside the update object after the `sort_order` line:

```ts
        ...(patch.answerSyntax !== undefined && { answer_syntax: patch.answerSyntax }),
```

- [ ] **Step 7: Add the select to the form**

In `components/admin/TestForm.tsx`, add the imports:

```ts
import { ANSWER_SYNTAXES, SYNTAX_LABELS } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";
```

add the field to `TestFormValues`:

```ts
export interface TestFormValues {
  courseId: string;
  name: string;
  term: string;
  description: string;
  isPublished: boolean;
  answerSyntax: AnswerSyntax;
}
```

add it to the initial state, after `isPublished`:

```ts
    answerSyntax: initial?.answerSyntax ?? "numbas",
```

and insert this block between the Description `LatexField` and the Published
checkbox:

```tsx
      <label className="block text-sm font-medium text-gray-700">
        Answer syntax
        <select
          className={inputClass}
          value={values.answerSyntax}
          onChange={(e) => set("answerSyntax", e.target.value as AnswerSyntax)}
        >
          {ANSWER_SYNTAXES.map((s) => (
            <option key={s} value={s}>
              {SYNTAX_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs font-normal text-gray-500">
          The syntax students must use for expression and set answers in this
          test. Changing it does not rewrite answers you have already entered.
        </span>
      </label>
```

- [ ] **Step 8: Pass it through the two admin pages**

In `app/admin/tests/new/page.tsx`, add to the `addTest` call, after `isPublished`:

```ts
            answerSyntax: values.answerSyntax,
```

In `app/admin/tests/[id]/page.tsx`, add to the `initial` prop, after `isPublished`:

```ts
          answerSyntax: test.answerSyntax,
```

and to the `editTest` call, after `isPublished`:

```ts
            answerSyntax: values.answerSyntax,
```

- [ ] **Step 9: Verify**

Run: `npm run tsc && npx vitest run`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/admin/content-store.ts lib/admin/__tests__/content-store.tests.test.ts components/admin/AdminStoreProvider.tsx lib/supabase/admin-mutations.ts components/admin/TestForm.tsx "app/admin/tests/new/page.tsx" "app/admin/tests/[id]/page.tsx"
git commit -m "feat: let admins choose a lab test's answer syntax"
```

---

## Task 12: Use the chosen syntax in the admin preview and answer editor

**Files:**
- Modify: `components/admin/QuestionsEditor.tsx`, `components/admin/QuestionEditor.tsx`, `components/admin/QuestionPreview.tsx`, `components/admin/AnswerValueEditor.tsx`

- [ ] **Step 1: Look up the syntax where the test id is known**

In `components/admin/QuestionsEditor.tsx`, after the `questions` declaration, add:

```ts
  const answerSyntax =
    content.labTests.find((t) => t.id === testId)?.answerSyntax ?? "numbas";
```

and pass it to the editor in `renderItem`:

```tsx
            return question ? (
              <QuestionEditor question={question} answerSyntax={answerSyntax} />
            ) : null;
```

- [ ] **Step 2: Thread it through the question editor**

In `components/admin/QuestionEditor.tsx`, add the import:

```ts
import type { AnswerSyntax } from "@/lib/math/syntax";
```

change the component signature to accept the new prop:

```tsx
export function QuestionEditor({
  question,
  answerSyntax,
}: {
  question: Question;
  answerSyntax: AnswerSyntax;
}) {
```

If the existing signature destructures more props, keep them and add
`answerSyntax` alongside. Then pass it to the preview:

```tsx
                <QuestionPreview question={question} answerSyntax={answerSyntax} />
```

- [ ] **Step 3: Render the preview in the chosen dialect**

In `components/admin/QuestionPreview.tsx`, add the import:

```ts
import type { AnswerSyntax } from "@/lib/math/syntax";
```

change the signature:

```tsx
export function QuestionPreview({
  question,
  answerSyntax,
}: {
  question: Question;
  answerSyntax: AnswerSyntax;
}) {
```

and add `syntax={answerSyntax}` to both `<AnswerLatex` tags in the file.

- [ ] **Step 4: Make the answer editor's set hints dialect-aware**

In `components/admin/AnswerValueEditor.tsx`, add the imports:

```ts
import { dialect, SYNTAX_LABELS } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";
```

add `answerSyntax` to the component's props, defaulting so existing tests keep
passing:

```tsx
export function AnswerValueEditor({
  answerType,
  answerValue,
  answerConfig,
  answerSyntax = "numbas",
  onChange,
}: {
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  answerSyntax?: AnswerSyntax;
  onChange: (state: AnswerState) => void;
}) {
```

Replace the `dialect("numbas").parseSet(` calls introduced in Task 7 Step 5 with
`dialect(answerSyntax).parseSet(`.

Change the expression field's label from:

```tsx
            Correct answer (Numbas syntax, e.g. 2^100)
```

to:

```tsx
            Correct answer ({SYNTAX_LABELS[answerSyntax]} syntax)
```

and the set field's label from:

```tsx
            Correct answer (set syntax, e.g. set(1,2,3))
```

to:

```tsx
            Correct answer (e.g. {dialect(answerSyntax).formatSet([1, 2, 3])})
```

- [ ] **Step 5: Pass the syntax into every AnswerValueEditor**

Run: `grep -rn "AnswerValueEditor" --include="*.tsx" components app`
For each rendering site (expected: `components/admin/PartEditor.tsx` and
`components/admin/StepsEditor.tsx`), thread `answerSyntax` down from
`QuestionEditor` the same way as Step 2 — add an `answerSyntax: AnswerSyntax`
prop to the component and pass `answerSyntax={answerSyntax}` to the editor.

- [ ] **Step 6: Verify**

Run: `npm run tsc && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/admin
git commit -m "feat: render admin answer editors and preview in the test's syntax"
```

---

## Task 13: Thread the syntax through the player tree

**Files:**
- Modify: `components/player/{PracticeRunner,QuestionPlayer,PartPlayer,StepCard,FinalAnswer}.tsx`, `app/tests/[testId]/practice/page.tsx`, `app/tests/[testId]/q/[questionId]/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/player/__tests__/step-card-syntax.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepCard } from "../StepCard";
import type { Step } from "@/lib/data/types";

const step: Step = {
  id: "s1",
  partId: "p1",
  number: 1,
  promptLatex: "Give the set.",
  answerType: "set_of_integers",
  answerValue: [1, 2, 3],
  explanationLatex: "Because.",
  sortOrder: 1,
  hints: [],
};

describe("StepCard answer syntax", () => {
  it("accepts maple brace notation when the test is maple", async () => {
    render(
      <StepCard step={step} solved={false} onSolved={() => {}} answerSyntax="maple" />
    );
    await userEvent.type(screen.getByRole("textbox"), "{{1,2,3}");
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("shows the syntax reason when notation is wrong for the dialect", async () => {
    render(
      <StepCard step={step} solved={false} onSolved={() => {}} answerSyntax="maple" />
    );
    await userEvent.type(screen.getByRole("textbox"), "set(1,2,3)");
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText(/Sets look like/)).toBeInTheDocument();
  });
});
```

Note: `userEvent.type` treats `{` as a special sequence, so a literal `{` is
typed as `{{`. That is why the first test types `{{1,2,3}`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/player/__tests__/step-card-syntax.test.tsx`
Expected: FAIL — `StepCard` has no `answerSyntax` prop, so the input grades as numbas and `{1,2,3}` is wrong.

- [ ] **Step 3: Update `StepCard`**

In `components/player/StepCard.tsx`, add the import:

```ts
import type { AnswerSyntax } from "@/lib/math/syntax";
```

extend the props:

```tsx
export function StepCard({
  step,
  solved,
  onSolved,
  answerSyntax = "numbas",
}: {
  step: Step;
  solved: boolean;
  onSolved: () => void;
  answerSyntax?: AnswerSyntax;
}) {
```

replace the `status` state with one that carries the reason:

```tsx
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState("");
```

update `check`:

```tsx
  const check = () => {
    if (correct) return;
    const result = grade(
      step.answerType,
      value,
      step.answerValue,
      step.answerConfig ?? {},
      answerSyntax
    );
    if (result.correct) {
      setStatus("correct");
      setReason("");
      onSolved();
    } else {
      setStatus("incorrect");
      setReason(result.reason ?? "");
    }
  };
```

replace the incorrect-status line:

```tsx
        {status === "incorrect" ? (
          <span className="text-sm text-amber-600">Not quite — try again.</span>
        ) : null}
```

with:

```tsx
        {status === "incorrect" ? (
          <span className="text-sm text-amber-600">
            {reason || "Not quite — try again."}
          </span>
        ) : null}
```

and add `syntax={answerSyntax}` to the `<AnswerLatex` tag in the reveal block.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/player/__tests__/step-card-syntax.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Apply the same change to `FinalAnswer`**

In `components/player/FinalAnswer.tsx`, add the same import, add
`answerSyntax = "numbas"` to the props with type `answerSyntax?: AnswerSyntax`,
add a `const [reason, setReason] = useState("")`, pass `answerSyntax` as the
fifth argument to `grade(...)`, set `setReason(result.reason ?? "")` on the
incorrect branch and `setReason("")` on the correct branch, replace the
"Not quite — try again." span with `{reason || "Not quite — try again."}`, and
add `syntax={answerSyntax}` to the `<AnswerLatex` tag.

- [ ] **Step 6: Thread through `PartPlayer`**

In `components/player/PartPlayer.tsx`, add the import, add
`answerSyntax: AnswerSyntax` to the props (required here — every caller has it),
and pass `answerSyntax={answerSyntax}` to both `<StepCard` and `<FinalAnswer`.

Because the prop is required, `components/player/__tests__/PartPlayer.test.tsx`
stops compiling. Add `answerSyntax="numbas"` to the `<PartPlayer` element in its
render helper (around line 23), which preserves that test's existing behaviour.

- [ ] **Step 7: Thread through `QuestionPlayer`**

In `components/player/QuestionPlayer.tsx`, add the import, change the signature to:

```tsx
export function QuestionPlayer({
  question,
  answerSyntax,
}: {
  question: Question;
  answerSyntax: AnswerSyntax;
}) {
```

and pass `answerSyntax={answerSyntax}` to `<PartPlayer`.

- [ ] **Step 8: Thread through `PracticeRunner`**

In `components/player/PracticeRunner.tsx`, pass the value it already has on
`test`:

```tsx
      <QuestionPlayer key={question.id} question={question} answerSyntax={test.answerSyntax} />
```

- [ ] **Step 9: Update the standalone question page**

In `app/tests/[testId]/q/[questionId]/page.tsx`, pass the test's syntax:

```tsx
      <QuestionPlayer question={question} answerSyntax={test.answerSyntax} />
```

`app/tests/[testId]/practice/page.tsx` needs no change — it already passes the
whole `test` to `PracticeRunner`.

- [ ] **Step 10: Verify**

Run: `npm run tsc && npx vitest run`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add components/player "app/tests/[testId]"
git commit -m "feat: grade student answers in the lab test's syntax"
```

---

## Task 14: Show the syntax badge on the lab test page

**Files:**
- Create: `components/ui/SyntaxBadge.tsx`
- Modify: `app/tests/[testId]/page.tsx`
- Test: `components/ui/__tests__/SyntaxBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/ui/__tests__/SyntaxBadge.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyntaxBadge } from "../SyntaxBadge";

describe("SyntaxBadge", () => {
  it("names the Numbas dialect", () => {
    render(<SyntaxBadge syntax="numbas" />);
    expect(screen.getByText("Numbas syntax")).toBeInTheDocument();
  });

  it("names the Maple dialect", () => {
    render(<SyntaxBadge syntax="maple" />);
    expect(screen.getByText("Maple syntax")).toBeInTheDocument();
  });

  it("names the LaTeX dialect", () => {
    render(<SyntaxBadge syntax="latex" />);
    expect(screen.getByText("LaTeX syntax")).toBeInTheDocument();
  });

  it("explains itself to assistive technology", () => {
    render(<SyntaxBadge syntax="maple" />);
    expect(screen.getByTitle(/Maple/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/__tests__/SyntaxBadge.test.tsx`
Expected: FAIL — `Failed to resolve import "../SyntaxBadge"`.

- [ ] **Step 3: Write the badge**

Create `components/ui/SyntaxBadge.tsx`:

```tsx
import { SYNTAX_LABELS } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

export function SyntaxBadge({ syntax }: { syntax: AnswerSyntax }) {
  const label = SYNTAX_LABELS[syntax];
  return (
    <span
      title={`Type your answers in ${label} syntax.`}
      className="shrink-0 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600"
    >
      {label} syntax
    </span>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/__tests__/SyntaxBadge.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Put the badge on the lab test page**

In `app/tests/[testId]/page.tsx`, add the import:

```ts
import { SyntaxBadge } from "@/components/ui/SyntaxBadge";
```

and change the `PageHeader` title so the badge sits beside it:

```tsx
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <RichText>{test.name}</RichText>
            <SyntaxBadge syntax={test.answerSyntax} />
          </span>
        }
```

Leave the `subtitle` prop exactly as it is.

- [ ] **Step 6: Verify**

Run: `npm run tsc && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/ui "app/tests/[testId]/page.tsx"
git commit -m "feat: show the expected answer syntax on the lab test page"
```

---

## Task 15: Full verification

**Files:** none modified unless a check fails.

- [ ] **Step 1: Typecheck**

Run: `npm run tsc`
Expected: PASS, no output.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS, no errors.

- [ ] **Step 3: Full test suite**

Run: `npx vitest run`
Expected: PASS, every file green. Record the final test count.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: PASS — the App Router pages compile.

- [ ] **Step 5: Confirm the regression guarantee holds**

Run: `npx vitest run lib/grading lib/math`
Expected: PASS. Every pre-existing MATH1081 answer case (`set(14,15,16,17,18)`,
`set()`, `2^100`, `2^20`) still grades correctly under the default numbas syntax.

- [ ] **Step 6: Confirm no stray `mobius` naming outside the wire format**

Run: `grep -rn "mobius" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: only `{ mobius: string }` type positions, `.mobius` property reads, and
the explanatory comment in `lib/grading/types.ts`.

- [ ] **Step 7: Manual smoke check**

```bash
npm run dev
```

Confirm, in the browser:
1. `/admin/tests/new` shows the Answer syntax select with Numbas, Maple, LaTeX.
2. Creating a Maple test, then opening `/tests/<id>`, shows a "Maple syntax" badge.
3. In that test, a `set_of_integers` answer accepts `{1,2,3}` and rejects
   `set(1,2,3)` with the "Sets look like {1,2,3} in this test." message.
4. An existing MATH1081 test still shows "Numbas syntax" and still accepts
   `set(14,15,16,17,18)`.

- [ ] **Step 8: Commit any fixes**

```bash
git add -A
git commit -m "fix: address verification findings for answer syntax dialects"
```

If nothing needed fixing, skip this step rather than making an empty commit.
