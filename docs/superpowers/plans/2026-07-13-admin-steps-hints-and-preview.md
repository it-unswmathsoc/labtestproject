# Admin Steps, Hints & Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the admin authoring tree — author the **guided steps** (sub-goal, expected intermediate answer, explanation) and their **hints** under each part, with reorder, plus a **read-only student-style live preview** of a whole question so admins can verify what they've authored.

**Architecture:** New pure reducers in `lib/admin/content-store.ts` handle step + hint CRUD over the deeply-nested `Content` tree (question → part → step → hint); unit-tested. `AdminStoreProvider` gains bound mutations. New client components (`StepsEditor`/`StepEditor`, `HintsEditor`) slot into the existing `PartEditor`; `QuestionPreview` renders a question read-only using the existing `RichText`/`MobiusAnswer`; a Preview toggle lives in `QuestionEditor`.

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind, Vitest + RTL. Reuses `AnswerValueEditor`, `LatexField`, `SortableList`, `RichText`, `MobiusAnswer`.

**Part of a series:** Plan 4c (after 4a foundation, 4b questions/parts). This completes the admin authoring tree.

**Reference spec:** `docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md`. Decision: standalone localStorage authoring, no login.

---

## File Structure

- `lib/admin/content-store.ts` (modify) — step + hint CRUD reducers.
- `components/admin/AdminStoreProvider.tsx` (modify) — bound step/hint mutations.
- `components/admin/HintsEditor.tsx` — a step's hints: list, add, edit, reorder.
- `components/admin/StepsEditor.tsx` — a part's steps: list, add, reorder; each step edits sub-goal, expected answer (`AnswerValueEditor`), explanation, and hints.
- `components/admin/PartEditor.tsx` (modify) — mount `<StepsEditor>` and label the part's own `AnswerValueEditor` as the Final answer.
- `components/admin/QuestionPreview.tsx` — read-only render of a whole question.
- `components/admin/QuestionEditor.tsx` (modify) — a Preview toggle.

Boundaries: all mutations flow through pure reducers + provider; `QuestionPreview` is render-only (no store writes).

---

## Task 1: Step CRUD reducers

**Files:**
- Modify: `lib/admin/content-store.ts`
- Test: `lib/admin/__tests__/content-store.steps.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/admin/__tests__/content-store.steps.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createStep, updateStep, deleteStep, reorderSteps } from "../content-store";
import type { Content } from "../types";
import type { QuestionPart } from "@/lib/data/types";

function baseContent(): Content {
  const part: QuestionPart = {
    id: "pa",
    questionId: "q1",
    label: "a",
    promptLatex: "Part a",
    answerType: "integer",
    answerValue: 19,
    sortOrder: 1,
    steps: [
      {
        id: "s1",
        partId: "pa",
        number: 1,
        promptLatex: "Step one",
        answerType: "integer",
        answerValue: 32,
        explanationLatex: "because",
        sortOrder: 1,
        hints: [],
      },
    ],
  };
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [{ id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1 }],
    questions: [
      { id: "q1", labTestId: "t1", number: 1, promptLatex: "One", sortOrder: 1, parts: [part] },
    ],
  };
}

describe("createStep", () => {
  it("appends a step to the part with next number/sortOrder and empty hints", () => {
    const { content, id } = createStep(baseContent(), "pa", {
      promptLatex: "Step two",
      answerType: "integer",
      answerValue: 19,
      explanationLatex: "then",
    });
    const step = content.questions[0].parts[0].steps.find((s) => s.id === id);
    expect(step?.number).toBe(2);
    expect(step?.sortOrder).toBe(2);
    expect(step?.hints).toEqual([]);
    expect(step?.partId).toBe("pa");
  });
});

describe("updateStep", () => {
  it("patches a step's fields", () => {
    const next = updateStep(baseContent(), "s1", {
      promptLatex: "Edited",
      answerValue: 40,
    });
    const step = next.questions[0].parts[0].steps.find((s) => s.id === "s1");
    expect(step?.promptLatex).toBe("Edited");
    expect(step?.answerValue).toBe(40);
  });
});

describe("deleteStep", () => {
  it("removes the step", () => {
    const next = deleteStep(baseContent(), "s1");
    expect(next.questions[0].parts[0].steps.some((s) => s.id === "s1")).toBe(false);
  });
});

describe("reorderSteps", () => {
  it("rewrites sortOrder among a part's steps", () => {
    let c = baseContent();
    const added = createStep(c, "pa", {
      promptLatex: "Step two",
      answerType: "integer",
      answerValue: 19,
      explanationLatex: "then",
    });
    c = added.content;
    const next = reorderSteps(c, "pa", [added.id, "s1"]);
    const steps = next.questions[0].parts[0].steps;
    expect(steps.find((s) => s.id === added.id)?.sortOrder).toBe(1);
    expect(steps.find((s) => s.id === "s1")?.sortOrder).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.steps.test.ts
```
Expected: FAIL — `createStep` is not exported.

- [ ] **Step 3: Implement the reducers**

Add `Step` to the `@/lib/data/types` import line (so it includes `LabTest, Question, QuestionPart, Step`), then append to `lib/admin/content-store.ts`:
```ts
export function createStep(
  content: Content,
  partId: string,
  input: {
    promptLatex: string;
    answerType: AnswerType;
    answerValue: AnswerValue;
    answerConfig?: AnswerConfig;
    explanationLatex: string;
  }
): { content: Content; id: string } {
  const id = newId("step");
  return {
    content: {
      ...content,
      questions: content.questions.map((q) => ({
        ...q,
        parts: q.parts.map((p) => {
          if (p.id !== partId) return p;
          const number = p.steps.length
            ? Math.max(...p.steps.map((s) => s.number)) + 1
            : 1;
          const sortOrder = p.steps.length
            ? Math.max(...p.steps.map((s) => s.sortOrder)) + 1
            : 1;
          const step: Step = { id, partId, number, sortOrder, hints: [], ...input };
          return { ...p, steps: [...p.steps, step] };
        }),
      })),
    },
    id,
  };
}

export function updateStep(
  content: Content,
  stepId: string,
  patch: Partial<Omit<Step, "id" | "partId" | "hints">>
): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => ({
        ...p,
        steps: p.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
      })),
    })),
  };
}

export function deleteStep(content: Content, stepId: string): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => ({
        ...p,
        steps: p.steps.filter((s) => s.id !== stepId),
      })),
    })),
  };
}

export function reorderSteps(
  content: Content,
  partId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) =>
        p.id !== partId
          ? p
          : {
              ...p,
              steps: p.steps.map((s) =>
                order.has(s.id) ? { ...s, sortOrder: order.get(s.id) as number } : s
              ),
            }
      ),
    })),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.steps.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/content-store.ts lib/admin/__tests__/content-store.steps.test.ts
git commit -m "feat: add step CRUD reducers to the admin store"
```

---

## Task 2: Hint CRUD reducers

**Files:**
- Modify: `lib/admin/content-store.ts`
- Test: `lib/admin/__tests__/content-store.hints.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/admin/__tests__/content-store.hints.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createHint, updateHint, deleteHint, reorderHints } from "../content-store";
import type { Content } from "../types";

function baseContent(): Content {
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [{ id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1 }],
    questions: [
      {
        id: "q1",
        labTestId: "t1",
        number: 1,
        promptLatex: "One",
        sortOrder: 1,
        parts: [
          {
            id: "pa",
            questionId: "q1",
            label: "a",
            promptLatex: "Part a",
            answerType: "integer",
            answerValue: 19,
            sortOrder: 1,
            steps: [
              {
                id: "s1",
                partId: "pa",
                number: 1,
                promptLatex: "Step one",
                answerType: "integer",
                answerValue: 32,
                explanationLatex: "because",
                sortOrder: 1,
                hints: [
                  { id: "h1", stepId: "s1", number: 1, bodyLatex: "First", sortOrder: 1 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

const step = (c: Content) => c.questions[0].parts[0].steps[0];

describe("createHint", () => {
  it("appends a hint to the step with next number/sortOrder", () => {
    const { content, id } = createHint(baseContent(), "s1", { bodyLatex: "Second" });
    const h = step(content).hints.find((x) => x.id === id);
    expect(h?.number).toBe(2);
    expect(h?.sortOrder).toBe(2);
    expect(h?.stepId).toBe("s1");
  });
});

describe("updateHint", () => {
  it("patches a hint body", () => {
    const next = updateHint(baseContent(), "h1", { bodyLatex: "Edited" });
    expect(step(next).hints.find((x) => x.id === "h1")?.bodyLatex).toBe("Edited");
  });
});

describe("deleteHint", () => {
  it("removes the hint", () => {
    const next = deleteHint(baseContent(), "h1");
    expect(step(next).hints.some((x) => x.id === "h1")).toBe(false);
  });
});

describe("reorderHints", () => {
  it("rewrites sortOrder among a step's hints", () => {
    let c = baseContent();
    const added = createHint(c, "s1", { bodyLatex: "Second" });
    c = added.content;
    const next = reorderHints(c, "s1", [added.id, "h1"]);
    expect(step(next).hints.find((x) => x.id === added.id)?.sortOrder).toBe(1);
    expect(step(next).hints.find((x) => x.id === "h1")?.sortOrder).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.hints.test.ts
```
Expected: FAIL — `createHint` is not exported.

- [ ] **Step 3: Implement the reducers**

Add `Hint` to the `@/lib/data/types` import line, then append to `lib/admin/content-store.ts`:
```ts
function mapSteps(content: Content, fn: (steps: Step[]) => Step[]): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => ({ ...p, steps: fn(p.steps) })),
    })),
  };
}

export function createHint(
  content: Content,
  stepId: string,
  input: { bodyLatex: string }
): { content: Content; id: string } {
  const id = newId("hint");
  const next = mapSteps(content, (steps) =>
    steps.map((s) => {
      if (s.id !== stepId) return s;
      const number = s.hints.length
        ? Math.max(...s.hints.map((h) => h.number)) + 1
        : 1;
      const sortOrder = s.hints.length
        ? Math.max(...s.hints.map((h) => h.sortOrder)) + 1
        : 1;
      const hint: Hint = { id, stepId, number, sortOrder, bodyLatex: input.bodyLatex };
      return { ...s, hints: [...s.hints, hint] };
    })
  );
  return { content: next, id };
}

export function updateHint(
  content: Content,
  hintId: string,
  patch: Partial<Omit<Hint, "id" | "stepId">>
): Content {
  return mapSteps(content, (steps) =>
    steps.map((s) => ({
      ...s,
      hints: s.hints.map((h) => (h.id === hintId ? { ...h, ...patch } : h)),
    }))
  );
}

export function deleteHint(content: Content, hintId: string): Content {
  return mapSteps(content, (steps) =>
    steps.map((s) => ({ ...s, hints: s.hints.filter((h) => h.id !== hintId) }))
  );
}

export function reorderHints(
  content: Content,
  stepId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return mapSteps(content, (steps) =>
    steps.map((s) =>
      s.id !== stepId
        ? s
        : {
            ...s,
            hints: s.hints.map((h) =>
              order.has(h.id) ? { ...h, sortOrder: order.get(h.id) as number } : h
            ),
          }
    )
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.hints.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/content-store.ts lib/admin/__tests__/content-store.hints.test.ts
git commit -m "feat: add hint CRUD reducers to the admin store"
```

---

## Task 3: Provider step/hint mutations

**Files:**
- Modify: `components/admin/AdminStoreProvider.tsx`
- Test: `components/admin/__tests__/AdminStoreProvider.steps.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/AdminStoreProvider.steps.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStoreProvider, useAdminStore } from "../AdminStoreProvider";

function Harness() {
  const { content, addQuestion, addPart, addStep, addHint } = useAdminStore();
  const testId = content.labTests[0].id;
  // Ensure a question + part exist to attach a step to.
  const q = content.questions.find((x) => x.labTestId === testId);
  const part = q?.parts[0];
  const step = part?.steps[0];
  const stepCount = q?.parts.reduce((n, p) => n + p.steps.length, 0) ?? 0;
  const hintCount = step?.hints.length ?? 0;
  return (
    <div>
      <span>steps:{stepCount}</span>
      <span>hints:{hintCount}</span>
      <button onClick={() => addQuestion(testId, { promptLatex: "Q" })}>q</button>
      <button onClick={() => part && addStep(part.id, { promptLatex: "S", answerType: "integer", answerValue: 0, explanationLatex: "" })}>s</button>
      <button onClick={() => step && addHint(step.id, { bodyLatex: "H" })}>h</button>
      <button onClick={() => q && addPart(q.id, { label: "a", promptLatex: "P", answerType: "integer", answerValue: 0 })}>p</button>
    </div>
  );
}

describe("AdminStoreProvider step/hint mutations", () => {
  it("adds a step and a hint and persists them", async () => {
    render(
      <AdminStoreProvider>
        <Harness />
      </AdminStoreProvider>
    );
    // First existing question already has a part with a step (fixture Q1a),
    // so we can add a hint directly and a step to that part.
    const s0 = Number(screen.getByText(/steps:/).textContent?.replace("steps:", ""));
    await userEvent.click(screen.getByRole("button", { name: "s" }));
    expect(screen.getByText(`steps:${s0 + 1}`)).toBeInTheDocument();

    const h0 = Number(screen.getByText(/hints:/).textContent?.replace("hints:", ""));
    await userEvent.click(screen.getByRole("button", { name: "h" }));
    expect(screen.getByText(`hints:${h0 + 1}`)).toBeInTheDocument();

    expect(window.localStorage.getItem("labtest:admin:content")).toContain('"S"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/AdminStoreProvider.steps.test.tsx
```
Expected: FAIL — `addStep` is not a function.

- [ ] **Step 3: Extend the provider**

In `components/admin/AdminStoreProvider.tsx`:

Add the store imports: `createStep, updateStep, deleteStep, reorderSteps, createHint, updateHint, deleteHint, reorderHints`.

Add type imports: `import type { Step, Hint } from "@/lib/data/types";` (merge into the existing `@/lib/data/types` import).

Extend the `AdminStore` interface with:
```ts
  addStep: (
    partId: string,
    input: {
      promptLatex: string;
      answerType: AnswerType;
      answerValue: AnswerValue;
      answerConfig?: AnswerConfig;
      explanationLatex: string;
    }
  ) => string;
  editStep: (stepId: string, patch: Partial<Omit<Step, "id" | "partId" | "hints">>) => void;
  removeStep: (stepId: string) => void;
  moveSteps: (partId: string, orderedIds: string[]) => void;
  addHint: (stepId: string, input: { bodyLatex: string }) => string;
  editHint: (hintId: string, patch: Partial<Omit<Hint, "id" | "stepId">>) => void;
  removeHint: (hintId: string) => void;
  moveHints: (stepId: string, orderedIds: string[]) => void;
```

Add the bound callbacks (mirroring the existing ones):
```ts
  const addStep = useCallback<AdminStore["addStep"]>(
    (partId, input) => {
      const { content: next, id } = createStep(contentRef.current, partId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editStep = useCallback<AdminStore["editStep"]>(
    (stepId, patch) => commit(updateStep(contentRef.current, stepId, patch)),
    [commit]
  );
  const removeStep = useCallback<AdminStore["removeStep"]>(
    (stepId) => commit(deleteStep(contentRef.current, stepId)),
    [commit]
  );
  const moveSteps = useCallback<AdminStore["moveSteps"]>(
    (partId, orderedIds) => commit(reorderSteps(contentRef.current, partId, orderedIds)),
    [commit]
  );
  const addHint = useCallback<AdminStore["addHint"]>(
    (stepId, input) => {
      const { content: next, id } = createHint(contentRef.current, stepId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editHint = useCallback<AdminStore["editHint"]>(
    (hintId, patch) => commit(updateHint(contentRef.current, hintId, patch)),
    [commit]
  );
  const removeHint = useCallback<AdminStore["removeHint"]>(
    (hintId) => commit(deleteHint(contentRef.current, hintId)),
    [commit]
  );
  const moveHints = useCallback<AdminStore["moveHints"]>(
    (stepId, orderedIds) => commit(reorderHints(contentRef.current, stepId, orderedIds)),
    [commit]
  );
```

Add all eight to the context `value={{ ... }}` object.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/AdminStoreProvider.steps.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminStoreProvider.tsx components/admin/__tests__/AdminStoreProvider.steps.test.tsx
git commit -m "feat: expose step/hint mutations from the admin provider"
```

---

## Task 4: HintsEditor

**Files:**
- Create: `components/admin/HintsEditor.tsx`

- [ ] **Step 1: Create HintsEditor**

Create `components/admin/HintsEditor.tsx`:
```tsx
"use client";

import type { Step } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { SortableList } from "./SortableList";
import { LatexField } from "./LatexField";

export function HintsEditor({ step }: { step: Step }) {
  const { addHint, editHint, removeHint, moveHints } = useAdminStore();
  const hints = [...step.hints].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-gray-500">Hints</span>
        <button
          type="button"
          onClick={() => addHint(step.id, { bodyLatex: "" })}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add hint
        </button>
      </div>
      {hints.length === 0 ? (
        <p className="text-sm text-gray-400">No hints.</p>
      ) : (
        <SortableList
          items={hints.map((h) => h.id)}
          onReorder={(ids) => moveHints(step.id, ids)}
          renderItem={(id) => {
            const hint = hints.find((h) => h.id === id);
            if (!hint) return null;
            return (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <LatexField
                    label={`Hint ${hint.number}`}
                    rows={2}
                    value={hint.bodyLatex}
                    onChange={(v) => editHint(hint.id, { bodyLatex: v })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeHint(hint.id)}
                  className="mt-6 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npx tsc --noEmit && npm run build
```
Expected: no type errors; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/admin/HintsEditor.tsx
git commit -m "feat: add HintsEditor with add, edit and reorder"
```

---

## Task 5: StepsEditor + wire into PartEditor

**Files:**
- Create: `components/admin/StepsEditor.tsx`
- Modify: `components/admin/PartEditor.tsx`

- [ ] **Step 1: Create StepsEditor**

Create `components/admin/StepsEditor.tsx`:
```tsx
"use client";

import type { QuestionPart } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { SortableList } from "./SortableList";
import { LatexField } from "./LatexField";
import { AnswerValueEditor } from "./AnswerValueEditor";
import { HintsEditor } from "./HintsEditor";

export function StepsEditor({ part }: { part: QuestionPart }) {
  const { addStep, editStep, removeStep, moveSteps } = useAdminStore();
  const steps = [...part.steps].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Steps</span>
        <button
          type="button"
          onClick={() =>
            addStep(part.id, {
              promptLatex: "",
              answerType: "integer",
              answerValue: 0,
              explanationLatex: "",
            })
          }
          className="text-sm text-blue-600 hover:underline"
        >
          + Add step
        </button>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-gray-500">No steps yet.</p>
      ) : (
        <SortableList
          items={steps.map((s) => s.id)}
          onReorder={(ids) => moveSteps(part.id, ids)}
          renderItem={(id) => {
            const step = steps.find((s) => s.id === id);
            if (!step) return null;
            return (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Step {step.number}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete step
                  </button>
                </div>
                <div className="space-y-3">
                  <LatexField
                    label="Sub-goal prompt"
                    value={step.promptLatex}
                    onChange={(v) => editStep(step.id, { promptLatex: v })}
                  />
                  <div className="rounded-md bg-gray-50 p-2">
                    <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      Expected answer
                    </div>
                    <AnswerValueEditor
                      answerType={step.answerType}
                      answerValue={step.answerValue}
                      answerConfig={step.answerConfig}
                      onChange={(state) =>
                        editStep(step.id, {
                          answerType: state.answerType,
                          answerValue: state.answerValue,
                          answerConfig: state.answerConfig,
                        })
                      }
                    />
                  </div>
                  <LatexField
                    label="Explanation"
                    value={step.explanationLatex}
                    onChange={(v) => editStep(step.id, { explanationLatex: v })}
                  />
                  <HintsEditor step={step} />
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount StepsEditor in PartEditor**

In `components/admin/PartEditor.tsx`:

Add the import:
```tsx
import { StepsEditor } from "./StepsEditor";
```

Insert `<StepsEditor part={part} />` and a "Final answer" heading so the part's own answer editor is clearly the final answer. Replace this block:
```tsx
        <AnswerValueEditor
          answerType={part.answerType}
          answerValue={part.answerValue}
          answerConfig={part.answerConfig}
          onChange={(state) =>
            editPart(part.id, {
              answerType: state.answerType,
              answerValue: state.answerValue,
              answerConfig: state.answerConfig,
            })
          }
        />
```
with:
```tsx
        <StepsEditor part={part} />

        <div className="rounded-md border border-gray-200 p-2">
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
            Final answer
          </div>
          <AnswerValueEditor
            answerType={part.answerType}
            answerValue={part.answerValue}
            answerConfig={part.answerConfig}
            onChange={(state) =>
              editPart(part.id, {
                answerType: state.answerType,
                answerValue: state.answerValue,
                answerConfig: state.answerConfig,
              })
            }
          />
        </div>
```

- [ ] **Step 3: Verify build**

Run:
```bash
npx tsc --noEmit && npm run build
```
Expected: no type errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/admin/StepsEditor.tsx components/admin/PartEditor.tsx
git commit -m "feat: add StepsEditor and mount it in PartEditor"
```

---

## Task 6: QuestionPreview

**Files:**
- Create: `components/admin/QuestionPreview.tsx`
- Test: `components/admin/__tests__/QuestionPreview.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/QuestionPreview.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionPreview } from "../QuestionPreview";
import type { Question } from "@/lib/data/types";

const question: Question = {
  id: "q1",
  labTestId: "t1",
  number: 1,
  promptLatex: "The stem",
  sortOrder: 1,
  parts: [
    {
      id: "pa",
      questionId: "q1",
      label: "a",
      promptLatex: "The part",
      answerType: "integer",
      answerValue: 19,
      sortOrder: 1,
      steps: [
        {
          id: "s1",
          partId: "pa",
          number: 1,
          promptLatex: "The sub-goal",
          answerType: "integer",
          answerValue: 32,
          explanationLatex: "The explanation",
          sortOrder: 1,
          hints: [
            { id: "h1", stepId: "s1", number: 1, bodyLatex: "The hint", sortOrder: 1 },
          ],
        },
      ],
    },
  ],
};

describe("QuestionPreview", () => {
  it("renders the stem, part, step, explanation and hint", () => {
    render(<QuestionPreview question={question} />);
    expect(screen.getByText(/The stem/)).toBeInTheDocument();
    expect(screen.getByText(/The part/)).toBeInTheDocument();
    expect(screen.getByText(/The sub-goal/)).toBeInTheDocument();
    expect(screen.getByText(/The explanation/)).toBeInTheDocument();
    expect(screen.getByText(/The hint/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/QuestionPreview.test.tsx
```
Expected: FAIL — cannot find module `../QuestionPreview`.

- [ ] **Step 3: Implement QuestionPreview**

Create `components/admin/QuestionPreview.tsx`:
```tsx
"use client";

import type { Question } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { MobiusAnswer } from "@/components/math/MobiusAnswer";

export function QuestionPreview({ question }: { question: Question }) {
  const parts = [...question.parts].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
      <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Preview</div>
      <div className="text-gray-800">
        <RichText>{question.promptLatex}</RichText>
      </div>
      {question.noteLatex ? (
        <div className="mt-1 text-sm italic text-gray-500">
          <RichText>{question.noteLatex}</RichText>
        </div>
      ) : null}

      {parts.map((part) => {
        const steps = [...part.steps].sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <div key={part.id} className="mt-4 border-l-2 border-gray-100 pl-3">
            <div className="text-gray-800">
              <span className="font-medium">{part.label}) </span>
              <RichText>{part.promptLatex}</RichText>
            </div>
            {part.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of a static diagram
              <img
                src={part.imageUrl}
                alt={part.imageAlt ?? ""}
                className="my-2 max-w-xs rounded border border-gray-200"
              />
            ) : null}
            {steps.map((step) => {
              const hints = [...step.hints].sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <div key={step.id} className="mt-2 rounded bg-gray-50 p-2 text-sm">
                  <div className="text-gray-600">
                    <span className="font-medium">Step {step.number}: </span>
                    <RichText>{step.promptLatex}</RichText>
                  </div>
                  <div className="text-gray-500">
                    Answer:{" "}
                    <MobiusAnswer
                      value={step.answerValue}
                      type={step.answerType}
                      config={step.answerConfig}
                    />
                  </div>
                  {step.explanationLatex ? (
                    <div className="mt-1 text-gray-600">
                      <RichText>{step.explanationLatex}</RichText>
                    </div>
                  ) : null}
                  {hints.map((h) => (
                    <div key={h.id} className="mt-1 text-amber-800">
                      Hint {h.number}: <RichText>{h.bodyLatex}</RichText>
                    </div>
                  ))}
                </div>
              );
            })}
            <div className="mt-2 text-sm text-gray-500">
              Final answer:{" "}
              <MobiusAnswer
                value={part.answerValue}
                type={part.answerType}
                config={part.answerConfig}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/QuestionPreview.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/QuestionPreview.tsx components/admin/__tests__/QuestionPreview.test.tsx
git commit -m "feat: add read-only QuestionPreview"
```

---

## Task 7: Preview toggle in QuestionEditor

**Files:**
- Modify: `components/admin/QuestionEditor.tsx`

- [ ] **Step 1: Add the preview toggle**

In `components/admin/QuestionEditor.tsx`:

Add the import:
```tsx
import { QuestionPreview } from "./QuestionPreview";
```

Add a preview state next to the existing `open` state:
```tsx
  const [showPreview, setShowPreview] = useState(false);
```

Inside the `{open ? (...) : null}` block, after `<PartsEditor question={question} />`, add:
```tsx
          <div>
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
            {showPreview ? (
              <div className="mt-2">
                <QuestionPreview question={question} />
              </div>
            ) : null}
          </div>
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manually verify**

`npm run dev`, open http://localhost:3000/admin/tests/test-1081-lt1:
- Expand Question 1 → expand part a → **Steps**: see the two authored steps (Step 1 with a hint, Step 2). Edit a sub-goal / expected answer / explanation; add a hint; add a step; drag to reorder steps and hints; delete a step/hint.
- Click **Show preview** → a read-only rendering of the whole question (stem, parts, steps with answers/explanations/hints, final answers) with math rendered.
- Reload → all edits persist.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add components/admin/QuestionEditor.tsx
git commit -m "feat: add preview toggle to QuestionEditor"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full gates**

Run:
```bash
npm test && npm run lint && npx tsc --noEmit && npm run build
```
Expected: all tests pass; lint clean; no type errors; build succeeds.

- [ ] **Step 2: End-to-end manual pass**

`npm run dev`: author a full question — stem, a part, two steps (each with expected answer + explanation + a hint), and a final answer — reorder steps/hints, open the preview to verify, reload to confirm persistence. Stop the dev server.

---

## Definition of Done (Plan 4c)

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass.
- [ ] Steps and hints can be added, edited, deleted, and reordered under a part/step and persist across reloads.
- [ ] Each step authors a sub-goal, an expected intermediate answer (typed editor), and an explanation; hints are ordered LaTeX bodies.
- [ ] A read-only preview renders a whole question (stem, parts, steps, hints, final answers) with math.
- [ ] The admin authoring tree (course → test → question → part → step → hint) is now complete.

---

## Remaining follow-ups (not in this plan)

- Fixture expansion to the full 8-question MATH1081 Lab Test 1 (with diagrams).
- Escape `ChoiceOption.label` before `\text{}` wrapping (from earlier reviews) — a small hardening for admin-entered labels containing LaTeX-special characters.
- (Eventually) wire the admin content store to the real Supabase backend so edits reflect on the student pages.
```
