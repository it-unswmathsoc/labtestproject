import { describe, it, expect } from "vitest";
import {
  getCourses,
  getCourseByCode,
  getLabTestsForCourse,
  getLabTest,
  getQuestionsForTest,
} from "../queries";

describe("data queries", () => {
  it("returns courses sorted by sortOrder", async () => {
    const courses = await getCourses();
    expect(courses.map((c) => c.code)).toEqual(["MATH1081", "MATH1141"]);
  });

  it("looks up a course by code case-insensitively", async () => {
    const course = await getCourseByCode("math1081");
    expect(course?.name).toBe("Discrete Mathematics");
  });

  it("returns null for an unknown course code", async () => {
    expect(await getCourseByCode("MATH9999")).toBeNull();
  });

  it("returns only PUBLISHED lab tests for a course", async () => {
    const tests = await getLabTestsForCourse("course-math1081");
    expect(tests.map((t) => t.name)).toEqual(["Lab Test 1"]);
  });

  it("returns an empty array for a course with no published tests", async () => {
    expect(await getLabTestsForCourse("course-math1141")).toEqual([]);
  });

  it("returns null when fetching an unpublished test by id", async () => {
    expect(await getLabTest("test-1081-lt2-draft")).toBeNull();
  });

  it("returns a published test by id", async () => {
    const test = await getLabTest("test-1081-lt1");
    expect(test?.name).toBe("Lab Test 1");
  });

  it("returns questions for a published test, sorted, with parts", async () => {
    const questions = await getQuestionsForTest("test-1081-lt1");
    expect(questions.map((q) => q.number)).toEqual([1, 2, 3, 4, 8]);
    expect(questions[0].parts.map((p) => p.label)).toEqual(["a", "b"]);
  });

  it("returns no questions for an unpublished test", async () => {
    expect(await getQuestionsForTest("test-1081-lt2-draft")).toEqual([]);
  });
});
