// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerValueEditor } from "../AnswerValueEditor";

describe("AnswerValueEditor", () => {
  it("edits an integer answer", async () => {
    const onChange = vi.fn();
    render(
      <AnswerValueEditor
        answerType="integer"
        answerValue={0}
        onChange={onChange}
      />
    );
    await userEvent.clear(screen.getByLabelText(/correct answer/i));
    await userEvent.type(screen.getByLabelText(/correct answer/i), "19");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerType: "integer", answerValue: 19 })
    );
  });

  it("edits a set_of_integers answer from set() syntax", async () => {
    const onChange = vi.fn();
    render(
      <AnswerValueEditor answerType="set_of_integers" answerValue={[]} onChange={onChange} />
    );
    await userEvent.type(screen.getByLabelText(/correct answer/i), "set(6,7)");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerType: "set_of_integers", answerValue: [6, 7] })
    );
  });

  it("resets the value shape when the type changes", async () => {
    const onChange = vi.fn();
    render(<AnswerValueEditor answerType="integer" answerValue={5} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText(/answer type/i), "text");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerType: "text", answerValue: { text: "" } })
    );
  });

  it("edits a text answer", async () => {
    const onChange = vi.fn();
    render(
      <AnswerValueEditor answerType="text" answerValue={{ text: "" }} onChange={onChange} />
    );
    await userEvent.type(screen.getByLabelText(/correct answer/i), "Bijective");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ answerValue: { text: "Bijective" } })
    );
  });
});
