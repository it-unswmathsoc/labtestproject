"use client";

import { useState } from "react";
import type { Question } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { LatexField } from "./LatexField";
import { PartsEditor } from "./PartsEditor";
import { QuestionPreview } from "./QuestionPreview";

export function QuestionEditor({ question }: { question: Question }) {
  const { editQuestion, removeQuestion } = useAdminStore();
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setShowPreview(false);
            setOpen((o) => !o);
          }}
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
        </div>
      ) : null}
    </div>
  );
}
