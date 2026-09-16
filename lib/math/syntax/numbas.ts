import type { NormalizeResult } from "./types";

/** JME is case-insensitive by default, so `Pi` and `pi` are the same name. */
export function normalize(input: string): NormalizeResult {
  return { value: input.replace(/\s+/g, "").toLowerCase() };
}

export function parseSet(input: string): number[] | null {
  const match = /^set\(\s*(.*?)\s*\)$/i.exec(input.trim());
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
  return `set(${members.join(",")})`;
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
