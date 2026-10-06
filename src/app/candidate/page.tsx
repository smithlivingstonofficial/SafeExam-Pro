import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { createDemoCandidateAssignmentAction } from "@/app/actions/exam";
import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { getUniversitySettings } from "@/lib/settings";
import { DesktopExitButton } from "@/components/candidate/desktop-exit-button";
import {
  ShieldCheck,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  Play,
  FileText,
  User,
  Inbox,
  Building2,
  Globe,
  Phone,
  Mail,
  Laptop,
  Monitor,
  Sparkles,
} from "lucide-react";

export default async function CandidateDashboard() {
  const user = await requireRole(["candidate", "admin"]);
  const supabase = await createClient();
  const settings = await getUniversitySettings();

  // Fetch candidate profile and enrolled department
  const { data: candidateProfile } = await supabase
    .from("profiles")
    .select("id, full_name, department_id, department")
    .eq("id", user.id)
    .single();

  let enrolledDeptName = candidateProfile?.department || null;
  if (candidateProfile?.department_id) {
    const { data: deptData } = await supabase
      .from("departments")
      .select("name, code")
      .eq("id", candidateProfile.department_id)
      .single();
    if (deptData) {
      enrolledDeptName = `${deptData.name}${deptData.code ? ` (${deptData.code})` : ""}`;
    }
  }

  // Fetch real assignments for this candidate
  const { data: assignments } = await supabase
    .from("exam_assignments")
    .select("id, status, assigned_at, started_at, schedule_id")
    .eq("candidate_id", user.id);

  // Fetch schedules for these assignments
  const scheduleIds = assignments?.map((a) => a.schedule_id) || [];
  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("id, start_at, end_at, duration_minutes, proctoring_level, window_type, exam_id")
    .in("id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"]);

  // Fetch exams for these schedules
  const examIds = schedules?.map((s) => s.exam_id) || [];
  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, description, instructions, settings")
    .in("id", examIds.length ? examIds : ["00000000-0000-0000-0000-000000000000"]);

  // Fetch exam results for candidate's assignments
  const assignmentIds = assignments?.map((a) => a.id) || [];
  const { data: examResults } = await supabase
    .from("exam_results")
    .select("id, assignment_id, total_score, max_score, percentage, percentile, section_scores, status, created_at")
    .in("assignment_id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const scheduleMap = new Map((schedules || []).map((s) => [s.id, s]));
  const examMap = new Map((exams || []).map((e) => [e.id, e]));
  const resultMap = new Map((examResults || []).map((r) => [r.assignment_id, r]));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                SafeExam Pro
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                Candidate Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{user.fullName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{user.email}</span>
            </div>
            <DesktopExitButton />
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                {settings.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Welcome, {user.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Candidate Account • Authorized Entrance Examination Access
              </p>

              {enrolledDeptName && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Enrolled: {enrolledDeptName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Universal Common + Specialized Papers</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-700">Identity Status</div>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Credentials
                </div>
                {enrolledDeptName && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Department Validated
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exam Allocation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active / Upcoming Tests (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-700" />
              <span>Assigned Entrance Examination Sessions</span>
            </h2>

            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const schedule = scheduleMap.get(assignment.schedule_id);
                  const exam = schedule ? examMap.get(schedule.exam_id) : null;
                  const startDate = schedule ? new Date(schedule.start_at) : null;
                  const endDate = schedule ? new Date(schedule.end_at) : null;
                  const result = resultMap.get(assignment.id);

                  const nowMs = Date.now();
                  const startMs = startDate ? startDate.getTime() : 0;
                  const endMs = endDate ? endDate.getTime() : Number.MAX_SAFE_INTEGER;

                  const isCompleted = assignment.status === "submitted" || assignment.status === "graded";
                  const isResultPublished = isCompleted && result?.status === "published";
                  const isUpcoming = nowMs < startMs && assignment.status === "assigned";
                  const isScheduleExpired = nowMs > endMs && assignment.status === "assigned";
                  const isStarted = assignment.status === "started";

                  const startedMs = assignment.started_at ? new Date(assignment.started_at).getTime() : nowMs;
                  const durationMs = (schedule?.duration_minutes || 120) * 60 * 1000;
                  const hardDeadlineMs = Math.min(startedMs + durationMs, endMs);
                  const isSessionTimeExpired = isStarted && nowMs >= hardDeadlineMs;

                  return (
                    <div
                      key={assignment.id}
                      className={`bg-white border rounded-2xl p-6 shadow-xs relative overflow-hidden ${
                        isResultPublished
                          ? "border-emerald-200 ring-1 ring-emerald-100"
                          : isCompleted || isSessionTimeExpired
                          ? "border-amber-200"
                          : isScheduleExpired
                          ? "border-rose-200 bg-rose-50/20"
                          : isUpcoming
                          ? "border-slate-200"
                          : "border-indigo-200"
                      }`}
                    >
                      <div
                        className={`absolute top-0 right-0 px-3 py-1 text-white text-[11px] font-bold rounded-bl-xl uppercase tracking-wider ${
                          isResultPublished
                            ? "bg-emerald-600"
                            : isCompleted || isSessionTimeExpired
                            ? "bg-amber-600"
                            : isScheduleExpired
                            ? "bg-rose-600"
                            : isUpcoming
                            ? "bg-slate-600"
                            : isStarted
                            ? "bg-blue-600"
                            : "bg-indigo-600"
                        }`}
                      >
                        {isResultPublished
                          ? "Result Published"
                          : isCompleted || isSessionTimeExpired
                          ? "Completed"
                          : isScheduleExpired
                          ? "Schedule Expired"
                          : isUpcoming
                          ? "Upcoming"
                          : isStarted
                          ? "In Progress"
                          : assignment.status}
                      </div>

                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                            isResultPublished
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : isCompleted || isSessionTimeExpired
                              ? "bg-amber-50 border-amber-100 text-amber-700"
                              : isScheduleExpired
                              ? "bg-rose-50 border-rose-100 text-rose-700"
                              : isUpcoming
                              ? "bg-slate-50 border-slate-200 text-slate-600"
                              : "bg-indigo-50 border-indigo-100 text-indigo-700"
                          }`}
                        >
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">
                            {exam?.title || "Examination Paper"}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {exam?.description || "Curriculum entrance evaluation."}
                          </p>

                          {/* Published Official Scorecard Section */}
                          {isResultPublished && result ? (
                            <div className="mt-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Official Statement of Marks
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-700">
                                  Verified by Examination Board
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                                  <div className="text-[10px] font-semibold text-slate-500">Raw Score</div>
                                  <div className="text-base font-extrabold text-slate-900">
                                    {result.total_score} <span className="text-xs font-normal text-slate-400">/ {result.max_score}</span>
                                  </div>
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                                  <div className="text-[10px] font-semibold text-slate-500">Percentage</div>
                                  <div className="text-base font-extrabold text-emerald-700">
                                    {result.percentage}%
                                  </div>
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center col-span-2 sm:col-span-1">
                                  <div className="text-[10px] font-semibold text-slate-500">Percentile Rank</div>
                                  <div className="text-base font-extrabold text-indigo-700">
                                    {result.percentile !== null ? `${result.percentile}th` : "Qualified"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : isCompleted || isSessionTimeExpired ? (
                            <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block">Evaluation & Moderation in Progress</span>
                                <span className="text-[11px] text-amber-800">
                                  Your answers have been securely recorded. The institutional grading committee is finalizing marks. The scorecard will appear here once released.
                                </span>
                              </div>
                            </div>
                          ) : isScheduleExpired ? (
                            <div className="mt-4 p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/70 flex items-start gap-2.5 text-xs text-rose-900">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block">Examination Schedule Concluded</span>
                                <span className="text-[11px] text-rose-800">
                                  The scheduled testing window for this entrance assessment closed at {endDate ? endDate.toLocaleString() : "designated time"}. New session attempts are blocked.
                                </span>
                              </div>
                            </div>
                          ) : isUpcoming ? (
                            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block">Scheduled Assessment Window</span>
                                <span className="text-[11px] text-slate-500">
                                  Opens on <strong>{startDate ? startDate.toLocaleString() : "Scheduled date"}</strong>. System pre-check diagnostic will become available when the window starts.
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>Duration: <strong>{schedule?.duration_minutes || 120} Mins</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-indigo-500" />
                                <span>Surveillance: <strong className="capitalize">{schedule?.proctoring_level || "Standard"}</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Status: <strong className="capitalize">{assignment.status}</strong></span>
                              </div>
                            </div>
                          )}

                          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">
                              Schedule Window:{" "}
                              <span className="font-semibold text-slate-700">
                                {startDate ? startDate.toLocaleString() : "To be announced"}
                              </span>
                            </div>

                            {isScheduleExpired ? (
                              <span className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs inline-flex items-center gap-1.5 cursor-not-allowed">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Schedule Closed</span>
                              </span>
                            ) : isUpcoming ? (
                              <span className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Opens at {startDate ? startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Start Time"}</span>
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={`safeexam://exam/${assignment.id}`}
                                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="Launch in SafeExam Pro Desktop Lockdown Client"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>SafeExam Browser</span>
                                </a>
                                <Link
                                  href={`/candidate/exam/${assignment.id}`}
                                  className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                                    isResultPublished
                                      ? "bg-emerald-700 hover:bg-emerald-800"
                                      : isCompleted || isSessionTimeExpired
                                      ? "bg-slate-700 hover:bg-slate-800"
                                      : assignment.status === "started"
                                      ? "bg-blue-700 hover:bg-blue-800"
                                      : "bg-indigo-700 hover:bg-indigo-800"
                                  }`}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>
                                    {isResultPublished
                                      ? "View Statement of Marks"
                                      : isCompleted || isSessionTimeExpired
                                      ? "View Submission Docket"
                                      : assignment.status === "started"
                                      ? "Resume in Browser"
                                      : "Web Browser"}
                                  </span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (

              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  No Examinations Assigned Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your university entrance examination schedule has not been published yet. Once the department allocates your seat, it will appear here automatically.
                </p>

                <form
                  action={async () => {
                    "use server";
                    const res = await createDemoCandidateAssignmentAction();
                    if (res.data?.assignmentId) {
                      redirect(`/candidate/exam/${res.data.assignmentId}`);
                    }
                  }}
                  className="mt-5"
                >
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Practice Examination (Demo Room)</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Pre-Exam Security & Guidelines */}
          <div className="space-y-6">
            {/* SafeExam Desktop Lockdown Client Card (Institutional Light Theme) */}
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/60 rounded-full blur-2xl -z-0 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">SafeExam Desktop Client</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Institutional Lockdown Software v1.0.0</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                  Secure Client
                </span>
              </div>

              <p className="relative z-10 text-xs text-slate-600 leading-relaxed">
                Dedicated Windows client providing institutional kiosk containment. Inhibits multi-monitors, screen-capture utilities, and background applications during examinations.
              </p>

              <div className="relative z-10 grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <Monitor className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  <span className="font-medium">Display Guard</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-medium">Kiosk Locked</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span className="font-medium">HWID Sealed</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span className="font-medium">Process Guard</span>
                </div>
              </div>

              <div className="relative z-10 pt-1 flex flex-col gap-2">
                <a
                  href="safeexam://candidate"
                  className="w-full text-center py-2.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch SafeExam Desktop</span>
                </a>
                <div className="text-[10px] text-slate-400 text-center">
                  Deep link protocol <code className="text-indigo-700 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">safeexam://</code>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <span>Candidate Checklist</span>
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Valid Identification:</strong> Keep your official university hall ticket or government photo ID ready.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Single Monitor Setup:</strong> Disconnect any external secondary displays or screen mirroring devices.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Well-Lit Room:</strong> Ensure your webcam has clear frontal illumination without harsh backlight.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Strict Anti-Cheat:</strong> Tab-switching, copy-pasting, or unauthorized process execution triggers an immediate incident report.
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/#system-check"
                  className="block text-center py-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100"
                >
                  Run Device Compatibility Diagnostic →
                </Link>
              </div>

              {(settings.contactEmail || settings.contactPhone) && (
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">Admissions / Support Desk:</div>
                  {settings.contactEmail && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{settings.contactEmail}</span>
                    </div>
                  )}
                  {settings.contactPhone && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{settings.contactPhone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
