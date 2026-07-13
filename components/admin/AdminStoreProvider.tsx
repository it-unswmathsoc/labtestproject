"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Content } from "@/lib/admin/types";
import {
  seedContent,
  createTest,
  updateTest,
  deleteTest,
  reorderTests,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  createPart,
  updatePart,
  deletePart,
  reorderParts,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  createHint,
  updateHint,
  deleteHint,
  reorderHints,
} from "@/lib/admin/content-store";
import type { LabTest, Question, QuestionPart, Step, Hint } from "@/lib/data/types";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";

const STORAGE_KEY = "labtest:admin:content";

interface AdminStore {
  content: Content;
  addTest: (input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
  }) => string;
  editTest: (id: string, patch: Partial<Omit<LabTest, "id">>) => void;
  removeTest: (id: string) => void;
  moveTests: (courseId: string, orderedIds: string[]) => void;
  addQuestion: (testId: string, input: { promptLatex: string; noteLatex?: string }) => string;
  editQuestion: (id: string, patch: Partial<Omit<Question, "id" | "parts">>) => void;
  removeQuestion: (id: string) => void;
  moveQuestions: (testId: string, orderedIds: string[]) => void;
  addPart: (
    questionId: string,
    input: {
      label: string;
      promptLatex: string;
      imageUrl?: string;
      imageAlt?: string;
      answerType: AnswerType;
      answerValue: AnswerValue;
      answerConfig?: AnswerConfig;
    }
  ) => string;
  editPart: (partId: string, patch: Partial<Omit<QuestionPart, "id" | "questionId" | "steps">>) => void;
  removePart: (partId: string) => void;
  moveParts: (questionId: string, orderedIds: string[]) => void;
  addStep: (
    partId: string,
    input: {
      promptLatex: string;
      answerType: AnswerType;
      answerValue: AnswerValue;
      answerConfig?: AnswerConfig;
      explanationLatex: string;
    }
  ) => string;
  editStep: (stepId: string, patch: Partial<Omit<Step, "id" | "partId" | "hints">>) => void;
  removeStep: (stepId: string) => void;
  moveSteps: (partId: string, orderedIds: string[]) => void;
  addHint: (stepId: string, input: { bodyLatex: string }) => string;
  editHint: (hintId: string, patch: Partial<Omit<Hint, "id" | "stepId">>) => void;
  removeHint: (hintId: string) => void;
  moveHints: (stepId: string, orderedIds: string[]) => void;
}

const AdminStoreContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>(seedContent);
  const contentRef = useRef<Content>(content);

  // Hydrate from localStorage after mount (kept out of render so SSR and the
  // client's first paint agree).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Content;
        contentRef.current = parsed;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration
        setContent(parsed);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const commit = useCallback((next: Content) => {
    contentRef.current = next;
    setContent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const addTest = useCallback<AdminStore["addTest"]>(
    (input) => {
      const { content: next, id } = createTest(contentRef.current, input);
      commit(next);
      return id;
    },
    [commit]
  );

  const editTest = useCallback<AdminStore["editTest"]>(
    (id, patch) => commit(updateTest(contentRef.current, id, patch)),
    [commit]
  );

  const removeTest = useCallback<AdminStore["removeTest"]>(
    (id) => commit(deleteTest(contentRef.current, id)),
    [commit]
  );

  const moveTests = useCallback<AdminStore["moveTests"]>(
    (courseId, orderedIds) =>
      commit(reorderTests(contentRef.current, courseId, orderedIds)),
    [commit]
  );

  const addQuestion = useCallback<AdminStore["addQuestion"]>(
    (testId, input) => {
      const { content: next, id } = createQuestion(contentRef.current, testId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editQuestion = useCallback<AdminStore["editQuestion"]>(
    (id, patch) => commit(updateQuestion(contentRef.current, id, patch)),
    [commit]
  );
  const removeQuestion = useCallback<AdminStore["removeQuestion"]>(
    (id) => commit(deleteQuestion(contentRef.current, id)),
    [commit]
  );
  const moveQuestions = useCallback<AdminStore["moveQuestions"]>(
    (testId, orderedIds) => commit(reorderQuestions(contentRef.current, testId, orderedIds)),
    [commit]
  );
  const addPart = useCallback<AdminStore["addPart"]>(
    (questionId, input) => {
      const { content: next, id } = createPart(contentRef.current, questionId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editPart = useCallback<AdminStore["editPart"]>(
    (partId, patch) => commit(updatePart(contentRef.current, partId, patch)),
    [commit]
  );
  const removePart = useCallback<AdminStore["removePart"]>(
    (partId) => commit(deletePart(contentRef.current, partId)),
    [commit]
  );
  const moveParts = useCallback<AdminStore["moveParts"]>(
    (questionId, orderedIds) => commit(reorderParts(contentRef.current, questionId, orderedIds)),
    [commit]
  );

  const addStep = useCallback<AdminStore["addStep"]>(
    (partId, input) => {
      const { content: next, id } = createStep(contentRef.current, partId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editStep = useCallback<AdminStore["editStep"]>(
    (stepId, patch) => commit(updateStep(contentRef.current, stepId, patch)),
    [commit]
  );
  const removeStep = useCallback<AdminStore["removeStep"]>(
    (stepId) => commit(deleteStep(contentRef.current, stepId)),
    [commit]
  );
  const moveSteps = useCallback<AdminStore["moveSteps"]>(
    (partId, orderedIds) => commit(reorderSteps(contentRef.current, partId, orderedIds)),
    [commit]
  );
  const addHint = useCallback<AdminStore["addHint"]>(
    (stepId, input) => {
      const { content: next, id } = createHint(contentRef.current, stepId, input);
      commit(next);
      return id;
    },
    [commit]
  );
  const editHint = useCallback<AdminStore["editHint"]>(
    (hintId, patch) => commit(updateHint(contentRef.current, hintId, patch)),
    [commit]
  );
  const removeHint = useCallback<AdminStore["removeHint"]>(
    (hintId) => commit(deleteHint(contentRef.current, hintId)),
    [commit]
  );
  const moveHints = useCallback<AdminStore["moveHints"]>(
    (stepId, orderedIds) => commit(reorderHints(contentRef.current, stepId, orderedIds)),
    [commit]
  );

  return (
    <AdminStoreContext.Provider
      value={{
        content,
        addTest,
        editTest,
        removeTest,
        moveTests,
        addQuestion,
        editQuestion,
        removeQuestion,
        moveQuestions,
        addPart,
        editPart,
        removePart,
        moveParts,
        addStep,
        editStep,
        removeStep,
        moveSteps,
        addHint,
        editHint,
        removeHint,
        moveHints,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore(): AdminStore {
  const store = useContext(AdminStoreContext);
  if (!store) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return store;
}
