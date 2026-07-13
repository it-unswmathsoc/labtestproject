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
