"use client";

import { useAdminStore } from "./AdminStoreProvider";
import { SortableList } from "./SortableList";
import { QuestionEditor } from "./QuestionEditor";

export function QuestionsEditor({ testId }: { testId: string }) {
  const { content, addQuestion, moveQuestions } = useAdminStore();
  const questions = content.questions
    .filter((q) => q.labTestId === testId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
        <button
          type="button"
          onClick={() => addQuestion(testId, { promptLatex: "" })}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          + Add question
        </button>
      </div>
      {questions.length === 0 ? (
        <p className="text-sm text-gray-500">No questions yet.</p>
      ) : (
        <SortableList
          items={questions.map((q) => q.id)}
          onReorder={(ids) => moveQuestions(testId, ids)}
          renderItem={(id) => {
            const question = questions.find((q) => q.id === id);
            return question ? <QuestionEditor question={question} /> : null;
          }}
        />
      )}
    </div>
  );
}
