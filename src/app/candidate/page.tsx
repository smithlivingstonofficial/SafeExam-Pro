import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
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
} from "lucide-react";

export default async function CandidateDashboard() {
  const user = await requireRole(["candidate", "admin"]);
  const supabase = await createClient();

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

  const scheduleMap = new Map((schedules || []).map((s) => [s.id, s]));
  const examMap = new Map((exams || []).map((e) => [e.id, e]));

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
                University Entrance Examination Board
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

                  return (
                    <div
                      key={assignment.id}
                      className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-xs relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-bl-xl uppercase tracking-wider">
                        {assignment.status}
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">
                            {exam?.title || "Examination Paper"}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {exam?.description || "Curriculum entrance evaluation."}
                          </p>

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

                          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">
                              Schedule Window:{" "}
                              <span className="font-semibold text-slate-700">
                                {startDate ? startDate.toLocaleString() : "To be announced"}
                              </span>
                            </div>
                            <button className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer">
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Launch Exam Environment</span>
                            </button>
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
              </div>
            )}
          </div>

          {/* Right Column: Pre-Exam Security & Guidelines */}
          <div className="space-y-6">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
