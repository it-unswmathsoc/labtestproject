"use client";

import type { QuestionPart } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { StepCard } from "./StepCard";
import { FinalAnswer } from "./FinalAnswer";

export function PartPlayer({
  part,
  solvedSteps,
  solvedPart,
  onStepSolved,
  onPartSolved,
}: {
  part: QuestionPart;
  solvedSteps: string[];
  solvedPart: boolean;
  onStepSolved: (stepId: string) => void;
  onPartSolved: () => void;
}) {
  return (
    <section className="mt-6 border-l-2 border-gray-100 pl-4">
      <div className="mb-3 text-gray-800">
        <span className="font-medium">{part.label}) </span>
        <RichText>{part.promptLatex}</RichText>
      </div>
      {part.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- static diagram, no layout benefit from next/image
        <img
          src={part.imageUrl}
          alt={part.imageAlt ?? ""}
          className="mb-3 max-w-xs rounded-md border border-gray-200"
        />
      ) : null}
      {part.steps.length > 0 ? (
        <div className="space-y-3">
          {part.steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              solved={solvedSteps.includes(step.id)}
              onSolved={() => onStepSolved(step.id)}
            />
          ))}
        </div>
      ) : null}
      <FinalAnswer part={part} solved={solvedPart} onSolved={onPartSolved} />
    </section>
  );
}
