import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuestion } from "../src/questions.ts";

test("short_text maps to a single-line text question", () => {
  assert.deepEqual(buildQuestion({ type: "short_text", required: true }), {
    required: true,
    textQuestion: { paragraph: false },
  });
});

test("paragraph maps to a multi-line text question", () => {
  assert.deepEqual(buildQuestion({ type: "paragraph", required: false }).textQuestion, { paragraph: true });
});

test("choice types map to RADIO, CHECKBOX and DROP_DOWN", () => {
  const options = ["a", "b"];
  const type = (t: "multiple_choice" | "checkboxes" | "dropdown") =>
    (buildQuestion({ type: t, required: false, options }).choiceQuestion as any).type;
  assert.equal(type("multiple_choice"), "RADIO");
  assert.equal(type("checkboxes"), "CHECKBOX");
  assert.equal(type("dropdown"), "DROP_DOWN");
  assert.deepEqual(
    (buildQuestion({ type: "dropdown", required: false, options }).choiceQuestion as any).options,
    [{ value: "a" }, { value: "b" }]
  );
});

test("choice types require options", () => {
  assert.throws(() => buildQuestion({ type: "checkboxes", required: false }), /options/);
  assert.throws(() => buildQuestion({ type: "dropdown", required: false, options: [] }), /options/);
});

test("scale maps bounds and labels", () => {
  assert.deepEqual(
    buildQuestion({ type: "scale", required: false, scale_low: 1, scale_high: 5, scale_low_label: "Bad", scale_high_label: "Good" })
      .scaleQuestion,
    { low: 1, high: 5, lowLabel: "Bad", highLabel: "Good" }
  );
});

test("scale validates its bounds", () => {
  assert.throws(() => buildQuestion({ type: "scale", required: false }), /scale_low/);
  assert.throws(() => buildQuestion({ type: "scale", required: false, scale_low: 3, scale_high: 3 }), /greater/);
});

test("graded choice question gets points and correct answers", () => {
  const q = buildQuestion({ type: "multiple_choice", required: false, options: ["a", "b"], correct_answers: ["b"], points: 3 });
  assert.deepEqual(q.grading, { pointValue: 3, correctAnswers: { answers: [{ value: "b" }] } });
});

test("points default to 1 when correct answers are given", () => {
  const q = buildQuestion({ type: "short_text", required: false, correct_answers: ["Paris"] });
  assert.equal((q.grading as any).pointValue, 1);
});

test("grading validates answers against options and question type", () => {
  const base = { required: false, options: ["a", "b"] };
  assert.throws(() => buildQuestion({ ...base, type: "dropdown", correct_answers: ["z"] }), /not found/);
  assert.throws(() => buildQuestion({ ...base, type: "multiple_choice", correct_answers: ["a", "b"] }), /exactly one/);
  assert.doesNotThrow(() => buildQuestion({ ...base, type: "checkboxes", correct_answers: ["a", "b"] }));
  assert.throws(() => buildQuestion({ ...base, type: "dropdown", points: 2 }), /correct_answers/);
  assert.throws(() => buildQuestion({ type: "scale", required: false, scale_low: 1, scale_high: 5, points: 1 }), /can't be graded/);
  assert.throws(() => buildQuestion({ type: "paragraph", required: false, correct_answers: ["x"] }), /manually/);
});

test("ungraded questions have no grading block", () => {
  assert.equal(buildQuestion({ type: "short_text", required: false }).grading, undefined);
});
