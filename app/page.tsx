import { getCourses } from "@/lib/data/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 3600;

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <div>
      <PageHeader
        title="Choose a course"
        subtitle="Practise past lab tests with guided steps, hints and worked solutions."
      />
      {courses.length === 0 ? (
        <p className="text-gray-500">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              href={`/courses/${course.code}`}
              title={course.code}
              subtitle={course.name}
            >
              {course.description}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
