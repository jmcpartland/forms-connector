import { test } from "node:test";
import assert from "node:assert/strict";
import { questionLabels, readableResponses } from "../src/responses.ts";

const form = {
  items: [
    { title: "Name", questionItem: { question: { questionId: "q1" } } },
    { title: "Fruit", questionItem: { question: { questionId: "q2" } } },
    { title: "Name", questionItem: { question: { questionId: "q3" } } },
    { title: "Grid", questionGroupItem: { questions: [{ questionId: "r1", rowQuestion: { title: "Row A" } }] } },
  ],
};

test("labels are unique and include grid rows", () => {
  const l = questionLabels(form);
  assert.equal(l.get("q1"), "Name");
  assert.equal(l.get("q3"), "Name (2)");
  assert.equal(l.get("r1"), "Grid — Row A");
});

test("responses are keyed by question text", () => {
  const out = readableResponses(form, [
    {
      responseId: "r",
      createTime: "t1",
      lastSubmittedTime: "t2",
      respondentEmail: "a@b.c",
      totalScore: 3,
      answers: {
        q1: { textAnswers: { answers: [{ value: "Ada" }] } },
        q2: { textAnswers: { answers: [{ value: "x" }, { value: "y" }] }, grade: { score: 1, correct: true } },
        gone: { textAnswers: { answers: [{ value: "?" }] } },
      },
    },
  ]);
  assert.deepEqual(out[0], {
    responseId: "r",
    submittedAt: "t2",
    respondentEmail: "a@b.c",
    totalScore: 3,
    answers: { Name: "Ada", Fruit: ["x", "y"], "(deleted question gone)": "?" },
    grades: { Fruit: { score: 1, correct: true } },
  });
});

test("minimal responses omit optional fields", () => {
  const [r] = readableResponses(form, [{ responseId: "r", createTime: "t1", answers: {} }]);
  assert.deepEqual(r, { responseId: "r", submittedAt: "t1", answers: {} });
});
