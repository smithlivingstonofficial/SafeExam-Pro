import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { scheduleExamAction } from "@/app/actions/examiner";
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  ShieldCheck,
  Users,
  Video,
  ChevronRight,
  Calendar,
} from "lucide-react";

export default async function ExaminerSchedulesPage() {
  const supabase = await createClient();

  // Fetch all exam schedules
  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("*")
    .order("start_at", { ascending: true });

  // Fetch available exams for schedule form and name lookup
  const { data: availableExams } = await supabase
    .from("exams")
    .select("id, title")
    .order("title", { ascending: true });

  const examMap = new Map((availableExams || []).map((e) => [e.id, e]));

  return (
    <div className="space-y-6">
      {/* Header with Scheduling Dialog */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Examination Delivery Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure test windows, fixed start times, and proctoring surveillance levels.
          </p>
        </div>

        <details className="group relative">
          <summary className="list-none inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer select-none transition-all">
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Exam Session</span>
          </summary>

          <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl z-30">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              New Exam Delivery Session
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set start/end window, duration, and monitoring parameters.
            </p>

            <form
              action={async (formData: FormData) => {
                "use server";
                await scheduleExamAction(formData);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Blueprint *
                </label>
                <select
                  name="examId"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                >
                  {availableExams && availableExams.length > 0 ? (
                    availableExams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))
                  ) : (
                    <option value="">No exams created</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Window *
                  </label>
                  <input
                    type="datetime-local"
                    name="startAt"
                    required
                    defaultValue="2026-10-15T09:00"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Window *
                  </label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    required
                    defaultValue="2026-10-15T12:00"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    name="durationMinutes"
                    required
                    defaultValue="120"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Window Type
                  </label>
                  <select
                    name="windowType"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  >
                    <option value="fixed">Fixed Synchronous Window</option>
                    <option value="flexible">Flexible Window</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proctoring Level
                  </label>
                  <select
                    name="proctoringLevel"
                    defaultValue="standard"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  >
                    <option value="none">None (Open Practice)</option>
                    <option value="basic">Basic (Tab Focus Only)</option>
                    <option value="standard">Standard (Webcam Stream)</option>
                    <option value="full">Full (Webcam + Screen + AI)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Candidates
                  </label>
                  <input
                    type="number"
                    name="maxCandidates"
                    placeholder="e.g. 500"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </details>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules && schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((sch) => {
              const examData = examMap.get(sch.exam_id);
              const startDate = new Date(sch.start_at);
              const endDate = new Date(sch.end_at);

              return (
                <div
                  key={sch.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
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
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mt-1.5">
                        {examData?.title || "Examination Session"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sch.duration_minutes} Mins Duration</span>
                        </span>
                        <span>•</span>
                        <span>
                          {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
                        <Video className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="capitalize">{sch.proctoring_level} Proctoring</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sch.max_candidates ? `Max ${sch.max_candidates} seats` : "Unlimited enrollment"}
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
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Exam Sessions Scheduled
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Schedule test windows to allow registered candidates to access entrance examinations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
