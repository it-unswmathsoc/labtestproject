import type { Course, LabTest, Question } from "./types";
import { courses, labTests, questions } from "./fixtures";

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

export async function getCourses(): Promise<Course[]> {
  return [...courses].sort(bySortOrder);
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  const target = code.toLowerCase();
  return courses.find((c) => c.code.toLowerCase() === target) ?? null;
}

export async function getLabTestsForCourse(courseId: string): Promise<LabTest[]> {
  return labTests
    .filter((t) => t.courseId === courseId && t.isPublished)
    .sort(bySortOrder);
}

export async function getLabTest(testId: string): Promise<LabTest | null> {
  return labTests.find((t) => t.id === testId && t.isPublished) ?? null;
}

export async function getQuestionsForTest(testId: string): Promise<Question[]> {
  const test = await getLabTest(testId);
  if (!test) return [];
  return questions
    .filter((q) => q.labTestId === testId)
    .sort(bySortOrder)
    .map((q) => ({
      ...q,
      parts: [...q.parts].sort(bySortOrder),
    }));
}
