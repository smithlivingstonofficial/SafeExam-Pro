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
} from "@/lib/validations/examiner";
import { Json } from "@/types/database";

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

  const rawData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
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
    details: { name: newBank.name },
  });

  revalidatePath("/examiner");
  return { success: true, data: newBank };
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
    .select("id, subject, type")
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
    details: { bankId: q.bankId, type: q.type, subject: q.subject },
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
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
    shuffleOptions: formData.get("shuffleOptions") === "on",
    allowBacktracking: formData.get("allowBacktracking") === "on",
    requireSafeBrowser: formData.get("requireSafeBrowser") === "on",
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
        shuffle_questions: validation.data.shuffleQuestions,
        shuffle_options: validation.data.shuffleOptions,
        allow_backtracking: validation.data.allowBacktracking,
        require_safe_browser: validation.data.requireSafeBrowser,
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
      order_index: s.orderIndex,
      time_limit_minutes: s.timeLimitMinutes || null,
      marking_scheme: {
        correct_marks: s.correctMarks,
        negative_marks: s.negativeMarks,
        partial_marks: s.partialMarks,
      },
    })
    .select("id, title")
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
export async function scheduleExamAction(formData: FormData): Promise<ActionResult> {
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
