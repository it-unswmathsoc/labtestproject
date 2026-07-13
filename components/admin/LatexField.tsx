"use client";

import { useId } from "react";
import { RichText } from "@/components/math/RichText";

export function LatexField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="block">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700">
        <span className="mr-1 text-xs text-gray-400">Preview:</span>
        <RichText>{value}</RichText>
      </div>
    </div>
  );
}
