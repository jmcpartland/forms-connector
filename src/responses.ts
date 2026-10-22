type Json = Record<string, any>;

/** questionId -> unique, human-readable label, built from a form as returned by get_form. */
export function questionLabels(form: Json): Map<string, string> {
  const labels = new Map<string, string>();
  const used = new Map<string, number>();
  const add = (id: string | undefined, label: string) => {
    if (!id) return;
    const n = (used.get(label) ?? 0) + 1;
    used.set(label, n);
    labels.set(id, n === 1 ? label : `${label} (${n})`);
  };
  for (const item of form.items ?? []) {
    const title = item.title ?? "(untitled)";
    if (item.questionItem?.question) add(item.questionItem.question.questionId, title);
    // Grid questions: one row question per row.
    for (const q of item.questionGroupItem?.questions ?? []) {
      add(q.questionId, `${title} — ${q.rowQuestion?.title ?? "row"}`);
    }
  }
  return labels;
}

/** Reshape raw Forms API responses so answers are keyed by question text instead of question ID. */
export function readableResponses(form: Json, responses: Json[]): Json[] {
  const labels = questionLabels(form);
  return responses.map((r) => {
    const answers: Json = {};
    const grades: Json = {};
    for (const [qid, a] of Object.entries<Json>(r.answers ?? {})) {
      const label = labels.get(qid) ?? `(deleted question ${qid})`;
      const values: string[] =
        a.textAnswers?.answers?.map((x: Json) => x.value) ??
        a.fileUploadAnswers?.answers?.map((x: Json) => `${x.fileName} (Drive file ${x.fileId})`) ??
        [];
      answers[label] = values.length === 1 ? values[0] : values;
      if (a.grade) grades[label] = { score: a.grade.score ?? 0, correct: a.grade.correct ?? false };
    }
    return {
      responseId: r.responseId,
      submittedAt: r.lastSubmittedTime ?? r.createTime,
      ...(r.respondentEmail ? { respondentEmail: r.respondentEmail } : {}),
      ...(r.totalScore !== undefined ? { totalScore: r.totalScore } : {}),
      answers,
      ...(Object.keys(grades).length ? { grades } : {}),
    };
  });
}
