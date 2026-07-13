export type RichSegment =
  | { type: "text"; value: string }
  | { type: "inlineMath"; value: string }
  | { type: "displayMath"; value: string };

export function parseRichText(input: string): RichSegment[] {
  const segmentRe = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  const segments: RichSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = segmentRe.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "displayMath", value: match[1] });
    } else {
      segments.push({ type: "inlineMath", value: match[2] });
    }
    lastIndex = segmentRe.lastIndex;
  }
  if (lastIndex < input.length) {
    segments.push({ type: "text", value: input.slice(lastIndex) });
  }
  return segments;
}
