import { describe, it, expect } from "vitest";
import { gradeMultiSelect } from "../multiSelect";

describe("gradeMultiSelect", () => {
  it("accepts the exact selection (Q8a reflexive/symmetric/transitive)", () => {
    const r = gradeMultiSelect(
      ["reflexive", "symmetric", "transitive"],
      { selected: ["reflexive", "symmetric", "transitive"] }
    );
    expect(r.correct).toBe(true);
  });

  it("is order-insensitive", () => {
    expect(
      gradeMultiSelect(["symmetric", "reflexive"], { selected: ["reflexive", "symmetric"] }).correct
    ).toBe(true);
  });

  it("accepts an empty selection matching an empty answer", () => {
    expect(gradeMultiSelect([], { selected: [] }).correct).toBe(true);
  });

  it("rejects a superset selection", () => {
    expect(
      gradeMultiSelect(["reflexive", "symmetric"], { selected: ["reflexive"] }).correct
    ).toBe(false);
  });

  it("rejects a missing member", () => {
    expect(
      gradeMultiSelect(["reflexive"], { selected: ["reflexive", "symmetric"] }).correct
    ).toBe(false);
  });

  it("returns a sorted comma-joined normalized form", () => {
    expect(
      gradeMultiSelect(["transitive", "reflexive"], { selected: ["reflexive", "transitive"] }).normalized
    ).toBe("reflexive,transitive");
  });
});
