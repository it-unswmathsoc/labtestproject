"use client";

import { useState } from "react";
import type { QuestionPart } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore, useAnswerSyntax } from "./AdminStoreProvider";
import { LatexField } from "./LatexField";
import { AnswerValueEditor } from "./AnswerValueEditor";
import { StepsEditor } from "./StepsEditor";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

const BUCKET = "question-images";

export function PartEditor({ part }: { part: QuestionPart }) {
  const { editPart, removePart } = useAdminStore();
  const answerSyntax = useAnswerSyntax(part.questionId);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function uploadImage(file: File) {
    setIsUploading(true);
    setUploadError("");

    const supabase = createClient();
    const path = `${part.id}/${file.name}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (error) {
      setUploadError(error.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    editPart(part.id, { imageUrl: data.publicUrl });
    setIsUploading(false);
  }

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
            Image URL (optional)
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

        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              …or upload a diagram
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              disabled={isUploading}
              className="mt-1 block w-full text-sm text-gray-600"
              // Clear the selection so re-picking the same file still fires
              // change — otherwise retrying after a failed upload does nothing.
              onClick={(e) => (e.currentTarget.value = "")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
          </label>
          {isUploading ? (
            <p className="mt-1 text-sm text-gray-500">Uploading…</p>
          ) : null}
          {uploadError ? (
            <p className="mt-1 text-sm text-red-600">{uploadError}</p>
          ) : null}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Image alt text (accessibility)
          </span>
          <input
            type="text"
            className={inputClass}
            value={part.imageAlt ?? ""}
            onChange={(e) =>
              editPart(part.id, { imageAlt: e.target.value || undefined })
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
            answerSyntax={answerSyntax}
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
