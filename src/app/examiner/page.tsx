import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Layers,
  BookOpen,
  CalendarCheck,
  Award,
  PlusCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Globe,
  Building2,
  Sparkles,
  Calendar,
  FileText,
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

  sections?.forEach((s) => {
    if (!examSectionsMap[s.exam_id]) examSectionsMap[s.exam_id] = [];
    examSectionsMap[s.exam_id]!.push(s);
  });

  sectionQuestions?.forEach((sq) => {
    sectionQuestionsCountMap[sq.section_id] = (sectionQuestionsCountMap[sq.section_id] || 0) + 1;
  });

  // 3. Fetch schedules
  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("id, exam_id, start_at, end_at, duration_minutes, proctoring_level, status, max_candidates")
    .order("start_at", { ascending: true });

  // Map schedules to exams
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
    <div className="space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              Executive Command Center
            </span>
            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              Institutional Entrance Assessment
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Examination Control Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage question banks, compose multi-section exam papers, configure live delivery windows, and verify student enrollment seamlessly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/examiner/exams"
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Compose New Exam</span>
          </Link>
          <Link
            href="/examiner/schedules"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <span>Schedule Session</span>
          </Link>
          <Link
            href="/examiner/banks"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Author Questions</span>
          </Link>
        </div>
      </div>

      {/* 4-Step Interactive Examination Lifecycle Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Question Repositories */}
        <Link
          href="/examiner/banks"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Step 1</span>
              <BookOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Question Repositories
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Author common aptitude & specialized departmental questions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800">
              {totalQuestions} Items ({commonQuestionsCount} Common)
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Step 2: Exam Blueprints */}
        <Link
          href="/examiner/exams"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Step 2</span>
              <Layers className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Exam Blueprints
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Assemble sections, configure marking schemes & link items.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800">
              {totalExams} Blueprints Configured
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Step 3: Delivery Schedules */}
        <Link
          href="/examiner/schedules"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Step 3</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Delivery Schedules
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Set active time windows & proctoring surveillance levels.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800">
              {totalSchedules} Sessions Scheduled
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Step 4: Candidate Enrollment */}
        <Link
          href="/examiner/schedules"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Step 4</span>
              <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
              Candidate Enrollment
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Assign students by department & issue verified test access.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800">
              {totalAssignments} Candidates Enrolled
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Main Section: Examination Papers & Readiness Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Examination Papers & Delivery Readiness</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of blueprints, linked questions, and scheduled delivery windows.
            </p>
          </div>
          <Link
            href="/examiner/exams"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 group"
          >
            <span>Manage All Blueprints</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const examSections = examSectionsMap[exam.id] || [];
              const schedule = examScheduleMap.get(exam.id);

              let totalExamQuestions = 0;
              examSections.forEach((s) => {
                totalExamQuestions += sectionQuestionsCountMap[s.id] || 0;
              });

              const isPublished = exam.status === "published";
              const isScheduled = !!schedule;
              const enrolledCount = schedule ? (scheduleAssignmentCountMap[schedule.id] || 0) : 0;

              return (
                <div
                  key={exam.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isPublished
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {exam.status}
                        </span>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {examSections.length} {examSections.length === 1 ? "Section" : "Sections"}
                        </span>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {totalExamQuestions} Questions Linked
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3 line-clamp-1">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {exam.description || "University qualifying entrance assessment."}
                    </p>
                  </div>

                  {/* Schedule Readiness Banner */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {isScheduled ? (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-emerald-950 block truncate">
                              Scheduled Window Active
                            </span>
                            <span className="text-[11px] text-emerald-800">
                              {new Date(schedule.start_at).toLocaleDateString()} • {schedule.duration_minutes} Mins Duration • {enrolledCount} Enrolled
                            </span>
                          </div>
                        </div>
                        <Link
                          href="/examiner/schedules"
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0"
                        >
                          Roster
                        </Link>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-amber-950 block truncate">
                              No Delivery Schedule Configured
                            </span>
                            <span className="text-[11px] text-amber-800">
                              Candidates cannot take this exam until a time window is created.
                            </span>
                          </div>
                        </div>
                        <Link
                          href="/examiner/schedules"
                          className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] shadow-2xs shrink-0"
                        >
                          Schedule
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        {examSections.length > 0 ? "Blueprint ready for delivery" : "Requires sections"}
                      </span>
                      <Link
                        href={`/examiner/exams/${exam.id}`}
                        className="font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 group cursor-pointer"
                      >
                        <span>Open Composer</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Examination Papers Created Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start by composing your first examination paper. You can add common and department-specific sections and link questions.
            </p>
            <div className="mt-4">
              <Link
                href="/examiner/exams"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Compose First Exam</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Row: Upcoming Schedules & Quick Question Repository Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active & Upcoming Delivery Sessions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Delivery Windows</span>
            </h3>
            <Link
              href="/examiner/schedules"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800"
            >
              View All ({totalSchedules})
            </Link>
          </div>

          {schedules && schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.slice(0, 3).map((sch) => {
                const assignedCount = scheduleAssignmentCountMap[sch.id] || 0;
                const startDate = new Date(sch.start_at);

                return (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{startDate.toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span>{startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {sch.duration_minutes} Mins
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="capitalize">{sch.proctoring_level} Proctoring</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{assignedCount} Candidates Enrolled</span>
                      </div>
                    </div>

                    <Link
                      href="/examiner/schedules"
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 shadow-2xs"
                    >
                      Manage Roster
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500">
                No exam delivery sessions currently scheduled.
              </p>
              <Link
                href="/examiner/schedules"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
              >
                <span>Schedule a test window</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Question Repository Summary */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Question Bank Repositories</span>
              </h3>
              <Link
                href="/examiner/banks"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800"
              >
                Browse Banks ({banks?.length || 0})
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-indigo-700">
                  Universal Common
                </div>
                <div className="text-xl font-extrabold text-indigo-950 mt-1">
                  {commonQuestionsCount}
                </div>
                <div className="text-[11px] text-indigo-600/80 mt-0.5">
                  Delivered to all candidates
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <div className="text-[10px] uppercase font-bold text-purple-700">
                  Dept-Specific
                </div>
                <div className="text-xl font-extrabold text-purple-950 mt-1">
                  {deptQuestionsCount}
                </div>
                <div className="text-[11px] text-purple-600/80 mt-0.5">
                  Specialized departmental
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Questions can be categorized as <strong>Universal Common</strong> (applicable across all entrance candidates) or strictly linked to a candidate&#39;s registered <strong>Academic Department</strong>.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {banks?.length || 0} Domain Repositories Active
            </span>
            <Link
              href="/examiner/banks"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Manage Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
