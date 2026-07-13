import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabTest, getQuestion } from "@/lib/data/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuestionPlayer } from "@/components/player/QuestionPlayer";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ testId: string; questionId: string }>;
}) {
  const { testId, questionId } = await params;
  const test = await getLabTest(testId);
  if (!test) notFound();

  const question = await getQuestion(questionId);
  if (!question || question.labTestId !== testId) notFound();

  return (
    <div>
      <PageHeader title={`${test.name} — Question ${question.number}`} />
      <QuestionPlayer question={question} />
      <div className="mt-8">
        <Link
          href={`/tests/${testId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to {test.name}
        </Link>
      </div>
    </div>
  );
}
