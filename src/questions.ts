export type QuestionType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "scale"
  | "date"
  | "time"
  | "section";

export interface QuestionArgs {
  title: string;
  type: QuestionType;
  required: boolean;
  /** Help text shown under the question (or the section's description). */
  description?: string;
  options?: string[];
  /** Randomize the order of choices (multiple_choice, checkboxes, dropdown). */
  shuffle?: boolean;
  /** Add an "Other" free-text choice (multiple_choice and checkboxes only). */
  include_other?: boolean;
  scale_low?: number;
  scale_high?: number;
  scale_low_label?: string;
  scale_high_label?: string;
  /** date: also ask for a time of day. */
  date_include_time?: boolean;
  /** time: ask for a duration instead of a time of day. */
  time_is_duration?: boolean;
  /** Quiz grading: points for a correct answer (defaults to 1 when correct_answers is set). */
  points?: number;
  /** Quiz grading: the correct answer(s). Must match option text for choice questions. */
  correct_answers?: string[];
}

type Item = Record<string, any>;

const CHOICE_TYPES = ["multiple_choice", "checkboxes", "dropdown"] as const;
const isChoice = (t: QuestionType) => (CHOICE_TYPES as readonly string[]).includes(t);

/** Map our tool arguments to a Google Forms API `Item` (a question or a section break). */
export function buildItem(a: QuestionArgs): Item {
  const item: Item = { title: a.title };
  if (a.description !== undefined) item.description = a.description;

  if (a.type === "section") {
    if (a.options?.length || a.correct_answers?.length || a.points !== undefined) {
      throw new Error("Sections can't have options or grading");
    }
    item.pageBreakItem = {};
    return item;
  }
  item.questionItem = { question: buildQuestion(a) };
  return item;
}

/** Map our tool arguments to a Google Forms API `Question` object. */
export function buildQuestion(a: Omit<QuestionArgs, "title">): Record<string, unknown> {
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
      if (a.include_other && a.type === "dropdown") throw new Error('"include_other" is not available for dropdown');
      const options: Record<string, unknown>[] = a.options.map((value) => ({ value }));
      if (a.include_other) options.push({ isOther: true });
      question.choiceQuestion = {
        type: a.type === "multiple_choice" ? "RADIO" : a.type === "checkboxes" ? "CHECKBOX" : "DROP_DOWN",
        options,
        ...(a.shuffle !== undefined ? { shuffle: a.shuffle } : {}),
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
    case "date":
      question.dateQuestion = { includeYear: true, includeTime: a.date_include_time ?? false };
      break;
    case "time":
      question.timeQuestion = { duration: a.time_is_duration ?? false };
      break;
    default:
      throw new Error(`Unknown question type: ${a.type}`);
  }
  const grading = buildGrading(a.type, a.options, a.correct_answers, a.points);
  if (grading) question.grading = grading;
  return question;
}

/** Quiz grading for a question, or undefined when none was requested. */
function buildGrading(
  type: QuestionType,
  options: string[] | undefined,
  answers: string[] | undefined,
  points: number | undefined
): Record<string, unknown> | undefined {
  if (!answers?.length && points === undefined) return undefined;
  if (type === "scale" || type === "date" || type === "time" || type === "section") {
    throw new Error(`${type} questions can't be graded`);
  }

  if (isChoice(type)) {
    if (!answers?.length) throw new Error('"correct_answers" is required to grade a choice question');
    const missing = answers.filter((x) => !options?.includes(x));
    if (missing.length) throw new Error(`correct_answers not found in options: ${missing.join(", ")}`);
    if (type !== "checkboxes" && answers.length !== 1) {
      throw new Error(`${type} questions take exactly one correct answer`);
    }
  } else if (type === "paragraph" && answers?.length) {
    throw new Error("Paragraph answers can't be auto-graded; set points only and grade manually");
  }

  const grading: Record<string, unknown> = { pointValue: points ?? 1 };
  if (answers?.length) grading.correctAnswers = { answers: answers.map((value) => ({ value })) };
  return grading;
}

export interface QuestionChanges {
  title?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  shuffle?: boolean;
  include_other?: boolean;
  scale_low_label?: string;
  scale_high_label?: string;
  points?: number;
  correct_answers?: string[];
}

function typeOf(question: Item): QuestionType {
  if (question.choiceQuestion) {
    const t = question.choiceQuestion.type;
    return t === "RADIO" ? "multiple_choice" : t === "CHECKBOX" ? "checkboxes" : "dropdown";
  }
  if (question.textQuestion) return question.textQuestion.paragraph ? "paragraph" : "short_text";
  if (question.scaleQuestion) return "scale";
  if (question.dateQuestion) return "date";
  if (question.timeQuestion) return "time";
  throw new Error("This question type can't be edited with this tool");
}

/**
 * Apply edits to an existing form item (as returned by get_form) and return the full replacement item.
 * The question type can't change: delete the item and add a new one for that.
 */
export function applyItemChanges(existing: Item, changes: QuestionChanges): Item {
  const item: Item = structuredClone(existing);
  if (changes.title !== undefined) item.title = changes.title;
  if (changes.description !== undefined) item.description = changes.description;

  const question: Item | undefined = item.questionItem?.question;
  const touchesQuestion = Object.entries(changes).some(
    ([k, v]) => v !== undefined && k !== "title" && k !== "description"
  );
  if (!question) {
    if (touchesQuestion) throw new Error("Only the title and description can be changed on a section or text item");
    return item;
  }

  if (changes.required !== undefined) question.required = changes.required;

  const type = typeOf(question);
  const touchesChoices =
    changes.options !== undefined || changes.shuffle !== undefined || changes.include_other !== undefined;
  if (touchesChoices) {
    if (!isChoice(type)) throw new Error("options, shuffle and include_other only apply to choice questions");
    const cq = question.choiceQuestion;
    const currentValues: string[] = cq.options.filter((o: Item) => !o.isOther).map((o: Item) => o.value);
    const hadOther = cq.options.some((o: Item) => o.isOther);
    const values = changes.options ?? currentValues;
    if (!values.length) throw new Error('"options" can\'t be empty');
    const other = changes.include_other ?? hadOther;
    if (other && type === "dropdown") throw new Error('"include_other" is not available for dropdown');
    cq.options = [...values.map((value) => ({ value })), ...(other ? [{ isOther: true }] : [])];
    if (changes.shuffle !== undefined) cq.shuffle = changes.shuffle;
  }

  if (changes.scale_low_label !== undefined || changes.scale_high_label !== undefined) {
    if (type !== "scale") throw new Error("Scale labels only apply to scale questions");
    if (changes.scale_low_label !== undefined) question.scaleQuestion.lowLabel = changes.scale_low_label;
    if (changes.scale_high_label !== undefined) question.scaleQuestion.highLabel = changes.scale_high_label;
  }

  if (changes.points !== undefined || changes.correct_answers !== undefined) {
    const optionValues: string[] | undefined = question.choiceQuestion?.options
      ?.filter((o: Item) => !o.isOther)
      .map((o: Item) => o.value);
    const prev = question.grading;
    const answers =
      changes.correct_answers ?? (prev?.correctAnswers?.answers ?? []).map((x: Item) => x.value);
    const grading = buildGrading(type, optionValues, answers, changes.points ?? prev?.pointValue);
    if (grading) question.grading = grading;
  } else if (touchesChoices && question.grading?.correctAnswers && question.choiceQuestion) {
    // Edited options must still contain the existing correct answers.
    const values = question.choiceQuestion.options.filter((o: Item) => !o.isOther).map((o: Item) => o.value);
    const stale = question.grading.correctAnswers.answers.filter((x: Item) => !values.includes(x.value));
    if (stale.length) {
      throw new Error(
        `Options no longer include the correct answer(s): ${stale.map((x: Item) => x.value).join(", ")}. ` +
          "Pass correct_answers too."
      );
    }
  }
  return item;
}

export interface FoundItem {
  item: Item;
  index: number;
}

/** Locate an item by its itemId (from get_form). */
export function findItem(form: { items?: Item[] }, itemId: string): FoundItem {
  const items = form.items ?? [];
  const index = items.findIndex((i) => i.itemId === itemId);
  if (index < 0) {
    throw new Error(`No item with item_id "${itemId}". Use get_form to see the current item IDs.`);
  }
  return { item: items[index], index };
}
