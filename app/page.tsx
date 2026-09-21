import { getCourses } from "@/lib/data/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Latex } from "@/components/math/Latex";
import { StepsIcon, HintIcon, CheckIcon } from "@/components/ui/icons";

export const revalidate = 3600;

const FEATURES = [
  {
    icon: StepsIcon,
    title: "Guided steps",
    body: "Every lab test is broken into the same steps you'll see in the real thing, so there are no surprises on the day.",
  },
  {
    icon: HintIcon,
    title: "Hints when you're stuck",
    body: "Nudge yourself in the right direction without giving up and jumping straight to the answer.",
  },
  {
    icon: CheckIcon,
    title: "Worked solutions",
    body: "Full worked solutions for every question, so you know exactly where your working went off track.",
  },
];

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <div>
      {/* Hero */}
      <section className="flex flex-col items-start gap-5 pb-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <Latex>{"\\int_a^b"}</Latex>
          <span>A MathSoc project</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Walk into your lab test having already done it.
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          Practise past UNSW maths lab tests with the same guided steps,
          hints and worked solutions you&apos;ll wish you had on the day.
        </p>
        <a
          href="#courses"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Browse courses ↓
        </a>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 gap-4 border-t border-gray-200 py-8 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-gray-200 p-5">
            <Icon className="h-6 w-6 text-gray-900" />
            <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{body}</p>
          </div>
        ))}
      </section>

      {/* Course index — this is what every "All courses" BackLink returns to */}
      <section id="courses" className="border-t border-gray-200 pt-8">
        <PageHeader title="Choose a course" />
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
      </section>
    </div>
  );
}
