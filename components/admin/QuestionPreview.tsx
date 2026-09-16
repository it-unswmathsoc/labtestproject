"use client";

import type { Question } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { AnswerLatex } from "@/components/math/AnswerLatex";

export function QuestionPreview({ question }: { question: Question }) {
  const parts = [...question.parts].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
      <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Preview</div>
      <div className="text-gray-800">
        <RichText>{question.promptLatex}</RichText>
      </div>
      {question.noteLatex ? (
        <div className="mt-1 text-sm italic text-gray-500">
          <RichText>{question.noteLatex}</RichText>
        </div>
      ) : null}

      {parts.map((part) => {
        const steps = [...part.steps].sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <div key={part.id} className="mt-4 border-l-2 border-gray-100 pl-3">
            <div className="text-gray-800">
              <span className="font-medium">{part.label}) </span>
              <RichText>{part.promptLatex}</RichText>
            </div>
            {part.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of a static diagram
              <img
                src={part.imageUrl}
                alt={part.imageAlt ?? ""}
                className="my-2 max-w-xs rounded border border-gray-200"
              />
            ) : null}
            {steps.map((step) => {
              const hints = [...step.hints].sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <div key={step.id} className="mt-2 rounded bg-gray-50 p-2 text-sm">
                  <div className="text-gray-600">
                    <span className="font-medium">Step {step.number}: </span>
                    <RichText>{step.promptLatex}</RichText>
                  </div>
                  <div className="text-gray-500">
                    Answer:{" "}
                    <AnswerLatex
                      value={step.answerValue}
                      type={step.answerType}
                      config={step.answerConfig}
                    />
                  </div>
                  {step.explanationLatex ? (
                    <div className="mt-1 text-gray-600">
                      <RichText>{step.explanationLatex}</RichText>
                    </div>
                  ) : null}
                  {hints.map((h) => (
                    <div key={h.id} className="mt-1 text-amber-800">
                      Hint {h.number}: <RichText>{h.bodyLatex}</RichText>
                    </div>
                  ))}
                </div>
              );
            })}
            <div className="mt-2 text-sm text-gray-500">
              Final answer:{" "}
              <AnswerLatex
                value={part.answerValue}
                type={part.answerType}
                config={part.answerConfig}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
