// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestForm } from "../TestForm";

const courses = [{ id: "c1", code: "MATH1081", name: "Discrete", sortOrder: 1 }];

describe("TestForm", () => {
  it("submits the entered values", async () => {
    const onSubmit = vi.fn();
    render(<TestForm courses={courses} onSubmit={onSubmit} submitLabel="Create" />);

    await userEvent.type(screen.getByLabelText(/name/i), "Lab Test 9");
    await userEvent.type(screen.getByLabelText(/term/i), "2026 T1");
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "c1",
        name: "Lab Test 9",
        term: "2026 T1",
        isPublished: false,
      })
    );
  });

  it("pre-fills from initial values", () => {
    render(
      <TestForm
        courses={courses}
        onSubmit={vi.fn()}
        submitLabel="Save"
        initial={{
          courseId: "c1",
          name: "Existing",
          term: "2025 T3",
          description: "desc",
          isPublished: true,
        }}
      />
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue("Existing");
    expect(screen.getByLabelText(/published/i)).toBeChecked();
  });
});
