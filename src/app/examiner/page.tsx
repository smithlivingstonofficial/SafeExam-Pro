import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Layers,
  BookOpen,
  CalendarCheck,
  PlusCircle,
  ArrowRight,
  Users,
  CheckCircle2,
  AlertCircle,
  Globe,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

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
  const publishedExamsCount = exams?.filter((e) => e.status === "published").length || 0;
  const draftExamsCount = totalExams - publishedExamsCount;
  const totalSchedules = schedules?.length || 0;
  const totalAssignments = assignments?.length || 0;

  return (
    <div className="space-y-6 max-w-full">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Examiner Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Entrance examination composition, question banks, and delivery schedules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/examiner/quick-setup"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Setup Wizard</span>
          </Link>
          <Link
            href="/examiner/exams"
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Advanced Composer</span>
          </Link>
          <Link
            href="/examiner/banks"
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Question Banks</span>
          </Link>
        </div>
      </div>

      {/* 4 Clean Metric Cards (Matching Admin Overview Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Question Pool */}
        <Link
          href="/examiner/banks"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Question Pool
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalQuestions}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {commonQuestionsCount} Common • {deptQuestionsCount} Dept
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
        </Link>

        {/* Metric 2: Exam Blueprints */}
        <Link
          href="/examiner/exams"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Exam Blueprints
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalExams}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {publishedExamsCount} Ready • {draftExamsCount} Draft
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </Link>

        {/* Metric 3: Delivery Windows */}
        <Link
          href="/examiner/schedules"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Delivery Windows
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalSchedules}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Active scheduled slots
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </Link>

        {/* Metric 4: Enrolled Candidates */}
        <Link
          href="/examiner/schedules"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Enrolled Candidates
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalAssignments}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Allocated test slots
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Main 2-Column Section: Exam Papers (7 cols) & Delivery Windows (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Examination Blueprints (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                <span>Examination Papers ({totalExams})</span>
              </h2>
              <Link
                href="/examiner/exams"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 group"
              >
                <span>Manage All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {exams && exams.length > 0 ? (
                exams.slice(0, 4).map((exam) => {
                  const examSections = examSectionsMap[exam.id] || [];
                  const schedule = examScheduleMap.get(exam.id);

                  let totalExamQuestions = 0;
                  let totalExamMarks = 0;
                  examSections.forEach((s) => {
                    totalExamQuestions += sectionQuestionsCountMap[s.id] || 0;
                    totalExamMarks += sectionMarksMap[s.id] || 0;
                  });

                  const isPublished = exam.status === "published";

                  return (
                    <div
                      key={exam.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-700 transition-colors">
                            {exam.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase border ${
                              isPublished
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-amber-50 border-amber-200 text-amber-800"
                            }`}
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2.5 mt-1">
                          <span>{examSections.length} Sections</span>
                          <span>•</span>
                          <span>{totalExamQuestions} Questions</span>
                          <span>•</span>
                          <span>{totalExamMarks} Marks</span>
                          {schedule && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">Scheduled</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/examiner/exams/${exam.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          Composer ↗
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No examination papers composed yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/examiner/exams"
              className="text-xs font-semibold text-indigo-700 hover:underline"
            >
              Compose New Exam Blueprint &rarr;
            </Link>
          </div>
        </div>

        {/* Right Panel: Upcoming Delivery Windows (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span>Delivery Windows</span>
              </h2>
              <Link
                href="/examiner/schedules"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                View All ({totalSchedules})
              </Link>
            </div>

            <div className="space-y-2.5 mt-2.5">
              {schedules && schedules.length > 0 ? (
                schedules.slice(0, 3).map((sch) => {
                  const assignedCount = scheduleAssignmentCountMap[sch.id] || 0;
                  const startDate = new Date(sch.start_at);

                  return (
                    <div
                      key={sch.id}
                      className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <span>{startDate.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                          <span className="text-slate-400">•</span>
                          <span>{startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                            {sch.duration_minutes}m
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span className="capitalize">{sch.proctoring_level}</span>
                          <span className="mx-1">•</span>
                          <span className="font-medium text-slate-700">{assignedCount} Candidates</span>
                        </div>
                      </div>

                      <Link
                        href="/examiner/schedules"
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                      >
                        Roster
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No delivery windows scheduled.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/examiner/schedules"
              className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs text-center border border-indigo-200/70 transition-colors flex items-center justify-center gap-1"
            >
              <span>Manage Schedules & Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Question Repositories Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Universal Common Questions</span>
              <span className="text-[11px] text-slate-500">Shared entrance syllabus pool for all candidates</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-indigo-700">{commonQuestionsCount}</span>
            <span className="text-[11px] text-slate-400 block">Items</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Departmental Question Banks</span>
              <span className="text-[11px] text-slate-500">Domain-specific subjects and research questions</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-purple-700">{deptQuestionsCount}</span>
            <span className="text-[11px] text-slate-400 block">Items</span>
          </div>
        </div>
      </div>
    </div>
  );
}
