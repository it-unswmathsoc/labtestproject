import type { Content } from "./types";
import { courses, labTests, questions } from "@/lib/data/fixtures";

export function seedContent(): Content {
  return structuredClone({ courses, labTests, questions });
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${prefix}-${rand}`;
}
