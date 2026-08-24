"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { TestForm } from "@/components/admin/TestForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/math/RichText";
import { QuestionsEditor } from "@/components/admin/QuestionsEditor";

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { content, isLoading, editTest } = useAdminStore();
  const test = content.labTests.find((t) => t.id === id);
  // The store loads asynchronously; without this a refresh 404s before it arrives.
  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (!test) notFound();

  const questionCount = content.questions.filter(
    (q) => q.labTestId === id
  ).length;

  return (
    <div>
      <PageHeader
        title={<>Edit: <RichText>{test.name}</RichText></>}
        subtitle={`${questionCount} question${questionCount === 1 ? "" : "s"}`}
      />
      <TestForm
        courses={content.courses}
        submitLabel="Save"
        initial={{
          courseId: test.courseId,
          name: test.name,
          term: test.term ?? "",
          description: test.description ?? "",
          isPublished: test.isPublished,
        }}
        onSubmit={(values) =>
          editTest(id, {
            courseId: values.courseId,
            name: values.name,
            term: values.term || undefined,
            description: values.description || undefined,
            isPublished: values.isPublished,
          })
        }
      />
      <QuestionsEditor testId={id} />
    </div>
  );
}
