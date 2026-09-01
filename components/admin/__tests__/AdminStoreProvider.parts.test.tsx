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
const { AdminStoreProvider, useAdminStore } = await import("../AdminStoreProvider");

function Harness() {
  const { content, addQuestion, addPart, removeQuestion } = useAdminStore();
  const testId = content.labTests[0]?.id;
  const q = content.questions.filter((x) => x.labTestId === testId);
  const partCount = q.reduce((n, x) => n + x.parts.length, 0);
  return (
    <div>
      <span>questions:{q.length}</span>
      <span>parts:{partCount}</span>
      <button onClick={() => addQuestion(testId, { promptLatex: "New Q" })}>addq</button>
      <button
        onClick={() =>
          q.length > 0 &&
          addPart(q[q.length - 1].id, {
            label: "z",
            promptLatex: "New P",
            answerType: "integer",
            answerValue: 0,
          })
        }
      >
        addp
      </button>
      <button onClick={() => q[0] && removeQuestion(q[0].id)}>removeq</button>
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
    expect(screen.getByText(/questions:/).textContent).not.toBe("questions:0")
  );
}

beforeEach(() => {
  mock.reset();
  mock.seed(seedContent());
});

describe("AdminStoreProvider question/part mutations", () => {
  it("adds a question and a part, inserting each into its own table", async () => {
    await renderLoaded();
    const q0 = Number(screen.getByText(/questions:/).textContent!.replace("questions:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addq" }));
    expect(screen.getByText(`questions:${q0 + 1}`)).toBeInTheDocument();

    const p0 = Number(screen.getByText(/parts:/).textContent!.replace("parts:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addp" }));
    expect(screen.getByText(`parts:${p0 + 1}`)).toBeInTheDocument();

    await waitFor(() => expect(mock.calls).toHaveLength(2));
    expect(mock.calls.map((c) => c.table)).toEqual(["questions", "question_parts"]);
    expect(mock.calls[1].payload).toMatchObject({
      prompt_latex: "New P",
      answer_type: "integer",
    });
  });

  it("serialises a child insert after its parent insert", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "addq" }));
    await userEvent.click(screen.getByRole("button", { name: "addp" }));

    await waitFor(() => expect(mock.calls).toHaveLength(2));
    const [question, part] = mock.calls;
    expect(question.table).toBe("questions");
    expect(part.payload!.question_id).toBe(question.payload!.id);
  });

  it("deletes a question with one delete, relying on the cascade", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "removeq" }));

    await waitFor(() => expect(mock.calls.some((c) => c.op === "delete")).toBe(true));
    const deletes = mock.calls.filter((c) => c.op === "delete");
    expect(deletes).toHaveLength(1);
    expect(deletes[0].table).toBe("questions");
  });
});
