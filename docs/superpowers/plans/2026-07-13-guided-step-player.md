# Guided Step Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the read-only test-overview "Practice" affordance with the interactive **guided step player** — each question part is worked step-by-step, every step auto-graded via the Plan 1 `grade()` dispatcher, with optional hints, a reveal-answer hatch, and progress saved to `localStorage`.

**Architecture:** A new client-component tree under `components/player/`. The route `app/tests/[testId]/q/[questionId]/page.tsx` (server component) loads one `Question` via a new `getQuestion` query and hands it to `<QuestionPlayer>` (client). `QuestionPlayer` owns progress state (`useQuestionProgress`, localStorage-backed) and renders one `<PartPlayer>` per part; each part renders its `<StepCard>` list plus a `<FinalAnswer>`. `StepCard`/`FinalAnswer` grade input locally with `grade()`. No gating, unlimited attempts, free skip-ahead. The existing directive-less math components (`Latex`/`RichText`/`MobiusAnswer`) are reused inside these client components (they have no server-only code, so they run on the client too).

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind, Plan 1 `lib/grading` + Plan 2 `lib/data`/`components/math`. Tests: Vitest + React Testing Library + jsdom (new for this plan).

**Part of a series:** Plan 3 of 4. Plans 1 (libraries) and 2 (data layer + browse pages) are complete. Plan 4 = Admin Authoring.

**Reference spec:** `docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md` (Section 3 — The Guided Step Player).

---

## File Structure

Created/modified in this plan:

- `vitest.setup.ts` (create), `vitest.config.ts` (modify) — add jsdom + RTL for component tests.
- `lib/data/queries.ts` (modify) — add `getQuestion(questionId)`.
- `components/player/input-value.ts` — `InputValue` type + `emptyInput()`.
- `components/player/AnswerInput.tsx` — per-`answerType` input widget.
- `components/player/HintStack.tsx` — progressive hint reveal.
- `components/player/useQuestionProgress.ts` — localStorage-backed solved-state hook.
- `components/player/StepCard.tsx` — one auto-graded step (input + check + reveal + hints + explanation).
- `components/player/FinalAnswer.tsx` — the part's final auto-graded answer.
- `components/player/PartPlayer.tsx` — one question part (steps + final answer).
- `components/player/QuestionPlayer.tsx` — the whole question (stem + parts), owns progress.
- `app/tests/[testId]/q/[questionId]/page.tsx` — the player route.
- `app/tests/[testId]/page.tsx` (modify) — replace the disabled button with a real practice link.

Boundaries: grading logic stays in `lib/grading` (reused, not reimplemented); each player component has one responsibility; `AnswerInput` is the single place that maps an `answerType` to a widget.

---

## Task 1: Component test environment (RTL + jsdom)

**Files:**
- Create: `vitest.setup.ts`
- Modify: `vitest.config.ts`
- Modify: `package.json` (dev deps)

- [ ] **Step 1: Install testing libraries**

Run:
```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Create the Vitest setup file**

Create `vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Update the Vitest config**

Replace `vitest.config.ts` with:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["lib/**/*.test.ts", "components/**/*.test.{ts,tsx}"],
  },
});
```
Component tests opt into the DOM per-file with a `// @vitest-environment jsdom` docblock (see later tasks); library tests stay on the fast `node` environment. Note the `{ts,tsx}` glob — the `useQuestionProgress` hook test is a `.test.ts` (no JSX) and must be matched too.

- [ ] **Step 4: Verify existing suite still passes**

Run:
```bash
npm test
```
Expected: all existing tests (90) still pass under the new config.

- [ ] **Step 5: Commit**

```bash
git add vitest.setup.ts vitest.config.ts package.json package-lock.json
git commit -m "chore: add React Testing Library + jsdom for component tests"
```

---

## Task 2: getQuestion query

**Files:**
- Modify: `lib/data/queries.ts`
- Modify: `lib/data/__tests__/queries.test.ts`

- [ ] **Step 1: Add the failing test**

Add to `lib/data/__tests__/queries.test.ts` — first update the import line to include `getQuestion`:
```ts
import {
  getCourses,
  getCourseByCode,
  getLabTestsForCourse,
  getLabTest,
  getQuestionsForTest,
  getQuestion,
} from "../queries";
```
Then add these tests inside the `describe("data queries", ...)` block:
```ts
  it("returns a single question by id with sorted parts/steps/hints", async () => {
    const q = await getQuestion("q-1081-lt1-1");
    expect(q?.number).toBe(1);
    expect(q?.parts.map((p) => p.label)).toEqual(["a", "b"]);
    expect(q?.parts[0].steps.map((s) => s.number)).toEqual([1, 2]);
    expect(q?.parts[0].steps[0].hints).toHaveLength(1);
  });

  it("returns null for an unknown question id", async () => {
    expect(await getQuestion("q-nope")).toBeNull();
  });

  it("returns null for a question under an unpublished test", async () => {
    // (no such fixture question today, but the guard must hold if one is added)
    expect(await getQuestion("q-does-not-exist")).toBeNull();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/data/__tests__/queries.test.ts
```
Expected: FAIL — `getQuestion` is not exported.

- [ ] **Step 3: Implement getQuestion**

Add to `lib/data/queries.ts` (after `getQuestionsForTest`):
```ts
export async function getQuestion(questionId: string): Promise<Question | null> {
  const question = questions.find((q) => q.id === questionId);
  if (!question) return null;
  const test = await getLabTest(question.labTestId);
  if (!test) return null;
  return {
    ...question,
    parts: [...question.parts].sort(bySortOrder).map((p) => ({
      ...p,
      steps: [...p.steps].sort(bySortOrder).map((s) => ({
        ...s,
        hints: [...s.hints].sort(bySortOrder),
      })),
    })),
  };
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
git commit -m "feat: add getQuestion query (published-guarded, deep-copied)"
```

---

## Task 3: Input value helper + AnswerInput widget

**Files:**
- Create: `components/player/input-value.ts`
- Create: `components/player/AnswerInput.tsx`
- Test: `components/player/__tests__/AnswerInput.test.tsx`

- [ ] **Step 1: Create the input-value helper**

Create `components/player/input-value.ts`:
```ts
import type { AnswerType } from "@/lib/grading";

/** A student's in-progress input: an array for multi_select, a string otherwise. */
export type InputValue = string | string[];

export function emptyInput(type: AnswerType): InputValue {
  return type === "multi_select" ? [] : "";
}
```

- [ ] **Step 2: Write the failing test**

Create `components/player/__tests__/AnswerInput.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerInput } from "../AnswerInput";

describe("AnswerInput", () => {
  it("renders a text box for integer answers and reports typing", async () => {
    const onChange = vi.fn();
    render(
      <AnswerInput answerType="integer" name="s1" value="" onChange={onChange} />
    );
    await userEvent.type(screen.getByRole("textbox"), "19");
    expect(onChange).toHaveBeenLastCalledWith("19");
  });

  it("renders radios for single_choice and reports the chosen value", async () => {
    const onChange = vi.fn();
    render(
      <AnswerInput
        answerType="single_choice"
        name="s2"
        value=""
        onChange={onChange}
        config={{
          options: [
            { value: "injective", label: "injective" },
            { value: "not_surjective", label: "not surjective" },
          ],
        }}
      />
    );
    await userEvent.click(screen.getByLabelText("not surjective"));
    expect(onChange).toHaveBeenCalledWith("not_surjective");
  });

  it("renders checkboxes for multi_select and toggles values in an array", async () => {
    const onChange = vi.fn();
    render(
      <AnswerInput
        answerType="multi_select"
        name="s3"
        value={[]}
        onChange={onChange}
        config={{
          options: [
            { value: "reflexive", label: "Reflexive" },
            { value: "symmetric", label: "Symmetric" },
          ],
        }}
      />
    );
    await userEvent.click(screen.getByLabelText("Reflexive"));
    expect(onChange).toHaveBeenCalledWith(["reflexive"]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:
```bash
npx vitest run components/player/__tests__/AnswerInput.test.tsx
```
Expected: FAIL — cannot find module `../AnswerInput`.

- [ ] **Step 4: Implement AnswerInput**

Create `components/player/AnswerInput.tsx`:
```tsx
"use client";

import type { AnswerType, AnswerConfig } from "@/lib/grading";
import type { InputValue } from "./input-value";

export function AnswerInput({
  answerType,
  config,
  name,
  value,
  onChange,
  disabled,
}: {
  answerType: AnswerType;
  config?: AnswerConfig;
  name: string;
  value: InputValue;
  onChange: (value: InputValue) => void;
  disabled?: boolean;
}) {
  if (answerType === "single_choice") {
    const options = config?.options ?? [];
    return (
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              disabled={disabled}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (answerType === "multi_select") {
    const options = config?.options ?? [];
    const selected = Array.isArray(value) ? value : [];
    const toggle = (v: string) =>
      onChange(
        selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]
      );
    return (
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
              disabled={disabled}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  const placeholder =
    answerType === "set_of_integers"
      ? "e.g. set(1,2,3)"
      : answerType === "expression"
        ? "e.g. 2^100"
        : "";
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
    />
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
npx vitest run components/player/__tests__/AnswerInput.test.tsx
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/player/input-value.ts components/player/AnswerInput.tsx components/player/__tests__/AnswerInput.test.tsx
git commit -m "feat: add AnswerInput widget with per-type inputs"
```

---

## Task 4: HintStack

**Files:**
- Create: `components/player/HintStack.tsx`
- Test: `components/player/__tests__/HintStack.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/player/__tests__/HintStack.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HintStack } from "../HintStack";
import type { Hint } from "@/lib/data/types";

const hints: Hint[] = [
  { id: "h1", stepId: "s1", number: 1, bodyLatex: "First hint", sortOrder: 1 },
  { id: "h2", stepId: "s1", number: 2, bodyLatex: "Second hint", sortOrder: 2 },
];

describe("HintStack", () => {
  it("hides hints until requested, then reveals them one at a time", async () => {
    render(<HintStack hints={hints} />);
    expect(screen.queryByText(/First hint/)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show a hint/i }));
    expect(screen.getByText(/First hint/)).toBeInTheDocument();
    expect(screen.queryByText(/Second hint/)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show another hint/i }));
    expect(screen.getByText(/Second hint/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/player/__tests__/HintStack.test.tsx
```
Expected: FAIL — cannot find module `../HintStack`.

- [ ] **Step 3: Implement HintStack**

Create `components/player/HintStack.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Hint } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";

export function HintStack({ hints }: { hints: Hint[] }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="mt-2">
      {hints.slice(0, shown).map((h) => (
        <div
          key={h.id}
          className="mt-1 rounded-md bg-amber-50 p-2 text-sm text-amber-900"
        >
          <span className="font-medium">Hint {h.number}: </span>
          <RichText>{h.bodyLatex}</RichText>
        </div>
      ))}
      {shown < hints.length ? (
        <button
          type="button"
          onClick={() => setShown((n) => n + 1)}
          className="mt-1 text-sm text-amber-700 hover:underline"
        >
          {shown === 0 ? "Show a hint" : "Show another hint"}
        </button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/player/__tests__/HintStack.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/player/HintStack.tsx components/player/__tests__/HintStack.test.tsx
git commit -m "feat: add HintStack with progressive reveal"
```

---

## Task 5: useQuestionProgress hook

**Files:**
- Create: `components/player/useQuestionProgress.ts`
- Test: `components/player/__tests__/useQuestionProgress.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/player/__tests__/useQuestionProgress.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useQuestionProgress } from "../useQuestionProgress";

describe("useQuestionProgress", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts empty and records solved steps and parts", () => {
    const { result } = renderHook(() => useQuestionProgress("q1"));
    expect(result.current.progress).toEqual({ steps: [], parts: [] });

    act(() => result.current.markStep("s1"));
    act(() => result.current.markPart("p1"));

    expect(result.current.progress.steps).toContain("s1");
    expect(result.current.progress.parts).toContain("p1");
  });

  it("persists to localStorage under a per-question key", () => {
    const { result } = renderHook(() => useQuestionProgress("q1"));
    act(() => result.current.markStep("s1"));
    expect(window.localStorage.getItem("labtest:progress:q1")).toContain("s1");
  });

  it("rehydrates existing progress on mount", () => {
    window.localStorage.setItem(
      "labtest:progress:q2",
      JSON.stringify({ steps: ["sX"], parts: [] })
    );
    const { result } = renderHook(() => useQuestionProgress("q2"));
    expect(result.current.progress.steps).toContain("sX");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/player/__tests__/useQuestionProgress.test.ts
```
Expected: FAIL — cannot find module `../useQuestionProgress`.

- [ ] **Step 3: Implement the hook**

Create `components/player/useQuestionProgress.ts`:
```ts
"use client";

import { useCallback, useEffect, useState } from "react";

interface Progress {
  steps: string[];
  parts: string[];
}

const emptyProgress: Progress = { steps: [], parts: [] };
const keyFor = (questionId: string) => `labtest:progress:${questionId}`;

export function useQuestionProgress(questionId: string) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(keyFor(questionId));
      setProgress(raw ? (JSON.parse(raw) as Progress) : emptyProgress);
    } catch {
      setProgress(emptyProgress);
    }
  }, [questionId]);

  const add = useCallback(
    (field: keyof Progress, id: string) => {
      setProgress((prev) => {
        if (prev[field].includes(id)) return prev;
        const next = { ...prev, [field]: [...prev[field], id] };
        try {
          window.localStorage.setItem(keyFor(questionId), JSON.stringify(next));
        } catch {
          // ignore storage errors (private mode, quota)
        }
        return next;
      });
    },
    [questionId]
  );

  const markStep = useCallback((stepId: string) => add("steps", stepId), [add]);
  const markPart = useCallback((partId: string) => add("parts", partId), [add]);

  return { progress, markStep, markPart };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/player/__tests__/useQuestionProgress.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/player/useQuestionProgress.ts components/player/__tests__/useQuestionProgress.test.ts
git commit -m "feat: add localStorage-backed useQuestionProgress hook"
```

---

## Task 6: StepCard (the core interaction)

**Files:**
- Create: `components/player/StepCard.tsx`
- Test: `components/player/__tests__/StepCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/player/__tests__/StepCard.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepCard } from "../StepCard";
import type { Step } from "@/lib/data/types";

const step: Step = {
  id: "s1",
  partId: "p1",
  number: 1,
  promptLatex: "Find the union size.",
  answerType: "integer",
  answerValue: 32,
  explanationLatex: "It equals 32.",
  sortOrder: 1,
  hints: [
    { id: "h1", stepId: "s1", number: 1, bodyLatex: "Subtract the none-count.", sortOrder: 1 },
  ],
};

describe("StepCard", () => {
  it("marks correct, reveals the explanation, and calls onSolved", async () => {
    const onSolved = vi.fn();
    render(<StepCard step={step} solved={false} onSolved={onSolved} />);

    expect(screen.queryByText(/It equals 32/)).toBeNull();
    await userEvent.type(screen.getByRole("textbox"), "32");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));

    expect(screen.getByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText(/It equals 32/)).toBeInTheDocument();
    expect(onSolved).toHaveBeenCalledOnce();
  });

  it("shows a try-again message on a wrong answer without solving", async () => {
    const onSolved = vi.fn();
    render(<StepCard step={step} solved={false} onSolved={onSolved} />);

    await userEvent.type(screen.getByRole("textbox"), "10");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));

    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("reveals the answer via the reveal hatch", async () => {
    render(<StepCard step={step} solved={false} onSolved={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText(/It equals 32/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/player/__tests__/StepCard.test.tsx
```
Expected: FAIL — cannot find module `../StepCard`.

- [ ] **Step 3: Implement StepCard**

Create `components/player/StepCard.tsx`:
```tsx
"use client";

import { useState } from "react";
import { grade } from "@/lib/grading";
import type { Step } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { MobiusAnswer } from "@/components/math/MobiusAnswer";
import { AnswerInput } from "./AnswerInput";
import { HintStack } from "./HintStack";
import { emptyInput, type InputValue } from "./input-value";

type Status = "idle" | "correct" | "incorrect";

export function StepCard({
  step,
  solved,
  onSolved,
}: {
  step: Step;
  solved: boolean;
  onSolved: () => void;
}) {
  const [value, setValue] = useState<InputValue>(emptyInput(step.answerType));
  const [status, setStatus] = useState<Status>(solved ? "correct" : "idle");
  const [revealed, setRevealed] = useState(false);

  const check = () => {
    const result = grade(
      step.answerType,
      value,
      step.answerValue,
      step.answerConfig ?? {}
    );
    if (result.correct) {
      setStatus("correct");
      onSolved();
    } else {
      setStatus("incorrect");
    }
  };

  const showExplanation = status === "correct" || revealed;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Step {step.number}</span>
        {status === "correct" ? <span className="text-green-600">✓</span> : null}
      </div>
      <div className="mb-3 text-gray-800">
        <RichText>{step.promptLatex}</RichText>
      </div>
      <AnswerInput
        answerType={step.answerType}
        config={step.answerConfig}
        name={`step-${step.id}`}
        value={value}
        onChange={setValue}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Check
        </button>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-sm text-gray-500 hover:underline"
        >
          Reveal answer
        </button>
        {status === "correct" ? (
          <span className="text-sm text-green-600">Correct!</span>
        ) : null}
        {status === "incorrect" ? (
          <span className="text-sm text-amber-600">Not quite — try again.</span>
        ) : null}
      </div>
      {step.hints.length > 0 ? <HintStack hints={step.hints} /> : null}
      {revealed ? (
        <div className="mt-2 text-sm text-gray-600">
          Answer:{" "}
          <MobiusAnswer
            value={step.answerValue}
            type={step.answerType}
            config={step.answerConfig}
          />
        </div>
      ) : null}
      {showExplanation ? (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <RichText>{step.explanationLatex}</RichText>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/player/__tests__/StepCard.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/player/StepCard.tsx components/player/__tests__/StepCard.test.tsx
git commit -m "feat: add StepCard auto-graded step with reveal and hints"
```

---

## Task 7: FinalAnswer

**Files:**
- Create: `components/player/FinalAnswer.tsx`
- Test: `components/player/__tests__/FinalAnswer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/player/__tests__/FinalAnswer.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinalAnswer } from "../FinalAnswer";
import type { QuestionPart } from "@/lib/data/types";

const part: QuestionPart = {
  id: "p1",
  questionId: "q1",
  label: "a",
  promptLatex: "How many study Maths?",
  answerType: "integer",
  answerValue: 19,
  sortOrder: 1,
  steps: [],
};

describe("FinalAnswer", () => {
  it("solves on the correct final answer and calls onSolved", async () => {
    const onSolved = vi.fn();
    render(<FinalAnswer part={part} solved={false} onSolved={onSolved} />);
    await userEvent.type(screen.getByRole("textbox"), "19");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText(/solved/i)).toBeInTheDocument();
    expect(onSolved).toHaveBeenCalledOnce();
  });

  it("rejects a wrong final answer", async () => {
    render(<FinalAnswer part={part} solved={false} onSolved={vi.fn()} />);
    await userEvent.type(screen.getByRole("textbox"), "20");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/player/__tests__/FinalAnswer.test.tsx
```
Expected: FAIL — cannot find module `../FinalAnswer`.

- [ ] **Step 3: Implement FinalAnswer**

Create `components/player/FinalAnswer.tsx`:
```tsx
"use client";

import { useState } from "react";
import { grade } from "@/lib/grading";
import type { QuestionPart } from "@/lib/data/types";
import { MobiusAnswer } from "@/components/math/MobiusAnswer";
import { AnswerInput } from "./AnswerInput";
import { emptyInput, type InputValue } from "./input-value";

type Status = "idle" | "correct" | "incorrect";

export function FinalAnswer({
  part,
  solved,
  onSolved,
}: {
  part: QuestionPart;
  solved: boolean;
  onSolved: () => void;
}) {
  const [value, setValue] = useState<InputValue>(emptyInput(part.answerType));
  const [status, setStatus] = useState<Status>(solved ? "correct" : "idle");
  const [revealed, setRevealed] = useState(false);

  const check = () => {
    const result = grade(
      part.answerType,
      value,
      part.answerValue,
      part.answerConfig ?? {}
    );
    if (result.correct) {
      setStatus("correct");
      onSolved();
    } else {
      setStatus("incorrect");
    }
  };

  return (
    <div className="mt-4 rounded-lg bg-gray-50 p-4">
      <div className="mb-2 text-sm font-medium text-gray-700">Final answer</div>
      <AnswerInput
        answerType={part.answerType}
        config={part.answerConfig}
        name={`final-${part.id}`}
        value={value}
        onChange={setValue}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Check
        </button>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-sm text-gray-500 hover:underline"
        >
          Reveal answer
        </button>
        {status === "correct" ? (
          <span className="text-sm text-green-600">Solved! 🎉</span>
        ) : null}
        {status === "incorrect" ? (
          <span className="text-sm text-amber-600">Not quite — try again.</span>
        ) : null}
      </div>
      {revealed ? (
        <div className="mt-2 text-sm text-gray-600">
          Answer:{" "}
          <MobiusAnswer
            value={part.answerValue}
            type={part.answerType}
            config={part.answerConfig}
          />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/player/__tests__/FinalAnswer.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/player/FinalAnswer.tsx components/player/__tests__/FinalAnswer.test.tsx
git commit -m "feat: add FinalAnswer auto-graded part answer"
```

---

## Task 8: PartPlayer

**Files:**
- Create: `components/player/PartPlayer.tsx`

- [ ] **Step 1: Create PartPlayer**

Create `components/player/PartPlayer.tsx`:
```tsx
"use client";

import type { QuestionPart } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { StepCard } from "./StepCard";
import { FinalAnswer } from "./FinalAnswer";

export function PartPlayer({
  part,
  solvedSteps,
  solvedPart,
  onStepSolved,
  onPartSolved,
}: {
  part: QuestionPart;
  solvedSteps: string[];
  solvedPart: boolean;
  onStepSolved: (stepId: string) => void;
  onPartSolved: () => void;
}) {
  return (
    <section className="mt-6 border-l-2 border-gray-100 pl-4">
      <div className="mb-3 text-gray-800">
        <span className="font-medium">{part.label}) </span>
        <RichText>{part.promptLatex}</RichText>
      </div>
      {part.steps.length > 0 ? (
        <div className="space-y-3">
          {part.steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              solved={solvedSteps.includes(step.id)}
              onSolved={() => onStepSolved(step.id)}
            />
          ))}
        </div>
      ) : null}
      <FinalAnswer part={part} solved={solvedPart} onSolved={onPartSolved} />
    </section>
  );
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
git add components/player/PartPlayer.tsx
git commit -m "feat: add PartPlayer composing steps and final answer"
```

---

## Task 9: QuestionPlayer

**Files:**
- Create: `components/player/QuestionPlayer.tsx`

- [ ] **Step 1: Create QuestionPlayer**

Create `components/player/QuestionPlayer.tsx`:
```tsx
"use client";

import type { Question } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { PartPlayer } from "./PartPlayer";
import { useQuestionProgress } from "./useQuestionProgress";

export function QuestionPlayer({ question }: { question: Question }) {
  const { progress, markStep, markPart } = useQuestionProgress(question.id);

  return (
    <div>
      <div className="mb-2 text-gray-800">
        <RichText>{question.promptLatex}</RichText>
      </div>
      {question.noteLatex ? (
        <div className="mb-4 text-sm italic text-gray-500">
          <RichText>{question.noteLatex}</RichText>
        </div>
      ) : null}
      {question.parts.map((part) => (
        <PartPlayer
          key={part.id}
          part={part}
          solvedSteps={progress.steps}
          solvedPart={progress.parts.includes(part.id)}
          onStepSolved={markStep}
          onPartSolved={() => markPart(part.id)}
        />
      ))}
    </div>
  );
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
git add components/player/QuestionPlayer.tsx
git commit -m "feat: add QuestionPlayer owning progress state"
```

---

## Task 10: Player route + wire the practice link

**Files:**
- Create: `app/tests/[testId]/q/[questionId]/page.tsx`
- Modify: `app/tests/[testId]/page.tsx`

- [ ] **Step 1: Create the player route**

Create `app/tests/[testId]/q/[questionId]/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabTest, getQuestion } from "@/lib/data/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuestionPlayer } from "@/components/player/QuestionPlayer";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ testId: string; questionId: string }>;
}) {
  const { testId, questionId } = await params;
  const test = await getLabTest(testId);
  if (!test) notFound();

  const question = await getQuestion(questionId);
  if (!question || question.labTestId !== testId) notFound();

  return (
    <div>
      <PageHeader title={`${test.name} — Question ${question.number}`} />
      <QuestionPlayer question={question} />
      <div className="mt-8">
        <Link
          href={`/tests/${testId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to {test.name}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the disabled button with a practice link**

In `app/tests/[testId]/page.tsx`:

First add the import at the top (with the other imports):
```tsx
import Link from "next/link";
```

Then replace the disabled `<button>…</button>` block:
```tsx
              <button
                type="button"
                disabled
                className="mt-4 cursor-not-allowed rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-400"
              >
                Practice (coming in the next release)
              </button>
```
with:
```tsx
              <Link
                href={`/tests/${testId}/q/${q.id}`}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Practise this question →
              </Link>
```

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds; a new `/tests/[testId]/q/[questionId]` route appears.

- [ ] **Step 4: Manually verify the player**

Run `npm run dev`, then:
- Go to http://localhost:3000/tests/test-1081-lt1 and click **"Practise this question →"** on Question 1.
- Confirm the page shows the stem, part a) with **Step 1** and **Step 2** inputs, and a **Final answer** box.
- In Step 1 type `32` → **Check** → shows "Correct!", a ✓, and the explanation. Type `10` first to confirm "Not quite — try again."
- Click **Show a hint** on Step 1 → the hint appears.
- Click **Reveal answer** on Step 2 → the answer renders.
- In part a)'s Final answer type `19` → **Check** → "Solved! 🎉".
- Try Question 8 (multi_select): tick Reflexive + Symmetric + Transitive → Check → solved. Try Question 3 (single_choice radios) and Question 2 (`set(14,15,16,17,18)` and `2^100`).
- Reload the page → previously-solved steps/parts still show ✓ (localStorage).
Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/tests/[testId]/q app/tests/[testId]/page.tsx
git commit -m "feat: add guided step player route and link it from the overview"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full suite**

Run:
```bash
npm test
```
Expected: all green (library + data + all new player component tests).

- [ ] **Step 2: Lint, types, build**

Run:
```bash
npm run lint && npx tsc --noEmit && npm run build
```
Expected: lint clean; no type errors; build succeeds.

- [ ] **Step 3: End-to-end manual pass**

`npm run dev`, walk one full question end-to-end (steps → hints → reveal → final answer → reload persistence) across at least an `integer`, a `set_of_integers`, an `expression`, a `single_choice`, and a `multi_select` question. Stop the dev server.

- [ ] **Step 4: Commit any final fixes (only if needed)**

```bash
git add -A
git commit -m "fix: address final verification issues"
```

---

## Definition of Done (Plan 3)

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass.
- [ ] From a lab test, "Practise this question" opens the guided player for that question.
- [ ] Each step and each part's final answer auto-grade via the Plan 1 `grade()` dispatcher, across all six answer types, with unlimited attempts and no gating (free skip-ahead).
- [ ] Hints reveal progressively only where the step has hints; "Reveal answer" works on steps and finals.
- [ ] Solved steps/parts persist across reloads via `localStorage`.

---

## Roadmap: Plan 4 (unchanged)

- **Plan 4 — Admin Authoring**: Supabase Auth login + `/admin/*` protection, nested tree editor (question → part → step → hint), typed answer editor with live `renderMobiusAnswer` preview, LaTeX live-preview fields, dnd-kit reordering, mutation functions + validation. Also where the real `supabase-js` implementation replaces the fixture behind `lib/data/queries.ts`, the schema migration SQL is authored as the backend contract, and `ChoiceOption.label` gets escaped/validated before `\text{}` wrapping (noted in Plan 1/2 reviews). Fixture expansion to the full 8-question Lab Test 1 also lands around here (or as a separate content task).
```
