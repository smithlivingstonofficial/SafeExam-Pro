import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/server";
import { getUniversitySettings } from "@/lib/settings";
import { ExamPrecheck } from "@/components/candidate/exam-precheck";
import { ExamRoom } from "@/components/candidate/exam-room";
import { ExamCompleted } from "@/components/candidate/exam-completed";
import {
  SAMPLE_ENTRANCE_SECTIONS,
  ExamSectionItem,
  ExamQuestionItem,
} from "@/lib/exam/sample-exam-data";
import { submitExamAction } from "@/app/actions/exam";
import { ShieldAlert, ArrowLeft, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{
    assignmentId: string;
  }>;
}

export default async function CandidateExamPage({ params }: PageProps) {
  const { assignmentId } = await params;
  const user = await requireRole(["candidate", "admin"]);
  const adminSupabase = createAdminClient();
  const settings = await getUniversitySettings();

  // 1. Fetch assignment and verify candidate access
  const { data: assignment, error: assignErr } = await adminSupabase
    .from("exam_assignments")
    .select("id, schedule_id, candidate_id, status, assigned_at, started_at, submitted_at")
    .eq("id", assignmentId)
    .single();

  if (assignErr || !assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Assignment Not Found</h2>
          <p className="text-xs text-slate-500">
            This examination docket was not found or has been revoked by the university administrator.
          </p>
          <Link
            href="/candidate"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Candidate Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Verify access ownership
  if (user.role === "candidate" && assignment.candidate_id !== user.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not possess candidate authorization credentials for this specific examination session.
          </p>
          <Link
            href="/candidate"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Candidate Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch candidate profile
  const { data: candidateProfile } = await adminSupabase
    .from("profiles")
    .select("id, full_name, metadata, department, department_id")
    .eq("id", assignment.candidate_id)
    .single();

  const candidateName = candidateProfile?.full_name || user.fullName;
  const candidateEmail = (candidateProfile?.metadata as any)?.email || user.email;

  // Resolve candidate department ID (check direct foreign key, or resolve by name/code from departments table)
  let candidateDeptId = candidateProfile?.department_id || null;
  if (!candidateDeptId && candidateProfile?.department) {
    const { data: deptRows } = await adminSupabase
      .from("departments")
      .select("id, name, code");
    const foundDept = (deptRows || []).find(
      (d: { id: string; name: string; code?: string }) =>
        d.name.toLowerCase() === candidateProfile.department.toLowerCase() ||
        d.code?.toLowerCase() === candidateProfile.department.toLowerCase()
    );
    if (foundDept) {
      candidateDeptId = foundDept.id;
    }
  }

  // 3. Fetch schedule & exam
  const { data: schedule } = await adminSupabase
    .from("exam_schedules")
    .select("id, exam_id, start_at, end_at, duration_minutes, proctoring_level")
    .eq("id", assignment.schedule_id)
    .single();

  let examTitle = "Ph.D Entrance Examination 2026";
  const durationMinutes = schedule?.duration_minutes || 120;
  const proctoringLevel = schedule?.proctoring_level || "standard";

  if (schedule?.exam_id) {
    const { data: examData } = await adminSupabase
      .from("exams")
      .select("id, title, instructions")
      .eq("id", schedule.exam_id)
      .single();

    if (examData?.title) {
      examTitle = examData.title;
    }
  }

  // 4. Server-Authoritative Schedule Window & Deadline Verification
  const nowMs = Date.now();
  const serverNowIso = new Date(nowMs).toISOString();

  if (schedule) {
    const startMs = new Date(schedule.start_at).getTime();
    const endMs = new Date(schedule.end_at).getTime();

    // Gatekeeper 1: Schedule window has not opened yet
    if (nowMs < startMs && assignment.status === "assigned") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Scheduled Assessment
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">Examination Window Not Open Yet</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              This examination docket is scheduled to open on <strong>{new Date(schedule.start_at).toLocaleString()}</strong>.
              Please return at the designated start time to proceed through diagnostic pre-checks.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              Authoritative Server Time: <strong>{new Date(nowMs).toLocaleTimeString()}</strong>
            </div>
            <Link
              href="/candidate"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Candidate Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }

    // Gatekeeper 2: Schedule window closed and candidate never started
    if (nowMs > endMs && assignment.status === "assigned") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                Access Window Expired
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">Examination Schedule Concluded</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The institutional examination delivery window closed at <strong>{new Date(schedule.end_at).toLocaleString()}</strong>.
              New attempts are locked in compliance with university exam regulations.
            </p>
            <Link
              href="/candidate"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Candidate Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }

    // Gatekeeper 3: Candidate started previously, but allocated duration/window has elapsed
    if (assignment.status === "started" && assignment.started_at) {
      const startedMs = new Date(assignment.started_at).getTime();
      const durationMs = (schedule.duration_minutes || 120) * 60 * 1000;
      const hardDeadlineMs = Math.min(startedMs + durationMs, endMs);

      if (nowMs >= hardDeadlineMs) {
        // Auto-finalize on server and show completed scorecard
        await submitExamAction(assignmentId);
        return (
          <ExamCompleted
            examTitle={examTitle}
            candidateName={candidateName}
            candidateEmail={candidateEmail}
            assignmentId={assignmentId}
            submittedAt={serverNowIso}
            universityName={settings.name}
          />
        );
      }
    }
  }

  // 5. If already submitted or graded, display completion card
  if (assignment.status === "submitted" || assignment.status === "graded") {
    return (
      <ExamCompleted
        examTitle={examTitle}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        assignmentId={assignmentId}
        submittedAt={assignment.submitted_at}
        universityName={settings.name}
      />
    );
  }

  // 5. Fetch live questions from DB: 20 Universal Common + 30 Department-Specific = 50 Total Questions
  let finalSections: ExamSectionItem[] = [];

  if (schedule?.exam_id) {
    const { data: dbSections } = await adminSupabase
      .from("exam_sections")
      .select("*")
      .eq("exam_id", schedule.exam_id)
      .order("order_index", { ascending: true });

    if (dbSections && dbSections.length > 0) {
      // Filter sections: Include Universal Common Part A (20 Qs) + candidate's enrolled department Part B (30 Qs)
      const eligibleSections = dbSections.filter((sec: any) => {
        if (sec.scope === "common" || !sec.department_id) {
          return true; // Universal Common section (for all candidates)
        }
        // Department-specific section: only include if matches this candidate's enrolled department
        if (candidateDeptId && sec.department_id === candidateDeptId) {
          return true;
        }
        return false;
      });

      if (eligibleSections.length > 0) {
        const sectionIds = eligibleSections.map((s: any) => s.id);
        const { data: sectionQuestions } = await adminSupabase
          .from("exam_section_questions")
          .select("id, section_id, question_id, order_index, marks")
          .in("section_id", sectionIds)
          .order("order_index", { ascending: true });

        const qIds = (sectionQuestions || []).map((sq: any) => sq.question_id);
        // Security: NEVER select correct_answer or explanation in candidate queries
        const { data: questions } = await adminSupabase
          .from("questions")
          .select("id, type, subject, topic, difficulty, content, options")
          .in("id", qIds.length ? qIds : ["00000000-0000-0000-0000-000000000000"]);

        if (questions && questions.length > 0) {
          const qMap = new Map((questions as any[]).map((q) => [q.id, q]));

          finalSections = eligibleSections.map((sec: any) => {
            const secScheme = (sec.marking_scheme as Record<string, unknown>) || {};
            const correctMarks =
              typeof sec.correct_marks === "number"
                ? sec.correct_marks
                : typeof secScheme.correct_marks === "number"
                ? secScheme.correct_marks
                : typeof secScheme.correctMarks === "number"
                ? secScheme.correctMarks
                : 1;

            const negativeMarks =
              typeof sec.negative_marks === "number"
                ? sec.negative_marks
                : typeof secScheme.negative_marks === "number"
                ? secScheme.negative_marks
                : typeof secScheme.negativeMarks === "number"
                ? secScheme.negativeMarks
                : 0;

            const secQs = (sectionQuestions || [])
              .filter((sq: any) => sq.section_id === sec.id)
              .map((sq: any) => {
                const q = qMap.get(sq.question_id);
                if (!q) return null;
                const content = (q.content as any) || {};
                const rawOptions = (q.options as any[]) || [];

                // Sanitize options: remove isCorrect / is_correct from candidate view
                const sanitizedOptions = rawOptions.map((opt: any, optIdx: number) => ({
                  id: opt.id || String.fromCharCode(65 + optIdx),
                  text: opt.text || opt.label || "",
                }));

                const qMarks = typeof sq.marks === "number" ? sq.marks : correctMarks;

                return {
                  id: q.id,
                  sectionId: sec.id,
                  orderIndex: sq.order_index,
                  type: q.type,
                  questionText: content.text || "Question content statement",
                  latexCode: content.latex || null,
                  codeSnippet: content.codeSnippet || null,
                  programmingLanguage: content.programmingLanguage || null,
                  subject: q.subject || "General",
                  topic: q.topic || null,
                  difficulty: q.difficulty || 2,
                  marks: qMarks,
                  negativeMarks: negativeMarks,
                  options: sanitizedOptions,
                } as ExamQuestionItem;
              })
              .filter(Boolean) as ExamQuestionItem[];

            return {
              id: sec.id,
              title: sec.title,
              scope: sec.scope,
              orderIndex: sec.order_index,
              correctMarks,
              negativeMarks,
              questions: secQs,
            };
          });
        }
      }
    }
  }

  // Fallback to rich entrance dataset ONLY if exam has no sections/questions linked in DB
  if (finalSections.length === 0 || finalSections.every((s) => s.questions.length === 0)) {
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

    // Strip answers from sample sections as well
    finalSections = sampleSections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => ({
        ...q,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
        })),
        correctAnswer: undefined,
      })),
    }));
  }

  // 6. Fetch existing responses for this candidate
  const { data: existingResponses } = await adminSupabase
    .from("exam_responses")
    .select("question_id, response, is_flagged")
    .eq("assignment_id", assignmentId);

  const initialResponses = (existingResponses || []).map((r: any) => ({
    question_id: r.question_id,
    response: (r.response as Record<string, unknown>) || {},
    is_flagged: r.is_flagged || false,
  }));

  const totalQuestions = finalSections.reduce((acc, s) => acc + s.questions.length, 0);

  // 7. If status is 'assigned', show Pre-check diagnostic screen
  if (assignment.status === "assigned") {
    return (
      <ExamPrecheck
        assignmentId={assignmentId}
        examTitle={examTitle}
        durationMinutes={durationMinutes}
        proctoringLevel={proctoringLevel}
        candidateName={candidateName}
        universityName={settings.name}
        totalQuestions={totalQuestions}
      />
    );
  }

  // 8. If status is 'started', show the Live Exam Room
  return (
    <ExamRoom
      assignmentId={assignmentId}
      examTitle={examTitle}
      universityName={settings.name}
      candidateName={candidateName}
      candidateEmail={candidateEmail}
      durationMinutes={durationMinutes}
      startedAt={assignment.started_at}
      serverNow={serverNowIso}
      scheduleEndAt={schedule?.end_at || null}
      sections={finalSections}
      initialResponses={initialResponses}
    />
  );
}
