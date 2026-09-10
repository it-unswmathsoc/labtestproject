import { notFound } from "next/navigation";
import {
  getLabTest,
  getQuestionsForTest,
  getCourseById,
} from "@/lib/data/queries";
import { PracticeRunner } from "@/components/player/PracticeRunner";
import { BackLink } from "@/components/ui/BackLink";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = await getLabTest(testId);
  if (!test) notFound();

  const questions = await getQuestionsForTest(testId);
  const course = await getCourseById(test.courseId);

  return (
    <div>
      <BackLink href={`/tests/${testId}`}>Exit practice</BackLink>
      <PracticeRunner
        test={test}
        questions={questions}
        courseCode={course?.code ?? ""}
      />
    </div>
  );
}
