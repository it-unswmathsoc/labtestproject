// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStoreProvider, useAdminStore } from "../AdminStoreProvider";

function Harness() {
  const { content, addTest } = useAdminStore();
  const count = content.labTests.length;
  return (
    <div>
      <span>count:{count}</span>
      <button
        type="button"
        onClick={() =>
          addTest({ courseId: content.courses[0].id, name: "New", isPublished: false })
        }
      >
        add
      </button>
    </div>
  );
}

describe("AdminStoreProvider", () => {
  it("exposes seeded content and persists an added test", async () => {
    render(
      <AdminStoreProvider>
        <Harness />
      </AdminStoreProvider>
    );
    const before = Number(
      screen.getByText(/count:/).textContent?.replace("count:", "")
    );
    await userEvent.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByText(`count:${before + 1}`)).toBeInTheDocument();
    expect(window.localStorage.getItem("labtest:admin:content")).toContain('"New"');
  });
});
