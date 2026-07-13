// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStoreProvider, useAdminStore } from "../AdminStoreProvider";

function Harness() {
  const { content, addQuestion, addPart, addStep, addHint } = useAdminStore();
  const testId = content.labTests[0].id;
  // Ensure a question + part exist to attach a step to.
  const q = content.questions.find((x) => x.labTestId === testId);
  const part = q?.parts[0];
  const step = part?.steps[0];
  const stepCount = q?.parts.reduce((n, p) => n + p.steps.length, 0) ?? 0;
  const hintCount = step?.hints.length ?? 0;
  return (
    <div>
      <span>steps:{stepCount}</span>
      <span>hints:{hintCount}</span>
      <button onClick={() => addQuestion(testId, { promptLatex: "Q" })}>q</button>
      <button onClick={() => part && addStep(part.id, { promptLatex: "S", answerType: "integer", answerValue: 0, explanationLatex: "" })}>s</button>
      <button onClick={() => step && addHint(step.id, { bodyLatex: "H" })}>h</button>
      <button onClick={() => q && addPart(q.id, { label: "a", promptLatex: "P", answerType: "integer", answerValue: 0 })}>p</button>
    </div>
  );
}

describe("AdminStoreProvider step/hint mutations", () => {
  it("adds a step and a hint and persists them", async () => {
    render(
      <AdminStoreProvider>
        <Harness />
      </AdminStoreProvider>
    );
    // First existing question already has a part with a step (fixture Q1a),
    // so we can add a hint directly and a step to that part.
    const s0 = Number(screen.getByText(/steps:/).textContent?.replace("steps:", ""));
    await userEvent.click(screen.getByRole("button", { name: "s" }));
    expect(screen.getByText(`steps:${s0 + 1}`)).toBeInTheDocument();

    const h0 = Number(screen.getByText(/hints:/).textContent?.replace("hints:", ""));
    await userEvent.click(screen.getByRole("button", { name: "h" }));
    expect(screen.getByText(`hints:${h0 + 1}`)).toBeInTheDocument();

    expect(window.localStorage.getItem("labtest:admin:content")).toContain('"S"');
  });
});
