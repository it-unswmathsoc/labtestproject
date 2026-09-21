import { SYNTAX_LABELS } from "@/lib/math/syntax";
import type { AnswerSyntax } from "@/lib/math/syntax";

export function SyntaxBadge({ syntax }: { syntax: AnswerSyntax }) {
  const label = SYNTAX_LABELS[syntax];
  return (
    <span
      title={`Type your answers in ${label} syntax.`}
      className="shrink-0 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600"
    >
      {label} syntax
    </span>
  );
}
