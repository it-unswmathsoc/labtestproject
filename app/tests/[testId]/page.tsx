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
              <div className="mb-4 text-gray-800">
                <RichText>{q.promptLatex}</RichText>
              </div>
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
              <button
                type="button"
                disabled
                className="mt-4 cursor-not-allowed rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-400"
              >
                Practice (coming in the next release)
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
