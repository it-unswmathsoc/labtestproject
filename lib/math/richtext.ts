export type RichSegment =
  | { type: "text"; value: string }
  | { type: "inlineMath"; value: string }
  | { type: "displayMath"; value: string };

const SEGMENT_RE = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;

export function parseRichText(input: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  SEGMENT_RE.lastIndex = 0;
  while ((match = SEGMENT_RE.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "displayMath", value: match[1] });
    } else {
      segments.push({ type: "inlineMath", value: match[2] });
    }
    lastIndex = SEGMENT_RE.lastIndex;
  }
  if (lastIndex < input.length) {
    segments.push({ type: "text", value: input.slice(lastIndex) });
  }
  return segments;
}
