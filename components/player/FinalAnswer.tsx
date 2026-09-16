"use client";

import { useState } from "react";
import { grade } from "@/lib/grading";
import type { QuestionPart } from "@/lib/data/types";
import { AnswerLatex } from "@/components/math/AnswerLatex";
import { AnswerInput } from "./AnswerInput";
import { emptyInput, type InputValue } from "./input-value";

type Status = "idle" | "correct" | "incorrect";

export function FinalAnswer({
  part,
  solved,
  onSolved,
}: {
  part: QuestionPart;
  solved: boolean;
  onSolved: () => void;
}) {
  const [value, setValue] = useState<InputValue>(emptyInput(part.answerType));
  const [status, setStatus] = useState<Status>("idle");
  const [revealed, setRevealed] = useState(false);

  const solvedNow = solved || status === "correct";

  const check = () => {
    if (solvedNow) return;
    const result = grade(part.answerType, value, part.answerValue, part.answerConfig ?? {});
    if (result.correct) {
      setStatus("correct");
      onSolved();
    } else {
      setStatus("incorrect");
    }
  };

  return (
    <div className="mt-4 rounded-lg bg-gray-50 p-4">
      <div className="mb-2 text-sm font-medium text-gray-700">Final answer</div>
      <AnswerInput
        answerType={part.answerType}
        config={part.answerConfig}
        name={`final-${part.id}`}
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
        {solvedNow ? <span className="text-sm text-green-600">Solved! 🎉</span> : null}
        {status === "incorrect" ? (
          <span className="text-sm text-amber-600">Not quite — try again.</span>
        ) : null}
      </div>
      {revealed ? (
        <div className="mt-2 text-sm text-gray-600">
          Answer:{" "}
          <AnswerLatex
            value={part.answerValue}
            type={part.answerType}
            config={part.answerConfig}
          />
        </div>
      ) : null}
    </div>
  );
}
