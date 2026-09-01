import type { Course, LabTest, Question } from "./types";
import { publicClient } from "@/lib/supabase/public";
import {
  toCourse,
  toLabTest,
  toQuestion,
  QUESTION_TREE_SELECT,
} from "@/lib/supabase/mappers";

// Ids reach these helpers straight from the URL. PostgREST rejects a non-uuid
// filter value with 22P02, which would surface as a 500 error page; for a URL
// segment it just means "no such row", so screen it out first.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await publicClient
    .from("courses")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data.map(toCourse);
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  // Escape LIKE wildcards: the code comes straight from the URL, and a bare
  // ilike would let /courses/% match an arbitrary course.
  const { data, error } = await publicClient
    .from("courses")
    .select("*")
    .ilike("code", code.replace(/[%_\\]/g, "\\$&"))
    .maybeSingle();
  if (error) throw error;
  return data ? toCourse(data) : null;
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  if (!UUID.test(courseId)) return null;

  const { data, error } = await publicClient
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data ? toCourse(data) : null;
}

export async function getLabTestsForCourse(courseId: string): Promise<LabTest[]> {
  const { data, error } = await publicClient
    .from("lab_tests")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("sort_order");
  if (error) throw error;
  return data.map(toLabTest);
}

export async function getLabTest(testId: string): Promise<LabTest | null> {
  if (!UUID.test(testId)) return null;

  const { data, error } = await publicClient
    .from("lab_tests")
    .select("*")
    .eq("id", testId)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toLabTest(data) : null;
}

export async function getQuestionsForTest(testId: string): Promise<Question[]> {
  const test = await getLabTest(testId);
  if (!test) return [];

  const { data, error } = await publicClient
    .from("questions")
    .select(QUESTION_TREE_SELECT)
    .eq("lab_test_id", testId)
    .order("sort_order");
  if (error) throw error;
  return data.map(toQuestion);
}

export async function getQuestion(questionId: string): Promise<Question | null> {
  if (!UUID.test(questionId)) return null;

  const { data, error } = await publicClient
    .from("questions")
    .select(QUESTION_TREE_SELECT)
    .eq("id", questionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // RLS already hides questions under an unpublished test; confirm explicitly too.
  const test = await getLabTest(data.lab_test_id);
  if (!test) return null;

  return toQuestion(data);
}
