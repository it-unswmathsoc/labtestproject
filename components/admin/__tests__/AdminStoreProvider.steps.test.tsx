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
  const { content, addStep, addHint, moveSteps } = useAdminStore();
  const part = content.questions.flatMap((q) => q.parts)[0];
  const steps = part?.steps ?? [];
  const hintCount = steps.reduce((n, s) => n + s.hints.length, 0);
  return (
    <div>
      <span>steps:{steps.length}</span>
      <span>hints:{hintCount}</span>
      <button
        onClick={() =>
          addStep(part.id, {
            promptLatex: "S",
            answerType: "integer",
            answerValue: 1,
            explanationLatex: "E",
          })
        }
      >
        adds
      </button>
      <button onClick={() => steps[0] && addHint(steps[0].id, { bodyLatex: "H" })}>
        addh
      </button>
      <button
        onClick={() => moveSteps(part.id, steps.map((s) => s.id).reverse())}
      >
        moves
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
    expect(screen.getByText(/steps:/).textContent).not.toBe("steps:0")
  );
}

beforeEach(() => {
  mock.reset();
  mock.seed(seedContent());
});

describe("AdminStoreProvider step/hint mutations", () => {
  it("adds a step and persists it", async () => {
    await renderLoaded();
    const before = Number(screen.getByText(/steps:/).textContent!.replace("steps:", ""));
    await userEvent.click(screen.getByRole("button", { name: "adds" }));
    expect(screen.getByText(`steps:${before + 1}`)).toBeInTheDocument();

    await waitFor(() => expect(mock.calls).toHaveLength(1));
    expect(mock.calls[0].table).toBe("steps");
    expect(mock.calls[0].payload).toMatchObject({
      prompt_latex: "S",
      explanation_latex: "E",
    });
  });

  it("adds a hint under a step", async () => {
    await renderLoaded();
    const before = Number(screen.getByText(/hints:/).textContent!.replace("hints:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addh" }));
    expect(screen.getByText(`hints:${before + 1}`)).toBeInTheDocument();

    await waitFor(() => expect(mock.calls).toHaveLength(1));
    expect(mock.calls[0].table).toBe("hints");
    expect(mock.calls[0].payload).toMatchObject({ body_latex: "H" });
  });

  it("reorders steps through reorder_steps", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: "moves" }));

    await waitFor(() => expect(mock.rpcCalls).toHaveLength(1));
    expect(mock.rpcCalls[0].fn).toBe("reorder_steps");
    expect(mock.rpcCalls[0].args.p_ids).toHaveLength(2);
  });
});
