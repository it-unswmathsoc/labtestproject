"use client";

import { useState } from "react";
import { grade } from "@/lib/grading";
import type { Step } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";
import { AnswerLatex } from "@/components/math/AnswerLatex";
import { AnswerInput } from "./AnswerInput";
import { HintStack } from "./HintStack";
import { emptyInput, type InputValue } from "./input-value";

type Status = "idle" | "correct" | "incorrect";

export function StepCard({
  step,
  solved,
  onSolved,
}: {
  step: Step;
  solved: boolean;
  onSolved: () => void;
}) {
  const [value, setValue] = useState<InputValue>(emptyInput(step.answerType));
  const [status, setStatus] = useState<Status>("idle");
  const [revealed, setRevealed] = useState(false);

  const correct = solved || status === "correct";

  const check = () => {
    if (correct) return;
    const result = grade(step.answerType, value, step.answerValue, step.answerConfig ?? {});
    if (result.correct) {
      setStatus("correct");
      onSolved();
    } else {
      setStatus("incorrect");
    }
  };

  const showExplanation = correct || revealed;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Step {step.number}</span>
        {correct ? <span className="text-green-600">✓</span> : null}
      </div>
      <div className="mb-3 text-gray-800">
        <RichText>{step.promptLatex}</RichText>
      </div>
      <AnswerInput
        answerType={step.answerType}
        config={step.answerConfig}
        name={`step-${step.id}`}
        value={value}
        onChange={setValue}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Check
        </button>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-sm text-gray-500 hover:underline"
        >
          Reveal answer
        </button>
        {correct ? <span className="text-sm text-green-600">Correct!</span> : null}
        {status === "incorrect" ? (
          <span className="text-sm text-amber-600">Not quite — try again.</span>
        ) : null}
      </div>
      {step.hints.length > 0 ? <HintStack hints={step.hints} /> : null}
      {revealed ? (
        <div className="mt-2 text-sm text-gray-600">
          Answer:{" "}
          <AnswerLatex
            value={step.answerValue}
            type={step.answerType}
            config={step.answerConfig}
          />
        </div>
      ) : null}
      {showExplanation ? (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <RichText>{step.explanationLatex}</RichText>
        </div>
      ) : null}
    </div>
  );
}
