"use client";

import { useState } from "react";
import type { Course } from "@/lib/data/types";

export interface CourseFormValues {
  code: string;
  name: string;
  description: string;
}

export function CourseForm({
  existing,
  editingId,
  onSubmit,
  onCancel,
  submitLabel,
  initial,
}: {
  /** Every course currently known, used to reject a duplicate code. */
  existing: Course[];
  /** The course being edited, so its own code does not collide with itself. */
  editingId?: string;
  onSubmit: (values: CourseFormValues) => void;
  onCancel: () => void;
  submitLabel: string;
  initial?: Partial<CourseFormValues>;
}) {
  const [values, setValues] = useState<CourseFormValues>({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });
  const [error, setError] = useState("");

  const set = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

  // Course code and name are plain text: the public pages render them as-is
  // rather than through RichText, so there is no LatexField here.
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const code = values.code.trim();
        const name = values.name.trim();
        // Mirrors the courses_code_key unique index, which is on lower(code).
        const clash = existing.some(
          (c) => c.id !== editingId && c.code.toLowerCase() === code.toLowerCase()
        );
        if (clash) {
          setError(`A course with the code "${code}" already exists.`);
          return;
        }
        setError("");
        onSubmit({ code, name, description: values.description.trim() });
      }}
    >
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-medium text-gray-700">
        Code
        <input
          className={inputClass}
          required
          value={values.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="MATH1081"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Name
        <input
          className={inputClass}
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Discrete Mathematics"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Description
        <textarea
          className={inputClass}
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Logic, sets, relations, graphs and counting."
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
