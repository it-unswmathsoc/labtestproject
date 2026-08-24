// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { seedContent } from "@/lib/admin/content-store";

vi.mock("@/lib/supabase/client", () => import("./supabase-mock"));
vi.mock("@/lib/supabase/revalidate", () => ({
  revalidatePaths: vi.fn(async () => {}),
}));

const mock = await import("./supabase-mock");
const { revalidatePaths } = await import("@/lib/supabase/revalidate");
const { AdminStoreProvider, useAdminStore } = await import("../AdminStoreProvider");

function Harness() {
  const { content, addTest, editTest, removeTest, moveTests } = useAdminStore();
  const count = content.labTests.length;
  const courseId = content.courses[0]?.id;
  return (
    <div>
      <span>count:{count}</span>
      <button
        onClick={() => courseId && addTest({ courseId, name: "New", isPublished: false })}
      >
        add
      </button>
      <button
        onClick={() => editTest(content.labTests[0].id, { name: "Renamed" })}
      >
        edit
      </button>
      <button onClick={() => removeTest(content.labTests[0].id)}>remove</button>
      <button
        onClick={() =>
          editTest(content.labTests[0].id, { courseId: content.courses[1].id })
        }
      >
        movecourse
      </button>
      <button
        onClick={() =>
          moveTests(
            courseId,
            content.labTests.filter((t) => t.courseId === courseId).map((t) => t.id).reverse()
          )
        }
      >
        move
      </button>
    </div>
  );
}

async function renderLoaded() {
  render(
    <AdminStoreProvider>
      <Harness />
    </AdminStoreProvider>
  );
  await waitFor(() =>
    expect(screen.getByText(/count:/).textContent).not.toBe("count:0")
  );
}

beforeEach(() => {
  mock.reset();
  mock.seed(seedContent());
  // Calls accumulate across tests otherwise, so calls[0] would be a previous
  // test's paths.
  vi.mocked(revalidatePaths).mockClear();
});

describe("AdminStoreProvider", () => {
  it("loads content from Supabase rather than localStorage", async () => {
    await renderLoaded();
    expect(screen.getByText("count:2")).toBeInTheDocument();
    expect(window.localStorage.getItem("labtest:admin:content")).toBeNull();
  });

  it("optimistically adds a test and inserts it", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "add" }));

    expect(screen.getByText("count:3")).toBeInTheDocument();
    await waitFor(() =>
      expect(mock.calls).toContainEqual(
        expect.objectContaining({ table: "lab_tests", op: "insert" })
      )
    );
    const insert = mock.calls.find((c) => c.op === "insert")!;
    expect(insert.payload).toMatchObject({ name: "New", is_published: false });
    expect(insert.payload!.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("updates a test and revalidates the student-facing paths", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "edit" }));

    await waitFor(() =>
      expect(mock.calls).toContainEqual(
        expect.objectContaining({ table: "lab_tests", op: "update" })
      )
    );
    await waitFor(() => expect(revalidatePaths).toHaveBeenCalled());
    expect(vi.mocked(revalidatePaths).mock.calls[0][0]).toContain("/courses/MATH1081");
  });

  it("deletes a test without deleting its children by hand", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "remove" }));

    expect(screen.getByText("count:1")).toBeInTheDocument();
    await waitFor(() => expect(mock.calls.some((c) => c.op === "delete")).toBe(true));
    expect(mock.calls.filter((c) => c.op === "delete")).toHaveLength(1);
  });

  it("reorders through the RPC, not a table update", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "move" }));

    await waitFor(() => expect(mock.rpcCalls).toHaveLength(1));
    expect(mock.rpcCalls[0].fn).toBe("reorder_lab_tests");
    expect(mock.rpcCalls[0].args.p_ids).toHaveLength(2);
  });

  it("revalidates the course page after a reorder", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "move" }));

    // The course page is the one showing the order that just changed.
    await waitFor(() => expect(revalidatePaths).toHaveBeenCalled());
    expect(vi.mocked(revalidatePaths).mock.calls[0][0]).toContain("/courses/MATH1081");
  });

  it("revalidates both course pages when a test changes course", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "movecourse" }));

    await waitFor(() => expect(revalidatePaths).toHaveBeenCalled());
    const paths = vi.mocked(revalidatePaths).mock.calls[0][0];
    expect(paths).toContain("/courses/MATH1081");
    expect(paths).toContain("/courses/MATH1141");
  });

  it("surfaces an error and refetches when a write fails", async () => {
    await renderLoaded();
    mock.failNextWrite();
    await userEvent.click(screen.getByRole("button", { name: "add" }));

    // Optimistic add is rolled back by the refetch.
    await waitFor(() => expect(screen.getByText("count:2")).toBeInTheDocument());
    // ...and the reason survives it, rather than being cleared by load().
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("write failed")
    );
  });
});
