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
    <div className="space-y-5 max-w-full">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Blueprint</span>
          </Link>
          <Link
            href="/examiner/schedules"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Schedule</span>
          </Link>
          <Link
            href="/examiner/banks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Questions</span>
          </Link>
        </div>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Question Pool */}
        <Link
          href="/examiner/banks"
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-medium text-slate-500">Question Pool</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {totalQuestions}
              <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                ({commonQuestionsCount} Common)
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 2: Blueprints */}
        <Link
          href="/examiner/exams"
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-medium text-slate-500">Exam Blueprints</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {totalExams}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 3: Schedules */}
        <Link
          href="/examiner/schedules"
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-medium text-slate-500">Delivery Windows</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {totalSchedules}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 4: Candidates */}
        <Link
          href="/examiner/schedules"
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-medium text-slate-500">Enrolled Candidates</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {totalAssignments}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Main Section: Examination Papers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Exam Blueprints
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
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
                  className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPublished ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Draft
                          </span>
                        )}

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {examSections.length} {examSections.length === 1 ? "Section" : "Sections"}
                        </span>

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {totalExamQuestions} Questions
                        </span>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
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

                  {/* Schedule Status & Action */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    {isScheduled ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-emerald-900 font-semibold truncate">
                            {new Date(schedule.start_at).toLocaleDateString()} • {schedule.duration_minutes}m • {enrolledCount} Enrolled
                          </span>
                        </div>
                        <Link
                          href="/examiner/schedules"
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shrink-0 transition-colors"
                        >
                          Roster
                        </Link>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-amber-900 font-semibold truncate">
                            Delivery window required before testing
                          </span>
                        </div>
                        <Link
                          href="/examiner/schedules"
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shrink-0 transition-colors"
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
                className="bg-slate-50/50 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
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
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center">
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs"
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
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
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
              <div className="space-y-2 mt-3">
                {schedules.slice(0, 3).map((sch) => {
                  const assignedCount = scheduleAssignmentCountMap[sch.id] || 0;
                  const startDate = new Date(sch.start_at);

                  return (
                    <div
                      key={sch.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
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
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span className="capitalize">{sch.proctoring_level} Proctoring</span>
                          <span className="mx-1">•</span>
                          <span className="font-medium text-slate-700">{assignedCount} Enrolled</span>
                        </div>
                      </div>

                      <Link
                        href="/examiner/schedules"
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-1.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700">No Active Delivery Windows</h4>
                <Link
                  href="/examiner/schedules"
                  className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <PlusCircle className="w-3 h-3 text-indigo-600" />
                  <span>Schedule Test Window</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
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

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-indigo-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Universal Common</span>
                </div>
                <div className="text-xl font-bold text-indigo-950 mt-1">
                  {commonQuestionsCount}
                </div>
                <div className="text-[11px] text-indigo-600/80 mt-0.5">
                  All entrance applicants
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-100">
                <div className="text-[10px] uppercase font-bold text-purple-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Dept-Specific</span>
                </div>
                <div className="text-xl font-bold text-purple-950 mt-1">
                  {deptQuestionsCount}
                </div>
                <div className="text-[11px] text-purple-600/80 mt-0.5">
                  Filtered by department
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
