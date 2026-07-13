// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useQuestionProgress } from "../useQuestionProgress";

describe("useQuestionProgress", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts empty and records solved steps and parts", () => {
    const { result } = renderHook(() => useQuestionProgress("q1"));
    expect(result.current.progress).toEqual({ steps: [], parts: [] });

    act(() => result.current.markStep("s1"));
    act(() => result.current.markPart("p1"));

    expect(result.current.progress.steps).toContain("s1");
    expect(result.current.progress.parts).toContain("p1");
  });

  it("persists to localStorage under a per-question key", () => {
    const { result } = renderHook(() => useQuestionProgress("q1"));
    act(() => result.current.markStep("s1"));
    expect(window.localStorage.getItem("labtest:progress:q1")).toContain("s1");
  });

  it("rehydrates existing progress on mount", () => {
    window.localStorage.setItem(
      "labtest:progress:q2",
      JSON.stringify({ steps: ["sX"], parts: [] })
    );
    const { result } = renderHook(() => useQuestionProgress("q2"));
    expect(result.current.progress.steps).toContain("sX");
  });
});
