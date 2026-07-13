"use client";

import { useState } from "react";
import type { Hint } from "@/lib/data/types";
import { RichText } from "@/components/math/RichText";

export function HintStack({ hints }: { hints: Hint[] }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="mt-2">
      {hints.slice(0, shown).map((h) => (
        <div
          key={h.id}
          className="mt-1 rounded-md bg-amber-50 p-2 text-sm text-amber-900"
        >
          <span className="font-medium">Hint {h.number}: </span>
          <RichText>{h.bodyLatex}</RichText>
        </div>
      ))}
      {shown < hints.length ? (
        <button
          type="button"
          onClick={() => setShown((n) => n + 1)}
          className="mt-1 text-sm text-amber-700 hover:underline"
        >
          {shown === 0 ? "Show a hint" : "Show another hint"}
        </button>
      ) : null}
    </div>
  );
}
