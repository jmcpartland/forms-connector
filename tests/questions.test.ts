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
