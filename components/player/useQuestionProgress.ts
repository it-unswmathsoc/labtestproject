"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

interface Progress {
  steps: string[];
  parts: string[];
}

const emptyProgress: Progress = { steps: [], parts: [] };
const keyFor = (questionId: string) => `labtest:progress:${questionId}`;

export function useQuestionProgress(questionId: string) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(keyFor(questionId));
      const next = raw ? (JSON.parse(raw) as Progress) : emptyProgress;
      startTransition(() => setProgress(next));
    } catch {
      startTransition(() => setProgress(emptyProgress));
    }
  }, [questionId]);

  const add = useCallback(
    (field: keyof Progress, id: string) => {
      setProgress((prev) => {
        if (prev[field].includes(id)) return prev;
        const next = { ...prev, [field]: [...prev[field], id] };
        try {
          window.localStorage.setItem(keyFor(questionId), JSON.stringify(next));
        } catch {
          // ignore storage errors (private mode, quota)
        }
        return next;
      });
    },
    [questionId]
  );

  const markStep = useCallback((stepId: string) => add("steps", stepId), [add]);
  const markPart = useCallback((partId: string) => add("parts", partId), [add]);

  return { progress, markStep, markPart };
}
