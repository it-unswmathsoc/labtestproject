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
  it("produces unique UUIDs", () => {
    const x = newId();
    const y = newId();
    expect(x).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(x).not.toBe(y);
  });
});
