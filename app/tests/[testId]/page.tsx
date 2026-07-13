import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabTest, getQuestionsForTest } from "@/lib/data/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/math/RichText";
import { MobiusAnswer } from "@/components/math/MobiusAnswer";

export const revalidate = 3600;

export default async function TestOverviewPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = await getLabTest(testId);
  if (!test) notFound();

  const questions = await getQuestionsForTest(testId);

  return (
    <div>
      <PageHeader
        title={test.name}
        subtitle={[test.term, test.description].filter(Boolean).join(" · ")}
      />
      {questions.length === 0 ? (
        <p className="text-gray-500">This test has no questions yet.</p>
      ) : (
        <ol className="space-y-8">
          {questions.map((q) => (
            <li key={q.id} className="rounded-xl border border-gray-200 p-5">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Question {q.number}
              </h2>
              <div className="mb-2 text-gray-800">
                <RichText>{q.promptLatex}</RichText>
              </div>
              {q.noteLatex ? (
                <div className="mb-4 text-sm italic text-gray-500">
                  <RichText>{q.noteLatex}</RichText>
                </div>
              ) : null}
              <div className="space-y-3">
                {q.parts.map((part) => (
                  <div key={part.id} className="border-l-2 border-gray-100 pl-4">
                    <div className="text-gray-800">
                      <span className="font-medium">{part.label})</span>{" "}
                      <RichText>{part.promptLatex}</RichText>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Answer:{" "}
                      <MobiusAnswer
                        value={part.answerValue}
                        type={part.answerType}
                        config={part.answerConfig}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/tests/${testId}/q/${q.id}`}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Practise this question →
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
