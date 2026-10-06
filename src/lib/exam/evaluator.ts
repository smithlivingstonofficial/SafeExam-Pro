/**
 * Exam Scoring and Answer Evaluation Engine for SafeExam Pro
 * Authoritative, universal evaluator for DB questions and sample dataset.
 */

export interface ParsedCorrectAnswer {
  targetOptId: string | null;
  targetOptIds: string[];
  targetNumeric: number | null;
  explanation: string | null;
}

export interface QuestionEvaluationResult {
  isAttempted: boolean;
  isCorrect: boolean;
  awardedMarks: number;
  selectedOptionId: string | null;
  selectedOptionIds: string[] | null;
  numericalValue: string | null;
  descriptiveText: string | null;
  correctOptionId: string | null;
  correctOptionIds: string[] | null;
  correctNumericValue: number | null;
  explanation: string | null;
}

/**
 * Universally extracts the correct answer from any DB question or schema variant
 */
export function extractQuestionCorrectAnswer(q: {
  type?: string;
  correct_answer?: unknown;
  correctAnswer?: unknown;
  options?: unknown;
  explanation?: unknown;
}): ParsedCorrectAnswer {
  let targetOptId: string | null = null;
  let targetOptIds: string[] = [];
  let targetNumeric: number | null = null;
  let explanation: string | null = null;

  const rawOptions = Array.isArray(q.options) ? (q.options as Array<any>) : [];
  const correctObj = q.correct_answer !== undefined ? q.correct_answer : q.correctAnswer;

  if (typeof q.explanation === "string") {
    explanation = q.explanation;
  }

  if (typeof correctObj === "string") {
    const trimmed = correctObj.trim();
    targetOptId = trimmed;
    targetOptIds = [trimmed];
    const num = parseFloat(trimmed);
    if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      targetNumeric = num;
    }
  } else if (typeof correctObj === "number") {
    targetNumeric = correctObj;
    targetOptId = String(correctObj);
  } else if (Array.isArray(correctObj)) {
    targetOptIds = correctObj.map((item) => String(item).trim());
    if (targetOptIds.length > 0) {
      targetOptId = targetOptIds[0];
    }
  } else if (correctObj && typeof correctObj === "object") {
    const obj = correctObj as Record<string, any>;
    if (typeof obj.optionId === "string") {
      targetOptId = obj.optionId.trim();
      if (!targetOptIds.includes(targetOptId)) targetOptIds.push(targetOptId);
    }
    if (Array.isArray(obj.optionIds)) {
      obj.optionIds.forEach((id: any) => {
        const s = String(id).trim();
        if (s && !targetOptIds.includes(s)) targetOptIds.push(s);
      });
      if (!targetOptId && targetOptIds.length > 0) {
        targetOptId = targetOptIds[0];
      }
    }
    if (typeof obj.numericValue === "number") targetNumeric = obj.numericValue;
    else if (typeof obj.value === "number") targetNumeric = obj.value;
    else if (typeof obj.value === "string") {
      const parsed = parseFloat(obj.value);
      if (!isNaN(parsed)) targetNumeric = parsed;
    }
    if (typeof obj.explanation === "string") explanation = obj.explanation;
  }

  // Fallback: check options array for isCorrect / is_correct flag
  if (!targetOptId && targetOptIds.length === 0) {
    const correctOptions = rawOptions.filter(
      (opt) => opt.isCorrect === true || opt.is_correct === true || opt.correct === true
    );
    if (correctOptions.length > 0) {
      targetOptIds = correctOptions.map((opt) => String(opt.id || opt.label || "").trim());
      targetOptId = targetOptIds[0] || null;
    }
  }

  return { targetOptId, targetOptIds, targetNumeric, explanation };
}

/**
 * Evaluates a single candidate answer against a question's marking scheme
 */
export function evaluateCandidateAnswer(
  q: {
    type: string;
    correct_answer?: unknown;
    correctAnswer?: unknown;
    options?: unknown;
    explanation?: unknown;
  },
  userResponse: Record<string, unknown> | undefined,
  marks: number = 1,
  negativeMarks: number = 0
): QuestionEvaluationResult {
  const { targetOptId, targetOptIds, targetNumeric, explanation } = extractQuestionCorrectAnswer(q);

  const selectedOptId = userResponse?.selectedOptionId
    ? String(userResponse.selectedOptionId).trim()
    : userResponse?.selectedOption
    ? String(userResponse.selectedOption).trim()
    : userResponse?.optionId
    ? String(userResponse.optionId).trim()
    : null;

  const rawSelectedOptIds =
    Array.isArray(userResponse?.selectedOptionIds) ? userResponse.selectedOptionIds :
    Array.isArray(userResponse?.selectedOptions) ? userResponse.selectedOptions : null;

  const selectedOptIds = rawSelectedOptIds ? rawSelectedOptIds.map((id: any) => String(id).trim()) : null;

  const numericVal =
    userResponse?.numericalValue !== undefined
      ? String(userResponse.numericalValue).trim()
      : userResponse?.numericValue !== undefined
      ? String(userResponse.numericValue).trim()
      : null;

  const descriptive = userResponse?.descriptiveText
    ? String(userResponse.descriptiveText).trim()
    : userResponse?.text
    ? String(userResponse.text).trim()
    : null;

  const isAttempted = Boolean(
    selectedOptId ||
      (selectedOptIds && selectedOptIds.length > 0) ||
      (numericVal && numericVal.length > 0) ||
      (descriptive && descriptive.length > 0)
  );

  let isCorrect = false;
  let awardedMarks = 0;

  if (q.type === "mcq_single" || q.type === "true_false") {
    if (selectedOptId && targetOptId) {
      if (selectedOptId.toUpperCase() === targetOptId.toUpperCase()) {
        isCorrect = true;
        awardedMarks = marks;
      } else {
        awardedMarks = -negativeMarks;
      }
    } else if (selectedOptId) {
      awardedMarks = -negativeMarks;
    }
  } else if (q.type === "mcq_multiple") {
    if (selectedOptIds && selectedOptIds.length > 0) {
      const userSet = new Set(selectedOptIds.map((s) => s.toUpperCase()));
      const targetSet = new Set(targetOptIds.map((s) => s.toUpperCase()));

      const isExactMatch =
        userSet.size > 0 &&
        userSet.size === targetSet.size &&
        [...userSet].every((val) => targetSet.has(val));

      if (isExactMatch) {
        isCorrect = true;
        awardedMarks = marks;
      } else {
        awardedMarks = -negativeMarks;
      }
    }
  } else if (q.type === "numerical") {
    if (numericVal !== null && targetNumeric !== null) {
      const numParsed = parseFloat(numericVal);
      if (!isNaN(numParsed) && Math.abs(numParsed - targetNumeric) < 0.001) {
        isCorrect = true;
        awardedMarks = marks;
      } else if (!isNaN(numParsed)) {
        awardedMarks = -negativeMarks;
      }
    }
  }

  return {
    isAttempted,
    isCorrect,
    awardedMarks,
    selectedOptionId: selectedOptId,
    selectedOptionIds: selectedOptIds,
    numericalValue: numericVal,
    descriptiveText: descriptive,
    correctOptionId: targetOptId,
    correctOptionIds: targetOptIds.length > 0 ? targetOptIds : null,
    correctNumericValue: targetNumeric,
    explanation,
  };
}
