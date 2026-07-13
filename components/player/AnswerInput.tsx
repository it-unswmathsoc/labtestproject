"use client";

import type { AnswerType, AnswerConfig } from "@/lib/grading";
import type { InputValue } from "./input-value";

export function AnswerInput({
  answerType,
  config,
  name,
  value,
  onChange,
  disabled,
}: {
  answerType: AnswerType;
  config?: AnswerConfig;
  name: string;
  value: InputValue;
  onChange: (value: InputValue) => void;
  disabled?: boolean;
}) {
  if (answerType === "single_choice") {
    const options = config?.options ?? [];
    return (
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              disabled={disabled}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (answerType === "multi_select") {
    const options = config?.options ?? [];
    const selected = Array.isArray(value) ? value : [];
    const toggle = (v: string) =>
      onChange(
        selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]
      );
    return (
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
              disabled={disabled}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  const placeholder =
    answerType === "set_of_integers"
      ? "e.g. set(1,2,3)"
      : answerType === "expression"
        ? "e.g. 2^100"
        : "";
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
    />
  );
}
