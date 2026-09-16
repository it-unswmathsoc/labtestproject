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
import type { AnswerSyntax } from "@/lib/math/syntax";
import {
  createCourse,
  updateCourse,
  deleteCourse,
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
import type { Course, LabTest, Question, QuestionPart, Step, Hint } from "@/lib/data/types";
import type { AnswerType, AnswerValue, AnswerConfig } from "@/lib/grading";
import * as db from "@/lib/supabase/admin-mutations";
import { CancelledMutation, MutationQueue } from "@/lib/supabase/mutation-queue";
import { revalidatePaths } from "@/lib/supabase/revalidate";

const EMPTY: Content = { courses: [], labTests: [], questions: [] };

interface AdminStore {
  content: Content;
  isLoading: boolean;
  error: string;
  addCourse: (input: { code: string; name: string; description?: string }) => string;
  editCourse: (id: string, patch: Partial<Omit<Course, "id">>) => void;
  removeCourse: (id: string) => void;
  addTest: (input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
    answerSyntax?: AnswerSyntax;
  }) => string;
  /** Resolves true once the write lands, so the form can confirm the save. */
  editTest: (id: string, patch: Partial<Omit<LabTest, "id">>) => Promise<boolean>;
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
  const [content, setContent] = useState<Content>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const contentRef = useRef<Content>(EMPTY);
  const queueRef = useRef<MutationQueue>(null);
  queueRef.current ??= new MutationQueue();

  const apply = useCallback((next: Content) => {
    contentRef.current = next;
    setContent(next);
  }, []);

  const load = useCallback(async () => {
    try {
      const fetched = await db.fetchContent();
      contentRef.current = fetched;
      setContent(fetched);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  /** Locates a row's ancestry so the queue can prune descendants of a delete. */
  const ancestry = useCallback((id: string): string[] => {
    const { labTests, questions } = contentRef.current;
    if (labTests.some((t) => t.id === id)) return [id];

    for (const question of questions) {
      if (question.id === id) return [question.labTestId, id];
      for (const part of question.parts) {
        if (part.id === id) return [question.labTestId, question.id, id];
        for (const step of part.steps) {
          if (step.id === id) return [question.labTestId, question.id, part.id, id];
          for (const hint of step.hints) {
            if (hint.id === id) {
              return [question.labTestId, question.id, part.id, step.id, id];
            }
          }
        }
      }
    }
    return [id];
  }, []);

  /** Paths students can see. Only routes that set `revalidate` need busting. */
  const affectedPaths = useCallback((testId?: string): string[] => {
    const { courses, labTests } = contentRef.current;
    const paths = ["/"];
    const test = labTests.find((t) => t.id === testId);
    if (!test) return paths;

    const course = courses.find((c) => c.id === test.courseId);
    if (course) paths.push(`/courses/${course.code}`);
    paths.push(`/tests/${test.id}`);
    return paths;
  }, []);

  /** A course owns a /courses page, plus every /tests page beneath it. */
  const coursePaths = useCallback((courseId: string): string[] => {
    const { courses, labTests } = contentRef.current;
    const paths = ["/"];
    const course = courses.find((c) => c.id === courseId);
    if (!course) return paths;

    paths.push(`/courses/${course.code}`);
    for (const test of labTests) {
      if (test.courseId === courseId) paths.push(`/tests/${test.id}`);
    }
    return paths;
  }, []);

  /**
   * Resolves true once the row is actually in Postgres, so a caller can confirm
   * the save rather than guess from the optimistic update. Failures resolve
   * false instead of rejecting: they are already reported through `error`, and
   * rejecting would strand every caller that fires and forgets.
   */
  const write = useCallback(
    (
      scope: string[],
      run: () => Promise<unknown>,
      paths: string[]
    ): Promise<boolean> => {
      const queue = queueRef.current!;
      return queue
        .enqueue(scope, run)
        .then(() => queue.whenIdle())
        .then(() => revalidatePaths(paths))
        .then(() => true)
        .catch((cause: unknown) => {
          if (cause instanceof CancelledMutation) return false;
          const message = cause instanceof Error ? cause.message : String(cause);
          // Refetch first: load() clears `error` on success, so report afterwards.
          void load().then(() => setError(message));
          return false;
        });
    },
    [load]
  );

  const testIdOf = useCallback((id: string) => ancestry(id)[0], [ancestry]);

  const addCourse = useCallback<AdminStore["addCourse"]>(
    (input) => {
      const { content: next, id } = createCourse(contentRef.current, input);
      apply(next);
      const course = next.courses.find((c) => c.id === id)!;
      write([id], () => db.insertCourse(course), coursePaths(id));
      return id;
    },
    [apply, coursePaths, write]
  );

  const editCourse = useCallback<AdminStore["editCourse"]>(
    (id, patch) => {
      // Renaming the code moves the course's public page; the old url goes stale
      // unless it is busted too.
      const before = coursePaths(id);
      apply(updateCourse(contentRef.current, id, patch));
      const paths = [...new Set([...before, ...coursePaths(id)])];
      write([id], () => db.updateCourse(id, patch), paths);
    },
    [apply, coursePaths, write]
  );

  const removeCourse = useCallback<AdminStore["removeCourse"]>(
    (id) => {
      const paths = coursePaths(id);
      // Queued scopes are rooted at a lab test, not a course, so the course id
      // alone would not match them. Prune each doomed test's subtree by hand.
      const doomedTestIds = contentRef.current.labTests
        .filter((t) => t.courseId === id)
        .map((t) => t.id);
      apply(deleteCourse(contentRef.current, id));
      for (const testId of doomedTestIds) queueRef.current!.prune([testId]);
      queueRef.current!.prune([id]);
      write([id], () => db.deleteRow("courses", id), paths);
    },
    [apply, coursePaths, write]
  );

  const addTest = useCallback<AdminStore["addTest"]>(
    (input) => {
      const { content: next, id } = createTest(contentRef.current, input);
      apply(next);
      const test = next.labTests.find((t) => t.id === id)!;
      write([id], () => db.insertLabTest(test), affectedPaths(id));
      return id;
    },
    [affectedPaths, apply, write]
  );

  const editTest = useCallback<AdminStore["editTest"]>(
    (id, patch) => {
      // A course change moves the test between two /courses pages; the one it
      // left goes stale unless it is busted too.
      const before = affectedPaths(id);
      apply(updateTest(contentRef.current, id, patch));
      const paths = [...new Set([...before, ...affectedPaths(id)])];
      return write([id], () => db.updateLabTest(id, patch), paths);
    },
    [affectedPaths, apply, write]
  );

  const removeTest = useCallback<AdminStore["removeTest"]>(
    (id) => {
      const paths = affectedPaths(id);
      apply(deleteTest(contentRef.current, id));
      queueRef.current!.prune([id]);
      write([id], () => db.deleteRow("lab_tests", id), paths);
    },
    [affectedPaths, apply, write]
  );

  const moveTests = useCallback<AdminStore["moveTests"]>(
    (courseId, orderedIds) => {
      apply(reorderTests(contentRef.current, courseId, orderedIds));
      write(
        orderedIds,
        () => db.reorder("reorder_lab_tests", courseId, orderedIds),
        affectedPaths(orderedIds[0])
      );
    },
    [affectedPaths, apply, write]
  );

  const addQuestion = useCallback<AdminStore["addQuestion"]>(
    (testId, input) => {
      const { content: next, id } = createQuestion(contentRef.current, testId, input);
      apply(next);
      const question = next.questions.find((q) => q.id === id)!;
      write([testId, id], () => db.insertQuestion(question), affectedPaths(testId));
      return id;
    },
    [affectedPaths, apply, write]
  );

  const editQuestion = useCallback<AdminStore["editQuestion"]>(
    (id, patch) => {
      const testId = testIdOf(id);
      apply(updateQuestion(contentRef.current, id, patch));
      write([testId, id], () => db.updateQuestion(id, patch), affectedPaths(testId));
    },
    [affectedPaths, apply, testIdOf, write]
  );

  const removeQuestion = useCallback<AdminStore["removeQuestion"]>(
    (id) => {
      const scope = ancestry(id);
      const paths = affectedPaths(scope[0]);
      apply(deleteQuestion(contentRef.current, id));
      queueRef.current!.prune(scope);
      write(scope, () => db.deleteRow("questions", id), paths);
    },
    [affectedPaths, ancestry, apply, write]
  );

  const moveQuestions = useCallback<AdminStore["moveQuestions"]>(
    (testId, orderedIds) => {
      apply(reorderQuestions(contentRef.current, testId, orderedIds));
      write(
        [testId, ...orderedIds],
        () => db.reorder("reorder_questions", testId, orderedIds),
        affectedPaths(testId)
      );
    },
    [affectedPaths, apply, write]
  );

  const addPart = useCallback<AdminStore["addPart"]>(
    (questionId, input) => {
      const testId = testIdOf(questionId);
      const { content: next, id } = createPart(contentRef.current, questionId, input);
      apply(next);
      const part = next.questions.flatMap((q) => q.parts).find((p) => p.id === id)!;
      write([testId, questionId, id], () => db.insertPart(part), affectedPaths(testId));
      return id;
    },
    [affectedPaths, apply, testIdOf, write]
  );

  const editPart = useCallback<AdminStore["editPart"]>(
    (partId, patch) => {
      const scope = ancestry(partId);
      apply(updatePart(contentRef.current, partId, patch));
      write(scope, () => db.updatePart(partId, patch), affectedPaths(scope[0]));
    },
    [affectedPaths, ancestry, apply, write]
  );

  const removePart = useCallback<AdminStore["removePart"]>(
    (partId) => {
      const scope = ancestry(partId);
      const paths = affectedPaths(scope[0]);
      apply(deletePart(contentRef.current, partId));
      queueRef.current!.prune(scope);
      write(scope, () => db.deleteRow("question_parts", partId), paths);
    },
    [affectedPaths, ancestry, apply, write]
  );

  const moveParts = useCallback<AdminStore["moveParts"]>(
    (questionId, orderedIds) => {
      const testId = testIdOf(questionId);
      apply(reorderParts(contentRef.current, questionId, orderedIds));
      write(
        [testId, questionId, ...orderedIds],
        () => db.reorder("reorder_parts", questionId, orderedIds),
        affectedPaths(testId)
      );
    },
    [affectedPaths, apply, testIdOf, write]
  );

  const addStep = useCallback<AdminStore["addStep"]>(
    (partId, input) => {
      const parentScope = ancestry(partId);
      const { content: next, id } = createStep(contentRef.current, partId, input);
      apply(next);
      const step = next.questions
        .flatMap((q) => q.parts)
        .flatMap((p) => p.steps)
        .find((s) => s.id === id)!;
      write(
        [...parentScope, id],
        () => db.insertStep(step),
        affectedPaths(parentScope[0])
      );
      return id;
    },
    [affectedPaths, ancestry, apply, write]
  );

  const editStep = useCallback<AdminStore["editStep"]>(
    (stepId, patch) => {
      const scope = ancestry(stepId);
      apply(updateStep(contentRef.current, stepId, patch));
      write(scope, () => db.updateStep(stepId, patch), affectedPaths(scope[0]));
    },
    [affectedPaths, ancestry, apply, write]
  );

  const removeStep = useCallback<AdminStore["removeStep"]>(
    (stepId) => {
      const scope = ancestry(stepId);
      const partId = scope[2];
      const paths = affectedPaths(scope[0]);
      const next = deleteStep(contentRef.current, stepId);
      // Snapshot the survivors now. Reading contentRef after the delete resolves
      // would pick up a step added in the meantime, whose row does not exist yet.
      const part = next.questions.flatMap((q) => q.parts).find((p) => p.id === partId);
      const remaining = part ? part.steps.map((s) => s.id) : [];
      apply(next);
      queueRef.current!.prune(scope);
      write(
        scope,
        async () => {
          await db.deleteRow("steps", stepId);
          // deleteStep renumbers the survivors; persist that.
          if (remaining.length) await db.reorder("reorder_steps", partId, remaining);
        },
        paths
      );
    },
    [affectedPaths, ancestry, apply, write]
  );

  const moveSteps = useCallback<AdminStore["moveSteps"]>(
    (partId, orderedIds) => {
      const scope = ancestry(partId);
      apply(reorderSteps(contentRef.current, partId, orderedIds));
      write(
        [...scope, ...orderedIds],
        () => db.reorder("reorder_steps", partId, orderedIds),
        affectedPaths(scope[0])
      );
    },
    [affectedPaths, ancestry, apply, write]
  );

  const addHint = useCallback<AdminStore["addHint"]>(
    (stepId, input) => {
      const parentScope = ancestry(stepId);
      const { content: next, id } = createHint(contentRef.current, stepId, input);
      apply(next);
      const hint = next.questions
        .flatMap((q) => q.parts)
        .flatMap((p) => p.steps)
        .flatMap((s) => s.hints)
        .find((h) => h.id === id)!;
      write(
        [...parentScope, id],
        () => db.insertHint(hint),
        affectedPaths(parentScope[0])
      );
      return id;
    },
    [affectedPaths, ancestry, apply, write]
  );

  const editHint = useCallback<AdminStore["editHint"]>(
    (hintId, patch) => {
      const scope = ancestry(hintId);
      apply(updateHint(contentRef.current, hintId, patch));
      write(scope, () => db.updateHint(hintId, patch), affectedPaths(scope[0]));
    },
    [affectedPaths, ancestry, apply, write]
  );

  const removeHint = useCallback<AdminStore["removeHint"]>(
    (hintId) => {
      const scope = ancestry(hintId);
      const stepId = scope[3];
      const paths = affectedPaths(scope[0]);
      const next = deleteHint(contentRef.current, hintId);
      const step = next.questions
        .flatMap((q) => q.parts)
        .flatMap((p) => p.steps)
        .find((s) => s.id === stepId);
      const remaining = step ? step.hints.map((h) => h.id) : [];
      apply(next);
      queueRef.current!.prune(scope);
      write(
        scope,
        async () => {
          await db.deleteRow("hints", hintId);
          if (remaining.length) await db.reorder("reorder_hints", stepId, remaining);
        },
        paths
      );
    },
    [affectedPaths, ancestry, apply, write]
  );

  const moveHints = useCallback<AdminStore["moveHints"]>(
    (stepId, orderedIds) => {
      const scope = ancestry(stepId);
      apply(reorderHints(contentRef.current, stepId, orderedIds));
      write(
        [...scope, ...orderedIds],
        () => db.reorder("reorder_hints", stepId, orderedIds),
        affectedPaths(scope[0])
      );
    },
    [affectedPaths, ancestry, apply, write]
  );

  return (
    <AdminStoreContext.Provider
      value={{
        content,
        isLoading,
        error,
        addCourse,
        editCourse,
        removeCourse,
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
      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
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
