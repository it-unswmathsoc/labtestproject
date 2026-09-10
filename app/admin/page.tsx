"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/components/admin/AdminStoreProvider";
import { CourseForm } from "@/components/admin/CourseForm";
import { SortableList } from "@/components/admin/SortableList";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/math/RichText";

/** Which course the modal is for: a new one, or an existing one being edited. */
type CourseDialog = { mode: "new" } | { mode: "edit"; courseId: string };

export default function AdminDashboard() {
  const {
    content,
    addCourse,
    editCourse,
    removeCourse,
    removeTest,
    moveTests,
  } = useAdminStore();
  const [dialog, setDialog] = useState<CourseDialog | null>(null);

  const { courses } = content;
  const editing =
    dialog?.mode === "edit"
      ? courses.find((c) => c.id === dialog.courseId)
      : undefined;

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Lab tests" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDialog({ mode: "new" })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New course
          </button>
          <Link
            href="/admin/tests/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New lab test
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">
          No courses yet. Add one to start creating lab tests.
        </p>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => {
            const tests = content.labTests
              .filter((t) => t.courseId === course.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <section key={course.id}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {course.code} — {course.name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setDialog({ mode: "edit", courseId: course.id })}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${course.code}"? Its ${tests.length} lab test(s) and all their questions will be deleted too.`
                          )
                        ) {
                          removeCourse(course.id);
                        }
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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
      )}

      {dialog ? (
        <Modal
          title={editing ? "Edit course" : "New course"}
          onClose={() => setDialog(null)}
        >
          <CourseForm
            // Remounts on switching between courses so the fields reinitialise.
            key={editing?.id ?? "new"}
            existing={content.courses}
            editingId={editing?.id}
            initial={editing}
            submitLabel={editing ? "Save" : "Create"}
            onCancel={() => setDialog(null)}
            onSubmit={(values) => {
              const patch = {
                code: values.code,
                name: values.name,
                description: values.description || undefined,
              };
              if (editing) {
                editCourse(editing.id, patch);
              } else {
                addCourse(patch);
              }
              setDialog(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
