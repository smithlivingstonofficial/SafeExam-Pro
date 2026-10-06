import { createAdminClient } from "@/lib/supabase/server";
import { EvaluationGradingManager } from "@/components/examiner/evaluation-grading-manager";
import { evaluateCandidateAnswer } from "@/lib/exam/evaluator";
import { SAMPLE_ENTRANCE_SECTIONS } from "@/lib/exam/sample-exam-data";
import { Json } from "@/types/database";

interface ScheduleRow {
  id: string;
  exam_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
}

interface ExamRow {
  id: string;
  title: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  department: string | null;
  department_id: string | null;
}

interface AssignmentRow {
  id: string;
  candidate_id: string;
  schedule_id: string;
  status: "assigned" | "started" | "submitted" | "graded" | "absent";
  started_at: string | null;
  submitted_at: string | null;
  assigned_at: string;
}

interface ResultRow {
  id: string;
  assignment_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  percentile: number | null;
  section_scores: Json;
  status: string;
  graded_by?: string | null;
  graded_at?: string | null;
  created_at: string;
}

interface SectionRow {
  id: string;
  title: string;
  scope?: string | null;
  department_id?: string | null;
  marking_scheme?: Json;
  correct_marks?: number | null;
  negative_marks?: number | null;
}

interface SectionQuestionRow {
  question_id: string;
  section_id: string;
  marks?: number | null;
  order_index?: number | null;
}

interface QuestionRow {
  id: string;
  type: string;
  options?: Json;
  correct_answer?: Json;
}

interface ResponseRow {
  question_id: string;
  response: Json;
}

interface ProctorSessionRow {
  assignment_id: string;
  risk_score: number;
  flags: Json;
}

export default async function ExaminerGradingPage() {
  const adminSupabase = createAdminClient();
  const nowMs = Date.now();

  // 1. Fetch all schedules
  const { data: rawSchedules } = await adminSupabase
    .from("exam_schedules")
    .select("id, exam_id, start_at, end_at, duration_minutes");
  const schedules = (rawSchedules || []) as ScheduleRow[];
  const scheduleMap = new Map<string, ScheduleRow>(schedules.map((s) => [s.id, s]));

  // 2. Fetch all exams
  const { data: rawExams } = await adminSupabase.from("exams").select("id, title");
  const exams = (rawExams || []) as ExamRow[];
  const examMap = new Map<string, string>(exams.map((e) => [e.id, e.title]));

  // 3. Fetch all candidate profiles
  const { data: rawProfiles } = await adminSupabase
    .from("profiles")
    .select("id, full_name, department, department_id");
  const profiles = (rawProfiles || []) as ProfileRow[];
  const profileMap = new Map<string, ProfileRow>(profiles.map((p) => [p.id, p]));

  // 4. Fetch assignments with activity (submitted, graded, or started)
  const { data: rawAssignments } = await adminSupabase
    .from("exam_assignments")
    .select("id, candidate_id, schedule_id, status, started_at, submitted_at, assigned_at");

  const activeAssignments = (rawAssignments || []) as AssignmentRow[];

  // 5. Check for expired sessions and auto-finalize
  for (const a of activeAssignments) {
    const sch = scheduleMap.get(a.schedule_id);
    if (a.status === "started" && a.started_at && sch) {
      const startedMs = new Date(a.started_at).getTime();
      const durationMs = (sch.duration_minutes || 120) * 60 * 1000;
      const endMs = sch.end_at ? new Date(sch.end_at).getTime() : Number.MAX_SAFE_INTEGER;
      const hardDeadline = Math.min(startedMs + durationMs, endMs);

      if (nowMs >= hardDeadline) {
        const submittedIso = new Date(hardDeadline).toISOString();
        await adminSupabase
          .from("exam_assignments")
          .update({ status: "submitted", submitted_at: submittedIso })
          .eq("id", a.id);
        a.status = "submitted";
        a.submitted_at = submittedIso;
      }
    }
  }

  // 6. Fetch existing results
  const { data: rawResults } = await adminSupabase
    .from("exam_results")
    .select("*")
    .order("created_at", { ascending: false });

  const existingResults = (rawResults || []) as ResultRow[];
  const resultMap = new Map<string, ResultRow>(existingResults.map((r) => [r.assignment_id, r]));

  // 7. For any submitted/graded assignment missing an exam_results row, compute and persist it
  const submittedAssignments = activeAssignments.filter(
    (a) => a.status === "submitted" || a.status === "graded"
  );

  for (const a of submittedAssignments) {
    const existing = resultMap.get(a.id);
    if (!existing || Number(existing.max_score) === 0) {
      const sch = scheduleMap.get(a.schedule_id);
      const cand = profileMap.get(a.candidate_id);

      let totalScore = 0;
      let maxScore = 0;
      const sectionScores: Record<string, { title: string; score: number; maxScore: number }> = {};

      if (sch?.exam_id) {
        const { data: rawSections } = await adminSupabase
          .from("exam_sections")
          .select("id, title, scope, department_id, marking_scheme, correct_marks, negative_marks")
          .eq("exam_id", sch.exam_id)
          .order("order_index", { ascending: true });

        const allSections = (rawSections || []) as SectionRow[];
        const eligibleSections = allSections.filter((sec) => {
          if (sec.scope === "common" || !sec.department_id) return true;
          return cand?.department_id && sec.department_id === cand.department_id;
        });

        const sectionIds = eligibleSections.map((s) => s.id);
        const { data: rawSecQuestions } = await adminSupabase
          .from("exam_section_questions")
          .select("question_id, section_id, marks, order_index")
          .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
          .order("order_index", { ascending: true });

        const sectionQuestions = (rawSecQuestions || []) as SectionQuestionRow[];
        const qIds = sectionQuestions.map((sq) => sq.question_id);

        const { data: rawQuestions } = await adminSupabase
          .from("questions")
          .select("id, type, options, correct_answer")
          .in("id", qIds.length ? qIds : ["00000000-0000-0000-0000-000000000000"]);

        const questions = (rawQuestions || []) as QuestionRow[];

        const { data: rawResponses } = await adminSupabase
          .from("exam_responses")
          .select("question_id, response")
          .eq("assignment_id", a.id);

        const responses = (rawResponses || []) as ResponseRow[];
        const respMap = new Map<string, Record<string, unknown>>(
          responses.map((r) => [r.question_id, (r.response as Record<string, unknown>) || {}])
        );
        const qMap = new Map<string, QuestionRow>(questions.map((q) => [q.id, q]));
        const secMap = new Map<string, SectionRow>(eligibleSections.map((s) => [s.id, s]));

        if (questions && questions.length > 0) {
          sectionQuestions.forEach((sq) => {
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
                : 1;
            const qNeg =
              typeof sec.negative_marks === "number"
                ? sec.negative_marks
                : typeof scheme.negative_marks === "number"
                ? (scheme.negative_marks as number)
                : 0;

            maxScore += qMarks;
            if (!sectionScores[sec.id]) {
              sectionScores[sec.id] = { title: sec.title, score: 0, maxScore: 0 };
            }
            sectionScores[sec.id].maxScore += qMarks;

            const userResp = respMap.get(q.id);
            const evalRes = evaluateCandidateAnswer(q, userResp, qMarks, qNeg);
            if (evalRes.isAttempted) {
              totalScore += evalRes.awardedMarks;
              sectionScores[sec.id].score += evalRes.awardedMarks;
            }
          });
        }
      }

      if (maxScore === 0) {
        const candidateDeptName = cand?.department?.toLowerCase() || "";
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
          });
        });
      }

      totalScore = Math.max(0, totalScore);
      Object.keys(sectionScores).forEach((secId) => {
        sectionScores[secId].score = Math.max(0, sectionScores[secId].score);
      });

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;
      const nowIso = new Date().toISOString();

      if (existing) {
        await adminSupabase
          .from("exam_results")
          .update({
            total_score: totalScore,
            max_score: maxScore,
            percentage,
            section_scores: sectionScores as unknown as Json,
            graded_at: nowIso,
          })
          .eq("id", existing.id);
        existing.total_score = totalScore;
        existing.max_score = maxScore;
        existing.percentage = percentage;
        existing.section_scores = sectionScores as unknown as Json;
      } else {
        const { data: newRes } = await adminSupabase
          .from("exam_results")
          .insert({
            assignment_id: a.id,
            total_score: totalScore,
            max_score: maxScore,
            percentage,
            section_scores: sectionScores as unknown as Json,
            status: "draft",
            graded_at: nowIso,
            created_at: nowIso,
          })
          .select("*")
          .single();

        if (newRes) {
          resultMap.set(a.id, newRes as ResultRow);
        }
      }
    }
  }

  // 8. Re-fetch final results
  const { data: rawFinalResults } = await adminSupabase
    .from("exam_results")
    .select("*")
    .order("created_at", { ascending: false });

  const finalResults = (rawFinalResults || []) as ResultRow[];
  const assignmentIds = finalResults.map((r) => r.assignment_id);

  // 9. Fetch proctoring sessions for surveillance flags
  const { data: rawProctorSessions } = await adminSupabase
    .from("proctoring_sessions")
    .select("assignment_id, risk_score, flags")
    .in("assignment_id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const proctorSessions = (rawProctorSessions || []) as ProctorSessionRow[];
  const assignmentLookup = new Map<string, AssignmentRow>(activeAssignments.map((a) => [a.id, a]));
  const proctorMap = new Map<string, ProctorSessionRow>(proctorSessions.map((p) => [p.assignment_id, p]));

  const formattedResults = finalResults.map((res) => {
    const assignment = assignmentLookup.get(res.assignment_id);
    const candidate = assignment ? profileMap.get(assignment.candidate_id) : null;
    const schedule = assignment ? scheduleMap.get(assignment.schedule_id) : null;
    const examTitle = schedule ? examMap.get(schedule.exam_id) || "Ph.D Entrance Assessment" : "Ph.D Entrance Assessment";
    const proc = proctorMap.get(res.assignment_id);

    const flagsList = (Array.isArray(proc?.flags) ? proc?.flags : []) as Array<{ type: string; timestamp: string }>;
    const fullscreenExits = flagsList.filter((f) => f.type === "FULLSCREEN_EXIT").length;
    const tabSwitches = flagsList.filter((f) => f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR").length;

    const totalCandidatesInSameExam = finalResults.filter((r) => {
      const a = assignmentLookup.get(r.assignment_id);
      const curA = assignmentLookup.get(res.assignment_id);
      return a && curA && a.schedule_id === curA.schedule_id;
    });

    let displayPercentile = res.percentile !== null && res.percentile !== undefined ? Number(res.percentile) : null;
    if (displayPercentile === null && totalCandidatesInSameExam.length > 0) {
      const scoreNum = Number(res.total_score) || 0;
      const countBelowOrEqual = totalCandidatesInSameExam.filter(
        (r) => (Number(r.total_score) || 0) <= scoreNum
      ).length;
      displayPercentile = Math.round((countBelowOrEqual / totalCandidatesInSameExam.length) * 1000) / 10;
    }

    return {
      id: res.id,
      assignment_id: res.assignment_id,
      candidate_name: candidate?.full_name || "Candidate",
      candidate_department: candidate?.department || "General",
      exam_title: examTitle,
      total_score: Number(res.total_score) || 0,
      max_score: Number(res.max_score) || 0,
      percentage: Number(res.percentage) || 0,
      percentile: displayPercentile,
      status: res.status || "draft",
      created_at: res.created_at,
      risk_score: proc?.risk_score || 0,
      fullscreen_exits: fullscreenExits,
      tab_switches: tabSwitches,
      total_flags: flagsList.length,
    };
  });

  return <EvaluationGradingManager results={formattedResults} />;
}
