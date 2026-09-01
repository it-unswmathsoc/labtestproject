import { notFound } from "next/navigation";
import { getCourseByCode, getLabTestsForCourse } from "@/lib/data/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/math/RichText";

export const revalidate = 3600;

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const { courseCode } = await params;
  const course = await getCourseByCode(courseCode);
  if (!course) notFound();

  const tests = await getLabTestsForCourse(course.id);

  return (
    <div>
      <PageHeader title={`${course.code} — ${course.name}`} subtitle="Lab tests" />
      {tests.length === 0 ? (
        <p className="text-gray-500">No lab tests available yet for this course.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tests.map((test) => (
            <Card
              key={test.id}
              href={`/tests/${test.id}`}
              title={<RichText>{test.name}</RichText>}
              subtitle={test.term ? <RichText>{test.term}</RichText> : undefined}
            >
              {test.description ? <RichText>{test.description}</RichText> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
