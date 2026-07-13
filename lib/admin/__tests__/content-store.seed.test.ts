import { describe, it, expect } from "vitest";
import { seedContent, newId } from "../content-store";

describe("seedContent", () => {
  it("returns a deep copy of the fixture content", () => {
    const a = seedContent();
    const b = seedContent();
    expect(a.courses.length).toBeGreaterThan(0);
    expect(a.labTests.length).toBeGreaterThan(0);
    // Mutating one copy must not affect another.
    a.labTests[0].name = "CHANGED";
    expect(b.labTests[0].name).not.toBe("CHANGED");
  });
});

describe("newId", () => {
  it("produces unique prefixed ids", () => {
    const x = newId("test");
    const y = newId("test");
    expect(x.startsWith("test-")).toBe(true);
    expect(x).not.toBe(y);
  });
});
