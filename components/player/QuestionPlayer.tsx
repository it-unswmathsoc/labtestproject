"use client";

import type { Question } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { PartPlayer } from "./PartPlayer";
import { useQuestionProgress } from "./useQuestionProgress";

export function QuestionPlayer({ question }: { question: Question }) {
  const { progress, markStep, markPart } = useQuestionProgress(question.id);

  return (
    <div>
      <div className="mb-2 text-gray-800">
        <RichText>{question.promptLatex}</RichText>
      </div>
      {question.noteLatex ? (
        <div className="mb-4 text-sm italic text-gray-500">
          <RichText>{question.noteLatex}</RichText>
        </div>
      ) : null}
      {question.parts.map((part) => (
        <PartPlayer
          key={part.id}
          part={part}
          solvedSteps={progress.steps}
          solvedPart={progress.parts.includes(part.id)}
          onStepSolved={markStep}
          onPartSolved={() => markPart(part.id)}
        />
      ))}
    </div>
  );
}
