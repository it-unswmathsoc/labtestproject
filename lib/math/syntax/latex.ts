import type { NormalizeResult } from "./types";

export function normalize(input: string): NormalizeResult {
  let value = input.replace(/\\left|\\right/g, "");
  // Collapse whitespace, keeping exactly one space where it is the thing that
  // ends a control sequence before a letter (`\sin x`), dropping it elsewhere.
  value = value.replace(/\s+/g, (match, offset: number, whole: string) => {
    const before = whole.slice(0, offset);
    const after = whole.slice(offset + match.length);
    return /\\[A-Za-z]+$/.test(before) && /^[A-Za-z]/.test(after) ? " " : "";
  });
  // Brace bare single-character scripts so x^2 and x^{2} compare equal.
  value = value.replace(/([_^])([A-Za-z0-9])/g, "$1{$2}");
  return { value };
}

export function parseSet(input: string): number[] | null {
  const trimmed = input.trim();
  if (trimmed === "\\emptyset") return [];
  const match = /^\\\{\s*(.*?)\s*\\\}$/.exec(trimmed);
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
  if (members.length === 0) return "\\emptyset";
  return `\\{${members.join(",")}\\}`;
}

/** Input is already LaTeX, so rendering is the identity. */
export function setToLatex(input: string): string {
  return input;
}

export function expressionToLatex(input: string): string {
  return input;
}
