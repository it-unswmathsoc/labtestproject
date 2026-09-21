import { describe, it, expect } from "vitest";
import {
  createTest,
  updateTest,
  deleteTest,
  reorderTests,
} from "../content-store";
import type { Content } from "../types";

function baseContent(): Content {
  return {
    courses: [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }],
    labTests: [
      { id: "t1", courseId: "c1", name: "Lab Test 1", isPublished: true, sortOrder: 1, answerSyntax: "numbas" },
      { id: "t2", courseId: "c1", name: "Lab Test 2", isPublished: false, sortOrder: 2, answerSyntax: "numbas" },
    ],
    questions: [
      {
        id: "q1",
        labTestId: "t1",
        number: 1,
        promptLatex: "Stem",
        sortOrder: 1,
        parts: [],
      },
    ],
  };
}

describe("createTest", () => {
  it("appends a test with the next sortOrder and returns its id", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 3",
      isPublished: false,
    });
    const created = content.labTests.find((t) => t.id === id);
    expect(created?.name).toBe("Lab Test 3");
    expect(created?.sortOrder).toBe(3);
  });

  it("starts sortOrder at 1 for a course with no tests", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c2",
      name: "First",
      isPublished: false,
    });
    expect(content.labTests.find((t) => t.id === id)?.sortOrder).toBe(1);
  });
});

describe("updateTest", () => {
  it("patches only the named test", () => {
    const next = updateTest(baseContent(), "t1", { name: "Renamed", isPublished: false });
    expect(next.labTests.find((t) => t.id === "t1")?.name).toBe("Renamed");
    expect(next.labTests.find((t) => t.id === "t1")?.isPublished).toBe(false);
    expect(next.labTests.find((t) => t.id === "t2")?.name).toBe("Lab Test 2");
  });
});

describe("deleteTest", () => {
  it("removes the test and its questions", () => {
    const next = deleteTest(baseContent(), "t1");
    expect(next.labTests.some((t) => t.id === "t1")).toBe(false);
    expect(next.questions.some((q) => q.labTestId === "t1")).toBe(false);
  });
});

describe("reorderTests", () => {
  it("rewrites sortOrder to match the given order within a course", () => {
    const next = reorderTests(baseContent(), "c1", ["t2", "t1"]);
    expect(next.labTests.find((t) => t.id === "t2")?.sortOrder).toBe(1);
    expect(next.labTests.find((t) => t.id === "t1")?.sortOrder).toBe(2);
  });
});

describe("createTest answer syntax", () => {
  it("stores the chosen syntax", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 3",
      isPublished: false,
      answerSyntax: "maple",
    });
    expect(content.labTests.find((t) => t.id === id)?.answerSyntax).toBe("maple");
  });

  it("defaults to numbas when none is given", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 4",
      isPublished: false,
    });
    expect(content.labTests.find((t) => t.id === id)?.answerSyntax).toBe("numbas");
  });

  it("defaults to numbas when the key is present but undefined", () => {
    const { content, id } = createTest(baseContent(), {
      courseId: "c1",
      name: "Lab Test 5",
      isPublished: false,
      answerSyntax: undefined,
    });
    expect(content.labTests.find((t) => t.id === id)?.answerSyntax).toBe("numbas");
  });
});
