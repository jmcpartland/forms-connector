export type QuestionType = "short_text" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown" | "scale";

export interface QuestionArgs {
  type: QuestionType;
  required: boolean;
  options?: string[];
  scale_low?: number;
  scale_high?: number;
  scale_low_label?: string;
  scale_high_label?: string;
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
  return question;
}
