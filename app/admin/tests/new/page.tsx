"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { TestForm } from "@/components/admin/TestForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

export default function NewTestPage() {
  const router = useRouter();
  const { content, addTest } = useAdminStore();

  return (
    <div>
      <BackLink href="/admin">Lab tests</BackLink>
      <PageHeader title="New lab test" />
      <TestForm
        courses={content.courses}
        submitLabel="Create"
        onSubmit={(values) => {
          const id = addTest({
            courseId: values.courseId,
            name: values.name,
            term: values.term || undefined,
            description: values.description || undefined,
            isPublished: values.isPublished,
          });
          router.push(`/admin/tests/${id}`);
        }}
      />
    </div>
  );
}
