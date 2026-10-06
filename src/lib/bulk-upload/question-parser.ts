import { BulkQuestionItemInput } from "@/lib/validations/examiner";

export interface ParsedQuestionRow {
  raw: Record<string, string>;
  parsed?: BulkQuestionItemInput;
  isValid: boolean;
  errors: string[];
}

/**
 * Parses raw text in Aiken format into structured questions
 */
export function parseAikenFormat(
  text: string,
  defaultSubject = "General",
  defaultBankIsCommon = true,
  defaultDepartmentId?: string | null
): ParsedQuestionRow[] {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const results: ParsedQuestionRow[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (lines.length < 3) {
      results.push({
        raw: { text: block },
        isValid: false,
        errors: ["Incomplete question block (requires statement, options, and ANSWER)"],
      });
      continue;
    }

    // Find answer line (e.g. "ANSWER: B" or "ANS: A")
    let answerIndex = -1;
    let answerLetter = "";

    for (let l = lines.length - 1; l >= 0; l--) {
      const match = lines[l].match(/^(?:ANSWER|ANS)\s*:\s*([A-Za-z,\s]+)/i);
      if (match) {
        answerIndex = l;
        answerLetter = match[1].trim().toUpperCase();
        break;
      }
    }

    if (answerIndex === -1 || !answerLetter) {
      results.push({
        raw: { text: block },
        isValid: false,
        errors: ["Missing 'ANSWER: X' line"],
      });
      continue;
    }

    // Options are lines between question and answer
    const optionLines = lines.slice(1, answerIndex);
    const options: Array<{ id: string; text: string; isCorrect: boolean }> = [];
    const questionStatement = lines.slice(0, 1).join(" ").trim();

    const correctLetters = answerLetter.split(/[\s,]+/).map((s) => s.trim().toUpperCase());

    for (const optLine of optionLines) {
      const optMatch = optLine.match(/^([A-Za-z])[\.\)]\s*(.+)/);
      if (optMatch) {
        const letter = optMatch[1].toUpperCase();
        const optText = optMatch[2].trim();
        options.push({
          id: letter,
          text: optText,
          isCorrect: correctLetters.includes(letter),
        });
      }
    }

    if (options.length < 2) {
      results.push({
        raw: { text: block },
        isValid: false,
        errors: ["Question must provide at least two choices (A, B)"],
      });
      continue;
    }

    const hasCorrect = options.some((o) => o.isCorrect);
    if (!hasCorrect) {
      results.push({
        raw: { text: block },
        isValid: false,
        errors: [`Answer letter '${answerLetter}' does not match any provided options`],
      });
      continue;
    }

    const isMultiple = correctLetters.length > 1;

    // Scope detection for Aiken
    let isCommon = defaultBankIsCommon;
    const lowerStatement = questionStatement.toLowerCase();
    if (lowerStatement.includes("[dept specific") || lowerStatement.includes("[part b]")) {
      isCommon = false;
    } else if (lowerStatement.includes("[common") || lowerStatement.includes("[part a]")) {
      isCommon = true;
    }

    results.push({
      raw: {
        questionText: questionStatement,
        answer: answerLetter,
        optionsCount: String(options.length),
      },
      isValid: true,
      errors: [],
      parsed: {
        questionText: questionStatement,
        type: isMultiple ? "mcq_multiple" : "mcq_single",
        options,
        subject: defaultSubject,
        difficulty: 2,
        isCommon,
        departmentId: isCommon ? undefined : (defaultDepartmentId || undefined),
      },
    });
  }

  return results;
}

export interface DepartmentReference {
  id: string;
  name: string;
  code: string | null;
}

/**
 * Validates a CSV row into a structured Question item with department & scope detection
 */
export function validateQuestionCsvRow(
  row: Record<string, string>,
  defaultSubject = "General",
  defaultBankIsCommon = true,
  defaultDepartmentId?: string | null,
  departments: DepartmentReference[] = []
): { isValid: boolean; errors: string[]; parsed?: BulkQuestionItemInput } {
  const errors: string[] = [];

  const text = (row.questionText || row.question || row.statement || row["Question Statement"] || "").trim();
  if (!text || text.length < 5) {
    errors.push("Question statement must be at least 5 characters long");
  }

  // Determine type
  let rawType = (row.questionType || row.type || row["Question Type"] || "mcq_single").toLowerCase().trim();
  if (rawType === "single_choice" || rawType === "mcq" || rawType === "single") rawType = "mcq_single";
  if (rawType === "multiple_choice" || rawType === "multi" || rawType === "multiple") rawType = "mcq_multiple";
  if (rawType === "true_false" || rawType === "tf") rawType = "true_false";
  if (rawType === "numerical" || rawType === "numeric") rawType = "numerical";
  if (rawType === "fill_blank" || rawType === "blank") rawType = "fill_blank";
  if (rawType === "descriptive" || rawType === "essay") rawType = "descriptive";

  const type = rawType as BulkQuestionItemInput["type"];

  // Difficulty normalization
  let difficulty = 2;
  const rawDiff = (row.difficulty || row["Difficulty"] || "medium").toLowerCase().trim();
  if (rawDiff === "1" || rawDiff === "easy") difficulty = 1;
  else if (rawDiff === "2" || rawDiff === "medium") difficulty = 2;
  else if (rawDiff === "3" || rawDiff === "hard") difficulty = 3;
  else if (rawDiff === "4" || rawDiff === "expert") difficulty = 4;
  else if (rawDiff === "5" || rawDiff === "master") difficulty = 5;

  const subject = (row.subject || row["Subject"] || defaultSubject || "General").trim();
  const topic = (row.topic || row["Topic"] || "").trim() || undefined;
  const explanation = (row.explanation || row["Explanation"] || "").trim() || undefined;

  // Options parsing for MCQ / True False
  const options: Array<{ id: string; text: string; isCorrect: boolean }> = [];
  let correctAnswerText: string | undefined = undefined;

  const rawAns = (row.correctAnswer || row.answer || row.correct || row["Correct Answer"] || "").trim().toUpperCase();

  if (type === "mcq_single" || type === "mcq_multiple" || type === "true_false") {
    const rawOptions = [
      { id: "A", text: row.optionA || row.option_a || row.optA || row["Option A"] || "" },
      { id: "B", text: row.optionB || row.option_b || row.optB || row["Option B"] || "" },
      { id: "C", text: row.optionC || row.option_c || row.optC || row["Option C"] || "" },
      { id: "D", text: row.optionD || row.option_d || row.optD || row["Option D"] || "" },
      { id: "E", text: row.optionE || row.option_e || row.optE || row["Option E"] || "" },
    ].filter((o) => o.text.trim().length > 0);

    if (rawOptions.length < 2) {
      errors.push("MCQ questions require at least two option choices (Option A and Option B)");
    }

    if (!rawAns) {
      errors.push("Correct answer key (e.g., 'A', 'B', or 'A,C') is required");
    }

    const correctLetters = rawAns.split(/[\s,]+/).map((s) => s.trim().toUpperCase());

    for (const opt of rawOptions) {
      options.push({
        id: opt.id,
        text: opt.text.trim(),
        isCorrect: correctLetters.includes(opt.id),
      });
    }

    if (!options.some((o) => o.isCorrect)) {
      errors.push(`Correct answer '${rawAns}' does not match any valid options (${rawOptions.map((o) => o.id).join(", ")})`);
    }
  } else {
    // Fill in the blank / numerical / descriptive
    correctAnswerText = (row.correctAnswer || row.answer || row["Correct Answer"] || "").trim();
    if (!correctAnswerText) {
      errors.push("Accepted correct answer text is required");
    }
  }

  // --- Department & Scope Binding Detection ---
  const rawScope = (
    row.scope ||
    row.isCommon ||
    row.is_common ||
    row.applicability ||
    row.classification ||
    row["Scope"] ||
    row["Classification"] ||
    ""
  ).toLowerCase().trim();

  const rawDept = (
    row.department ||
    row.dept ||
    row.departmentCode ||
    row.programCode ||
    row.program ||
    row.discipline ||
    row["Department"] ||
    row["Program Code"] ||
    ""
  ).trim();

  // Match department against provided departments list
  let matchedDeptId: string | undefined = undefined;

  if (rawDept && departments.length > 0) {
    const cleanRaw = rawDept.toLowerCase().replace(/[\s\-_/().,#]+/g, "");
    const found = departments.find(
      (d) =>
        d.id === rawDept ||
        (d.code && d.code.toLowerCase().replace(/[\s\-_/().,#]+/g, "") === cleanRaw) ||
        d.name.toLowerCase().replace(/[\s\-_/().,#]+/g, "") === cleanRaw ||
        d.name.toLowerCase().replace(/[\s\-_/().,#]+/g, "").includes(cleanRaw) ||
        cleanRaw.includes(d.name.toLowerCase().replace(/[\s\-_/().,#]+/g, ""))
    );
    if (found) {
      matchedDeptId = found.id;
    }
  }

  // Auto-detect isCommon from tags, scope, or department
  let isCommon = defaultBankIsCommon;
  const combinedMeta = `${subject} ${topic || ""} ${text}`.toLowerCase();

  if (matchedDeptId) {
    isCommon = false;
  } else if (
    rawScope === "false" ||
    rawScope === "0" ||
    rawScope === "no" ||
    rawScope === "dept" ||
    rawScope === "department" ||
    rawScope === "department_specific" ||
    rawScope === "dept-specific" ||
    rawScope === "part b"
  ) {
    isCommon = false;
  } else if (
    rawScope === "true" ||
    rawScope === "1" ||
    rawScope === "yes" ||
    rawScope === "common" ||
    rawScope === "universal" ||
    rawScope === "part a"
  ) {
    isCommon = true;
  } else if (
    combinedMeta.includes("[dept specific") ||
    combinedMeta.includes("[department specific") ||
    combinedMeta.includes("part b")
  ) {
    isCommon = false;
  } else if (
    combinedMeta.includes("[common") ||
    combinedMeta.includes("[universal") ||
    combinedMeta.includes("part a")
  ) {
    isCommon = true;
  }

  const finalDeptId = isCommon
    ? undefined
    : (matchedDeptId || defaultDepartmentId || undefined);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    parsed: {
      questionText: text,
      type,
      options,
      correctAnswerText,
      subject,
      topic,
      difficulty,
      explanation,
      isCommon,
      departmentId: finalDeptId,
    },
  };
}
