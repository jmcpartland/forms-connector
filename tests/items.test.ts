import { test } from "node:test";
import assert from "node:assert/strict";
import { applyItemChanges, buildItem, findItem } from "../src/questions.ts";

test("section becomes a page break with description", () => {
  assert.deepEqual(buildItem({ title: "Part 2", type: "section", required: false, description: "More" }), {
    title: "Part 2",
    description: "More",
    pageBreakItem: {},
  });
  assert.throws(() => buildItem({ title: "x", type: "section", required: false, points: 1 }), /Sections/);
});

test("description goes on the item, not the question", () => {
  const item = buildItem({ title: "Q", type: "short_text", required: false, description: "hint" });
  assert.equal(item.description, "hint");
  assert.equal((item.questionItem.question as any).description, undefined);
});

test("date and time questions", () => {
  assert.deepEqual(buildItem({ title: "d", type: "date", required: false }).questionItem.question.dateQuestion, {
    includeYear: true,
    includeTime: false,
  });
  assert.deepEqual(
    buildItem({ title: "d", type: "date", required: false, date_include_time: true }).questionItem.question.dateQuestion,
    { includeYear: true, includeTime: true }
  );
  assert.deepEqual(buildItem({ title: "t", type: "time", required: false, time_is_duration: true }).questionItem.question.timeQuestion, {
    duration: true,
  });
  assert.throws(() => buildItem({ title: "d", type: "date", required: false, points: 1 }), /can't be graded/);
});

test("shuffle and Other option", () => {
  const q = buildItem({ title: "c", type: "checkboxes", required: false, options: ["a", "b"], shuffle: true, include_other: true })
    .questionItem.question.choiceQuestion;
  assert.equal(q.shuffle, true);
  assert.deepEqual(q.options, [{ value: "a" }, { value: "b" }, { isOther: true }]);
  assert.throws(() => buildItem({ title: "c", type: "dropdown", required: false, options: ["a"], include_other: true }), /dropdown/);
});

const choiceItem = () => ({
  itemId: "i1",
  title: "Pick",
  questionItem: {
    question: {
      questionId: "q1",
      required: false,
      choiceQuestion: { type: "RADIO", options: [{ value: "a" }, { value: "b" }] },
    },
  },
});

test("applyItemChanges edits only what is passed and keeps IDs", () => {
  const out = applyItemChanges(choiceItem(), { title: "New", required: true });
  assert.equal(out.title, "New");
  assert.equal(out.itemId, "i1");
  assert.equal(out.questionItem.question.questionId, "q1");
  assert.equal(out.questionItem.question.required, true);
  assert.deepEqual(out.questionItem.question.choiceQuestion.options, [{ value: "a" }, { value: "b" }]);
});

test("applyItemChanges does not mutate its input", () => {
  const src = choiceItem();
  applyItemChanges(src, { title: "New", options: ["x"] });
  assert.equal(src.title, "Pick");
  assert.equal(src.questionItem.question.choiceQuestion.options.length, 2);
});

test("applyItemChanges replaces options, preserving a pre-existing Other", () => {
  const src: any = choiceItem();
  src.questionItem.question.choiceQuestion.options.push({ isOther: true });
  const out = applyItemChanges(src, { options: ["x", "y"] });
  assert.deepEqual(out.questionItem.question.choiceQuestion.options, [{ value: "x" }, { value: "y" }, { isOther: true }]);
  const noOther = applyItemChanges(src, { include_other: false });
  assert.deepEqual(noOther.questionItem.question.choiceQuestion.options, [{ value: "a" }, { value: "b" }]);
});

test("applyItemChanges grading validates against current options", () => {
  const out = applyItemChanges(choiceItem(), { correct_answers: ["b"], points: 2 });
  assert.deepEqual(out.questionItem.question.grading, { pointValue: 2, correctAnswers: { answers: [{ value: "b" }] } });
  assert.throws(() => applyItemChanges(choiceItem(), { correct_answers: ["z"] }), /not found/);
});

test("changing options must keep existing correct answers", () => {
  const graded = applyItemChanges(choiceItem(), { correct_answers: ["b"] });
  assert.throws(() => applyItemChanges(graded, { options: ["a", "c"] }), /correct answer/);
  assert.doesNotThrow(() => applyItemChanges(graded, { options: ["a", "c"], correct_answers: ["c"] }));
});

test("applyItemChanges rejects edits that don't fit the item", () => {
  const section = { itemId: "s", title: "S", pageBreakItem: {} };
  assert.equal(applyItemChanges(section, { title: "T" }).title, "T");
  assert.throws(() => applyItemChanges(section, { required: true }), /section or text/);
  const text = { itemId: "t", title: "T", questionItem: { question: { questionId: "q", textQuestion: {} } } };
  assert.throws(() => applyItemChanges(text, { options: ["a"] }), /choice/);
  assert.throws(() => applyItemChanges(text, { scale_low_label: "x" }), /scale/i);
});

test("findItem locates by itemId or explains", () => {
  const form = { items: [{ itemId: "a" }, { itemId: "b" }] };
  assert.equal(findItem(form, "b").index, 1);
  assert.throws(() => findItem(form, "zz"), /get_form/);
  assert.throws(() => findItem({}, "a"), /get_form/);
});
