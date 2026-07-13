# Admin Foundation & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the admin area — a browser-only content store (seeded from the current sample data, persisted to localStorage) and an `/admin` dashboard where MathSoc can create, edit, publish, delete, and reorder **lab tests**. No auth (deferred). No backend: edits live in localStorage and do not change the public student pages yet.

**Architecture:** Pure reducer functions in `lib/admin/content-store.ts` transform an immutable `Content` object (`{ courses, labTests, questions }`); they are unit-tested in isolation. A client `AdminStoreProvider` holds `Content` in React state, hydrates from localStorage after mount (SSR-safe), and exposes bound mutations that persist on change. Admin pages under `app/admin/*` are client components consuming `useAdminStore()`. Reordering uses dnd-kit.

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind, dnd-kit, Vitest + React Testing Library. Reuses `lib/data/types` and `lib/data/fixtures`.

**Part of a series:** Plan 4a of the admin series (4b = question/part authoring, 4c = steps/hints + live preview). Plans 1–3 are complete.

**Reference spec:** `docs/superpowers/specs/2026-07-13-mathsoc-labtest-practice-frontend-design.md` (Admin Authoring). **Decision:** standalone authoring + preview, localStorage-backed, no login, full tree across 4a–4c.

---

## File Structure

- `lib/admin/types.ts` — `Content` shape.
- `lib/admin/content-store.ts` — `seedContent`, `newId`, and pure test CRUD (`createTest`, `updateTest`, `deleteTest`, `reorderTests`). Tested.
- `components/admin/AdminStoreProvider.tsx` — context + `useAdminStore()` hook (localStorage-backed).
- `app/admin/layout.tsx` — wraps admin pages in the provider + an admin header.
- `app/admin/page.tsx` — dashboard: courses → their lab tests, publish badges, new/edit/delete, drag-to-reorder.
- `app/admin/tests/new/page.tsx` — create-lab-test form.
- `app/admin/tests/[id]/page.tsx` — edit lab-test metadata (questions authoring is 4b; a read-only question count is shown for now).
- `components/admin/TestForm.tsx` — shared create/edit metadata form.
- `components/admin/SortableList.tsx` — small dnd-kit wrapper for vertical reordering.

Boundaries: all content mutations flow through `content-store.ts` (pure) + the provider (persistence); pages compose. The store is the single source of truth for admin content.

---

## Task 1: Content types + seed

**Files:**
- Create: `lib/admin/types.ts`
- Create: `lib/admin/content-store.ts` (seed + newId only in this task)
- Test: `lib/admin/__tests__/content-store.seed.test.ts`

- [ ] **Step 1: Create the Content type**

Create `lib/admin/types.ts`:
```ts
import type { Course, LabTest, Question } from "@/lib/data/types";

export interface Content {
  courses: Course[];
  labTests: LabTest[];
  questions: Question[];
}
```

- [ ] **Step 2: Write the failing test**

Create `lib/admin/__tests__/content-store.seed.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { seedContent, newId } from "../content-store";

describe("seedContent", () => {
  it("returns a deep copy of the fixture content", () => {
    const a = seedContent();
    const b = seedContent();
    expect(a.courses.length).toBeGreaterThan(0);
    expect(a.labTests.length).toBeGreaterThan(0);
    // Mutating one copy must not affect another.
    a.labTests[0].name = "CHANGED";
    expect(b.labTests[0].name).not.toBe("CHANGED");
  });
});

describe("newId", () => {
  it("produces unique prefixed ids", () => {
    const x = newId("test");
    const y = newId("test");
    expect(x.startsWith("test-")).toBe(true);
    expect(x).not.toBe(y);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.seed.test.ts
```
Expected: FAIL — cannot find module `../content-store`.

- [ ] **Step 4: Implement seed + newId**

Create `lib/admin/content-store.ts`:
```ts
import type { Content } from "./types";
import { courses, labTests, questions } from "@/lib/data/fixtures";

export function seedContent(): Content {
  return structuredClone({ courses, labTests, questions });
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${prefix}-${rand}`;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.seed.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/admin/types.ts lib/admin/content-store.ts lib/admin/__tests__/content-store.seed.test.ts
git commit -m "feat: add admin content types, seed, and id generator"
```

---

## Task 2: Lab-test CRUD reducers

**Files:**
- Modify: `lib/admin/content-store.ts`
- Test: `lib/admin/__tests__/content-store.tests.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/admin/__tests__/content-store.tests.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  createTest,
  updateTest,
  deleteTest,
  reorderTests,
} from "../content-store";
import type { Content } from "../types";

function baseContent(): Content {
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [
      { id: "t1", courseId: "c1", name: "Lab Test 1", isPublished: true, sortOrder: 1 },
      { id: "t2", courseId: "c1", name: "Lab Test 2", isPublished: false, sortOrder: 2 },
    ],
    questions: [
      {
        id: "q1",
        labTestId: "t1",
        number: 1,
        promptLatex: "Stem",
        sortOrder: 1,
        parts: [],
      },
    ],
  };
}

describe("createTest", () => {
  it("appends a test with the next sortOrder and returns its id", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 3",
      isPublished: false,
    });
    const created = content.labTests.find((t) => t.id === id);
    expect(created?.name).toBe("Lab Test 3");
    expect(created?.sortOrder).toBe(3);
  });

  it("starts sortOrder at 1 for a course with no tests", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c2",
      name: "First",
      isPublished: false,
    });
    expect(content.labTests.find((t) => t.id === id)?.sortOrder).toBe(1);
  });
});

describe("updateTest", () => {
  it("patches only the named test", () => {
    const next = updateTest(baseContent(), "t1", { name: "Renamed", isPublished: false });
    expect(next.labTests.find((t) => t.id === "t1")?.name).toBe("Renamed");
    expect(next.labTests.find((t) => t.id === "t1")?.isPublished).toBe(false);
    expect(next.labTests.find((t) => t.id === "t2")?.name).toBe("Lab Test 2");
  });
});

describe("deleteTest", () => {
  it("removes the test and its questions", () => {
    const next = deleteTest(baseContent(), "t1");
    expect(next.labTests.some((t) => t.id === "t1")).toBe(false);
    expect(next.questions.some((q) => q.labTestId === "t1")).toBe(false);
  });
});

describe("reorderTests", () => {
  it("rewrites sortOrder to match the given order within a course", () => {
    const next = reorderTests(baseContent(), "c1", ["t2", "t1"]);
    expect(next.labTests.find((t) => t.id === "t2")?.sortOrder).toBe(1);
    expect(next.labTests.find((t) => t.id === "t1")?.sortOrder).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.tests.test.ts
```
Expected: FAIL — `createTest` is not exported.

- [ ] **Step 3: Implement the reducers**

Append to `lib/admin/content-store.ts`:
```ts
import type { LabTest } from "@/lib/data/types";

export function createTest(
  content: Content,
  input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
  }
): { content: Content; id: string } {
  const id = newId("test");
  const siblings = content.labTests.filter((t) => t.courseId === input.courseId);
  const sortOrder = siblings.length
    ? Math.max(...siblings.map((t) => t.sortOrder)) + 1
    : 1;
  const test: LabTest = { id, sortOrder, ...input };
  return { content: { ...content, labTests: [...content.labTests, test] }, id };
}

export function updateTest(
  content: Content,
  id: string,
  patch: Partial<Omit<LabTest, "id">>
): Content {
  return {
    ...content,
    labTests: content.labTests.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
}

export function deleteTest(content: Content, id: string): Content {
  return {
    ...content,
    labTests: content.labTests.filter((t) => t.id !== id),
    questions: content.questions.filter((q) => q.labTestId !== id),
  };
}

export function reorderTests(
  content: Content,
  courseId: string,
  orderedIds: string[]
): Content {
  const order = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return {
    ...content,
    labTests: content.labTests.map((t) =>
      t.courseId === courseId && order.has(t.id)
        ? { ...t, sortOrder: order.get(t.id) as number }
        : t
    ),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run lib/admin/__tests__/content-store.tests.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/content-store.ts lib/admin/__tests__/content-store.tests.test.ts
git commit -m "feat: add lab-test CRUD reducers to the admin store"
```

---

## Task 3: AdminStoreProvider

**Files:**
- Create: `components/admin/AdminStoreProvider.tsx`
- Test: `components/admin/__tests__/AdminStoreProvider.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/AdminStoreProvider.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStoreProvider, useAdminStore } from "../AdminStoreProvider";

function Harness() {
  const { content, addTest } = useAdminStore();
  const count = content.labTests.length;
  return (
    <div>
      <span>count:{count}</span>
      <button
        type="button"
        onClick={() =>
          addTest({ courseId: content.courses[0].id, name: "New", isPublished: false })
        }
      >
        add
      </button>
    </div>
  );
}

describe("AdminStoreProvider", () => {
  it("exposes seeded content and persists an added test", async () => {
    render(
      <AdminStoreProvider>
        <Harness />
      </AdminStoreProvider>
    );
    const before = Number(
      screen.getByText(/count:/).textContent?.replace("count:", "")
    );
    await userEvent.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByText(`count:${before + 1}`)).toBeInTheDocument();
    expect(window.localStorage.getItem("labtest:admin:content")).toContain('"New"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/AdminStoreProvider.test.tsx
```
Expected: FAIL — cannot find module `../AdminStoreProvider`.

- [ ] **Step 3: Implement the provider**

Create `components/admin/AdminStoreProvider.tsx`:
```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Content } from "@/lib/admin/types";
import {
  seedContent,
  createTest,
  updateTest,
  deleteTest,
  reorderTests,
} from "@/lib/admin/content-store";
import type { LabTest } from "@/lib/data/types";

const STORAGE_KEY = "labtest:admin:content";

interface AdminStore {
  content: Content;
  addTest: (input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
  }) => string;
  editTest: (id: string, patch: Partial<Omit<LabTest, "id">>) => void;
  removeTest: (id: string) => void;
  moveTests: (courseId: string, orderedIds: string[]) => void;
}

const AdminStoreContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>(seedContent);
  const contentRef = useRef<Content>(content);

  // Hydrate from localStorage after mount (kept out of render so SSR and the
  // client's first paint agree).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Content;
        contentRef.current = parsed;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration
        setContent(parsed);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const commit = useCallback((next: Content) => {
    contentRef.current = next;
    setContent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const addTest = useCallback<AdminStore["addTest"]>(
    (input) => {
      const { content: next, id } = createTest(contentRef.current, input);
      commit(next);
      return id;
    },
    [commit]
  );

  const editTest = useCallback<AdminStore["editTest"]>(
    (id, patch) => commit(updateTest(contentRef.current, id, patch)),
    [commit]
  );

  const removeTest = useCallback<AdminStore["removeTest"]>(
    (id) => commit(deleteTest(contentRef.current, id)),
    [commit]
  );

  const moveTests = useCallback<AdminStore["moveTests"]>(
    (courseId, orderedIds) =>
      commit(reorderTests(contentRef.current, courseId, orderedIds)),
    [commit]
  );

  return (
    <AdminStoreContext.Provider
      value={{ content, addTest, editTest, removeTest, moveTests }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore(): AdminStore {
  const store = useContext(AdminStoreContext);
  if (!store) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return store;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/AdminStoreProvider.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminStoreProvider.tsx components/admin/__tests__/AdminStoreProvider.test.tsx
git commit -m "feat: add localStorage-backed AdminStoreProvider"
```

---

## Task 4: Admin layout

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: Create the admin layout**

Create `app/admin/layout.tsx`:
```tsx
import Link from "next/link";
import { AdminStoreProvider } from "@/components/admin/AdminStoreProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminStoreProvider>
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
        <Link href="/admin" className="font-semibold text-gray-900">
          Admin · Lab Tests
        </Link>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          View site →
        </Link>
      </div>
      {children}
    </AdminStoreProvider>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds (routes under `/admin` will 404 until pages exist, that's fine — the layout compiles).

- [ ] **Step 3: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add admin layout with store provider"
```

---

## Task 5: Shared TestForm

**Files:**
- Create: `components/admin/TestForm.tsx`
- Test: `components/admin/__tests__/TestForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/admin/__tests__/TestForm.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestForm } from "../TestForm";

const courses = [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }];

describe("TestForm", () => {
  it("submits the entered values", async () => {
    const onSubmit = vi.fn();
    render(<TestForm courses={courses} onSubmit={onSubmit} submitLabel="Create" />);

    await userEvent.type(screen.getByLabelText(/name/i), "Lab Test 9");
    await userEvent.type(screen.getByLabelText(/term/i), "2026 T1");
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "c1",
        name: "Lab Test 9",
        term: "2026 T1",
        isPublished: false,
      })
    );
  });

  it("pre-fills from initial values", () => {
    render(
      <TestForm
        courses={courses}
        onSubmit={vi.fn()}
        submitLabel="Save"
        initial={{
          courseId: "c1",
          name: "Existing",
          term: "2025 T3",
          description: "desc",
          isPublished: true,
        }}
      />
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue("Existing");
    expect(screen.getByLabelText(/published/i)).toBeChecked();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run components/admin/__tests__/TestForm.test.tsx
```
Expected: FAIL — cannot find module `../TestForm`.

- [ ] **Step 3: Implement TestForm**

Create `components/admin/TestForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Course } from "@/lib/data/types";

export interface TestFormValues {
  courseId: string;
  name: string;
  term: string;
  description: string;
  isPublished: boolean;
}

export function TestForm({
  courses,
  onSubmit,
  submitLabel,
  initial,
}: {
  courses: Course[];
  onSubmit: (values: TestFormValues) => void;
  submitLabel: string;
  initial?: Partial<TestFormValues>;
}) {
  const [values, setValues] = useState<TestFormValues>({
    courseId: initial?.courseId ?? courses[0]?.id ?? "",
    name: initial?.name ?? "",
    term: initial?.term ?? "",
    description: initial?.description ?? "",
    isPublished: initial?.isPublished ?? false,
  });

  const set = <K extends keyof TestFormValues>(key: K, value: TestFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <label className="block text-sm font-medium text-gray-700">
        Course
        <select
          className={inputClass}
          value={values.courseId}
          onChange={(e) => set("courseId", e.target.value)}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Name
        <input
          className={inputClass}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Term
        <input
          className={inputClass}
          value={values.term}
          onChange={(e) => set("term", e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Description
        <textarea
          className={inputClass}
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
        />
        Published
      </label>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run components/admin/__tests__/TestForm.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/TestForm.tsx components/admin/__tests__/TestForm.test.tsx
git commit -m "feat: add shared TestForm for admin create/edit"
```

---

## Task 6: Create-lab-test page

**Files:**
- Create: `app/admin/tests/new/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/admin/tests/new/page.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { TestForm } from "@/components/admin/TestForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewTestPage() {
  const router = useRouter();
  const { content, addTest } = useAdminStore();

  return (
    <div>
      <PageHeader title="New lab test" />
      <TestForm
        courses={content.courses}
        submitLabel="Create"
        onSubmit={(values) => {
          const id = addTest({
            courseId: values.courseId,
            name: values.name,
            term: values.term || undefined,
            description: values.description || undefined,
            isPublished: values.isPublished,
          });
          router.push(`/admin/tests/${id}`);
        }}
      />
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

- [ ] **Step 3: Commit**

```bash
git add app/admin/tests/new/page.tsx
git commit -m "feat: add create-lab-test admin page"
```

---

## Task 7: Edit-lab-test page

**Files:**
- Create: `app/admin/tests/[id]/page.tsx`

- [ ] **Step 1: Create the page**

Questions authoring arrives in Plan 4b; for now this page edits metadata and shows the question count.

Create `app/admin/tests/[id]/page.tsx`:
```tsx
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { TestForm } from "@/components/admin/TestForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { content, editTest } = useAdminStore();
  const test = content.labTests.find((t) => t.id === id);
  if (!test) notFound();

  const questionCount = content.questions.filter(
    (q) => q.labTestId === id
  ).length;

  return (
    <div>
      <PageHeader
        title={`Edit: ${test.name}`}
        subtitle={`${questionCount} question${questionCount === 1 ? "" : "s"}`}
      />
      <TestForm
        courses={content.courses}
        submitLabel="Save"
        initial={{
          courseId: test.courseId,
          name: test.name,
          term: test.term ?? "",
          description: test.description ?? "",
          isPublished: test.isPublished,
        }}
        onSubmit={(values) =>
          editTest(id, {
            courseId: values.courseId,
            name: values.name,
            term: values.term || undefined,
            description: values.description || undefined,
            isPublished: values.isPublished,
          })
        }
      />
      <p className="mt-8 text-sm text-gray-500">
        Question authoring is coming next.
      </p>
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

- [ ] **Step 3: Commit**

```bash
git add app/admin/tests/[id]/page.tsx
git commit -m "feat: add edit-lab-test admin page"
```

---

## Task 8: SortableList (dnd-kit wrapper)

**Files:**
- Modify: `package.json` (dnd-kit deps)
- Create: `components/admin/SortableList.tsx`

- [ ] **Step 1: Install dnd-kit**

Run:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Create the SortableList wrapper**

A minimal vertical drag-to-reorder list. `items` are ids; `renderItem` renders each; `onReorder` gets the new id order.

Create `components/admin/SortableList.tsx`:
```tsx
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab px-1 text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function SortableList({
  items,
  onReorder,
  renderItem,
}: {
  items: string[];
  onReorder: (orderedIds: string[]) => void;
  renderItem: (id: string) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((id) => (
            <SortableRow key={id} id={id}>
              {renderItem(id)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 3: Verify build and types**

Run:
```bash
npx tsc --noEmit && npm run build
```
Expected: no type errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json components/admin/SortableList.tsx
git commit -m "feat: add dnd-kit SortableList wrapper"
```

---

## Task 9: Admin dashboard

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create the dashboard**

Lists each course with its lab tests (drag-to-reorder), publish badges, edit link, delete button, and a "New lab test" action.

Create `app/admin/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { SortableList } from "@/components/admin/SortableList";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AdminDashboard() {
  const { content, removeTest, moveTests } = useAdminStore();

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Lab tests" />
        <Link
          href="/admin/tests/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + New lab test
        </Link>
      </div>

      <div className="space-y-8">
        {content.courses.map((course) => {
          const tests = content.labTests
            .filter((t) => t.courseId === course.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <section key={course.id}>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                {course.code} — {course.name}
              </h2>
              {tests.length === 0 ? (
                <p className="text-sm text-gray-500">No lab tests yet.</p>
              ) : (
                <SortableList
                  items={tests.map((t) => t.id)}
                  onReorder={(ids) => moveTests(course.id, ids)}
                  renderItem={(id) => {
                    const test = tests.find((t) => t.id === id);
                    if (!test) return null;
                    return (
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            {test.name}
                          </span>
                          {test.term ? (
                            <span className="ml-2 text-sm text-gray-500">
                              {test.term}
                            </span>
                          ) : null}
                          <span
                            className={`ml-2 rounded px-2 py-0.5 text-xs ${
                              test.isPublished
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {test.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Link
                            href={`/admin/tests/${test.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete "${test.name}" and its questions?`
                                )
                              ) {
                                removeTest(test.id);
                              }
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds; `/admin` route present.

- [ ] **Step 3: Manually verify**

`npm run dev`, open http://localhost:3000/admin:
- See MATH1081 with "Lab Test 1" (Published) and "Lab Test 2" (Draft); MATH1141 with "No lab tests yet."
- Click **+ New lab test** → fill the form → **Create** → lands on the edit page → change a field → **Save**.
- Back on `/admin`, drag a test by the ⠿ handle to reorder; reload → order persists (localStorage).
- **Delete** a test (confirm dialog) → it disappears; reload → still gone.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin dashboard with reorder and delete"
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

`npm run dev`: create a test, edit it, publish toggle, reorder, delete, reload between each to confirm localStorage persistence. Stop the dev server.

---

## Definition of Done (Plan 4a)

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass.
- [ ] `/admin` lists courses and their lab tests with publish badges.
- [ ] Create, edit (incl. publish toggle), delete, and drag-reorder lab tests all work and persist across reloads via localStorage.
- [ ] All content mutations go through the pure `content-store.ts` reducers (unit-tested) and the provider.
- [ ] No auth; no change to the public student pages.

---

## Roadmap: Plans 4b–4c

- **Plan 4b — Question & part authoring:** nested question/part CRUD reducers + UI inside the test editor; the typed answer editor (all six answer types + config) with `renderMobiusAnswer` preview; per-part `imageUrl`; LaTeX textarea fields with live `<RichText>` preview.
- **Plan 4c — Steps, hints & live preview:** step + hint CRUD and reordering; a read-only student-style live preview of a question (reusing the player render); reorder handles at every tree level.
```
