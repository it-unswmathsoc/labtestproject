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
