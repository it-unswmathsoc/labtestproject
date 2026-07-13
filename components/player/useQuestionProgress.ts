"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Progress {
  steps: string[];
  parts: string[];
}

const emptyProgress: Progress = { steps: [], parts: [] };
const keyFor = (questionId: string) => `labtest:progress:${questionId}`;

export function useQuestionProgress(questionId: string) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const progressRef = useRef<Progress>(emptyProgress);

  // Hydrate once from localStorage after mount. Done in an effect (not a lazy
  // useState initializer) so the server-rendered HTML and the client's first
  // paint agree — reading localStorage during render would hydration-mismatch.
  useEffect(() => {
    let next = emptyProgress;
    try {
      const raw = window.localStorage.getItem(keyFor(questionId));
      if (raw) next = JSON.parse(raw) as Progress;
    } catch {
      next = emptyProgress;
    }
    progressRef.current = next;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
    setProgress(next);
  }, [questionId]);

  const commit = useCallback(
    (next: Progress) => {
      progressRef.current = next;
      setProgress(next);
      try {
        window.localStorage.setItem(keyFor(questionId), JSON.stringify(next));
      } catch {
        // ignore storage errors (private mode, quota)
      }
    },
    [questionId]
  );

  const markStep = useCallback(
    (stepId: string) => {
      const prev = progressRef.current;
      if (prev.steps.includes(stepId)) return;
      commit({ ...prev, steps: [...prev.steps, stepId] });
    },
    [commit]
  );

  const markPart = useCallback(
    (partId: string) => {
      const prev = progressRef.current;
      if (prev.parts.includes(partId)) return;
      commit({ ...prev, parts: [...prev.parts, partId] });
    },
    [commit]
  );

  return { progress, markStep, markPart };
}
