import type { NormalizeResult } from "./types";

/**
 * The four unambiguous implicit-multiplication patterns Maple rejects. A name
 * followed by "(" is deliberately absent: Maple reads `f(x)` and `sqrt(2)` as
 * function application, so flagging it would reject valid input.
 */
const IMPLICIT_MULTIPLICATION: { pattern: RegExp; example: string }[] = [
  { pattern: /\d[A-Za-z]/, example: "2*x, not 2x" },
  { pattern: /\d\(/, example: "2*(x+1), not 2(x+1)" },
  { pattern: /\)\(/, example: "(x+1)*(x+2), not (x+1)(x+2)" },
  { pattern: /\)[A-Za-z0-9]/, example: "(x+1)*2, not (x+1)2" },
];

/** Maple is case-sensitive, so this deliberately does not lowercase. */
export function normalize(input: string): NormalizeResult {
  const value = input.replace(/\s+/g, "");
  for (const { pattern, example } of IMPLICIT_MULTIPLICATION) {
    if (pattern.test(value)) {
      return {
        value,
        error: `Maple needs an explicit * for multiplication — write ${example}.`,
      };
    }
  }
  return { value };
}

export function parseSet(input: string): number[] | null {
  const match = /^\{\s*(.*?)\s*\}$/.exec(input.trim());
  if (!match) return null;
  const inner = match[1].trim();
  if (inner === "") return [];
  const members: number[] = [];
  for (const part of inner.split(",")) {
    const token = part.trim();
    if (!/^-?\d+$/.test(token)) return null;
    members.push(Number(token));
  }
  return members;
}

export function formatSet(members: number[]): string {
  return `{${members.join(",")}}`;
}

export function setToLatex(input: string): string {
  const members = parseSet(input);
  if (members === null) return input;
  if (members.length === 0) return "\\emptyset";
  return `\\{${members.join(",\\ ")}\\}`;
}

export function expressionToLatex(input: string): string {
  return input.replace(/\^(-?\d+)/g, "^{$1}").replace(/\*/g, "\\times ");
}
