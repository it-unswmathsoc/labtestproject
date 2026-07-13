// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStoreProvider, useAdminStore } from "../AdminStoreProvider";

function Harness() {
  const { content, addQuestion, addPart } = useAdminStore();
  const testId = content.labTests[0].id;
  const q = content.questions.filter((x) => x.labTestId === testId);
  const partCount = q.reduce((n, x) => n + x.parts.length, 0);
  return (
    <div>
      <span>questions:{q.length}</span>
      <span>parts:{partCount}</span>
      <button onClick={() => addQuestion(testId, { promptLatex: "New Q" })}>addq</button>
      <button
        onClick={() =>
          q[0] &&
          addPart(q[0].id, {
            label: "z",
            promptLatex: "New P",
            answerType: "integer",
            answerValue: 0,
          })
        }
      >
        addp
      </button>
    </div>
  );
}

describe("AdminStoreProvider question/part mutations", () => {
  it("adds a question and a part and persists them", async () => {
    render(
      <AdminStoreProvider>
        <Harness />
      </AdminStoreProvider>
    );
    const q0 = Number(screen.getByText(/questions:/).textContent?.replace("questions:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addq" }));
    expect(screen.getByText(`questions:${q0 + 1}`)).toBeInTheDocument();

    const p0 = Number(screen.getByText(/parts:/).textContent?.replace("parts:", ""));
    await userEvent.click(screen.getByRole("button", { name: "addp" }));
    expect(screen.getByText(`parts:${p0 + 1}`)).toBeInTheDocument();

    expect(window.localStorage.getItem("labtest:admin:content")).toContain('"New P"');
  });
});
