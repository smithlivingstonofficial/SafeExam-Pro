"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  scheduleExamAction,
  assignCandidatesToScheduleAction,
} from "@/app/actions/examiner";
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  ShieldCheck,
  Users,
  Video,
  ChevronRight,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  UserCheck,
  Play,
  ArrowRight,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface ScheduleItem {
  id: string;
  exam_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  window_type: string;
  max_candidates?: number | null;
  proctoring_level: string;
  status: string;
  created_at: string;
}

interface CandidateAssignment {
  id: string;
  schedule_id: string;
  candidate_id: string;
  status: string;
  assigned_at: string;
  candidateName?: string;
  candidateEmail?: string;
  departmentName?: string;
}

interface ExamScheduleManagerProps {
  schedules: ScheduleItem[];
  availableExams: ExamItem[];
  departments: Department[];
  initialAssignments: CandidateAssignment[];
  candidatePool: Array<{
    id: string;
    fullName: string;
    email: string;
    departmentId?: string | null;
  }>;
}

export function ExamScheduleManager({
  schedules: initialSchedules,
  availableExams,
  departments,
  initialAssignments,
  candidatePool,
}: ExamScheduleManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [assignments, setAssignments] = useState<CandidateAssignment[]>(initialAssignments);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeRosterSchedule, setActiveRosterSchedule] = useState<ScheduleItem | null>(null);

  // Create form state
  const [selectedExamId, setSelectedExamId] = useState(availableExams[0]?.id || "");
  const [startAt, setStartAt] = useState("2026-10-15T09:00");
  const [endAt, setEndAt] = useState("2026-10-15T12:00");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [windowType, setWindowType] = useState<"fixed" | "flexible">("fixed");
  const [proctoringLevel, setProctoringLevel] = useState("standard");
  const [maxCandidates, setMaxCandidates] = useState<number | "">("");

  // Roster enrollment state
  const [targetEnrollDeptId, setTargetEnrollDeptId] = useState("all");
  const [rosterSearch, setRosterSearch] = useState("");

  const examMap = new Map(availableExams.map((e) => [e.id, e]));
  const deptMap = new Map(departments.map((d) => [d.id, d]));
  const candidateMap = new Map(candidatePool.map((c) => [c.id, c]));

  // Handlers
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      alert("Please select an examination blueprint");
      return;
    }

    const formData = new FormData();
    formData.append("examId", selectedExamId);
    formData.append("startAt", startAt);
    formData.append("endAt", endAt);
    formData.append("durationMinutes", String(durationMinutes));
    formData.append("windowType", windowType);
    formData.append("proctoringLevel", proctoringLevel);
    if (maxCandidates) {
      formData.append("maxCandidates", String(maxCandidates));
    }

    startTransition(async () => {
      const res = await scheduleExamAction(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        router.refresh();
      } else {
        alert(res.error || "Failed to schedule exam");
      }
    });
  };

  const handleEnrollCandidates = (departmentId: string) => {
    if (!activeRosterSchedule) return;

    startTransition(async () => {
      const res = await assignCandidatesToScheduleAction(
        activeRosterSchedule.id,
        departmentId === "all" ? null : departmentId
      );
      if (res.success) {
        alert(`Successfully enrolled ${res.data?.assignedCount || 0} candidates!`);
        router.refresh();
      } else {
        alert(res.error || "Enrollment failed");
      }
    });
  };

  // Enrolled candidates for active roster schedule
  const activeEnrolledAssignments = assignments.filter(
    (a) => a.schedule_id === activeRosterSchedule?.id
  );

  const filteredEnrolled = activeEnrolledAssignments.filter((a) => {
    if (!rosterSearch.trim()) return true;
    const cand = candidateMap.get(a.candidate_id);
    const name = (cand?.fullName || a.candidateName || "").toLowerCase();
    const email = (cand?.email || a.candidateEmail || "").toLowerCase();
    const term = rosterSearch.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
              Exam Delivery System
            </span>
            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              {schedules.length} {schedules.length === 1 ? "Session" : "Sessions"} Configured
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Examination Delivery Schedules & Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure delivery windows, set anti-cheat proctoring surveillance, and enroll student cohorts with 1-click departmental assignment.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Schedule Exam Session</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.length > 0 ? (
          <div className="space-y-3.5">
            {schedules.map((sch) => {
              const examData = examMap.get(sch.exam_id);
              const startDate = new Date(sch.start_at);
              const endDate = new Date(sch.end_at);
              const enrolledForSch = assignments.filter((a) => a.schedule_id === sch.id);

              return (
                <div
                  key={sch.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                            sch.status === "active"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : sch.status === "completed"
                              ? "bg-slate-100 border-slate-200 text-slate-600"
                              : "bg-indigo-50 border-indigo-200 text-indigo-800"
                          }`}
                        >
                          {sch.status}
                        </span>

                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {sch.window_type} Window
                        </span>

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{enrolledForSch.length} Candidates Enrolled</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 mt-2">
                        {examData?.title || "Examination Session"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sch.duration_minutes} Mins Duration</span>
                        </span>
                        <span>•</span>
                        <span>
                          {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>•</span>
                        <span className="capitalize font-medium text-slate-600">
                          {sch.proctoring_level} Proctoring
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                    <button
                      onClick={() => {
                        setActiveRosterSchedule(sch);
                        setRosterSearch("");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Manage Roster ({enrolledForSch.length})</span>
                    </button>

                    <Link
                      href={`/examiner/exams/${sch.exam_id}`}
                      className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                    >
                      View Paper
                    </Link>

                    <Link
                      href="/proctor"
                      className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Proctoring</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Exam Sessions Scheduled
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Schedule test windows to allow registered candidates to access entrance examinations.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule First Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal 1: Create Exam Schedule Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Examination Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set delivery window, duration, and proctoring surveillance level.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Paper Blueprint *
                </label>
                <select
                  required
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                >
                  {availableExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Window *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Window *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Window Type
                  </label>
                  <select
                    value={windowType}
                    onChange={(e) => setWindowType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  >
                    <option value="fixed">Fixed Synchronous Window</option>
                    <option value="flexible">Flexible Window</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anti-Cheat Proctoring Surveillance Level *
                </label>
                <select
                  value={proctoringLevel}
                  onChange={(e) => setProctoringLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                >
                  <option value="none">None (Practice Examination)</option>
                  <option value="basic">Basic (Lockdown Browser & Focus Tracker)</option>
                  <option value="standard">Standard (Webcam Feed & Photo Verification)</option>
                  <option value="full">Full (Webcam + Screen Capture + AI Anomaly Detection)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Candidate Roster & 1-Click Enrollment Drawer */}
      {activeRosterSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    Candidate Roster
                  </span>
                  <span className="text-xs font-bold text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {activeEnrolledAssignments.length} Enrolled
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {examMap.get(activeRosterSchedule.exam_id)?.title || "Exam Session"}
                </h3>
              </div>

              <button
                onClick={() => setActiveRosterSchedule(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Department Enrollment Box */}
            <div className="p-5 border-b border-slate-200 bg-purple-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-950">
                  1-Click Cohort Enrollment
                </span>
              </div>
              <p className="text-[11px] text-purple-800/80 leading-relaxed">
                Automatically assign all registered candidates from a specific department to this exam window.
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={targetEnrollDeptId}
                  onChange={(e) => setTargetEnrollDeptId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white text-slate-900 font-medium"
                >
                  <option value="all">-- All Departments (Entire Candidate Pool) --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleEnrollCandidates(targetEnrollDeptId)}
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  Enroll Cohort
                </button>
              </div>
            </div>

            {/* Enrolled Candidates List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Filter enrolled candidates by name or email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              {filteredEnrolled.length > 0 ? (
                <div className="space-y-2">
                  {filteredEnrolled.map((a, idx) => {
                    const cand = candidateMap.get(a.candidate_id);
                    const candDept = cand?.departmentId ? deptMap.get(cand.departmentId) : null;

                    return (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-extrabold text-slate-400 text-[11px] w-5">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {cand?.fullName || a.candidateName || "Candidate"}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {cand?.email || a.candidateEmail || "email"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {candDept ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              {candDept.code || candDept.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">General</span>
                          )}

                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {a.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  {activeEnrolledAssignments.length === 0
                    ? "No candidates currently enrolled. Use the 1-Click Cohort Enrollment above to assign students."
                    : "No enrolled candidates match your search."}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setActiveRosterSchedule(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
