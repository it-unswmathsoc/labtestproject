"use client";

import Link from "next/link";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { SortableList } from "@/components/admin/SortableList";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/math/RichText";

export default function AdminDashboard() {
  const { content, removeTest, moveTests } = useAdminStore();

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Lab tests" />
        <Link
          href="/admin/tests/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + New lab test
        </Link>
      </div>

      <div className="space-y-8">
        {content.courses.map((course) => {
          const tests = content.labTests
            .filter((t) => t.courseId === course.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <section key={course.id}>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                {course.code} — {course.name}
              </h2>
              {tests.length === 0 ? (
                <p className="text-sm text-gray-500">No lab tests yet.</p>
              ) : (
                <SortableList
                  items={tests.map((t) => t.id)}
                  onReorder={(ids) => moveTests(course.id, ids)}
                  renderItem={(id) => {
                    const test = tests.find((t) => t.id === id);
                    if (!test) return null;
                    return (
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            <RichText>{test.name}</RichText>
                          </span>
                          {test.term ? (
                            <span className="ml-2 text-sm text-gray-500">
                              <RichText>{test.term}</RichText>
                            </span>
                          ) : null}
                          <span
                            className={`ml-2 rounded px-2 py-0.5 text-xs ${
                              test.isPublished
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {test.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Link
                            href={`/admin/tests/${test.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete "${test.name}" and its questions?`
                                )
                              ) {
                                removeTest(test.id);
                              }
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
