"use client";

import { useState } from "react";
import type { Course } from "@/lib/data/types";
import { LatexField } from "./LatexField";

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

      <LatexField
        label="Name"
        rows={2}
        required
        value={values.name}
        onChange={(v) => set("name", v)}
        placeholder="Vectors in $\\mathbb{R}^n$"
      />

      <LatexField
        label="Term"
        rows={2}
        value={values.term}
        onChange={(v) => set("term", v)}
        placeholder="2026 T1"
      />

      <LatexField
        label="Description"
        value={values.description}
        onChange={(v) => set("description", v)}
        placeholder="Covers $\\vec{u} \\cdot \\vec{v}$ and projections."
      />

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
