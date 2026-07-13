"use client";

import type { QuestionPart } from "@/lib/data/types";
import { useAdminStore } from "./AdminStoreProvider";
import { LatexField } from "./LatexField";
import { AnswerValueEditor } from "./AnswerValueEditor";
import { StepsEditor } from "./StepsEditor";

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
      </div>
    </div>
  );
}
