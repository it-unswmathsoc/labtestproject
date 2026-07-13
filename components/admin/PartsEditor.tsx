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
