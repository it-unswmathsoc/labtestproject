// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PartPlayer } from "../PartPlayer";
import type { QuestionPart } from "@/lib/data/types";

const basePart: QuestionPart = {
  id: "p1",
  questionId: "q1",
  label: "a",
  promptLatex: "Select all properties that hold.",
  answerType: "multi_select",
  answerValue: { selected: ["reflexive"] },
  answerConfig: { options: [{ value: "reflexive", label: "Reflexive" }] },
  sortOrder: 1,
  steps: [],
};

const noop = () => {};

function renderPart(part: QuestionPart) {
  return render(
    <PartPlayer
      part={part}
      solvedSteps={[]}
      solvedPart={false}
      onStepSolved={noop}
      onPartSolved={noop}
    />
  );
}

describe("PartPlayer", () => {
  it("renders a part diagram when imageUrl is set", () => {
    renderPart({
      ...basePart,
      imageUrl: "/questions/diagram.png",
      imageAlt: "An arrow diagram",
    });
    const img = screen.getByAltText("An arrow diagram");
    expect(img).toHaveAttribute("src", "/questions/diagram.png");
  });

  it("renders no image when imageUrl is absent", () => {
    renderPart(basePart);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
