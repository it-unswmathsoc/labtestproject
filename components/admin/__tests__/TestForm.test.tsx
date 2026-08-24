// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Course } from "@/lib/data/types";
import { TestForm } from "../TestForm";

const courses: Course[] = [
  { id: "c1", code: "MATH1081", name: "Discrete Mathematics", sortOrder: 1 },
];

describe("TestForm", () => {
  it("previews LaTeX in the name, term and description as KaTeX", async () => {
    render(<TestForm courses={courses} submitLabel="Create" onSubmit={() => {}} />);

    // NB: userEvent treats { as a key descriptor, so keep braces out of typed text.
    await userEvent.type(screen.getByLabelText("Name"), "Vectors in $x^2$");

    // Preview pane renders the math rather than showing the source.
    const rendered = document.querySelectorAll(".katex");
    expect(rendered.length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain("Vectors in ");
    // The source itself is still what lives in the field.
    expect(screen.getByLabelText("Name")).toHaveValue("Vectors in $x^2$");
  });

  it("submits the raw LaTeX source, not the rendered output", async () => {
    const onSubmit = vi.fn();
    render(<TestForm courses={courses} submitLabel="Create" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Name"), "Bases of $V$");
    await userEvent.type(screen.getByLabelText("Description"), "Find $\\dim V$.");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bases of $V$",
        description: "Find $\\dim V$.",
      })
    );
  });

  it("submits a real courseId even when courses arrive after first render", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TestForm courses={[]} submitLabel="Create" onSubmit={onSubmit} />
    );
    // Courses load a tick later, exactly like AdminStoreProvider's fetch.
    rerender(<TestForm courses={courses} submitLabel="Create" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Name"), "Week 1");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: "c1" })
    );
  });

  it("shows placeholders with single backslashes, not JSX-literal doubles", () => {
    render(<TestForm courses={courses} submitLabel="Create" onSubmit={() => {}} />);
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "placeholder",
      "Vectors in $\\mathbb{R}^n$"
    );
  });

  it("still requires a name", async () => {
    render(<TestForm courses={courses} submitLabel="Create" onSubmit={() => {}} />);
    expect(screen.getByLabelText("Name")).toBeRequired();
  });
});
