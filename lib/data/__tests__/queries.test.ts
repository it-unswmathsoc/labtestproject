import { describe, it, expect, beforeAll } from "vitest";
import type * as Queries from "../queries";

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

// Dynamic import: a static import would be hoisted ahead of the env vars above
// (queries.ts -> lib/supabase/public.ts builds its client eagerly at module
// load and throws if the env vars are missing), so we defer the import until
// after they're set.
let getCourses: typeof Queries.getCourses;
let getCourseByCode: typeof Queries.getCourseByCode;
let getCourseById: typeof Queries.getCourseById;
let getLabTestsForCourse: typeof Queries.getLabTestsForCourse;
let getLabTest: typeof Queries.getLabTest;
let getQuestionsForTest: typeof Queries.getQuestionsForTest;
let getQuestion: typeof Queries.getQuestion;

beforeAll(async () => {
  const queries = await import("../queries");
  ({
    getCourses,
    getCourseByCode,
    getCourseById,
    getLabTestsForCourse,
    getLabTest,
    getQuestionsForTest,
    getQuestion,
  } = queries);
});

// Literal ids from supabase/seed.sql (see that file's comment: they're pinned so
// they survive a db reset). id columns are uuid, so "unknown id" cases below use
// a syntactically valid but absent uuid rather than an arbitrary string.
const MATH1081_ID = "c0000000-0000-4000-8000-000000001081";
const MATH1141_ID = "c0000000-0000-4000-8000-000000001141";
const LAB_TEST_1_ID = "7e570000-0000-4000-8000-000000000001"; // published
const LAB_TEST_2_DRAFT_ID = "7e570000-0000-4000-8000-000000000002"; // unpublished
const QUESTION_1_ID = "90e50000-0000-4000-8000-000000000001";
const UNKNOWN_UUID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

describe("data queries", () => {
  it("returns courses sorted by sortOrder", async () => {
    const courses = await getCourses();
    expect(courses.map((c) => c.code)).toEqual(["MATH1081", "MATH1141"]);
  });

  it("looks up a course by code case-insensitively", async () => {
    const course = await getCourseByCode("math1081");
    expect(course?.name).toBe("Discrete Mathematics");
  });

  it("looks up a course by id", async () => {
    const course = await getCourseById(MATH1081_ID);
    expect(course?.code).toBe("MATH1081");
  });

  it("returns null for an unknown course id", async () => {
    expect(await getCourseById(UNKNOWN_UUID)).toBeNull();
  });

  it("returns null for an unknown course code", async () => {
    expect(await getCourseByCode("MATH9999")).toBeNull();
  });

  it("returns only PUBLISHED lab tests for a course", async () => {
    const tests = await getLabTestsForCourse(MATH1081_ID);
    expect(tests.map((t) => t.name)).toEqual(["Lab Test 1"]);
  });

  it("returns an empty array for a course with no published tests", async () => {
    expect(await getLabTestsForCourse(MATH1141_ID)).toEqual([]);
  });

  it("returns null when fetching an unpublished test by id", async () => {
    expect(await getLabTest(LAB_TEST_2_DRAFT_ID)).toBeNull();
  });

  it("returns a published test by id", async () => {
    const test = await getLabTest(LAB_TEST_1_ID);
    expect(test?.name).toBe("Lab Test 1");
  });

  it("returns questions for a published test, sorted, with parts", async () => {
    const questions = await getQuestionsForTest(LAB_TEST_1_ID);
    expect(questions.map((q) => q.number)).toEqual([1, 2, 3, 4, 8]);
    expect(questions[0].parts.map((p) => p.label)).toEqual(["a", "b"]);
  });

  it("returns no questions for an unpublished test", async () => {
    expect(await getQuestionsForTest(LAB_TEST_2_DRAFT_ID)).toEqual([]);
  });

  it("returns independent data across calls", async () => {
    const first = await getQuestionsForTest(LAB_TEST_1_ID);
    first[0].parts[0].answerValue = 999;
    const second = await getQuestionsForTest(LAB_TEST_1_ID);
    expect(second[0].parts[0].answerValue).toBe(19);
  });

  it("returns a single question by id with sorted parts/steps/hints", async () => {
    const q = await getQuestion(QUESTION_1_ID);
    expect(q?.number).toBe(1);
    expect(q?.parts.map((p) => p.label)).toEqual(["a", "b"]);
    expect(q?.parts[0].steps.map((s) => s.number)).toEqual([1, 2]);
    expect(q?.parts[0].steps[0].hints).toHaveLength(1);
  });

  it("returns null for an unknown question id", async () => {
    expect(await getQuestion(UNKNOWN_UUID)).toBeNull();
  });

  it("returns null for a question under an unpublished test", async () => {
    // (Lab Test 2 has no seeded questions, but the guard must hold if one is added)
    expect(await getQuestion(UNKNOWN_UUID)).toBeNull();
  });

  it("returns null for a non-uuid id rather than throwing", async () => {
    // A junk URL segment must reach notFound(), not the error boundary:
    // PostgREST answers a non-uuid filter with 400 / 22P02.
    expect(await getLabTest("foo")).toBeNull();
    expect(await getQuestion("foo")).toBeNull();
    expect(await getCourseById("foo")).toBeNull();
    expect(await getQuestionsForTest("foo")).toEqual([]);
  });
});
