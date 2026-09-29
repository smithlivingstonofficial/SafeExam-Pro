import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Layers,
  BookOpen,
  CalendarCheck,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Globe,
  Building2,
  Calendar,
  ChevronRight,
} from "lucide-react";

export default async function ExaminerDashboardPage() {
  const supabase = await createClient();

  // 1. Fetch all exams
  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, description, status, settings, created_at")
    .order("created_at", { ascending: false });

  // 2. Fetch sections and question counts
  const { data: sections } = await supabase
    .from("exam_sections")
    .select("id, exam_id, title, scope, department_id");

  const { data: sectionQuestions } = await supabase
    .from("exam_section_questions")
    .select("id, section_id, marks");

  // Map sections and questions to exams
  const examSectionsMap: Record<string, typeof sections> = {};
  const sectionQuestionsCountMap: Record<string, number> = {};
  const sectionMarksMap: Record<string, number> = {};

  sections?.forEach((s) => {
    if (!examSectionsMap[s.exam_id]) examSectionsMap[s.exam_id] = [];
    examSectionsMap[s.exam_id]!.push(s);
  });

  sectionQuestions?.forEach((sq) => {
    sectionQuestionsCountMap[sq.section_id] = (sectionQuestionsCountMap[sq.section_id] || 0) + 1;
    sectionMarksMap[sq.section_id] = (sectionMarksMap[sq.section_id] || 0) + (Number(sq.marks) || 0);
  });

  // 3. Fetch schedules
  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("id, exam_id, start_at, end_at, duration_minutes, proctoring_level, status, max_candidates")
    .order("start_at", { ascending: true });

  const examScheduleMap = new Map((schedules || []).map((s) => [s.exam_id, s]));

  // 4. Fetch candidate assignment counts
  const { data: assignments } = await supabase
    .from("exam_assignments")
    .select("id, schedule_id, status");

  const scheduleAssignmentCountMap: Record<string, number> = {};
  assignments?.forEach((a) => {
    scheduleAssignmentCountMap[a.schedule_id] = (scheduleAssignmentCountMap[a.schedule_id] || 0) + 1;
  });

  // 5. Fetch question repositories data
  const { data: questions } = await supabase
    .from("questions")
    .select("id, is_common, department_id, type");

  const { data: banks } = await supabase
    .from("question_banks")
    .select("id, name");

  const totalQuestions = questions?.length || 0;
  const commonQuestionsCount = questions?.filter((q) => q.is_common !== false).length || 0;
  const deptQuestionsCount = questions?.filter((q) => q.is_common === false).length || 0;
  const totalExams = exams?.length || 0;
  const totalSchedules = schedules?.length || 0;
  const totalAssignments = assignments?.length || 0;

  return (
    <div className="space-y-6 max-w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Examination Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active blueprints, question repositories, and delivery schedules
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/examiner/exams"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 ring-1 ring-indigo-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Blueprint</span>
          </Link>
          <Link
            href="/examiner/schedules"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Schedule</span>
          </Link>
          <Link
            href="/examiner/banks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Questions</span>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards with Light Matching Color Outlines & Soft Gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Question Pool (Indigo) */}
        <Link
          href="/examiner/banks"
          className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/20 p-4 rounded-2xl border border-indigo-200/80 shadow-[0_2px_8px_rgba(79,70,229,0.06)] hover:shadow-[0_4px_16px_rgba(79,70,229,0.12)] hover:border-indigo-300 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-indigo-900/70 tracking-wide uppercase">
              Question Pool
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-baseline">
              <span>{totalQuestions}</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200/80 px-1.5 py-0.5 rounded-md ml-2">
                {commonQuestionsCount} Common
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
        </Link>

        {/* Card 2: Blueprints (Blue) */}
        <Link
          href="/examiner/exams"
          className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/20 p-4 rounded-2xl border border-blue-200/80 shadow-[0_2px_8px_rgba(37,99,235,0.06)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)] hover:border-blue-300 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-blue-900/70 tracking-wide uppercase">
              Exam Blueprints
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {totalExams}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 border border-blue-200/80 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </Link>

        {/* Card 3: Delivery Windows (Emerald) */}
        <Link
          href="/examiner/schedules"
          className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/20 p-4 rounded-2xl border border-emerald-200/80 shadow-[0_2px_8px_rgba(16,185,129,0.06)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.12)] hover:border-emerald-300 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-emerald-900/70 tracking-wide uppercase">
              Delivery Windows
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {totalSchedules}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-4.5 h-4.5" />
          </div>
        </Link>

        {/* Card 4: Enrolled Candidates (Purple) */}
        <Link
          href="/examiner/schedules"
          className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/20 p-4 rounded-2xl border border-purple-200/80 shadow-[0_2px_8px_rgba(147,51,234,0.06)] hover:shadow-[0_4px_16px_rgba(147,51,234,0.12)] hover:border-purple-300 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold text-purple-900/70 tracking-wide uppercase">
              Enrolled Candidates
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {totalAssignments}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 border border-purple-200/80 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-4.5 h-4.5" />
          </div>
        </Link>
      </div>

      {/* Main Section: Examination Papers */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Exam Blueprints
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
              {totalExams}
            </span>
          </div>
          <Link
            href="/examiner/exams"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const examSections = examSectionsMap[exam.id] || [];
              const schedule = examScheduleMap.get(exam.id);

              let totalExamQuestions = 0;
              let totalExamMarks = 0;
              examSections.forEach((s) => {
                totalExamQuestions += sectionQuestionsCountMap[s.id] || 0;
                totalExamMarks += sectionMarksMap[s.id] || 0;
              });

              const isPublished = exam.status === "published";
              const isScheduled = !!schedule;
              const enrolledCount = schedule ? (scheduleAssignmentCountMap[schedule.id] || 0) : 0;

              return (
                <div
                  key={exam.id}
                  className="bg-gradient-to-b from-white via-white to-slate-50/40 border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPublished ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Draft
                          </span>
                        )}

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                          {examSections.length} {examSections.length === 1 ? "Section" : "Sections"}
                        </span>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50/80 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                          {totalExamQuestions} Questions
                        </span>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50/80 text-blue-700 border border-blue-200/80 shadow-2xs">
                          {totalExamMarks} Marks
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-2.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  {/* Schedule Status Banner */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    {isScheduled ? (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-950 font-semibold truncate">
                            {new Date(schedule.start_at).toLocaleDateString()} • {schedule.duration_minutes}m • {enrolledCount} Enrolled
                          </span>
                        </div>
                        <Link
                          href="/examiner/schedules"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs shrink-0 transition-colors"
                        >
                          Roster
                        </Link>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/60 to-white border border-amber-200/90 shadow-2xs flex items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-amber-950 font-semibold truncate">
                            Delivery window required before testing
                          </span>
                        </div>
                        <Link
                          href="/examiner/schedules"
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs shrink-0 transition-colors"
                        >
                          Schedule
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${examSections.length > 0 ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                        <span>{examSections.length > 0 ? "Ready for delivery" : "Requires sections"}</span>
                      </span>

                      <Link
                        href={`/examiner/exams/${exam.id}`}
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group/btn cursor-pointer"
                      >
                        <span>Open Composer</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* If only 1 exam exists, show a balanced compact action card */}
            {exams.length === 1 && (
              <Link
                href="/examiner/exams"
                className="bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:shadow-sm rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Compose Another Blueprint
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Create alternative entrance tests or subject papers
                  </p>
                </div>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              No Examination Papers Created Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Compose your first entrance paper with common and departmental sections.
            </p>
            <div className="mt-3">
              <Link
                href="/examiner/exams"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Compose First Exam</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Upcoming Schedules & Question Repository Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Delivery Windows */}
        <div className="bg-gradient-to-b from-white via-white to-slate-50/40 border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3.5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upcoming Delivery Windows</span>
              </h3>
              <Link
                href="/examiner/schedules"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View All ({totalSchedules})
              </Link>
            </div>

            {schedules && schedules.length > 0 ? (
              <div className="space-y-2.5 mt-3.5">
                {schedules.slice(0, 3).map((sch) => {
                  const assignedCount = scheduleAssignmentCountMap[sch.id] || 0;
                  const startDate = new Date(sch.start_at);

                  return (
                    <div
                      key={sch.id}
                      className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50/90 to-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{startDate.toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span>{startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {sch.duration_minutes}m
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span className="capitalize">{sch.proctoring_level} Proctoring</span>
                          <span className="mx-1">•</span>
                          <span className="font-medium text-slate-700">{assignedCount} Enrolled</span>
                        </div>
                      </div>

                      <Link
                        href="/examiner/schedules"
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-7 text-center flex flex-col items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-1.5">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700">No Active Delivery Windows</h4>
                <Link
                  href="/examiner/schedules"
                  className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3 h-3 text-indigo-600" />
                  <span>Schedule Test Window</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{totalAssignments} Total Candidates Assigned</span>
            <Link
              href="/examiner/schedules"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Open Schedule Manager &rarr;
            </Link>
          </div>
        </div>

        {/* Question Repository Summary */}
        <div className="bg-gradient-to-b from-white via-white to-slate-50/40 border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3.5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span>Question Repositories</span>
              </h3>
              <Link
                href="/examiner/banks"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Browse ({banks?.length || 0})
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3.5">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 via-indigo-50/30 to-white border border-indigo-200/90 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-indigo-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Universal Common</span>
                </div>
                <div className="text-2xl font-black text-indigo-950 mt-1">
                  {commonQuestionsCount}
                </div>
                <div className="text-[11px] text-indigo-600/90 font-medium mt-0.5">
                  All entrance applicants
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/90 via-purple-50/30 to-white border border-purple-200/90 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-purple-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Dept-Specific</span>
                </div>
                <div className="text-2xl font-black text-purple-950 mt-1">
                  {deptQuestionsCount}
                </div>
                <div className="text-[11px] text-purple-600/90 font-medium mt-0.5">
                  Filtered by department
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{banks?.length || 0} Domain Repositories Active</span>
            <Link
              href="/examiner/banks"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Manage Repository Items &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
