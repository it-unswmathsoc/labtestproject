import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabTest, getQuestionsForTest } from "@/lib/data/queries";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 3600;

export default async function TestStartPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = await getLabTest(testId);
  if (!test) notFound();

  const questions = await getQuestionsForTest(testId);
  const count = questions.length;
  const subtitle = [test.term, `${count} question${count === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <PageHeader title={test.name} subtitle={subtitle} />
      {test.description ? (
        <p className="mb-8 max-w-2xl text-gray-700">{test.description}</p>
      ) : null}
      {count > 0 ? (
        <Link
          href={`/tests/${testId}/practice`}
          className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
        >
          Start practising →
        </Link>
      ) : (
        <p className="text-gray-500">This test has no questions yet.</p>
      )}
    </div>
  );
}
