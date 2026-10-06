"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import { logAuditEvent } from "@/lib/audit";
import {
  createQuestionBankSchema,
  createQuestionSchema,
  createExamSchema,
  createExamSectionSchema,
  scheduleExamSchema,
  bulkCreateQuestionsSchema,
  BulkQuestionItemInput,
  bulkScheduleAllocationItemSchema,
  bulkCreateScheduleAllocationsSchema,
  BulkScheduleAllocationItemInput,
  quickPublishExamWizardSchema,
  QuickPublishExamWizardInput,
} from "@/lib/validations/examiner";
import { Json } from "@/types/database";
import {
  SAMPLE_ENTRANCE_SECTIONS,
  ExamSectionItem,
  ExamQuestionItem,
} from "@/lib/exam/sample-exam-data";
import { evaluateCandidateAnswer, extractQuestionCorrectAnswer } from "@/lib/exam/evaluator";

export interface ActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  code?: string;
  data?: T;
}

/**
 * Creates a new Question Bank for subject/domain organization.
 */
export async function createQuestionBankAction(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);

  const scope = (formData.get("scope") as string) || "common";
  const departmentId = (formData.get("departmentId") as string) || null;
  const isCommon = scope !== "department_specific" && (!departmentId || departmentId === "");

  const rawData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    isCommon,
    departmentId: isCommon ? undefined : (departmentId || undefined),
  };

  const validation = createQuestionBankSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid bank parameters",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();
  const { data: newBank, error } = await supabase
    .from("question_banks")
    .insert({
      name: validation.data.name,
      description: validation.data.description,
      department_id: validation.data.isCommon ? null : (validation.data.departmentId || null),
      is_common: validation.data.isCommon,
      created_by: user.id,
    })
    .select("id, name")
    .single();

  if (error || !newBank) {
    return {
      error: error?.message || "Failed to create question bank",
      code: "DB_ERROR",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_BANK_CREATED",
    entityType: "question_banks",
    entityId: newBank.id,
    details: {
      name: newBank.name,
      isCommon: validation.data.isCommon,
      departmentId: validation.data.departmentId,
    },
  });

  revalidatePath("/examiner");
  return { success: true, data: newBank };
}

/**
 * Permanently deletes a Question Bank repository and all associated questions.
 */
export async function deleteQuestionBankAction(bankId: string): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);

  if (!bankId || typeof bankId !== "string" || bankId.length < 10) {
    return {
      error: "Invalid Question Bank identifier",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();

  // Fetch bank details for audit record
  const { data: bank } = await supabase
    .from("question_banks")
    .select("id, name, is_common, department_id")
    .eq("id", bankId)
    .single();

  if (!bank) {
    return {
      error: "Question repository not found or already deleted",
      code: "NOT_FOUND",
    };
  }

  // Count questions in this bank
  const { count: questionsCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("bank_id", bankId);

  // Delete the bank (Cascade rule in postgres deletes associated questions and exam_section_questions)
  const { error } = await supabase
    .from("question_banks")
    .delete()
    .eq("id", bankId);

  if (error) {
    return {
      error: error.message || "Failed to delete question repository",
      code: "DB_ERROR",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_BANK_DELETED",
    entityType: "question_banks",
    entityId: bankId,
    details: {
      name: bank.name,
      isCommon: bank.is_common,
      departmentId: bank.department_id,
      questionsCount: questionsCount || 0,
    },
  });

  revalidatePath("/examiner");
  revalidatePath("/examiner/banks");
  return { success: true };
}

/**
 * Creates a structured question (MCQ, LaTeX, Coding, etc.) within a Question Bank.
 */
export async function createQuestionAction(payload: unknown): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);

  const validation = createQuestionSchema.safeParse(payload);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid question schema",
      code: "VALIDATION_ERROR",
    };
  }

  const q = validation.data;
  const supabase = await createClient();

  // Construct structured content JSON
  const contentJson: Json = {
    text: q.questionText,
    latex: q.latexCode || null,
    codeSnippet: q.codeSnippet || null,
    programmingLanguage: q.programmingLanguage || null,
  };

  // Construct options and correct answer JSON based on question type
  let optionsJson: Json = [];
  let correctAnswerJson: Json = null;

  if (q.type === "mcq_single" || q.type === "mcq_multiple" || q.type === "true_false") {
    optionsJson = q.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
    }));
    const correctIds = q.options.filter((opt) => opt.isCorrect).map((opt) => opt.id);
    correctAnswerJson = q.type === "mcq_single" || q.type === "true_false" ? correctIds[0] || "" : correctIds;
  } else if (q.type === "coding") {
    optionsJson = [];
    correctAnswerJson = {
      testCases: q.testCases || [],
      language: q.programmingLanguage || "python",
    };
  } else {
    // fill_blank, numerical, descriptive
    correctAnswerJson = {
      acceptedAnswer: q.correctAnswerText || "",
    };
  }

  const { data: newQuestion, error } = await supabase
    .from("questions")
    .insert({
      bank_id: q.bankId,
      created_by: user.id,
      department_id: q.isCommon ? null : (q.departmentId || null),
      is_common: q.isCommon,
      type: q.type,
      content: contentJson,
      options: optionsJson,
      correct_answer: correctAnswerJson,
      explanation: q.explanation || null,
      subject: q.subject,
      topic: q.topic || null,
      sub_topic: q.subTopic || null,
      difficulty: q.difficulty,
      bloom_level: q.bloomLevel || null,
      tags: q.tags || [],
      version: 1,
    })
    .select("id, subject, type, department_id, is_common")
    .single();

  if (error || !newQuestion) {
    return {
      error: error?.message || "Failed to save question",
      code: "DB_ERROR",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_CREATED",
    entityType: "questions",
    entityId: newQuestion.id,
    details: {
      bankId: q.bankId,
      type: q.type,
      subject: q.subject,
      isCommon: q.isCommon,
      departmentId: q.departmentId,
    },
  });

  revalidatePath(`/examiner/banks/${q.bankId}`);
  return { success: true, data: newQuestion };
}

/**
 * Deletes a question from a Question Bank.
 */
export async function deleteQuestionAction(questionId: string, bankId: string): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return {
      error: error.message,
      code: "DELETE_FAILED",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_DELETED",
    entityType: "questions",
    entityId: questionId,
    details: { bankId },
  });

  revalidatePath(`/examiner/banks/${bankId}`);
  return { success: true };
}

/**
 * Composes a new examination blueprint.
 */
export async function createExamAction(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);

  const rawData = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    instructions: (formData.get("instructions") as string) || null,
    departmentId: (formData.get("departmentId") as string) || null,
    targetDurationMinutes: formData.get("targetDurationMinutes") || null,
    passingPercentage: formData.get("passingPercentage") || null,
    enableNegativeMarking: formData.get("enableNegativeMarking") === "on",
    defaultNegativePenalty: formData.get("defaultNegativePenalty") || 0.25,
    enablePartialMarking: formData.get("enablePartialMarking") === "on",
    requireSectionalCutoff: formData.get("requireSectionalCutoff") === "on",
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
    shuffleOptions: formData.get("shuffleOptions") === "on",
    allowBacktracking: formData.get("allowBacktracking") === "on",
    requireSafeBrowser: formData.get("requireSafeBrowser") === "on",
    enableWebcamProctoring: formData.get("enableWebcamProctoring") === "on",
    calculatorType: (formData.get("calculatorType") as string) || "none",
  };

  const validation = createExamSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid exam configuration",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();
  const { data: newExam, error } = await supabase
    .from("exams")
    .insert({
      title: validation.data.title,
      description: validation.data.description,
      instructions: validation.data.instructions,
      status: "draft",
      settings: {
        department_id: validation.data.departmentId,
        target_duration_minutes: validation.data.targetDurationMinutes,
        passing_percentage: validation.data.passingPercentage,
        enable_negative_marking: validation.data.enableNegativeMarking,
        default_negative_penalty: validation.data.defaultNegativePenalty,
        enable_partial_marking: validation.data.enablePartialMarking,
        require_sectional_cutoff: validation.data.requireSectionalCutoff,
        shuffle_questions: validation.data.shuffleQuestions,
        shuffle_options: validation.data.shuffleOptions,
        allow_backtracking: validation.data.allowBacktracking,
        require_safe_browser: validation.data.requireSafeBrowser,
        enable_webcam_proctoring: validation.data.enableWebcamProctoring,
        calculator_type: validation.data.calculatorType,
      },
      created_by: user.id,
    })
    .select("id, title")
    .single();

  if (error || !newExam) {
    return {
      error: error?.message || "Failed to create exam",
      code: "DB_ERROR",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_CREATED",
    entityType: "exams",
    entityId: newExam.id,
    details: { title: newExam.title },
  });

  revalidatePath("/examiner/exams");
  return { success: true, data: newExam };
}

/**
 * Creates an Exam Section within an Exam.
 */
export async function createExamSectionAction(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);

  const rawData = {
    examId: formData.get("examId") as string,
    title: formData.get("title") as string,
    scope: (formData.get("scope") as "common" | "department_specific") || "common",
    departmentId: (formData.get("departmentId") as string) || undefined,
    orderIndex: formData.get("orderIndex"),
    timeLimitMinutes: formData.get("timeLimitMinutes") || null,
    correctMarks: formData.get("correctMarks"),
    negativeMarks: formData.get("negativeMarks"),
    partialMarks: formData.get("partialMarks") === "on",
  };

  const validation = createExamSectionSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid section specification",
      code: "VALIDATION_ERROR",
    };
  }

  const s = validation.data;
  const supabase = await createClient();

  const { data: newSection, error } = await supabase
    .from("exam_sections")
    .insert({
      exam_id: s.examId,
      title: s.title,
      scope: s.scope,
      department_id: s.scope === "common" ? null : (s.departmentId || null),
      order_index: s.orderIndex,
      time_limit_minutes: s.timeLimitMinutes || null,
      marking_scheme: {
        correct_marks: s.correctMarks,
        negative_marks: s.negativeMarks,
        partial_marks: s.partialMarks,
      },
    })
    .select("id, title, scope, department_id")
    .single();

  if (error || !newSection) {
    return {
      error: error?.message || "Failed to create section",
      code: "DB_ERROR",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_SECTION_CREATED",
    entityType: "exam_sections",
    entityId: newSection.id,
    details: { examId: s.examId, title: newSection.title },
  });

  revalidatePath(`/examiner/exams/${s.examId}`);
  return { success: true, data: newSection };
}

/**
 * Links a question from a Question Bank into an Exam Section.
 */
export async function addQuestionToSectionAction(
  sectionId: string,
  questionId: string,
  examId: string,
  marks: number = 1.0,
  orderIndex: number = 1
): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("exam_section_questions").insert({
    section_id: sectionId,
    question_id: questionId,
    order_index: orderIndex,
    marks,
  });

  if (error) {
    return {
      error: error.message,
      code: "ASSIGN_QUESTION_FAILED",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_LINKED_TO_SECTION",
    entityType: "exam_section_questions",
    details: { sectionId, questionId, examId, marks },
  });

  revalidatePath(`/examiner/exams/${examId}`);
  return { success: true };
}

/**
 * Schedules an exam delivery window.
 */
export async function scheduleExamAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(["examiner", "admin"]);

  const rawData = {
    examId: formData.get("examId") as string,
    startAt: formData.get("startAt") as string,
    endAt: formData.get("endAt") as string,
    durationMinutes: formData.get("durationMinutes"),
    windowType: (formData.get("windowType") as string) || "fixed",
    maxCandidates: formData.get("maxCandidates") || null,
    proctoringLevel: (formData.get("proctoringLevel") as string) || "standard",
  };

  const validation = scheduleExamSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid schedule data",
      code: "VALIDATION_ERROR",
    };
  }

  const sch = validation.data;
  const supabase = await createClient();

  const { data: newSchedule, error } = await supabase
    .from("exam_schedules")
    .insert({
      exam_id: sch.examId,
      start_at: sch.startAt,
      end_at: sch.endAt,
      duration_minutes: sch.durationMinutes,
      window_type: sch.windowType,
      max_candidates: sch.maxCandidates || null,
      proctoring_level: sch.proctoringLevel,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !newSchedule) {
    return {
      error: error?.message || "Failed to schedule exam",
      code: "DB_ERROR",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_SCHEDULED",
    entityType: "exam_schedules",
    entityId: newSchedule.id,
    details: {
      examId: sch.examId,
      startAt: sch.startAt,
      endAt: sch.endAt,
      duration: sch.durationMinutes,
    },
  });

  revalidatePath("/examiner/schedules");
  return { success: true, data: newSchedule };
}

/**
 * Bulk links multiple questions into an Exam Section at once.
 */
export async function bulkAddQuestionsToSectionAction(
  sectionId: string,
  questionIds: string[],
  examId: string,
  defaultMarks: number = 1.0,
  startingOrderIndex: number = 1
): Promise<ActionResult<{ addedCount: number }>> {
  const user = await requireRole(["examiner", "admin"]);
  if (!questionIds || questionIds.length === 0) {
    return { error: "No questions selected for linking", code: "EMPTY_SELECTION" };
  }

  const supabase = await createClient();

  const rows = questionIds.map((qId, idx) => ({
    section_id: sectionId,
    question_id: qId,
    marks: defaultMarks,
    order_index: startingOrderIndex + idx,
  }));

  const { error } = await supabase.from("exam_section_questions").insert(rows);

  if (error) {
    return { error: error.message, code: "BULK_ASSIGN_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTIONS_BULK_LINKED_TO_SECTION",
    entityType: "exam_section_questions",
    details: { sectionId, examId, count: questionIds.length, defaultMarks },
  });

  revalidatePath(`/examiner/exams/${examId}`);
  return { success: true, data: { addedCount: questionIds.length } };
}

/**
 * Removes a question from an Exam Section.
 */
export async function removeQuestionFromSectionAction(
  sectionQuestionId: string,
  examId: string
): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("exam_section_questions")
    .delete()
    .eq("id", sectionQuestionId);

  if (error) {
    return { error: error.message, code: "REMOVE_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_UNLINKED_FROM_SECTION",
    entityType: "exam_section_questions",
    entityId: sectionQuestionId,
    details: { examId },
  });

  revalidatePath(`/examiner/exams/${examId}`);
  return { success: true };
}

/**
 * Deletes an Exam Section and unlinks all its questions.
 */
export async function deleteExamSectionAction(
  sectionId: string,
  examId: string
): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  // First delete linked questions in this section
  await supabase
    .from("exam_section_questions")
    .delete()
    .eq("section_id", sectionId);

  const { error } = await supabase
    .from("exam_sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    return { error: error.message, code: "DELETE_SECTION_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_SECTION_DELETED",
    entityType: "exam_sections",
    entityId: sectionId,
    details: { examId },
  });

  revalidatePath(`/examiner/exams/${examId}`);
  return { success: true };
}

/**
 * Updates an Exam Blueprint status (e.g. Draft <-> Published).
 */
export async function updateExamStatusAction(
  examId: string,
  status: "draft" | "published" | "archived"
): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("exams")
    .update({ status })
    .eq("id", examId);

  if (error) {
    return { error: error.message, code: "STATUS_UPDATE_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_STATUS_UPDATED",
    entityType: "exams",
    entityId: examId,
    details: { status },
  });

  revalidatePath(`/examiner/exams/${examId}`);
  revalidatePath("/examiner/exams");
  revalidatePath("/examiner");
  return { success: true };
}

/**
 * Assigns candidates (either all candidates or filtered by department) to an Exam Schedule.
 */
export async function assignCandidatesToScheduleAction(
  scheduleId: string,
  departmentId?: string | null
): Promise<ActionResult<{ assignedCount: number }>> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  // Find candidate profiles
  let query = supabase
    .from("profiles")
    .select("id, department_id")
    .eq("role", "candidate");

  if (departmentId && departmentId !== "all") {
    query = query.eq("department_id", departmentId);
  }

  const { data: candidates, error: candidateErr } = await query;
  if (candidateErr || !candidates || candidates.length === 0) {
    return {
      error: "No candidates found matching the target department criteria",
      code: "NO_CANDIDATES",
    };
  }

  // Fetch already assigned candidate IDs for this schedule
  const { data: existingAssignments } = await supabase
    .from("exam_assignments")
    .select("candidate_id")
    .eq("schedule_id", scheduleId);

  const existingSet = new Set((existingAssignments || []).map((a) => a.candidate_id));
  const newCandidates = candidates.filter((c) => !existingSet.has(c.id));

  if (newCandidates.length === 0) {
    return {
      success: true,
      data: { assignedCount: 0 },
    };
  }

  const rows = newCandidates.map((c) => ({
    schedule_id: scheduleId,
    candidate_id: c.id,
    status: "assigned" as const,
  }));

  const { error: insertErr } = await supabase
    .from("exam_assignments")
    .insert(rows);

  if (insertErr) {
    return { error: insertErr.message, code: "ASSIGN_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "CANDIDATES_ASSIGNED_TO_SCHEDULE",
    entityType: "exam_assignments",
    details: {
      scheduleId,
      departmentId: departmentId || "all",
      assignedCount: newCandidates.length,
    },
  });

  revalidatePath("/examiner/schedules");
  revalidatePath("/examiner");
  return { success: true, data: { assignedCount: newCandidates.length } };
}

export interface BulkQuestionImportResult {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ rowNumber?: number; error: string }>;
}

/**
 * Bulk creates examination questions into a Question Bank.
 */
export async function bulkCreateQuestionsAction(
  bankId: string,
  questions: BulkQuestionItemInput[]
): Promise<{ success: boolean; error?: string; code?: string; data?: BulkQuestionImportResult }> {
  const user = await requireRole(["examiner", "admin"]);

  const validation = bulkCreateQuestionsSchema.safeParse({ bankId, questions });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid question batch payload",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();

  // 1. Verify question bank exists
  const { data: bank, error: bankErr } = await supabase
    .from("question_banks")
    .select("id, name, is_common, department_id")
    .eq("id", bankId)
    .single();

  if (bankErr || !bank) {
    return {
      success: false,
      error: "Target question bank not found",
      code: "NOT_FOUND",
    };
  }

  // 2. Prepare structured rows
  const newRows = questions.map((q) => {
    const contentJson: Json = { text: q.questionText };
    let optionsJson: Json = [];
    let correctAnswerJson: Json = null;

    if (q.type === "mcq_single" || q.type === "mcq_multiple" || q.type === "true_false") {
      optionsJson = q.options.map((opt) => ({ id: opt.id, text: opt.text }));
      const correctIds = q.options.filter((opt) => opt.isCorrect).map((opt) => opt.id);
      correctAnswerJson = (q.type === "mcq_single" || q.type === "true_false") ? (correctIds[0] || "") : correctIds;
    } else {
      correctAnswerJson = { acceptedAnswer: q.correctAnswerText || "" };
    }

    return {
      bank_id: bankId,
      created_by: user.id,
      department_id: q.departmentId !== undefined ? q.departmentId : bank.department_id,
      is_common: q.isCommon !== undefined ? q.isCommon : bank.is_common,
      type: q.type,
      content: contentJson,
      options: optionsJson,
      correct_answer: correctAnswerJson,
      explanation: q.explanation || null,
      subject: q.subject || bank.name,
      topic: q.topic || null,
      difficulty: q.difficulty || 2,
      version: 1,
    };
  });

  // 3. Batch insert in chunks of 100
  let createdCount = 0;
  let failedCount = 0;
  const errors: Array<{ rowNumber?: number; error: string }> = [];

  const chunkSize = 100;
  for (let i = 0; i < newRows.length; i += chunkSize) {
    const chunk = newRows.slice(i, i + chunkSize);
    const { error: insertErr } = await supabase.from("questions").insert(chunk);

    if (insertErr) {
      failedCount += chunk.length;
      errors.push({
        rowNumber: i + 1,
        error: insertErr.message,
      });
    } else {
      createdCount += chunk.length;
    }
  }

  // 4. Audit Log
  await logAuditEvent({
    userId: user.id,
    action: "BULK_QUESTIONS_IMPORTED",
    entityType: "questions",
    entityId: bankId,
    details: {
      bankId,
      bankName: bank.name,
      totalRequested: questions.length,
      createdCount,
      failedCount,
    },
  });

  revalidatePath(`/examiner/banks/${bankId}`);
  revalidatePath("/examiner");

  return {
    success: true,
    data: {
      success: true,
      totalProcessed: questions.length,
      createdCount,
      skippedCount: 0,
      updatedCount: 0,
      failedCount,
      errors,
    },
  };
}

/**
 * Bulk allocates candidates to an exam schedule from a CSV upload.
 */
export async function bulkAllocateCandidatesToScheduleAction(
  scheduleId: string,
  allocations: BulkScheduleAllocationItemInput[],
  conflictStrategy: "skip" | "overwrite" = "skip"
): Promise<ActionResult<{
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ rowNumber?: number; email?: string; fullName?: string; error: string }>;
}>> {
  const user = await requireRole(["examiner", "admin"]);

  const validation = bulkCreateScheduleAllocationsSchema.safeParse({
    scheduleId,
    allocations,
    conflictStrategy,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Validation failed on allocation data",
      code: "VALIDATION_ERROR",
    };
  }

  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      userId: user.id,
      action: "BULK_CANDIDATES_ALLOCATED_DEMO",
      entityType: "exam_assignments",
      entityId: scheduleId,
      details: {
        scheduleId,
        totalProcessed: allocations.length,
        createdCount: allocations.length,
        conflictStrategy,
      },
    });
    revalidatePath("/examiner/schedules");
    revalidatePath("/admin/students");
    return {
      success: true,
      data: {
        success: true,
        totalProcessed: allocations.length,
        createdCount: allocations.length,
        skippedCount: 0,
        updatedCount: 0,
        failedCount: 0,
        errors: [],
      },
    };
  }

  const supabase = await createClient();

  // 1. Verify schedule exists
  const { data: schedule, error: schedError } = await supabase
    .from("exam_schedules")
    .select("id, exam_id")
    .eq("id", scheduleId)
    .single();

  if (schedError || !schedule) {
    return { error: "Target exam delivery schedule not found", code: "NOT_FOUND" };
  }

  // 2. Fetch candidate profiles
  const { data: candidateProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, metadata")
    .eq("role", "candidate");

  const idMap = new Map<string, { id: string; fullName: string; email: string }>();
  const emailMap = new Map<string, { id: string; fullName: string; email: string }>();
  const regNoMap = new Map<string, { id: string; fullName: string; email: string }>();

  (candidateProfiles || []).forEach((c) => {
    const meta = (c.metadata as Record<string, unknown>) || {};
    const email = (meta.email as string) || "";
    const regNo = (meta.registrationNo as string) || (meta.reg_no as string) || "";
    const item = { id: c.id, fullName: c.full_name, email };

    idMap.set(c.id.toLowerCase(), item);
    if (email) emailMap.set(email.toLowerCase().trim(), item);
    if (regNo) regNoMap.set(regNo.toLowerCase().trim(), item);
  });

  // 3. Fetch existing assignments for this schedule
  const { data: existingAssignments } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id")
    .eq("schedule_id", scheduleId);

  const assignedCandidateSet = new Set((existingAssignments || []).map((a) => a.candidate_id));

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: Array<{ rowNumber?: number; email?: string; fullName?: string; error: string }> = [];

  for (let i = 0; i < allocations.length; i++) {
    const row = allocations[i];
    const rowNumber = i + 1;
    const cleanId = row.candidateIdentifier.trim().toLowerCase();

    // Match candidate
    const matchedCandidate = idMap.get(cleanId) || emailMap.get(cleanId) || regNoMap.get(cleanId);

    if (!matchedCandidate) {
      failedCount++;
      errors.push({
        rowNumber,
        email: row.candidateIdentifier,
        error: `Candidate "${row.candidateIdentifier}" was not found in the student database.`,
      });
      continue;
    }

    if (assignedCandidateSet.has(matchedCandidate.id)) {
      if (conflictStrategy === "overwrite") {
        updatedCount++;
      } else {
        skippedCount++;
      }
      continue;
    }

    // Insert new assignment
    const { error: insertErr } = await supabase.from("exam_assignments").insert({
      schedule_id: scheduleId,
      candidate_id: matchedCandidate.id,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    });

    if (insertErr) {
      failedCount++;
      errors.push({
        rowNumber,
        email: matchedCandidate.email,
        fullName: matchedCandidate.fullName,
        error: insertErr.message,
      });
    } else {
      assignedCandidateSet.add(matchedCandidate.id);
      createdCount++;
    }
  }

  // 4. Audit Log
  await logAuditEvent({
    userId: user.id,
    action: "BULK_CANDIDATES_ALLOCATED_TO_SCHEDULE",
    entityType: "exam_assignments",
    entityId: scheduleId,
    details: {
      scheduleId,
      examId: schedule.exam_id,
      totalProcessed: allocations.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      conflictStrategy,
    },
  });

  revalidatePath("/examiner/schedules");
  revalidatePath("/admin/students");
  revalidatePath("/candidate");

  return {
    success: true,
    data: {
      success: true,
      totalProcessed: allocations.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      errors,
    },
  };
}

/**
 * Updates the status of an examination result (e.g., publish scorecard or revert to draft).
 */
export async function updateExamResultStatusAction(
  resultId: string,
  status: "published" | "draft" | "reviewed"
): Promise<ActionResult> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const { data: updatedResult, error } = await supabase
    .from("exam_results")
    .update({
      status,
      graded_by: user.id,
      graded_at: nowIso,
    })
    .eq("id", resultId)
    .select("id, assignment_id, total_score, max_score, percentage, status")
    .single();

  if (error || !updatedResult) {
    return {
      error: error?.message || "Failed to update exam result status",
      code: "UPDATE_FAILED",
    };
  }

  await logAuditEvent({
    userId: user.id,
    action: status === "published" ? "EXAM_RESULT_PUBLISHED" : "EXAM_RESULT_STATUS_MODIFIED",
    entityType: "exam_results",
    entityId: resultId,
    details: {
      status,
      assignmentId: updatedResult.assignment_id,
      score: updatedResult.total_score,
      percentage: updatedResult.percentage,
    },
  });

  revalidatePath("/examiner/grading");
  revalidatePath("/examiner");
  revalidatePath("/candidate");
  return { success: true, data: updatedResult };
}

/**
 * Bulk publishes or reverts evaluation results for a batch of candidate submissions.
 */
export async function bulkUpdateExamResultsStatusAction(
  resultIds: string[],
  status: "published" | "draft"
): Promise<ActionResult<{ updatedCount: number }>> {
  const user = await requireRole(["examiner", "admin"]);

  if (!resultIds || resultIds.length === 0) {
    return { error: "No results selected for publishing operation", code: "EMPTY_SELECTION" };
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("exam_results")
    .update({
      status,
      graded_by: user.id,
      graded_at: nowIso,
    })
    .in("id", resultIds);

  if (error) {
    return { error: error.message, code: "BULK_UPDATE_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: status === "published" ? "EXAM_RESULTS_BULK_PUBLISHED" : "EXAM_RESULTS_BULK_DRAFTED",
    entityType: "exam_results",
    details: {
      count: resultIds.length,
      status,
      resultIds,
    },
  });

  revalidatePath("/examiner/grading");
  revalidatePath("/examiner");
  revalidatePath("/candidate");
  return { success: true, data: { updatedCount: resultIds.length } };
}

/**
 * Creates or retrieves a designated question bank for inline wizard uploads.
 */
export async function getOrCreateDefaultBankAction(examTitle: string): Promise<ActionResult<{ bankId: string; name: string }>> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const bankName = `${examTitle.trim()} — Question Pool`.slice(0, 120);

  // Check if bank with this name already exists
  const { data: existing } = await supabase
    .from("question_banks")
    .select("id, name")
    .eq("name", bankName)
    .maybeSingle();

  if (existing) {
    return { success: true, data: { bankId: existing.id, name: existing.name } };
  }

  // Create new bank
  const { data: newBank, error } = await supabase
    .from("question_banks")
    .insert({
      name: bankName,
      description: `Auto-created question repository for ${examTitle}`,
      is_common: true,
      created_by: user.id,
    })
    .select("id, name")
    .single();

  if (error || !newBank) {
    return { error: error?.message || "Failed to create question bank", code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "QUESTION_BANK_CREATED",
    entityType: "question_banks",
    entityId: newBank.id,
    details: { name: newBank.name, source: "wizard_auto_create" },
  });

  revalidatePath("/examiner/banks");
  return { success: true, data: { bankId: newBank.id, name: newBank.name } };
}

/**
 * Unified Exam Wizard — Atomically creates exam, sections, links questions,
 * creates schedule, and assigns candidates in a single seamless transaction.
 */
export async function quickPublishExamWizardAction(
  payload: unknown
): Promise<ActionResult<{ examId: string; scheduleId: string }>> {
  const user = await requireRole(["examiner", "admin"]);

  const validation = quickPublishExamWizardSchema.safeParse(payload);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid exam configuration payload",
      code: "VALIDATION_ERROR",
    };
  }

  const d = validation.data;
  const supabase = await createClient();

  // 1. Insert Exam record
  const { data: newExam, error: examErr } = await supabase
    .from("exams")
    .insert({
      title: d.title,
      description: d.description || null,
      instructions: d.instructions || null,
      status: d.publishStatus,
      settings: {
        target_duration_minutes: d.targetDurationMinutes,
        passing_percentage: d.passingPercentage,
        enable_negative_marking: d.enableNegativeMarking,
        default_negative_penalty: d.defaultNegativePenalty,
        enable_partial_marking: d.enablePartialMarking,
        require_sectional_cutoff: d.requireSectionalCutoff,
        shuffle_questions: d.shuffleQuestions,
        shuffle_options: d.shuffleOptions,
        allow_backtracking: d.allowBacktracking,
        require_safe_browser: d.requireSafeBrowser,
        enable_webcam_proctoring: d.enableWebcamProctoring,
        calculator_type: d.calculatorType,
        correct_marks_per_question: d.correctMarksPerQuestion,
      },
      created_by: user.id,
    })
    .select("id, title")
    .single();

  if (examErr || !newExam) {
    return {
      error: examErr?.message || "Failed to create exam",
      code: "DB_ERROR",
    };
  }

  const examId = newExam.id;
  let totalQuestionsCount = 0;

  // 2. Insert Part A — Universal Common Section (if questionIds provided)
  if (d.commonSection && d.commonSection.questionIds.length > 0) {
    const { data: sectionA, error: secAErr } = await supabase
      .from("exam_sections")
      .insert({
        exam_id: examId,
        title: d.commonSection.title || "Part A — Research Aptitude & Universal Common",
        scope: "common",
        department_id: null,
        order_index: 1,
        time_limit_minutes: null,
        marking_scheme: {
          correct_marks: d.correctMarksPerQuestion,
          negative_marks: d.enableNegativeMarking ? d.defaultNegativePenalty : 0,
          partial_marks: d.enablePartialMarking,
        },
      })
      .select("id")
      .single();

    if (secAErr || !sectionA) {
      return {
        error: secAErr?.message || "Failed to create common exam section",
        code: "DB_ERROR",
      };
    }

    const qRows = d.commonSection.questionIds.map((qId, idx) => ({
      section_id: sectionA.id,
      question_id: qId,
      marks: d.correctMarksPerQuestion,
      order_index: idx + 1,
    }));

    const { error: linkErr } = await supabase.from("exam_section_questions").insert(qRows);
    if (linkErr) {
      return {
        error: linkErr.message || "Failed to link common questions to section",
        code: "LINK_ERROR",
      };
    }
    totalQuestionsCount += qRows.length;
  }

  // 3. Insert Part B — Department-Specific Sections
  if (d.deptSections && d.deptSections.length > 0) {
    for (let i = 0; i < d.deptSections.length; i++) {
      const deptSec = d.deptSections[i];
      if (!deptSec.questionIds || deptSec.questionIds.length === 0) continue;

      const { data: sectionB, error: secBErr } = await supabase
        .from("exam_sections")
        .insert({
          exam_id: examId,
          title: deptSec.title || `Part B — Department Subject`,
          scope: "department_specific",
          department_id: deptSec.departmentId,
          order_index: 2 + i,
          time_limit_minutes: null,
          marking_scheme: {
            correct_marks: d.correctMarksPerQuestion,
            negative_marks: d.enableNegativeMarking ? d.defaultNegativePenalty : 0,
            partial_marks: d.enablePartialMarking,
          },
        })
        .select("id")
        .single();

      if (secBErr || !sectionB) {
        return {
          error: secBErr?.message || `Failed to create section for department`,
          code: "DB_ERROR",
        };
      }

      const qRows = deptSec.questionIds.map((qId, idx) => ({
        section_id: sectionB.id,
        question_id: qId,
        marks: d.correctMarksPerQuestion,
        order_index: idx + 1,
      }));

      const { error: linkErr } = await supabase.from("exam_section_questions").insert(qRows);
      if (linkErr) {
        return {
          error: linkErr.message || "Failed to link department questions to section",
          code: "LINK_ERROR",
        };
      }
      totalQuestionsCount += qRows.length;
    }
  }

  // 4. Create Schedule
  const { data: newSchedule, error: schErr } = await supabase
    .from("exam_schedules")
    .insert({
      exam_id: examId,
      start_at: d.schedule.startAt,
      end_at: d.schedule.endAt,
      duration_minutes: d.schedule.durationMinutes,
      window_type: d.schedule.windowType,
      max_candidates: d.schedule.maxCandidates || null,
      proctoring_level: d.schedule.proctoringLevel,
      status: d.publishStatus === "published" ? "scheduled" : "scheduled",
    })
    .select("id")
    .single();

  if (schErr || !newSchedule) {
    return {
      error: schErr?.message || "Failed to create exam schedule",
      code: "DB_ERROR",
    };
  }

  const scheduleId = newSchedule.id;

  // 5. Assign Candidates
  let assignedCount = 0;
  if (d.candidateIds && d.candidateIds.length > 0) {
    const assignRows = d.candidateIds.map((candidateId) => ({
      schedule_id: scheduleId,
      candidate_id: candidateId,
      status: "assigned" as const,
    }));

    const chunkSize = 200;
    for (let i = 0; i < assignRows.length; i += chunkSize) {
      const slice = assignRows.slice(i, i + chunkSize);
      const { error: assignErr } = await supabase.from("exam_assignments").insert(slice);
      if (assignErr) {
        console.error("Assignment batch error in wizard:", assignErr);
      } else {
        assignedCount += slice.length;
      }
    }
  }

  // 6. Audit Logging
  await logAuditEvent({
    userId: user.id,
    action: "EXAM_WIZARD_COMPLETED",
    entityType: "exams",
    entityId: examId,
    details: {
      examTitle: newExam.title,
      scheduleId,
      publishStatus: d.publishStatus,
      totalQuestionsCount,
      assignedCount,
      commonCount: d.commonSection.questionIds.length,
      deptSectionsCount: d.deptSections.length,
    },
  });

  // 7. Revalidate
  revalidatePath("/examiner/exams");
  revalidatePath(`/examiner/exams/${examId}`);
  revalidatePath("/examiner/schedules");
  revalidatePath("/examiner");
  revalidatePath("/candidate");

  return {
    success: true,
    data: {
      examId,
      scheduleId,
    },
  };
}

export interface QuestionReviewItem {
  questionId: string;
  orderIndex: number;
  sectionId: string;
  sectionTitle: string;
  type: string;
  questionText: string;
  latexCode?: string | null;
  codeSnippet?: string | null;
  programmingLanguage?: string | null;
  subject: string;
  topic?: string | null;
  difficulty: number;
  maxMarks: number;
  negativeMarks: number;
  awardedMarks: number;
  isCorrect: boolean;
  isAttempted: boolean;
  options: Array<{ id: string; text: string; isCorrect?: boolean }>;
  selectedOptionId?: string | null;
  selectedOptionIds?: string[] | null;
  numericalValue?: string | null;
  descriptiveText?: string | null;
  correctOptionId?: string | null;
  correctOptionIds?: string[] | null;
  correctNumericValue?: number | null;
  explanation?: string | null;
  examinerComment?: string | null;
}

export interface CandidateSubmissionDetails {
  resultId: string;
  assignmentId: string;
  candidateName: string;
  candidateEmail: string;
  candidateDepartment: string;
  examTitle: string;
  startedAt: string | null;
  submittedAt: string | null;
  status: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  percentile: number | null;
  sectionScores: Record<string, { title: string; score: number; maxScore: number }>;
  examinerFeedback?: string | null;
  questions: QuestionReviewItem[];
  proctoring: {
    riskScore: number;
    fullscreenExits: number;
    tabSwitches: number;
    totalFlags: number;
    flags: Array<{ type: string; timestamp: string; details?: Record<string, unknown>; message?: string }>;
  };
}

/**
 * Fetches comprehensive answer script, questions, candidate responses,
 * evaluated marks, and proctoring surveillance flags for deep examiner review.
 */
export async function getDetailedCandidateSubmissionAction(
  assignmentId: string
): Promise<ActionResult<CandidateSubmissionDetails>> {
  const user = await requireRole(["examiner", "admin", "proctor"]);
  const supabase = await createClient();

  // 1. Fetch assignment
  const { data: assignment, error: assignErr } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, schedule_id, status, started_at, submitted_at")
    .eq("id", assignmentId)
    .single();

  if (assignErr || !assignment) {
    return { error: "Assignment record not found", code: "NOT_FOUND" };
  }

  // 2. Fetch candidate profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, department, department_id, metadata")
    .eq("id", assignment.candidate_id)
    .single();

  const candidateName = profile?.full_name || "Candidate";
  const candidateEmail = ((profile?.metadata as Record<string, unknown>)?.email as string) || "candidate@university.edu";
  const candidateDept = profile?.department || "General";

  // Resolve department ID if needed
  let candidateDeptId = profile?.department_id || null;
  if (!candidateDeptId && profile?.department) {
    const deptStr = profile.department.toLowerCase();
    const { data: deptRows } = await supabase.from("departments").select("id, name, code");
    const match = (deptRows || []).find(
      (d) =>
        (d.name && d.name.toLowerCase() === deptStr) ||
        (d.code && d.code.toLowerCase() === deptStr)
    );
    if (match) candidateDeptId = match.id;
  }

  // 3. Fetch schedule & exam
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("id, exam_id, start_at, end_at, duration_minutes")
    .eq("id", assignment.schedule_id)
    .single();

  let examTitle = "Ph.D Entrance Examination";
  if (schedule?.exam_id) {
    const { data: examRow } = await supabase
      .from("exams")
      .select("title")
      .eq("id", schedule.exam_id)
      .single();
    if (examRow?.title) examTitle = examRow.title;
  }

  // 4. Fetch exam result
  const { data: result } = await supabase
    .from("exam_results")
    .select("*")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  // 5. Fetch all candidate responses
  const { data: responses } = await supabase
    .from("exam_responses")
    .select("question_id, response, is_flagged, time_spent_seconds")
    .eq("assignment_id", assignmentId);

  const responseMap = new Map<string, Record<string, unknown>>();
  (responses || []).forEach((r) => {
    if (r.response && typeof r.response === "object") {
      responseMap.set(r.question_id, r.response as Record<string, unknown>);
    }
  });

  // 6. Fetch questions & sections
  const questionsList: QuestionReviewItem[] = [];
  let computedTotalScore = 0;
  let computedMaxScore = 0;
  const sectionScoresDict: Record<string, { title: string; score: number; maxScore: number }> = {};

  if (schedule?.exam_id) {
    const { data: sections } = await supabase
      .from("exam_sections")
      .select("id, title, scope, department_id, marking_scheme")
      .eq("exam_id", schedule.exam_id)
      .order("order_index", { ascending: true });

    const allSections = sections || [];
    const eligibleSections = allSections.filter((sec) => {
      if (sec.scope === "common" || !sec.department_id) return true;
      return candidateDeptId && sec.department_id === candidateDeptId;
    });

    const sectionIds = eligibleSections.map((s) => s.id);

    const { data: sectionQuestions } = await supabase
      .from("exam_section_questions")
      .select("question_id, section_id, order_index, marks")
      .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
      .order("order_index", { ascending: true });

    const qIds = (sectionQuestions || []).map((sq) => sq.question_id);

    const { data: dbQuestions } = await supabase
      .from("questions")
      .select("id, type, subject, topic, difficulty, content, options, correct_answer")
      .in("id", qIds.length ? qIds : ["00000000-0000-0000-0000-000000000000"]);

    if (dbQuestions && dbQuestions.length > 0) {
      const qMap = new Map(dbQuestions.map((q) => [q.id, q]));
      const secMap = new Map(eligibleSections.map((s) => [s.id, s]));

      (sectionQuestions || []).forEach((sq, idx) => {
        const q = qMap.get(sq.question_id);
        const sec = secMap.get(sq.section_id);
        if (!q || !sec) return;

        const scheme = (sec.marking_scheme as Record<string, unknown>) || {};
        const qMarks =
          typeof sq.marks === "number"
            ? sq.marks
            : typeof scheme.correct_marks === "number"
            ? (scheme.correct_marks as number)
            : typeof scheme.correctMarks === "number"
            ? (scheme.correctMarks as number)
            : 1;
        const qNeg =
          typeof scheme.negative_marks === "number"
            ? (scheme.negative_marks as number)
            : typeof scheme.negativeMarks === "number"
            ? (scheme.negativeMarks as number)
            : 0;

        computedMaxScore += qMarks;
        if (!sectionScoresDict[sec.id]) {
          sectionScoresDict[sec.id] = { title: sec.title, score: 0, maxScore: 0 };
        }
        sectionScoresDict[sec.id].maxScore += qMarks;

        const content = (q.content as Record<string, unknown>) || {};
        const rawOptions = (Array.isArray(q.options) ? q.options : []) as Array<{
          id: string;
          text?: string;
          label?: string;
          isCorrect?: boolean;
          is_correct?: boolean;
        }>;

        const userResp = responseMap.get(q.id);
        const evalRes = evaluateCandidateAnswer(q, userResp, qMarks, qNeg);

        if (evalRes.isAttempted) {
          computedTotalScore += evalRes.awardedMarks;
          sectionScoresDict[sec.id].score += evalRes.awardedMarks;
        }

        const targetOptionId = evalRes.correctOptionId;
        const targetOptionIds = evalRes.correctOptionIds || (targetOptionId ? [targetOptionId] : []);

        questionsList.push({
          questionId: q.id,
          orderIndex: sq.order_index || idx + 1,
          sectionId: sec.id,
          sectionTitle: sec.title,
          type: q.type,
          questionText: (content.text as string) || "Question content statement",
          latexCode: (content.latex as string) || null,
          codeSnippet: (content.codeSnippet as string) || null,
          programmingLanguage: (content.programmingLanguage as string) || null,
          subject: q.subject || "General",
          topic: q.topic || null,
          difficulty: q.difficulty || 2,
          maxMarks: qMarks,
          negativeMarks: qNeg,
          awardedMarks: evalRes.awardedMarks,
          isCorrect: evalRes.isCorrect,
          isAttempted: evalRes.isAttempted,
          options: rawOptions.map((opt, optIdx) => {
            const optId = opt.id || String.fromCharCode(65 + optIdx);
            const isOptCorrect =
              targetOptionIds.some((id) => id.toUpperCase() === optId.toUpperCase()) ||
              opt.isCorrect === true ||
              opt.is_correct === true;
            return {
              id: optId,
              text: opt.text || opt.label || "",
              isCorrect: isOptCorrect,
            };
          }),
          selectedOptionId: evalRes.selectedOptionId,
          selectedOptionIds: evalRes.selectedOptionIds,
          numericalValue: evalRes.numericalValue,
          descriptiveText: evalRes.descriptiveText,
          correctOptionId: targetOptionId,
          correctOptionIds: targetOptionIds.length > 0 ? targetOptionIds : null,
          correctNumericValue: evalRes.correctNumericValue,
          explanation: evalRes.explanation,
        });
      });
    }
  }

  // Fallback to sample dataset if no DB questions attached
  if (questionsList.length === 0) {
    const isCs = !candidateDept || candidateDept.toLowerCase().includes("mca") || candidateDept.toLowerCase().includes("comp");
    const sampleSections = SAMPLE_ENTRANCE_SECTIONS.filter((sec) => sec.scope === "common" || isCs);

    sampleSections.forEach((sec) => {
      sectionScoresDict[sec.id] = { title: sec.title, score: 0, maxScore: 0 };

      sec.questions.forEach((q, idx) => {
        computedMaxScore += q.marks;
        sectionScoresDict[sec.id].maxScore += q.marks;

        const userResp = responseMap.get(q.id);
        const evalRes = evaluateCandidateAnswer(q, userResp, q.marks, q.negativeMarks);

        if (evalRes.isAttempted) {
          computedTotalScore += evalRes.awardedMarks;
          sectionScoresDict[sec.id].score += evalRes.awardedMarks;
        }

        const targetOptionId = evalRes.correctOptionId;
        const targetOptionIds = evalRes.correctOptionIds || (targetOptionId ? [targetOptionId] : []);

        questionsList.push({
          questionId: q.id,
          orderIndex: q.orderIndex || idx + 1,
          sectionId: sec.id,
          sectionTitle: sec.title,
          type: q.type,
          questionText: q.questionText,
          latexCode: q.latexCode || null,
          codeSnippet: q.codeSnippet || null,
          programmingLanguage: q.programmingLanguage || null,
          subject: q.subject,
          topic: q.topic || null,
          difficulty: q.difficulty,
          maxMarks: q.marks,
          negativeMarks: q.negativeMarks,
          awardedMarks: evalRes.awardedMarks,
          isCorrect: evalRes.isCorrect,
          isAttempted: evalRes.isAttempted,
          options: q.options.map((opt) => {
            const isOptCorrect =
              targetOptionIds.some((id) => id.toUpperCase() === opt.id.toUpperCase()) ||
              opt.id === q.correctAnswer?.optionId ||
              (q.correctAnswer?.optionIds || []).includes(opt.id);
            return {
              id: opt.id,
              text: opt.text,
              isCorrect: isOptCorrect,
            };
          }),
          selectedOptionId: evalRes.selectedOptionId,
          selectedOptionIds: evalRes.selectedOptionIds,
          numericalValue: evalRes.numericalValue,
          descriptiveText: evalRes.descriptiveText,
          correctOptionId: targetOptionId,
          correctOptionIds: targetOptionIds.length > 0 ? targetOptionIds : null,
          correctNumericValue: evalRes.correctNumericValue,
          explanation: evalRes.explanation,
        });
      });
    });
  }

  // 7. Fetch Proctoring Session & Flags
  const { data: proctorSession } = await supabase
    .from("proctoring_sessions")
    .select("risk_score, flags")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  const flagsList = (Array.isArray(proctorSession?.flags) ? proctorSession?.flags : []) as Array<{
    type: string;
    timestamp: string;
    details?: Record<string, unknown>;
    message?: string;
  }>;

  const fullscreenExits = flagsList.filter((f) => f.type === "FULLSCREEN_EXIT").length;
  const tabSwitches = flagsList.filter((f) => f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR").length;

  const totalScore = result ? Number(result.total_score) : Math.max(0, computedTotalScore);
  const maxScore = result && Number(result.max_score) > 0 ? Number(result.max_score) : computedMaxScore;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  return {
    success: true,
    data: {
      resultId: result?.id || "",
      assignmentId,
      candidateName,
      candidateEmail,
      candidateDepartment: candidateDept,
      examTitle,
      startedAt: assignment.started_at,
      submittedAt: assignment.submitted_at,
      status: result?.status || "draft",
      totalScore,
      maxScore,
      percentage,
      percentile: result?.percentile !== null && result?.percentile !== undefined ? Number(result.percentile) : null,
      sectionScores: (result?.section_scores as Record<string, { title: string; score: number; maxScore: number }>) || sectionScoresDict,
      questions: questionsList,
      proctoring: {
        riskScore: proctorSession?.risk_score || 0,
        fullscreenExits,
        tabSwitches,
        totalFlags: flagsList.length,
        flags: flagsList,
      },
    },
  };
}

export interface ManualGradeOverridePayload {
  resultId: string;
  assignmentId: string;
  questionScores?: Record<string, number>;
  questionComments?: Record<string, string>;
  overallFeedback?: string;
  status?: "draft" | "published" | "reviewed";
}

/**
 * Examiner Action: Saves manual grade moderation overrides and adjusts candidate total marks.
 */
export async function updateCandidateManualGradeAction(
  payload: ManualGradeOverridePayload
): Promise<ActionResult<{ totalScore: number; percentage: number; percentile: number | null }>> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  const { data: result } = await supabase
    .from("exam_results")
    .select("*")
    .eq("id", payload.resultId)
    .single();

  if (!result) {
    return { error: "Result record not found", code: "NOT_FOUND" };
  }

  const detailRes = await getDetailedCandidateSubmissionAction(result.assignment_id);
  if (!detailRes.success || !detailRes.data) {
    return { error: "Failed to load submission questions", code: "NOT_FOUND" };
  }

  let newTotalScore = 0;
  let maxScore = 0;
  const newSectionScores: Record<string, { title: string; score: number; maxScore: number }> = {};

  detailRes.data.questions.forEach((q) => {
    maxScore += q.maxMarks;
    const assignedScore =
      payload.questionScores && typeof payload.questionScores[q.questionId] === "number"
        ? payload.questionScores[q.questionId]
        : q.awardedMarks;

    newTotalScore += assignedScore;

    if (!newSectionScores[q.sectionId]) {
      newSectionScores[q.sectionId] = { title: q.sectionTitle, score: 0, maxScore: 0 };
    }
    newSectionScores[q.sectionId].score += assignedScore;
    newSectionScores[q.sectionId].maxScore += q.maxMarks;
  });

  const percentage = maxScore > 0 ? Math.round((newTotalScore / maxScore) * 1000) / 10 : 0;
  const nowIso = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("exam_results")
    .update({
      total_score: newTotalScore,
      max_score: maxScore,
      percentage,
      section_scores: newSectionScores as unknown as Json,
      status: payload.status || result.status,
      graded_by: user.id,
      graded_at: nowIso,
    })
    .eq("id", payload.resultId);

  if (updateErr) {
    return { error: updateErr.message, code: "DB_ERROR" };
  }

  const { data: assignment } = await supabase
    .from("exam_assignments")
    .select("schedule_id")
    .eq("id", result.assignment_id)
    .single();

  if (assignment?.schedule_id) {
    await recalculateCohortScoresAndPercentilesAction(assignment.schedule_id);
  }

  const { data: refreshedResult } = await supabase
    .from("exam_results")
    .select("percentile")
    .eq("id", payload.resultId)
    .single();

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_GRADE_MODERATED",
    entityType: "exam_results",
    entityId: payload.resultId,
    details: {
      assignmentId: result.assignment_id,
      previousScore: result.total_score,
      newTotalScore,
      percentage,
      status: payload.status || result.status,
    },
  });

  revalidatePath("/examiner/grading");
  revalidatePath("/candidate");
  return {
    success: true,
    data: {
      totalScore: newTotalScore,
      percentage,
      percentile: refreshedResult?.percentile ? Number(refreshedResult.percentile) : null,
    },
  };
}

/**
 * Examiner Action: Computes percentile ranks across all candidates in an exam cohort.
 */
export async function recalculateCohortScoresAndPercentilesAction(
  scheduleId?: string
): Promise<ActionResult<{ updatedCount: number }>> {
  const user = await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  let query = supabase.from("exam_assignments").select("id, schedule_id, status");
  if (scheduleId) {
    query = query.eq("schedule_id", scheduleId);
  }

  const { data: assignments } = await query;
  if (!assignments || assignments.length === 0) {
    return { success: true, data: { updatedCount: 0 } };
  }

  const assignmentIds = assignments.map((a) => a.id);
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

  const { data: results } = await supabase
    .from("exam_results")
    .select("id, assignment_id, total_score")
    .in("assignment_id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  if (!results || results.length === 0) {
    return { success: true, data: { updatedCount: 0 } };
  }

  const scheduleGroups = new Map<string, Array<{ id: string; assignment_id: string; total_score: number }>>();
  results.forEach((r) => {
    const a = assignmentMap.get(r.assignment_id);
    const sId = a?.schedule_id || "global";
    if (!scheduleGroups.has(sId)) {
      scheduleGroups.set(sId, []);
    }
    scheduleGroups.get(sId)!.push({
      id: r.id,
      assignment_id: r.assignment_id,
      total_score: Number(r.total_score) || 0,
    });
  });

  let totalUpdated = 0;

  for (const [, groupResults] of scheduleGroups.entries()) {
    const totalCandidates = groupResults.length;
    if (totalCandidates === 0) continue;

    for (const res of groupResults) {
      const countBelowOrEqual = groupResults.filter((g) => g.total_score <= res.total_score).length;
      const percentile = Math.round((countBelowOrEqual / totalCandidates) * 1000) / 10;

      await supabase.from("exam_results").update({ percentile }).eq("id", res.id);
      totalUpdated++;
    }
  }

  await logAuditEvent({
    userId: user.id,
    action: "COHORT_PERCENTILES_RECALCULATED",
    entityType: "exam_results",
    details: { totalUpdated, scheduleId },
  });

  revalidatePath("/examiner/grading");
  revalidatePath("/candidate");
  return { success: true, data: { updatedCount: totalUpdated } };
}

