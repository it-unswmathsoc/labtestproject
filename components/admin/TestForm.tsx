"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/data/types";
import { ANSWER_SYNTAXES, SYNTAX_LABELS } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";
import { LatexField } from "./LatexField";

export interface TestFormValues {
  courseId: string;
  name: string;
  term: string;
  description: string;
  isPublished: boolean;
  answerSyntax: AnswerSyntax;
}

export function TestForm({
  courses,
  onSubmit,
  submitLabel,
  initial,
}: {
  courses: Course[];
  /**
   * Return the store's write promise to get a "Saving…"/"Saved" indicator.
   * Returning nothing leaves the button silent, for callers that navigate away.
   */
  onSubmit: (values: TestFormValues) => void | Promise<boolean>;
  submitLabel: string;
  initial?: Partial<TestFormValues>;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [values, setValues] = useState<TestFormValues>({
    courseId: initial?.courseId ?? courses[0]?.id ?? "",
    name: initial?.name ?? "",
    term: initial?.term ?? "",
    description: initial?.description ?? "",
    isPublished: initial?.isPublished ?? false,
    answerSyntax: initial?.answerSyntax ?? "numbas",
  });

  const set = <K extends keyof TestFormValues>(key: K, value: TestFormValues[K]) => {
    // A stale "Saved" next to an edited field would describe the wrong state.
    setStatus("idle");
    setValues((v) => ({ ...v, [key]: value }));
  };

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  // Derived, not stored: courses arrive after the first render, so a courseId
  // captured in the initial state would stay "" and be rejected as a uuid.
  const courseId = values.courseId || courses[0]?.id || "";

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const pending = onSubmit({ ...values, courseId });
        if (!pending) return;
        setStatus("saving");
        // A failed write is reported by the store's own error banner, so this
        // just drops back to idle rather than claiming anything.
        void pending.then((ok) => setStatus(ok ? "saved" : "idle"));
      }}
    >
      <label className="block text-sm font-medium text-gray-700">
        Course
        <select
          className={inputClass}
          value={courseId}
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
        placeholder={"Vectors in $\\mathbb{R}^n$"}
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
        placeholder={"Covers $\\vec{u} \\cdot \\vec{v}$ and projections."}
      />

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

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
        />
        Published
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : submitLabel}
        </button>
        {status === "saved" ? (
          <span role="status" className="text-sm text-green-700">
            ✓ Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
