"use client";

import { useId } from "react";
import type {
  AnswerType,
  AnswerValue,
  AnswerConfig,
  ChoiceOption,
} from "@/lib/grading";
import { dialect } from "@/lib/math/syntax";

const ANSWER_TYPES: AnswerType[] = [
  "integer",
  "expression",
  "set_of_integers",
  "single_choice",
  "multi_select",
  "text",
];

export interface AnswerState {
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
}

export function defaultAnswerValue(type: AnswerType): AnswerValue {
  switch (type) {
    case "integer":
      return 0;
    case "expression":
      return { mobius: "" };
    case "set_of_integers":
      return [];
    case "single_choice":
      return { choice: "" };
    case "multi_select":
      return { selected: [] };
    case "text":
      return { text: "" };
  }
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

export function AnswerValueEditor({
  answerType,
  answerValue,
  answerConfig,
  onChange,
}: {
  answerType: AnswerType;
  answerValue: AnswerValue;
  answerConfig?: AnswerConfig;
  onChange: (state: AnswerState) => void;
}) {
  const typeId = useId();
  const answerId = useId();

  const emit = (patch: Partial<AnswerState>) =>
    onChange({ answerType, answerValue, answerConfig, ...patch });

  const changeType = (type: AnswerType) =>
    onChange({
      answerType: type,
      answerValue: defaultAnswerValue(type),
      answerConfig:
        type === "single_choice" || type === "multi_select"
          ? { options: answerConfig?.options ?? [] }
          : undefined,
    });

  const options = answerConfig?.options ?? [];
  const setOptions = (next: ChoiceOption[]) =>
    emit({ answerConfig: { ...answerConfig, options: next } });

  return (
    <div className="space-y-3">
      <div className="block">
        <label htmlFor={typeId} className="text-sm font-medium text-gray-700">
          Answer type
        </label>
        <select
          id={typeId}
          className={inputClass}
          value={answerType}
          onChange={(e) => changeType(e.target.value as AnswerType)}
        >
          {ANSWER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {answerType === "integer" ? (
        <div className="block">
          <label htmlFor={answerId} className="text-sm font-medium text-gray-700">
            Correct answer
          </label>
          <input
            id={answerId}
            type="text"
            inputMode="numeric"
            className={inputClass}
            defaultValue={String(answerValue as number)}
            onChange={(e) => emit({ answerValue: Number(e.target.value) || 0 })}
          />
        </div>
      ) : null}

      {answerType === "expression" ? (
        <div className="block">
          <label htmlFor={answerId} className="text-sm font-medium text-gray-700">
            Correct answer (Numbas syntax, e.g. 2^100)
          </label>
          <input
            id={answerId}
            type="text"
            className={inputClass}
            defaultValue={(answerValue as { mobius: string }).mobius}
            onChange={(e) => emit({ answerValue: { mobius: e.target.value } })}
          />
        </div>
      ) : null}

      {answerType === "set_of_integers" ? (
        <div className="block">
          <label htmlFor={answerId} className="text-sm font-medium text-gray-700">
            Correct answer (set syntax, e.g. set(1,2,3))
          </label>
          <input
            id={answerId}
            type="text"
            className={inputClass}
            defaultValue={
              (answerValue as number[]).length > 0
                ? `set(${(answerValue as number[]).join(",")})`
                : ""
            }
            onChange={(e) =>
              emit({ answerValue: dialect("numbas").parseSet(e.target.value) ?? [] })
            }
          />
        </div>
      ) : null}

      {answerType === "text" ? (
        <div className="block">
          <label htmlFor={answerId} className="text-sm font-medium text-gray-700">
            Correct answer
          </label>
          <input
            id={answerId}
            type="text"
            className={inputClass}
            defaultValue={(answerValue as { text: string }).text}
            onChange={(e) => emit({ answerValue: { text: e.target.value } })}
          />
        </div>
      ) : null}

      {answerType === "single_choice" || answerType === "multi_select" ? (
        <OptionsEditor
          options={options}
          answerType={answerType}
          answerValue={answerValue}
          onOptionsChange={setOptions}
          onAnswerChange={(v) => emit({ answerValue: v })}
        />
      ) : null}
    </div>
  );
}

function OptionsEditor({
  options,
  answerType,
  answerValue,
  onOptionsChange,
  onAnswerChange,
}: {
  options: ChoiceOption[];
  answerType: "single_choice" | "multi_select";
  answerValue: AnswerValue;
  onOptionsChange: (options: ChoiceOption[]) => void;
  onAnswerChange: (value: AnswerValue) => void;
}) {
  const groupName = useId();
  const selected =
    answerType === "single_choice"
      ? [(answerValue as { choice: string }).choice]
      : (answerValue as { selected: string[] }).selected;

  const updateOption = (i: number, patch: Partial<ChoiceOption>) =>
    onOptionsChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const addOption = () =>
    onOptionsChange([...options, { value: `opt${options.length + 1}`, label: "" }]);

  const removeOption = (i: number) =>
    onOptionsChange(options.filter((_, idx) => idx !== i));

  const toggleCorrect = (value: string) => {
    if (answerType === "single_choice") {
      onAnswerChange({ choice: value });
    } else {
      const set = new Set(selected);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      onAnswerChange({ selected: [...set] });
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 text-sm font-medium text-gray-700">
        Options (tick the correct {answerType === "single_choice" ? "one" : "ones"})
      </div>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type={answerType === "single_choice" ? "radio" : "checkbox"}
              name={groupName}
              aria-label={`Correct: ${o.value}`}
              checked={selected.includes(o.value)}
              onChange={() => toggleCorrect(o.value)}
            />
            <input
              type="text"
              aria-label={`Option value ${i + 1}`}
              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
              value={o.value}
              onChange={(e) => updateOption(i, { value: e.target.value })}
            />
            <input
              type="text"
              aria-label={`Option label ${i + 1}`}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="Label"
              value={o.label}
              onChange={(e) => updateOption(i, { label: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}
