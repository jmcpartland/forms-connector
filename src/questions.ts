export type QuestionType = "short_text" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown" | "scale";

export interface QuestionArgs {
  type: QuestionType;
  required: boolean;
  options?: string[];
  scale_low?: number;
  scale_high?: number;
  scale_low_label?: string;
  scale_high_label?: string;
  /** Quiz grading: points for a correct answer (defaults to 1 when correct_answers is set). */
  points?: number;
  /** Quiz grading: the correct answer(s). Must match option text for choice questions. */
  correct_answers?: string[];
}

/** Map our tool arguments to a Google Forms API `Question` object. */
export function buildQuestion(a: QuestionArgs): Record<string, unknown> {
  const question: Record<string, unknown> = { required: a.required };
  switch (a.type) {
    case "short_text":
      question.textQuestion = { paragraph: false };
      break;
    case "paragraph":
      question.textQuestion = { paragraph: true };
      break;
    case "multiple_choice":
    case "checkboxes":
    case "dropdown": {
      if (!a.options?.length) throw new Error(`"options" is required for ${a.type}`);
      question.choiceQuestion = {
        type: a.type === "multiple_choice" ? "RADIO" : a.type === "checkboxes" ? "CHECKBOX" : "DROP_DOWN",
        options: a.options.map((value) => ({ value })),
      };
      break;
    }
    case "scale":
      if (a.scale_low === undefined || a.scale_high === undefined)
        throw new Error('"scale_low" and "scale_high" are required for scale');
      if (a.scale_high <= a.scale_low) throw new Error('"scale_high" must be greater than "scale_low"');
      question.scaleQuestion = {
        low: a.scale_low,
        high: a.scale_high,
        lowLabel: a.scale_low_label,
        highLabel: a.scale_high_label,
      };
      break;
  }
  const grading = buildGrading(a);
  if (grading) question.grading = grading;
  return question;
}

/** Quiz grading for a question, or undefined when none was requested. */
function buildGrading(a: QuestionArgs): Record<string, unknown> | undefined {
  const answers = a.correct_answers;
  if (!answers?.length && a.points === undefined) return undefined;
  if (a.type === "scale") throw new Error("Scale questions can't be graded");

  const isChoice = a.type === "multiple_choice" || a.type === "checkboxes" || a.type === "dropdown";
  if (isChoice) {
    if (!answers?.length) throw new Error('"correct_answers" is required to grade a choice question');
    const missing = answers.filter((x) => !a.options!.includes(x));
    if (missing.length) throw new Error(`correct_answers not found in options: ${missing.join(", ")}`);
    if (a.type !== "checkboxes" && answers.length !== 1) {
      throw new Error(`${a.type} questions take exactly one correct answer`);
    }
  } else if (a.type === "paragraph" && answers?.length) {
    throw new Error("Paragraph answers can't be auto-graded; set points only and grade manually");
  }

  const grading: Record<string, unknown> = { pointValue: a.points ?? 1 };
  if (answers?.length) grading.correctAnswers = { answers: answers.map((value) => ({ value })) };
  return grading;
}
