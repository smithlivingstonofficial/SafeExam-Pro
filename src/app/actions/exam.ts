"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import { logAuditEvent } from "@/lib/audit";
import {
  saveResponseSchema,
  submitExamSchema,
  proctorIncidentSchema,
  candidateQuerySchema,
  respondQuerySchema,
  SaveResponseInput,
  ProctorIncidentInput,
  CandidateQueryInput,
  RespondQueryInput,
} from "@/lib/validations/exam";
import { Json } from "@/types/database";
import { SAMPLE_ENTRANCE_SECTIONS } from "@/lib/exam/sample-exam-data";
import { evaluateCandidateAnswer, extractQuestionCorrectAnswer } from "@/lib/exam/evaluator";

export interface ExamActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  code?: string;
  data?: T;
}

/**
 * Commences an exam delivery session for an assigned candidate.
 * Strictly verifies schedule start and end time windows before permitting entry.
 */
export async function startExamSessionAction(assignmentId: string): Promise<ExamActionResult> {
  const user = await requireRole(["candidate", "admin"]);
  const supabase = createAdminClient();

  // 1. Fetch assignment and verify ownership
  const { data: assignment, error: assignErr } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, status, started_at, schedule_id")
    .eq("id", assignmentId)
    .single();

  if (assignErr || !assignment) {
    return { error: "Examination assignment not found", code: "NOT_FOUND" };
  }

  if (user.role === "candidate" && assignment.candidate_id !== user.id) {
    return { error: "Access denied to this examination session", code: "UNAUTHORIZED" };
  }

  if (assignment.status === "submitted" || assignment.status === "graded") {
    return { error: "This examination has already been completed and submitted.", code: "ALREADY_SUBMITTED" };
  }

  // 2. Fetch schedule to check time window
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("id, start_at, end_at, duration_minutes, status")
    .eq("id", assignment.schedule_id)
    .single();

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (schedule) {
    const startMs = new Date(schedule.start_at).getTime();
    const endMs = new Date(schedule.end_at).getTime();

    // Reject if before schedule start time
    if (nowMs < startMs) {
      return {
        error: `The examination window has not opened yet. Scheduled start: ${new Date(schedule.start_at).toLocaleString()}`,
        code: "WINDOW_NOT_OPEN",
      };
    }

    // Reject if after schedule end time
    if (nowMs > endMs) {
      return {
        error: `The examination schedule concluded at ${new Date(schedule.end_at).toLocaleString()}. New attempts are not permitted.`,
        code: "SCHEDULE_EXPIRED",
      };
    }
  }

  // 3. Update status to 'started' if not already
  if (assignment.status !== "started") {
    const { error: updateErr } = await supabase
      .from("exam_assignments")
      .update({
        status: "started",
        started_at: assignment.started_at || nowIso,
      })
      .eq("id", assignmentId);

    if (updateErr) {
      return { error: updateErr.message, code: "DB_ERROR" };
    }
  }

  // 4. Initialize proctoring session if not existing
  const { data: existingProctor } = await supabase
    .from("proctoring_sessions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (!existingProctor) {
    await supabase.from("proctoring_sessions").insert({
      assignment_id: assignmentId,
      risk_score: 0,
      flags: [],
      screenshots: [],
      created_at: nowIso,
    });
  }

  // 5. Audit Log
  await logAuditEvent({
    userId: user.id,
    action: "EXAM_SESSION_STARTED",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: {
      scheduleId: assignment.schedule_id,
      startedAt: nowIso,
    },
  });

  revalidatePath(`/candidate/exam/${assignmentId}`);
  revalidatePath("/candidate");
  revalidatePath("/proctor");

  return { success: true };
}

/**
 * Saves candidate response to a question with auto-save timestamp.
 */
export async function saveExamResponseAction(input: SaveResponseInput): Promise<ExamActionResult> {
  const user = await requireRole(["candidate", "admin"]);

  const validation = saveResponseSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid response format",
      code: "VALIDATION_ERROR",
    };
  }

  const { assignmentId, questionId, response, isFlagged, timeSpentSeconds } = validation.data;
  const supabase = createAdminClient();

  // Verify assignment ownership and status
  const { data: assignment } = await supabase
    .from("exam_assignments")
    .select("candidate_id, status, started_at, schedule_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { error: "Assignment not found", code: "NOT_FOUND" };
  }

  if (user.role === "candidate" && assignment.candidate_id !== user.id) {
    return { error: "Unauthorized access", code: "FORBIDDEN" };
  }

  if (assignment.status === "submitted" || assignment.status === "graded") {
    return { error: "Exam is already submitted. No further modifications allowed.", code: "LOCKED" };
  }

  // Server-side Deadline Enforcement (duration + schedule window with 15s grace period)
  if (assignment.started_at && assignment.schedule_id) {
    const { data: schedule } = await supabase
      .from("exam_schedules")
      .select("duration_minutes, end_at")
      .eq("id", assignment.schedule_id)
      .maybeSingle();

    if (schedule) {
      const startedMs = new Date(assignment.started_at).getTime();
      const durationMs = (schedule.duration_minutes || 120) * 60 * 1000;
      const scheduleEndMs = schedule.end_at ? new Date(schedule.end_at).getTime() : Number.MAX_SAFE_INTEGER;

      const hardDeadlineMs = Math.min(startedMs + durationMs, scheduleEndMs);
      const maxAllowedMs = hardDeadlineMs + 15000; // 15 seconds network grace period

      if (Date.now() > maxAllowedMs) {
        // Auto-finalize exam to lock responses
        await submitExamAction(assignmentId);
        return {
          error: "Allotted examination time has elapsed. Your answers have been locked and submitted.",
          code: "TIME_EXPIRED",
        };
      }
    }
  }

  const nowIso = new Date().toISOString();

  // Check if response exists
  const { data: existingResponse } = await supabase
    .from("exam_responses")
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existingResponse) {
    const { error: updateErr } = await supabase
      .from("exam_responses")
      .update({
        response: response as Json,
        is_flagged: isFlagged,
        time_spent_seconds: timeSpentSeconds,
        saved_at: nowIso,
      })
      .eq("id", existingResponse.id);

    if (updateErr) {
      return { error: updateErr.message, code: "DB_ERROR" };
    }
  } else {
    const { error: insertErr } = await supabase.from("exam_responses").insert({
      assignment_id: assignmentId,
      question_id: questionId,
      response: response as Json,
      is_flagged: isFlagged,
      time_spent_seconds: timeSpentSeconds,
      saved_at: nowIso,
    });

    if (insertErr) {
      return { error: insertErr.message, code: "DB_ERROR" };
    }
  }

  return { success: true };
}

/**
 * Logs anti-cheat infractions and proctoring surveillance alerts.
 */
export async function recordProctorIncidentAction(
  assignmentId: string,
  incidentType: ProctorIncidentInput["incidentType"],
  details: Record<string, unknown> = {}
): Promise<ExamActionResult> {
  const user = await requireRole(["candidate", "admin", "proctor"]);
  const supabase = createAdminClient();

  const validation = proctorIncidentSchema.safeParse({ assignmentId, incidentType, details });
  if (!validation.success) {
    return { error: "Invalid incident payload", code: "VALIDATION_ERROR" };
  }

  const nowIso = new Date().toISOString();
  const incidentEntry = {
    type: incidentType,
    timestamp: nowIso,
    details,
  };

  const penaltyScore =
    incidentType === "TAB_SWITCH" ? 15 :
    incidentType === "WINDOW_BLUR" ? 15 :
    incidentType === "FULLSCREEN_EXIT" ? 20 :
    incidentType === "CLOCK_ANOMALY_DETECTED" ? 25 :
    incidentType === "DEVTOOLS_ATTEMPT" || incidentType === "DEVTOOLS_OPEN" ? 30 :
    incidentType === "SCREEN_CAPTURE_ATTEMPT" ? 20 :
    incidentType === "COPY_PASTE_ATTEMPT" ? 10 :
    incidentType === "MULTIPLE_FACES" ? 25 : 5;

  const { data: proctorSession } = await supabase
    .from("proctoring_sessions")
    .select("id, flags, risk_score")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (proctorSession) {
    const currentFlags = (Array.isArray(proctorSession.flags) ? proctorSession.flags : []) as unknown[];
    const updatedFlags = [...currentFlags, incidentEntry];
    const newRisk = Math.min(100, (proctorSession.risk_score || 0) + penaltyScore);

    await supabase
      .from("proctoring_sessions")
      .update({
        flags: updatedFlags as Json,
        risk_score: newRisk,
      })
      .eq("id", proctorSession.id);
  } else {
    await supabase.from("proctoring_sessions").insert({
      assignment_id: assignmentId,
      risk_score: penaltyScore,
      flags: [incidentEntry] as unknown as Json,
      screenshots: [],
      created_at: nowIso,
    });
  }

  await logAuditEvent({
    userId: user.id,
    action: `PROCTOR_INCIDENT_${incidentType}`,
    entityType: "proctoring_sessions",
    entityId: assignmentId,
    details: { incidentType, penaltyScore, ...details },
  });

  return { success: true };
}

/**
 * Proctor Action: Sends an official warning message directly to candidate screen.
 */
export async function sendProctorWarningAction(
  assignmentId: string,
  message: string
): Promise<ExamActionResult> {
  const user = await requireRole(["proctor", "admin"]);
  const supabase = createAdminClient();

  if (!message.trim()) {
    return { error: "Warning message cannot be empty", code: "VALIDATION_ERROR" };
  }

  const nowIso = new Date().toISOString();
  const warningEntry = {
    type: "PROCTOR_WARNING",
    message: message.trim(),
    issuedBy: user.fullName || "Proctor",
    timestamp: nowIso,
  };

  const { data: proctorSession } = await supabase
    .from("proctoring_sessions")
    .select("id, flags, risk_score")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (proctorSession) {
    const currentFlags = (Array.isArray(proctorSession.flags) ? proctorSession.flags : []) as unknown[];
    await supabase
      .from("proctoring_sessions")
      .update({
        flags: [...currentFlags, warningEntry] as Json,
        risk_score: Math.min(100, (proctorSession.risk_score || 0) + 15),
      })
      .eq("id", proctorSession.id);
  } else {
    await supabase.from("proctoring_sessions").insert({
      assignment_id: assignmentId,
      risk_score: 15,
      flags: [warningEntry] as unknown as Json,
      screenshots: [],
      created_at: nowIso,
    });
  }

  await logAuditEvent({
    userId: user.id,
    action: "PROCTOR_WARNING_ISSUED",
    entityType: "proctoring_sessions",
    entityId: assignmentId,
    details: { message, proctorId: user.id },
  });

  revalidatePath("/proctor");
  revalidatePath(`/candidate/exam/${assignmentId}`);

  return { success: true };
}

/**
 * Proctor Action: Force terminates an exam session due to severe malpractice.
 */
export async function terminateExamSessionAction(
  assignmentId: string,
  reason: string
): Promise<ExamActionResult> {
  const user = await requireRole(["proctor", "admin"]);
  const supabase = createAdminClient();

  const nowIso = new Date().toISOString();
  const termEntry = {
    type: "TERMINATED_BY_PROCTOR",
    reason: reason || "Malpractice or protocol violation",
    proctorName: user.fullName,
    timestamp: nowIso,
  };

  const { data: proctorSession } = await supabase
    .from("proctoring_sessions")
    .select("id, flags")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (proctorSession) {
    const currentFlags = (Array.isArray(proctorSession.flags) ? proctorSession.flags : []) as unknown[];
    await supabase
      .from("proctoring_sessions")
      .update({
        flags: [...currentFlags, termEntry] as Json,
        risk_score: 100,
        proctor_notes: reason,
      })
      .eq("id", proctorSession.id);
  }

  // Force submit the assignment
  await submitExamAction(assignmentId);

  await logAuditEvent({
    userId: user.id,
    action: "EXAM_TERMINATED_BY_PROCTOR",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: { reason, proctorId: user.id },
  });

  revalidatePath("/proctor");
  revalidatePath(`/candidate/exam/${assignmentId}`);
  revalidatePath("/candidate");

  return { success: true };
}

/**
 * Submits the examination, freezes responses, runs objective auto-scoring, and records results.
 */
export async function submitExamAction(assignmentId: string): Promise<ExamActionResult<{
  score: number;
  maxScore: number;
  percentage: number;
  totalAnswered: number;
}>> {
  const user = await requireRole(["candidate", "admin"]);
  const supabase = createAdminClient();

  // 1. Fetch assignment
  const { data: assignment, error: assignErr } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, schedule_id, status, started_at")
    .eq("id", assignmentId)
    .single();

  if (assignErr || !assignment) {
    return { error: "Assignment not found", code: "NOT_FOUND" };
  }

  if (user.role === "candidate" && assignment.candidate_id !== user.id) {
    return { error: "Unauthorized access", code: "FORBIDDEN" };
  }

  // Idempotency check: if already submitted, return existing results immediately
  if (assignment.status === "submitted" || assignment.status === "graded") {
    const { data: existingRes } = await supabase
      .from("exam_results")
      .select("total_score, max_score, percentage")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    return {
      success: true,
      data: {
        score: Number(existingRes?.total_score) || 0,
        maxScore: Number(existingRes?.max_score) || 0,
        percentage: Number(existingRes?.percentage) || 0,
        totalAnswered: 0,
      },
    };
  }

  const nowIso = new Date().toISOString();

  // 2. Fetch all responses submitted by this candidate
  const { data: responses } = await supabase
    .from("exam_responses")
    .select("question_id, response")
    .eq("assignment_id", assignmentId);

  interface DbResponseRow {
    question_id: string;
    response: unknown;
  }

  interface DbSectionRow {
    id: string;
    title: string;
    scope?: string | null;
    department_id?: string | null;
    correct_marks?: number | null;
    negative_marks?: number | null;
    marking_scheme?: unknown;
  }

  interface DbSectionQuestionRow {
    question_id: string;
    section_id: string;
    marks?: number | null;
  }

  interface DbQuestionRow {
    id: string;
    type: string;
    options?: unknown;
    correct_answer?: unknown;
  }

  const responseMap = new Map<string, Record<string, unknown>>();
  ((responses as DbResponseRow[]) || []).forEach((r) => {
    if (r.response && typeof r.response === "object") {
      responseMap.set(r.question_id, r.response as Record<string, unknown>);
    }
  });

  // 3. Score evaluation across questions
  // Fetch candidate profile to know enrolled department
  const { data: candidateProfile } = await supabase
    .from("profiles")
    .select("department_id, department")
    .eq("id", assignment.candidate_id)
    .maybeSingle();

  let candidateDeptId = candidateProfile?.department_id || null;
  if (!candidateDeptId && candidateProfile?.department) {
    const { data: deptRow } = await supabase
      .from("departments")
      .select("id")
      .or(`name.eq.${candidateProfile.department},code.eq.${candidateProfile.department}`)
      .maybeSingle();
    if (deptRow) {
      candidateDeptId = deptRow.id;
    }
  }

  // Check if live DB questions exist for this exam schedule
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("id, exam_id")
    .eq("id", assignment.schedule_id)
    .maybeSingle();

  let totalScore = 0;
  let maxScore = 0;
  let totalAnswered = 0;
  const sectionScores: Record<string, { title: string; score: number; maxScore: number }> = {};

  if (schedule?.exam_id) {
    const { data: sections } = await supabase
      .from("exam_sections")
      .select("id, title, correct_marks, negative_marks, scope, department_id, marking_scheme")
      .eq("exam_id", schedule.exam_id)
      .order("order_index", { ascending: true });

    const allSections = (sections as DbSectionRow[]) || [];
    // Only score sections meant for this candidate: universal common + candidate's department
    const typedSections = allSections.filter((sec) => {
      if (sec.scope === "common" || !sec.department_id) return true;
      return candidateDeptId && sec.department_id === candidateDeptId;
    });

    const sectionIds = typedSections.map((s) => s.id);

    const { data: sectionQuestions } = await supabase
      .from("exam_section_questions")
      .select("question_id, section_id, marks, order_index")
      .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
      .order("order_index", { ascending: true });

    const typedSectionQuestions = (sectionQuestions as DbSectionQuestionRow[]) || [];
    const qIds = typedSectionQuestions.map((sq) => sq.question_id);

    const { data: questions } = await supabase
      .from("questions")
      .select("id, type, options, correct_answer")
      .in("id", qIds.length ? qIds : ["00000000-0000-0000-0000-000000000000"]);

    const typedQuestions = (questions as DbQuestionRow[]) || [];

    if (typedQuestions.length > 0) {
      const qMap = new Map(typedQuestions.map((q) => [q.id, q]));
      const secMap = new Map(typedSections.map((s) => [s.id, s]));

      typedSectionQuestions.forEach((sq) => {
        const q = qMap.get(sq.question_id);
        const sec = secMap.get(sq.section_id);
        if (!q || !sec) return;

        const scheme = (sec.marking_scheme as Record<string, unknown>) || {};
        const qMarks =
          typeof sq.marks === "number"
            ? sq.marks
            : typeof sec.correct_marks === "number"
            ? sec.correct_marks
            : typeof scheme.correct_marks === "number"
            ? (scheme.correct_marks as number)
            : typeof scheme.correctMarks === "number"
            ? (scheme.correctMarks as number)
            : 1;
        const qNeg =
          typeof sec.negative_marks === "number"
            ? sec.negative_marks
            : typeof scheme.negative_marks === "number"
            ? (scheme.negative_marks as number)
            : typeof scheme.negativeMarks === "number"
            ? (scheme.negativeMarks as number)
            : 0;
        maxScore += qMarks;

        if (!sectionScores[sq.section_id]) {
          sectionScores[sq.section_id] = { title: sec.title, score: 0, maxScore: 0 };
        }
        sectionScores[sq.section_id].maxScore += qMarks;

        const userResp = responseMap.get(q.id);
        if (userResp) {
          totalAnswered++;
        }

        const evalRes = evaluateCandidateAnswer(q, userResp, qMarks, qNeg);
        if (evalRes.isAttempted) {
          totalScore += evalRes.awardedMarks;
          sectionScores[sq.section_id].score += evalRes.awardedMarks;
        }
      });
    }
  }

  // Fallback to sample entrance sections if no questions in DB
  if (maxScore === 0) {
    const candidateDeptName = candidateProfile?.department?.toLowerCase() || "";
    const isCsRelated =
      !candidateDeptName ||
      candidateDeptName.includes("computer") ||
      candidateDeptName.includes("cse") ||
      candidateDeptName.includes("mca") ||
      candidateDeptName.includes("information technology") ||
      candidateDeptName.includes("software");

    const sampleSections = SAMPLE_ENTRANCE_SECTIONS.filter((sec) => {
      if (sec.scope === "common") return true;
      return isCsRelated;
    });

    sampleSections.forEach((sec) => {
      sectionScores[sec.id] = { title: sec.title, score: 0, maxScore: 0 };

      sec.questions.forEach((q) => {
        maxScore += q.marks;
        sectionScores[sec.id].maxScore += q.marks;

        const userResp = responseMap.get(q.id);
        if (userResp) {
          totalAnswered++;
        }

        const evalRes = evaluateCandidateAnswer(q, userResp, q.marks, q.negativeMarks);
        if (evalRes.isAttempted) {
          totalScore += evalRes.awardedMarks;
          sectionScores[sec.id].score += evalRes.awardedMarks;
        }
      });
    });
  }

  // Ensure total score is non-negative
  totalScore = Math.max(0, totalScore);
  Object.keys(sectionScores).forEach((secId) => {
    sectionScores[secId].score = Math.max(0, sectionScores[secId].score);
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  // 4. Mark assignment as submitted
  const { error: submitErr } = await supabase
    .from("exam_assignments")
    .update({
      status: "submitted",
      submitted_at: nowIso,
    })
    .eq("id", assignmentId);

  if (submitErr) {
    return { error: submitErr.message, code: "DB_ERROR" };
  }

  // 5. Store / Upsert into exam_results
  const { data: existingResult } = await supabase
    .from("exam_results")
    .select("id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (existingResult) {
    await supabase
      .from("exam_results")
      .update({
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        section_scores: sectionScores as unknown as Json,
        status: "draft",
        graded_at: nowIso,
      })
      .eq("id", existingResult.id);
  } else {
    await supabase.from("exam_results").insert({
      assignment_id: assignmentId,
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      section_scores: sectionScores as unknown as Json,
      status: "draft",
      graded_at: nowIso,
      created_at: nowIso,
    });
  }

  // 6. Audit log
  await logAuditEvent({
    userId: user.id,
    action: "EXAM_SUBMITTED",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: {
      totalScore,
      maxScore,
      percentage,
      totalAnswered,
      submittedAt: nowIso,
    },
  });

  revalidatePath(`/candidate/exam/${assignmentId}`);
  revalidatePath("/candidate");
  revalidatePath("/examiner/grading");
  revalidatePath("/proctor");

  return {
    success: true,
    data: {
      score: totalScore,
      maxScore,
      percentage,
      totalAnswered,
    },
  };
}

/**
 * Creates or retrieves a practice assessment session for candidates to test the engine.
 */
export async function createDemoCandidateAssignmentAction(): Promise<ExamActionResult<{ assignmentId: string }>> {
  const user = await requireRole(["candidate", "admin", "examiner"]);
  const supabase = createAdminClient();

  // Find or create a schedule
  let { data: schedule } = await supabase
    .from("exam_schedules")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!schedule) {
    let { data: exam } = await supabase
      .from("exams")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!exam) {
      const { data: newExam } = await supabase
        .from("exams")
        .insert({
          title: "Ph.D Entrance Examination 2026",
          description: "Quantitative Reasoning, Research Methodology & Computer Science",
          status: "published",
          settings: { shuffleQuestions: true, allowBacktracking: true },
        })
        .select("id")
        .single();
      exam = newExam;
    }

    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { data: newSched } = await supabase
      .from("exam_schedules")
      .insert({
        exam_id: exam!.id,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        duration_minutes: 120,
        status: "active",
        proctoring_level: "standard",
      })
      .select("id")
      .single();
    schedule = newSched;
  }

  // Check if candidate already has an assignment for this schedule
  const { data: existingAssignment } = await supabase
    .from("exam_assignments")
    .select("id, status")
    .eq("candidate_id", user.id)
    .eq("schedule_id", schedule!.id)
    .maybeSingle();

  if (existingAssignment) {
    return { success: true, data: { assignmentId: existingAssignment.id } };
  }

  const { data: newAssignment, error: assignErr } = await supabase
    .from("exam_assignments")
    .insert({
      candidate_id: user.id,
      schedule_id: schedule!.id,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (assignErr || !newAssignment) {
    return { error: assignErr?.message || "Failed to initialize assessment session", code: "DB_ERROR" };
  }

  revalidatePath("/candidate");
  return { success: true, data: { assignmentId: newAssignment.id } };
}

export interface ExamSessionStatusResult {
  status: string;
  isTerminated: boolean;
  terminationReason?: string | null;
  serverNow: string;
  remainingSeconds: number;
  isTimeExpired: boolean;
  deadlineAt?: string | null;
  scheduleEndAt?: string | null;
  fullscreenExits: number;
  tabSwitches: number;
  otherFlags: number;
  totalFlags: number;
  riskScore: number;
  latestWarning?: {
    message: string;
    issuedBy?: string;
    timestamp: string;
  } | null;
}

/**
 * Checks the real-time supervision status of an active exam assignment.
 * Returns authoritative server time, remaining seconds, auto-finalizes if expired,
 * and delivers separate counts for fullscreen exits, tab switches, and warnings.
 */
export async function checkExamSessionStatusAction(
  assignmentId: string
): Promise<ExamActionResult<ExamSessionStatusResult>> {
  const user = await requireRole(["candidate", "admin", "proctor"]);
  const supabase = createAdminClient();

  const { data: assignment } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, status, started_at, schedule_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { error: "Assignment not found", code: "NOT_FOUND" };
  }

  if (user.role === "candidate" && assignment.candidate_id !== user.id) {
    return { error: "Unauthorized access", code: "FORBIDDEN" };
  }

  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("duration_minutes, end_at, start_at")
    .eq("id", assignment.schedule_id)
    .maybeSingle();

  const nowMs = Date.now();
  const serverNow = new Date(nowMs).toISOString();
  let isTimeExpired = false;
  let remainingSeconds = 0;
  let deadlineIso: string | null = null;

  if (assignment.started_at && schedule) {
    const startedMs = new Date(assignment.started_at).getTime();
    const durationMs = (schedule.duration_minutes || 120) * 60 * 1000;
    const scheduleEndMs = schedule.end_at ? new Date(schedule.end_at).getTime() : Number.MAX_SAFE_INTEGER;
    const hardDeadlineMs = Math.min(startedMs + durationMs, scheduleEndMs);
    deadlineIso = new Date(hardDeadlineMs).toISOString();

    remainingSeconds = Math.max(0, Math.floor((hardDeadlineMs - nowMs) / 1000));
    if (nowMs >= hardDeadlineMs) {
      isTimeExpired = true;
      if (assignment.status === "started") {
        // Auto-finalize on server
        await submitExamAction(assignmentId);
      }
    }
  }

  const { data: proctorSession } = await supabase
    .from("proctoring_sessions")
    .select("flags, risk_score")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  const flags = (Array.isArray(proctorSession?.flags) ? proctorSession?.flags : []) as Array<Record<string, unknown>>;

  // Granular Flag Separation
  const fullscreenExits = flags.filter((f) => f.type === "FULLSCREEN_EXIT").length;
  const tabSwitches = flags.filter((f) => f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR").length;
  const otherFlags = flags.filter(
    (f) =>
      f.type !== "FULLSCREEN_EXIT" &&
      f.type !== "TAB_SWITCH" &&
      f.type !== "WINDOW_BLUR" &&
      f.type !== "PROCTOR_WARNING" &&
      f.type !== "TERMINATED_BY_PROCTOR"
  ).length;

  // Look for termination flag
  const termFlag = flags.find((f) => f.type === "TERMINATED_BY_PROCTOR");
  const isTerminated = !!termFlag || assignment.status === "absent";
  const terminationReason = termFlag ? (termFlag.reason as string) : null;

  // Look for latest proctor warning
  const warnings = flags.filter((f) => f.type === "PROCTOR_WARNING");
  const latestWarningObj = warnings.length > 0 ? warnings[warnings.length - 1] : null;
  const latestWarning = latestWarningObj
    ? {
        message: (latestWarningObj.message as string) || "Please adhere to examination protocols.",
        issuedBy: (latestWarningObj.issuedBy as string) || "Exam Proctor",
        timestamp: (latestWarningObj.timestamp as string) || new Date().toISOString(),
      }
    : null;

  return {
    success: true,
    data: {
      status: assignment.status,
      isTerminated,
      terminationReason,
      serverNow,
      remainingSeconds,
      isTimeExpired,
      deadlineAt: deadlineIso,
      scheduleEndAt: schedule?.end_at || null,
      fullscreenExits,
      tabSwitches,
      otherFlags,
      totalFlags: fullscreenExits + tabSwitches + otherFlags,
      riskScore: proctorSession?.risk_score || 0,
      latestWarning,
    },
  };
}

export interface CandidateQueryItem {
  id: string;
  assignmentId: string;
  candidateId: string;
  candidateName?: string;
  candidateDepartment?: string;
  category: "technical" | "question_clarity" | "audio_video" | "connectivity" | "general";
  questionNumber?: number | null;
  message: string;
  status: "open" | "in_progress" | "resolved";
  resolvedBy?: string | null;
  resolvedByName?: string | null;
  responseMessage?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

/**
 * Candidate Action: Submits a real-time support query / inquiry directly to officials.
 */
export async function submitCandidateQueryAction(
  input: CandidateQueryInput
): Promise<ExamActionResult<CandidateQueryItem>> {
  const user = await requireRole(["candidate", "admin"]);
  const supabase = createAdminClient();

  const validation = candidateQuerySchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid query format",
      code: "VALIDATION_ERROR",
    };
  }

  const { assignmentId, category, questionNumber, message } = validation.data;

  // 1. Verify assignment and ownership
  const { data: assignment, error: assignErr } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, status, schedule_id")
    .eq("id", assignmentId)
    .single();

  if (assignErr || !assignment) {
    return { error: "Examination session not found", code: "NOT_FOUND" };
  }

  if (user.role === "candidate" && assignment.candidate_id !== user.id) {
    return { error: "Unauthorized access to exam session", code: "FORBIDDEN" };
  }

  const nowIso = new Date().toISOString();
  const queryId = crypto.randomUUID();

  const queryPayload: CandidateQueryItem = {
    id: queryId,
    assignmentId,
    candidateId: assignment.candidate_id,
    candidateName: user.fullName || "Candidate",
    category,
    questionNumber: questionNumber || null,
    message: message.trim(),
    status: "open",
    createdAt: nowIso,
  };

  // Try inserting into exam_queries table
  let insertSucceeded = false;
  try {
    const { error: insertErr } = await supabase.from("exam_queries").insert({
      id: queryId,
      assignment_id: assignmentId,
      candidate_id: assignment.candidate_id,
      category,
      question_number: questionNumber || null,
      message: message.trim(),
      status: "open",
      created_at: nowIso,
      updated_at: nowIso,
    });
    if (!insertErr) insertSucceeded = true;
  } catch {
    insertSucceeded = false;
  }

  // Also append to proctoring_sessions.flags for unified incident & realtime streaming
  try {
    const { data: proctorSession } = await supabase
      .from("proctoring_sessions")
      .select("id, flags")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    const queryFlagEntry = {
      type: "CANDIDATE_QUERY",
      queryId,
      category,
      questionNumber: questionNumber || null,
      message: message.trim(),
      status: "open",
      timestamp: nowIso,
    };

    if (proctorSession) {
      const currentFlags = (Array.isArray(proctorSession.flags) ? proctorSession.flags : []) as unknown[];
      await supabase
        .from("proctoring_sessions")
        .update({
          flags: [...currentFlags, queryFlagEntry] as Json,
        })
        .eq("id", proctorSession.id);
    } else {
      await supabase.from("proctoring_sessions").insert({
        assignment_id: assignmentId,
        risk_score: 0,
        flags: [queryFlagEntry] as unknown as Json,
        screenshots: [],
        created_at: nowIso,
      });
    }
  } catch {
    // proctor session update fallback
  }

  // Audit logging
  await logAuditEvent({
    userId: user.id,
    action: "CANDIDATE_EXAM_QUERY_SUBMITTED",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: {
      queryId,
      category,
      questionNumber,
      message: message.trim(),
    },
  });

  revalidatePath("/proctor");
  revalidatePath(`/candidate/exam/${assignmentId}`);

  return { success: true, data: queryPayload };
}

/**
 * Fetches real-time queries and official responses for a candidate's exam docket.
 */
export async function getCandidateQueriesAction(
  assignmentId: string
): Promise<ExamActionResult<CandidateQueryItem[]>> {
  const user = await requireRole(["candidate", "admin", "proctor"]);
  const supabase = createAdminClient();

  const queriesList: CandidateQueryItem[] = [];

  // 1. Try fetching from exam_queries table
  try {
    const { data: dbQueries, error: qErr } = await supabase
      .from("exam_queries")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (!qErr && dbQueries && dbQueries.length > 0) {
      dbQueries.forEach((q: any) => {
        queriesList.push({
          id: q.id,
          assignmentId: q.assignment_id,
          candidateId: q.candidate_id,
          category: q.category,
          questionNumber: q.question_number,
          message: q.message,
          status: q.status,
          resolvedBy: q.resolved_by,
          resolvedByName: q.resolved_by_name,
          responseMessage: q.response_message,
          resolvedAt: q.resolved_at,
          createdAt: q.created_at,
        });
      });
      return { success: true, data: queriesList };
    }
  } catch {
    // fallback to proctor session flags below
  }

  // 2. Fallback: Parse from proctoring_sessions.flags
  try {
    const { data: proctorSession } = await supabase
      .from("proctoring_sessions")
      .select("flags")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (proctorSession && Array.isArray(proctorSession.flags)) {
      const queryFlags = proctorSession.flags.filter((f: any) => f.type === "CANDIDATE_QUERY");
      queryFlags.forEach((q: any) => {
        queriesList.push({
          id: q.queryId || crypto.randomUUID(),
          assignmentId,
          candidateId: user.id,
          category: q.category || "general",
          questionNumber: q.questionNumber || null,
          message: q.message || "",
          status: q.status || "open",
          resolvedByName: q.resolvedByName || null,
          responseMessage: q.responseMessage || null,
          resolvedAt: q.resolvedAt || null,
          createdAt: q.timestamp || new Date().toISOString(),
        });
      });
    }
  } catch {
    // quiet fallback
  }

  return { success: true, data: queriesList };
}

/**
 * Proctor Action: Responds directly to a candidate's exam query and marks resolution status.
 */
export async function respondToCandidateQueryAction(
  input: RespondQueryInput
): Promise<ExamActionResult<CandidateQueryItem>> {
  const user = await requireRole(["proctor", "admin"]);
  const supabase = createAdminClient();

  const validation = respondQuerySchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid response format",
      code: "VALIDATION_ERROR",
    };
  }

  const { queryId, assignmentId, responseMessage, status } = validation.data;
  const nowIso = new Date().toISOString();

  // 1. Update in exam_queries table
  try {
    await supabase
      .from("exam_queries")
      .update({
        response_message: responseMessage.trim(),
        resolved_by: user.id,
        resolved_by_name: user.fullName || "Exam Proctor",
        resolved_at: nowIso,
        status,
        updated_at: nowIso,
      })
      .eq("id", queryId);
  } catch {
    // continue to flag update
  }

  // 2. Update flag in proctoring_sessions
  try {
    const { data: proctorSession } = await supabase
      .from("proctoring_sessions")
      .select("id, flags")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (proctorSession && Array.isArray(proctorSession.flags)) {
      const updatedFlags = proctorSession.flags.map((f: any) => {
        if (f.type === "CANDIDATE_QUERY" && (f.queryId === queryId || !f.queryId)) {
          return {
            ...f,
            status,
            responseMessage: responseMessage.trim(),
            resolvedByName: user.fullName || "Exam Proctor",
            resolvedAt: nowIso,
          };
        }
        return f;
      });

      await supabase
        .from("proctoring_sessions")
        .update({
          flags: updatedFlags as Json,
        })
        .eq("id", proctorSession.id);
    }
  } catch {
    // quiet fallback
  }

  // 3. Audit logging
  await logAuditEvent({
    userId: user.id,
    action: "PROCTOR_QUERY_RESOLVED",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: {
      queryId,
      responseMessage: responseMessage.trim(),
      status,
      proctorId: user.id,
    },
  });

  revalidatePath("/proctor");
  revalidatePath(`/candidate/exam/${assignmentId}`);

  return {
    success: true,
    data: {
      id: queryId,
      assignmentId,
      candidateId: "",
      category: "general",
      message: "",
      status,
      resolvedBy: user.id,
      resolvedByName: user.fullName || "Exam Proctor",
      responseMessage: responseMessage.trim(),
      resolvedAt: nowIso,
      createdAt: nowIso,
    },
  };
}

/**
 * Proctor Hub Action: Fetches all real-time queries across all active exam candidates.
 */
export async function getAllActiveQueriesAction(): Promise<ExamActionResult<CandidateQueryItem[]>> {
  const user = await requireRole(["proctor", "admin"]);
  const supabase = createAdminClient();

  const allQueries: CandidateQueryItem[] = [];

  try {
    // 1. Fetch from exam_queries with profile names
    const { data: dbQueries } = await supabase
      .from("exam_queries")
      .select("*, profiles:candidate_id(full_name, department)")
      .order("created_at", { ascending: false });

    if (dbQueries && dbQueries.length > 0) {
      dbQueries.forEach((q: any) => {
        allQueries.push({
          id: q.id,
          assignmentId: q.assignment_id,
          candidateId: q.candidate_id,
          candidateName: q.profiles?.full_name || "Candidate",
          candidateDepartment: q.profiles?.department || "Department",
          category: q.category,
          questionNumber: q.question_number,
          message: q.message,
          status: q.status,
          resolvedBy: q.resolved_by,
          resolvedByName: q.resolved_by_name,
          responseMessage: q.response_message,
          resolvedAt: q.resolved_at,
          createdAt: q.created_at,
        });
      });
      return { success: true, data: allQueries };
    }
  } catch {
    // fallback
  }

  // 2. Fallback: Parse active proctoring sessions
  try {
    const { data: sessions } = await supabase
      .from("proctoring_sessions")
      .select("assignment_id, flags, exam_assignments(candidate_id, profiles:candidate_id(full_name, department))");

    if (sessions) {
      sessions.forEach((s: any) => {
        if (Array.isArray(s.flags)) {
          const profile = s.exam_assignments?.profiles;
          s.flags
            .filter((f: any) => f.type === "CANDIDATE_QUERY")
            .forEach((q: any) => {
              allQueries.push({
                id: q.queryId || crypto.randomUUID(),
                assignmentId: s.assignment_id,
                candidateId: s.exam_assignments?.candidate_id || "",
                candidateName: profile?.full_name || "Candidate",
                candidateDepartment: profile?.department || "Department",
                category: q.category || "general",
                questionNumber: q.questionNumber || null,
                message: q.message || "",
                status: q.status || "open",
                resolvedByName: q.resolvedByName || null,
                responseMessage: q.responseMessage || null,
                resolvedAt: q.resolvedAt || null,
                createdAt: q.timestamp || new Date().toISOString(),
              });
            });
        }
      });
    }
  } catch {
    // quiet fallback
  }

  return { success: true, data: allQueries };
}



