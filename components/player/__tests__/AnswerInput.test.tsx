// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerInput } from "../AnswerInput";
import type { InputValue } from "../input-value";

describe("AnswerInput", () => {
  it("renders a text box for integer answers and accumulates typing", async () => {
    // AnswerInput is a controlled input, so the harness owns the value state —
    // testing it with a static value="" would reset the box on every keystroke.
    function Harness() {
      const [value, setValue] = useState<InputValue>("");
      return (
        <AnswerInput answerType="integer" name="s1" value={value} onChange={setValue} />
      );
    }
    render(<Harness />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "19");
    expect(box).toHaveValue("19");
  });

  it("renders radios for single_choice and reports the chosen value", async () => {
    const onChange = vi.fn();
    render(
      <AnswerInput
        answerType="single_choice"
        name="s2"
        value=""
        onChange={onChange}
        config={{
          options: [
            { value: "injective", label: "injective" },
            { value: "not_surjective", label: "not surjective" },
          ],
        }}
      />
    );
    await userEvent.click(screen.getByLabelText("not surjective"));
    expect(onChange).toHaveBeenCalledWith("not_surjective");
  });

  it("renders checkboxes for multi_select and toggles values in an array", async () => {
    const onChange = vi.fn();
    render(
      <AnswerInput
        answerType="multi_select"
        name="s3"
        value={[]}
        onChange={onChange}
        config={{
          options: [
            { value: "reflexive", label: "Reflexive" },
            { value: "symmetric", label: "Symmetric" },
          ],
        }}
      />
    );
    await userEvent.click(screen.getByLabelText("Reflexive"));
    expect(onChange).toHaveBeenCalledWith(["reflexive"]);
  });
});
