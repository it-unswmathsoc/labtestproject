"use client";

import { useState } from "react";
import Link from "next/link";
import type { LabTest, Question } from "@/lib/data/types";
import { QuestionPlayer } from "./QuestionPlayer";

export function PracticeRunner({
  test,
  questions,
  courseCode,
}: {
  test: LabTest;
  questions: Question[];
  courseCode: string;
}) {
  const [index, setIndex] = useState(0);

  if (questions.length === 0) {
    return <p className="text-gray-500">This test has no questions yet.</p>;
  }

  if (index >= questions.length) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-4xl">🎉</div>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          You&apos;ve reached the end of {test.name}
        </h1>
        <p className="mt-1 text-gray-500">Nice work — practice makes perfect.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Restart
          </button>
          {courseCode ? (
            <Link
              href={`/courses/${courseCode}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-500"
            >
              Back to {courseCode}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const question = questions[index];
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{test.name}</h1>
        <span className="shrink-0 text-sm text-gray-500">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <QuestionPlayer key={question.id} question={question} />

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => i + 1)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {isLast ? "Finish →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
