# Admin Question & Part Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the admin test editor so MathSoc can author **questions and their parts** — question stem/note, part label/prompt/image, and each part's **final answer via a typed answer editor** covering all six answer types — with **live LaTeX preview** on math fields, plus add/delete/reorder.

**Architecture:** New pure reducers in `lib/admin/content-store.ts` handle question and part CRUD over the nested `Content` tree; they are unit-tested. `AdminStoreProvider` gains bound mutations. A set of client components (`LatexField`, `AnswerValueEditor`, `PartEditor`, `PartsEditor`, `QuestionEditor`, `QuestionsEditor`) compose the nested editing UI, mounted inside the existing `/admin/tests/[id]` page. Reordering reuses the Plan 4a `SortableList`.

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind, Vitest + RTL. Reuses `lib/grading` types, `components/math` (RichText/MobiusAnswer), and the Plan 4a admin store/provider/SortableList.

**Part of a series:** Plan 4b (after 4a foundation & dashboard). 4c = steps, hints, reordering everywhere, and a live student-style preview.

**Reference spec:** `docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md` (Admin Authoring). Decision: standalone localStorage authoring, no login, full tree.

**Scope note:** Parts get their **final answer** here. **Steps and hints** authoring is 4c — new parts start with `steps: []`.

---

## File Structure

- `lib/admin/content-store.ts` (modify) — question + part CRUD reducers.
- `components/admin/AdminStoreProvider.tsx` (modify) — bound question/part mutations.
- `components/admin/LatexField.tsx` — labelled textarea with live `<RichText>` preview.
- `components/admin/AnswerValueEditor.tsx` — typed answer editor (all six `answerType`s + config/options).
- `components/admin/PartEditor.tsx` — one part's fields + answer editor.
- `components/admin/PartsEditor.tsx` — a question's parts: list, add, reorder.
- `components/admin/QuestionEditor.tsx` — one question's fields + its PartsEditor.
- `components/admin/QuestionsEditor.tsx` — a test's questions: list, add, reorder.
- `app/admin/tests/[id]/page.tsx` (modify) — mount `<QuestionsEditor testId={id} />`.

Boundaries: all mutations go through the pure reducers + provider; `AnswerValueEditor` is the single place that maps an `answerType` to its value/config editing UI (mirroring the student-side `AnswerInput`).

---

## Task 1: Question CRUD reducers

**Files:**
- Modify: `lib/admin/content-store.ts`
- Test: `lib/admin/__tests__/content-store.questions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/admin/__tests__/content-store.questions.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../content-store";
import type { Content } from "../types";

function baseContent(): Content {
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [
      { id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1 },
    ],
    questions: [
      { id: "q1", labTestId: "t1", number: 1, promptLatex: "One", sortOrder: 1, parts: [] },
      { id: "q2", labTestId: "t1", number: 2, promptLatex: "Two", sortOrder: 2, parts: [] },
    ],
  };
}

describe("createQuestion", () => {
  it("appends a question with the next number and sortOrder", () => {
    const { content, id } = createQuestion(baseContent(), "t1", { promptLatex: "Three" });
    const q = content.questions.find((x) => x.id === id);
    expect(q?.number).toBe(3);
    expect(q?.sortOrder).toBe(3);
    expect(q?.parts).toEqual([]);
    expect(q?.labTestId).toBe("t1");
  });

  it("numbers the first question of a test as 1", () => {
    const { content, id } = createQuestion(baseContent(), "t2", { promptLatex: "First" });
    expect(content.questions.find((x) => x.id === id)?.number).toBe(1);
  });
});

describe("updateQuestion", () => {
  it("patches stem and note", () => {
    const next = updateQuestion(baseContent(), "q1", {
      promptLatex: "Edited",
      noteLatex: "note",
    });
    const q = next.questions.find((x) => x.id === "q1");
    expect(q?.promptLatex).toBe("Edited");
    expect(q?.noteLatex).toBe("note");
  });
});

describe("deleteQuestion", () => {
  it("removes the question", () => {
    const next = deleteQuestion(baseContent(), "q1");
    expect(next.questions.some((x) => x.id === "q1")).toBe(false);
    expect(next.questions.some((x) => x.id === "q2")).toBe(true);
  });
});

describe("reorderQuestions", () => {
  it("rewrites sortOrder within the test", () => {
    const next = reorderQuestions(baseContent(), "t1", ["q2", "q1"]);
    expect(next.questions.find((x) => x.id === "q2")?.sortOrder).toBe(1);
    expect(next.questions.find((x) => x.id === "q1")?.sortOrder).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.questions.test.ts
```
Expected: FAIL — `createQuestion` is not exported.

- [ ] **Step 3: Implement the reducers**

Append to `lib/admin/content-store.ts` (add `Question` to the existing `import type { LabTest } from "@/lib/data/types";` line so it reads `import type { LabTest, Question } from "@/lib/data/types";`):
```ts
export function createQuestion(
  content: Content,
  testId: string,
  input: { promptLatex: string; noteLatex?: string }
): { content: Content; id: string } {
  const id = newId("q");
  const siblings = content.questions.filter((q) => q.labTestId === testId);
  const nextNum = siblings.length
    ? Math.max(...siblings.map((q) => q.number)) + 1
    : 1;
  const sortOrder = siblings.length
    ? Math.max(...siblings.map((q) => q.sortOrder)) + 1
    : 1;
  const question: Question = {
    id,
    labTestId: testId,
    number: nextNum,
    promptLatex: input.promptLatex,
    noteLatex: input.noteLatex,
    sortOrder,
    parts: [],
  };
  return { content: { ...content, questions: [...content.questions, question] }, id };
}

export function updateQuestion(
  content: Content,
  id: string,
  patch: Partial<Omit<Question, "id" | "parts">>
): Content {
  return {
    ...content,
    questions: content.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
  };
}

export function deleteQuestion(content: Content, id: string): Content {
  return {
    ...content,
    questions: content.questions.filter((q) => q.id !== id),
  };
}

export function reorderQuestions(
  content: Content,
  testId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    questions: content.questions.map((q) =>
      q.labTestId === testId && order.has(q.id)
        ? { ...q, sortOrder: order.get(q.id) as number }
        : q
    ),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.questions.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/content-store.ts lib/admin/__tests__/content-store.questions.test.ts
git commit -m "feat: add question CRUD reducers to the admin store"
```

---

## Task 2: Part CRUD reducers

**Files:**
- Modify: `lib/admin/content-store.ts`
- Test: `lib/admin/__tests__/content-store.parts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/admin/__tests__/content-store.parts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  createPart,
  updatePart,
  deletePart,
  reorderParts,
} from "../content-store";
import type { Content } from "../types";
import type { QuestionPart } from "@/lib/data/types";

function baseContent(): Content {
  const partA: QuestionPart = {
    id: "pa",
    questionId: "q1",
    label: "a",
    promptLatex: "Part a",
    answerType: "integer",
    answerValue: 1,
    sortOrder: 1,
    steps: [],
  };
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [
      { id: "t1", courseId: "c1", name: "LT1", isPublished: true, sortOrder: 1 },
    ],
    questions: [
      { id: "q1", labTestId: "t1", number: 1, promptLatex: "One", sortOrder: 1, parts: [partA] },
    ],
  };
}

describe("createPart", () => {
  it("appends a part to the question with the next sortOrder and empty steps", () => {
    const { content, id } = createPart(baseContent(), "q1", {
      label: "b",
      promptLatex: "Part b",
      answerType: "text",
      answerValue: { text: "Bijective" },
    });
    const q = content.questions.find((x) => x.id === "q1");
    const p = q?.parts.find((x) => x.id === id);
    expect(p?.label).toBe("b");
    expect(p?.sortOrder).toBe(2);
    expect(p?.steps).toEqual([]);
    expect(p?.questionId).toBe("q1");
  });
});

describe("updatePart", () => {
  it("patches the named part's fields", () => {
    const next = updatePart(baseContent(), "pa", {
      promptLatex: "Edited",
      answerType: "set_of_integers",
      answerValue: [1, 2, 3],
    });
    const p = next.questions[0].parts.find((x) => x.id === "pa");
    expect(p?.promptLatex).toBe("Edited");
    expect(p?.answerType).toBe("set_of_integers");
    expect(p?.answerValue).toEqual([1, 2, 3]);
  });
});

describe("deletePart", () => {
  it("removes the part", () => {
    const next = deletePart(baseContent(), "pa");
    expect(next.questions[0].parts.some((x) => x.id === "pa")).toBe(false);
  });
});

describe("reorderParts", () => {
  it("rewrites sortOrder among a question's parts", () => {
    let c = baseContent();
    const added = createPart(c, "q1", {
      label: "b",
      promptLatex: "Part b",
      answerType: "integer",
      answerValue: 2,
    });
    c = added.content;
    const next = reorderParts(c, "q1", [added.id, "pa"]);
    expect(next.questions[0].parts.find((x) => x.id === added.id)?.sortOrder).toBe(1);
    expect(next.questions[0].parts.find((x) => x.id === "pa")?.sortOrder).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.parts.test.ts
```
Expected: FAIL — `createPart` is not exported.

- [ ] **Step 3: Implement the reducers**

Append to `lib/admin/content-store.ts` (add `QuestionPart` and the grading types to the `@/lib/data/types` import: `import type { LabTest, Question, QuestionPart } from "@/lib/data/types";`, and add `import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";`):
```ts
export function createPart(
  content: Content,
  questionId: string,
  input: {
    label: string;
    promptLatex: string;
    imageUrl?: string;
    imageAlt?: string;
    answerType: AnswerType;
    answerValue: AnswerValue;
    answerConfig?: AnswerConfig;
  }
): { content: Content; id: string } {
  const id = newId("part");
  return {
    content: {
      ...content,
      questions: content.questions.map((q) => {
        if (q.id !== questionId) return q;
        const sortOrder = q.parts.length
          ? Math.max(...q.parts.map((p) => p.sortOrder)) + 1
          : 1;
        const part: QuestionPart = { id, questionId, sortOrder, steps: [], ...input };
        return { ...q, parts: [...q.parts, part] };
      }),
    },
    id,
  };
}

export function updatePart(
  content: Content,
  partId: string,
  patch: Partial<Omit<QuestionPart, "id" | "questionId" | "steps">>
): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)),
    })),
  };
}

export function deletePart(content: Content, partId: string): Content {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      ...q,
      parts: q.parts.filter((p) => p.id !== partId),
    })),
  };
}

export function reorderParts(
  content: Content,
  questionId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    questions: content.questions.map((q) =>
      q.id !== questionId
        ? q
        : {
            ...q,
            parts: q.parts.map((p) =>
              order.has(p.id) ? { ...p, sortOrder: order.get(p.id) as number } : p
            ),
          }
    ),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.parts.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/content-store.ts lib/admin/__tests__/content-store.parts.test.ts
git commit -m "feat: add part CRUD reducers to the admin store"
```

---

## Task 3: Provider question/part mutations

**Files:**
- Modify: `components/admin/AdminStoreProvider.tsx`
- Test: `components/admin/__tests__/AdminStoreProvider.parts.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/AdminStoreProvider.parts.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStoreProvider, useAdminStore } from "../AdminStoreProvider";

function Harness() {
  const { content, addQuestion, addPart } = useAdminStore();
  const testId = content.labTests[0].id;
  const q = content.questions.filter((x) => x.labTestId === testId);
  const partCount = q.reduce((n, x) => n + x.parts.length, 0);
  return (
    <div>
      <span>questions:{q.length}</span>
      <span>parts:{partCount}</span>
      <button onClick={() => addQuestion(testId, { promptLatex: "New Q" })}>addq</button>
      <button
        onClick={() =>
          q[0] &&
          addPart(q[0].id, {
            label: "z",
            promptLatex: "New P",
            answerType: "integer",
            answerValue: 0,
          })
        }
      >
        addp
      </button>
    </div>
  );
}

describe("AdminStoreProvider question/part mutations", () => {
  it("adds a question and a part and persists them", async () => {
    render(
      <AdminStoreProvider>
        <Harness />
      </AdminStoreProvider>
    );
    const q0 = Number(screen.getByText(/questions:/).textContent?.replace("questions:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addq" }));
    expect(screen.getByText(`questions:${q0 + 1}`)).toBeInTheDocument();

    const p0 = Number(screen.getByText(/parts:/).textContent?.replace("parts:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addp" }));
    expect(screen.getByText(`parts:${p0 + 1}`)).toBeInTheDocument();

    expect(window.localStorage.getItem("labtest:admin:content")).toContain('"New P"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/AdminStoreProvider.parts.test.tsx
```
Expected: FAIL — `addQuestion` is not a function.

- [ ] **Step 3: Extend the provider**

In `components/admin/AdminStoreProvider.tsx`:

Add to the imports from the store:
```ts
import {
  seedContent,
  createTest,
  updateTest,
  deleteTest,
  reorderTests,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  createPart,
  updatePart,
  deletePart,
  reorderParts,
} from "@/lib/admin/content-store";
```

Add these type imports:
```ts
import type { LabTest, Question, QuestionPart } from "@/lib/data/types";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
```

Extend the `AdminStore` interface with:
```ts
  addQuestion: (testId: string, input: { promptLatex: string; noteLatex?: string }) => string;
  editQuestion: (id: string, patch: Partial<Omit<Question, "id" | "parts">>) => void;
  removeQuestion: (id: string) => void;
  moveQuestions: (testId: string, orderedIds: string[]) => void;
  addPart: (
    questionId: string,
    input: {
      label: string;
      promptLatex: string;
      imageUrl?: string;
      imageAlt?: string;
      answerType: AnswerType;
      answerValue: AnswerValue;
      answerConfig?: AnswerConfig;
    }
  ) => string;
  editPart: (partId: string, patch: Partial<Omit<QuestionPart, "id" | "questionId" | "steps">>) => void;
  removePart: (partId: string) => void;
  moveParts: (questionId: string, orderedIds: string[]) => void;
```

Add these bound callbacks (next to the existing `addTest`/`editTest`/... callbacks):
```ts
  const addQuestion = useCallback<AdminStore["addQuestion"]>(
    (testId, input) => {
      const { content: next, id } = createQuestion(contentRef.current, testId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editQuestion = useCallback<AdminStore["editQuestion"]>(
    (id, patch) => commit(updateQuestion(contentRef.current, id, patch)),
    [commit]
  );
  const removeQuestion = useCallback<AdminStore["removeQuestion"]>(
    (id) => commit(deleteQuestion(contentRef.current, id)),
    [commit]
  );
  const moveQuestions = useCallback<AdminStore["moveQuestions"]>(
    (testId, orderedIds) => commit(reorderQuestions(contentRef.current, testId, orderedIds)),
    [commit]
  );
  const addPart = useCallback<AdminStore["addPart"]>(
    (questionId, input) => {
      const { content: next, id } = createPart(contentRef.current, questionId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editPart = useCallback<AdminStore["editPart"]>(
    (partId, patch) => commit(updatePart(contentRef.current, partId, patch)),
    [commit]
  );
  const removePart = useCallback<AdminStore["removePart"]>(
    (partId) => commit(deletePart(contentRef.current, partId)),
    [commit]
  );
  const moveParts = useCallback<AdminStore["moveParts"]>(
    (questionId, orderedIds) => commit(reorderParts(contentRef.current, questionId, orderedIds)),
    [commit]
  );
```

Add all eight to the context `value={{ ... }}` object alongside the existing four test mutations.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/AdminStoreProvider.parts.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminStoreProvider.tsx components/admin/__tests__/AdminStoreProvider.parts.test.tsx
git commit -m "feat: expose question/part mutations from the admin provider"
```

---

## Task 4: LatexField (textarea + live preview)

**Files:**
- Create: `components/admin/LatexField.tsx`
- Test: `components/admin/__tests__/LatexField.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/LatexField.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LatexField } from "../LatexField";

function Harness() {
  const [value, setValue] = useState("");
  return <LatexField label="Prompt" value={value} onChange={setValue} />;
}

describe("LatexField", () => {
  it("edits the value and shows a preview of the text", async () => {
    render(<Harness />);
    const box = screen.getByLabelText("Prompt");
    await userEvent.type(box, "Find x");
    expect(box).toHaveValue("Find x");
    // The preview region echoes the text (RichText renders plain text as-is).
    const previews = screen.getAllByText(/Find x/);
    expect(previews.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/LatexField.test.tsx
```
Expected: FAIL — cannot find module `../LatexField`.

- [ ] **Step 3: Implement LatexField**

Create `components/admin/LatexField.tsx`:
```tsx
"use client";

import { RichText } from "@/components/math/RichText";

export function LatexField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700">
        <span className="mr-1 text-xs text-gray-400">Preview:</span>
        <RichText>{value}</RichText>
      </div>
    </label>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/LatexField.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/LatexField.tsx components/admin/__tests__/LatexField.test.tsx
git commit -m "feat: add LatexField with live math preview"
```

---

## Task 5: AnswerValueEditor

Edits a part's `answerType` + `answerValue` + `answerConfig`. Emits the full triple on any change. For choice types it manages an options list and the correct selection.

**Files:**
- Create: `components/admin/AnswerValueEditor.tsx`
- Test: `components/admin/__tests__/AnswerValueEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/AnswerValueEditor.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerValueEditor } from "../AnswerValueEditor";

describe("AnswerValueEditor", () => {
  it("edits an integer answer", async () => {
    const onChange = vi.fn();
    render(
      <AnswerValueEditor
        answerType="integer"
        answerValue={0}
        onChange={onChange}
      />
    );
    await userEvent.clear(screen.getByLabelText(/correct answer/i));
    await userEvent.type(screen.getByLabelText(/correct answer/i), "19");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerType: "integer", answerValue: 19 })
    );
  });

  it("edits a set_of_integers answer from set() syntax", async () => {
    const onChange = vi.fn();
    render(
      <AnswerValueEditor answerType="set_of_integers" answerValue={[]} onChange={onChange} />
    );
    await userEvent.type(screen.getByLabelText(/correct answer/i), "set(6,7)");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerType: "set_of_integers", answerValue: [6, 7] })
    );
  });

  it("resets the value shape when the type changes", async () => {
    const onChange = vi.fn();
    render(<AnswerValueEditor answerType="integer" answerValue={5} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText(/answer type/i), "text");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerType: "text", answerValue: { text: "" } })
    );
  });

  it("edits a text answer", async () => {
    const onChange = vi.fn();
    render(
      <AnswerValueEditor answerType="text" answerValue={{ text: "" }} onChange={onChange} />
    );
    await userEvent.type(screen.getByLabelText(/correct answer/i), "Bijective");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerValue: { text: "Bijective" } })
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/AnswerValueEditor.test.tsx
```
Expected: FAIL — cannot find module `../AnswerValueEditor`.

- [ ] **Step 3: Implement AnswerValueEditor**

Create `components/admin/AnswerValueEditor.tsx`:
```tsx
"use client";

import { useId } from "react";
import type {
  AnswerType,
  AnswerValue,
  AnswerConfig,
  ChoiceOption,
} from "@/lib/grading";
import { parseIntegerSet } from "@/lib/grading/set";

const ANSWER_TYPES: AnswerType[] = [
  "integer",
  "expression",
  "set_of_integers",
  "single_choice",
  "multi_select",
  "text",
];

export interface AnswerState {
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
}

export function defaultAnswerValue(type: AnswerType): AnswerValue {
  switch (type) {
    case "integer":
      return 0;
    case "expression":
      return { mobius: "" };
    case "set_of_integers":
      return [];
    case "single_choice":
      return { choice: "" };
    case "multi_select":
      return { selected: [] };
    case "text":
      return { text: "" };
  }
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

export function AnswerValueEditor({
  answerType,
  answerValue,
  answerConfig,
  onChange,
}: {
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  onChange: (state: AnswerState) => void;
}) {
  const emit = (patch: Partial<AnswerState>) =>
    onChange({ answerType, answerValue, answerConfig, ...patch });

  const changeType = (type: AnswerType) =>
    onChange({
      answerType: type,
      answerValue: defaultAnswerValue(type),
      answerConfig:
        type === "single_choice" || type === "multi_select"
          ? { options: answerConfig?.options ?? [] }
          : undefined,
    });

  const options = answerConfig?.options ?? [];
  const setOptions = (next: ChoiceOption[]) =>
    emit({ answerConfig: { ...answerConfig, options: next } });

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Answer type</span>
        <select
          className={inputClass}
          value={answerType}
          onChange={(e) => changeType(e.target.value as AnswerType)}
        >
          {ANSWER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {answerType === "integer" ? (
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Correct answer</span>
          <input
            type="text"
            inputMode="numeric"
            className={inputClass}
            defaultValue={String(answerValue as number)}
            onChange={(e) => emit({ answerValue: Number(e.target.value) || 0 })}
          />
        </label>
      ) : null}

      {answerType === "expression" ? (
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Correct answer (Numbas syntax, e.g. 2^100)
          </span>
          <input
            type="text"
            className={inputClass}
            defaultValue={(answerValue as { mobius: string }).mobius}
            onChange={(e) => emit({ answerValue: { mobius: e.target.value } })}
          />
        </label>
      ) : null}

      {answerType === "set_of_integers" ? (
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Correct answer (set syntax, e.g. set(1,2,3))
          </span>
          <input
            type="text"
            className={inputClass}
            defaultValue={`set(${(answerValue as number[]).join(",")})`}
            onChange={(e) =>
              emit({ answerValue: parseIntegerSet(e.target.value) ?? [] })
            }
          />
        </label>
      ) : null}

      {answerType === "text" ? (
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Correct answer</span>
          <input
            type="text"
            className={inputClass}
            defaultValue={(answerValue as { text: string }).text}
            onChange={(e) => emit({ answerValue: { text: e.target.value } })}
          />
        </label>
      ) : null}

      {answerType === "single_choice" || answerType === "multi_select" ? (
        <OptionsEditor
          options={options}
          answerType={answerType}
          answerValue={answerValue}
          onOptionsChange={setOptions}
          onAnswerChange={(v) => emit({ answerValue: v })}
        />
      ) : null}
    </div>
  );
}

function OptionsEditor({
  options,
  answerType,
  answerValue,
  onOptionsChange,
  onAnswerChange,
}: {
  options: ChoiceOption[];
  answerType: "single_choice" | "multi_select";
  answerValue: AnswerValue;
  onOptionsChange: (options: ChoiceOption[]) => void;
  onAnswerChange: (value: AnswerValue) => void;
}) {
  const groupName = useId();
  const selected =
    answerType === "single_choice"
      ? [(answerValue as { choice: string }).choice]
      : (answerValue as { selected: string[] }).selected;

  const updateOption = (i: number, patch: Partial<ChoiceOption>) =>
    onOptionsChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const addOption = () =>
    onOptionsChange([...options, { value: `opt${options.length + 1}`, label: "" }]);

  const removeOption = (i: number) =>
    onOptionsChange(options.filter((_, idx) => idx !== i));

  const toggleCorrect = (value: string) => {
    if (answerType === "single_choice") {
      onAnswerChange({ choice: value });
    } else {
      const set = new Set(selected);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      onAnswerChange({ selected: [...set] });
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 text-sm font-medium text-gray-700">
        Options (tick the correct {answerType === "single_choice" ? "one" : "ones"})
      </div>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type={answerType === "single_choice" ? "radio" : "checkbox"}
              name={groupName}
              aria-label={`Correct: ${o.value}`}
              checked={selected.includes(o.value)}
              onChange={() => toggleCorrect(o.value)}
            />
            <input
              type="text"
              aria-label={`Option value ${i + 1}`}
              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
              value={o.value}
              onChange={(e) => updateOption(i, { value: e.target.value })}
            />
            <input
              type="text"
              aria-label={`Option label ${i + 1}`}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="Label"
              value={o.label}
              onChange={(e) => updateOption(i, { label: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/AnswerValueEditor.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AnswerValueEditor.tsx components/admin/__tests__/AnswerValueEditor.test.tsx
git commit -m "feat: add typed AnswerValueEditor for all answer types"
```

---

## Task 6: PartEditor

**Files:**
- Create: `components/admin/PartEditor.tsx`

- [ ] **Step 1: Create PartEditor**

Create `components/admin/PartEditor.tsx`:
```tsx
"use client";

import type { QuestionPart } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { LatexField } from "./LatexField";
import { AnswerValueEditor } from "./AnswerValueEditor";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

export function PartEditor({ part }: { part: QuestionPart }) {
  const { editPart, removePart } = useAdminStore();

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-gray-900">Part {part.label || "?"}</span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this part?")) removePart(part.id);
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Delete part
        </button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Label (e.g. a, b.i)</span>
          <input
            type="text"
            className={inputClass}
            value={part.label}
            onChange={(e) => editPart(part.id, { label: e.target.value })}
          />
        </label>

        <LatexField
          label="Prompt"
          value={part.promptLatex}
          onChange={(v) => editPart(part.id, { promptLatex: v })}
        />

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Image URL (optional, served from /public)
          </span>
          <input
            type="text"
            className={inputClass}
            placeholder="/questions/diagram.png"
            value={part.imageUrl ?? ""}
            onChange={(e) =>
              editPart(part.id, { imageUrl: e.target.value || undefined })
            }
          />
        </label>

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
git add components/admin/PartEditor.tsx
git commit -m "feat: add PartEditor with fields, image, and answer editor"
```

---

## Task 7: PartsEditor

**Files:**
- Create: `components/admin/PartsEditor.tsx`

- [ ] **Step 1: Create PartsEditor**

Create `components/admin/PartsEditor.tsx`:
```tsx
"use client";

import type { Question } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { SortableList } from "./SortableList";
import { PartEditor } from "./PartEditor";

export function PartsEditor({ question }: { question: Question }) {
  const { addPart, moveParts } = useAdminStore();
  const parts = [...question.parts].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Parts</span>
        <button
          type="button"
          onClick={() =>
            addPart(question.id, {
              label: "",
              promptLatex: "",
              answerType: "integer",
              answerValue: 0,
            })
          }
          className="text-sm text-blue-600 hover:underline"
        >
          + Add part
        </button>
      </div>
      {parts.length === 0 ? (
        <p className="text-sm text-gray-500">No parts yet.</p>
      ) : (
        <SortableList
          items={parts.map((p) => p.id)}
          onReorder={(ids) => moveParts(question.id, ids)}
          renderItem={(id) => {
            const part = parts.find((p) => p.id === id);
            return part ? <PartEditor part={part} /> : null;
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
git add components/admin/PartsEditor.tsx
git commit -m "feat: add PartsEditor list with add and reorder"
```

---

## Task 8: QuestionEditor

**Files:**
- Create: `components/admin/QuestionEditor.tsx`

- [ ] **Step 1: Create QuestionEditor**

An expandable editor: header with question number + expand toggle + delete; when open, the stem/note LaTeX fields and the PartsEditor.

Create `components/admin/QuestionEditor.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Question } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { LatexField } from "./LatexField";
import { PartsEditor } from "./PartsEditor";

export function QuestionEditor({ question }: { question: Question }) {
  const { editQuestion, removeQuestion } = useAdminStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-left font-medium text-gray-900"
        >
          {open ? "▾" : "▸"} Question {question.number}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({question.parts.length} part{question.parts.length === 1 ? "" : "s"})
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete question ${question.number}?`)) {
              removeQuestion(question.id);
            }
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <LatexField
            label="Stem"
            value={question.promptLatex}
            onChange={(v) => editQuestion(question.id, { promptLatex: v })}
          />
          <LatexField
            label="Note (optional)"
            rows={2}
            value={question.noteLatex ?? ""}
            onChange={(v) => editQuestion(question.id, { noteLatex: v || undefined })}
          />
          <PartsEditor question={question} />
        </div>
      ) : null}
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
git add components/admin/QuestionEditor.tsx
git commit -m "feat: add expandable QuestionEditor with stem, note and parts"
```

---

## Task 9: QuestionsEditor + mount in the test page

**Files:**
- Create: `components/admin/QuestionsEditor.tsx`
- Modify: `app/admin/tests/[id]/page.tsx`

- [ ] **Step 1: Create QuestionsEditor**

Create `components/admin/QuestionsEditor.tsx`:
```tsx
"use client";

import { useAdminStore } from "./AdminStoreProvider";
import { SortableList } from "./SortableList";
import { QuestionEditor } from "./QuestionEditor";

export function QuestionsEditor({ testId }: { testId: string }) {
  const { content, addQuestion, moveQuestions } = useAdminStore();
  const questions = content.questions
    .filter((q) => q.labTestId === testId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
        <button
          type="button"
          onClick={() => addQuestion(testId, { promptLatex: "" })}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          + Add question
        </button>
      </div>
      {questions.length === 0 ? (
        <p className="text-sm text-gray-500">No questions yet.</p>
      ) : (
        <SortableList
          items={questions.map((q) => q.id)}
          onReorder={(ids) => moveQuestions(testId, ids)}
          renderItem={(id) => {
            const question = questions.find((q) => q.id === id);
            return question ? <QuestionEditor question={question} /> : null;
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount it in the edit page**

In `app/admin/tests/[id]/page.tsx`, replace the placeholder paragraph:
```tsx
      <p className="mt-8 text-sm text-gray-500">
        Question authoring is coming next.
      </p>
```
with:
```tsx
      <QuestionsEditor testId={id} />
```
and add the import at the top:
```tsx
import { QuestionsEditor } from "@/components/admin/QuestionsEditor";
```

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Manually verify**

`npm run dev`, open http://localhost:3000/admin/tests/test-1081-lt1:
- See a **Questions** section listing Questions 1, 2, 3, 4, 8.
- **+ Add question** appends a new question; expand it (▸), type a stem (preview updates), **+ Add part**, set label + prompt, choose an **Answer type**, enter the correct answer (for a choice type, add options and tick the correct one).
- Drag questions and parts to reorder via the ⠿ handle.
- Delete a part / question (confirm dialog).
- Reload → everything persists (localStorage).
Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add components/admin/QuestionsEditor.tsx app/admin/tests/[id]/page.tsx
git commit -m "feat: mount question/part authoring in the test editor"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full gates**

Run:
```bash
npm test && npm run lint && npx tsc --noEmit && npm run build
```
Expected: all tests pass; lint clean; no type errors; build succeeds.

- [ ] **Step 2: End-to-end manual pass**

`npm run dev`: from `/admin`, open a test, add a question with two parts (one numeric, one multi-select with options), reorder them, reload to confirm persistence, then delete them. Stop the dev server.

---

## Definition of Done (Plan 4b)

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass.
- [ ] In the test editor, questions and parts can be added, edited, deleted, and reordered, and persist across reloads.
- [ ] Each part's final answer is authored via the typed `AnswerValueEditor` across all six answer types, including options management for choice types.
- [ ] Math fields show a live preview via `LatexField`.
- [ ] All mutations flow through the pure reducers (unit-tested) and the provider.

---

## Roadmap: Plan 4c

- **Plan 4c — Steps, hints & live preview:** step + hint CRUD reducers and UI under each part (sub-goal prompt, expected intermediate answer via the same `AnswerValueEditor`, explanation, ordered hints); reorder at those levels; a read-only student-style live preview of a whole question (reusing the player render). Also: fixture expansion to the full Lab Test 1, and `ChoiceOption.label` escaping before `\text{}` (from earlier reviews).
```
