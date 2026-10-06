"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createExamAction } from "@/app/actions/examiner";
import {
  Layers,
  PlusCircle,
  Clock,
  Shield,
  FileCheck,
  ArrowRight,
  X,
  CheckCircle2,
  Search,
  BookOpen,
  Lock,
  Scale,
  Video,
  Shuffle,
  Calculator,
  Check,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  settings?: any;
  created_at: string;
}

interface ExamBlueprintListProps {
  exams: ExamItem[];
  examSectionsMap: Record<string, number>;
  examQuestionsCountMap: Record<string, number>;
  departments?: Department[];
}

function InfoHelp({
  title,
  content,
  align = "right",
}: {
  title?: string;
  content: string;
  align?: "left" | "right";
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded-full hover:bg-indigo-50/80 transition-colors cursor-pointer"
        aria-label="More information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-56 sm:w-60 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {title && <div className="font-bold text-white mb-0.5 text-[11px]">{title}</div>}
          <p className="text-slate-300 text-[10px] leading-snug">{content}</p>
          <div
            className={`absolute top-full -mt-1 border-4 border-transparent border-t-slate-900 ${
              align === "left" ? "left-2" : "right-2"
            }`}
          />
        </div>
      )}
    </div>
  );
}

export function ExamBlueprintList({
  exams,
  examSectionsMap,
  examQuestionsCountMap,
  departments = [],
}: ExamBlueprintListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // General & Academic Specifications
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(120);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  // Marking & Negative Marking Architecture
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false);
  const [defaultNegativePenalty, setDefaultNegativePenalty] = useState(0.25);
  const [enablePartialMarking, setEnablePartialMarking] = useState(false);
  const [requireSectionalCutoff, setRequireSectionalCutoff] = useState(false);

  // Anti-Cheat & Safeguards
  const [requireSafeBrowser, setRequireSafeBrowser] = useState(true);
  const [enableWebcamProctoring, setEnableWebcamProctoring] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowBacktracking, setAllowBacktracking] = useState(true);
  const [calculatorType, setCalculatorType] = useState<"none" | "basic" | "scientific">("none");

  // Statistics
  const publishedCount = exams.filter((e) => e.status?.toLowerCase() === "published").length;
  const draftCount = exams.filter((e) => e.status?.toLowerCase() !== "published").length;

  const totalSections = useMemo(
    () => Object.values(examSectionsMap).reduce((a, b) => a + b, 0),
    [examSectionsMap]
  );
  const totalQuestionsLinked = useMemo(
    () => Object.values(examQuestionsCountMap).reduce((a, b) => a + b, 0),
    [examQuestionsCountMap]
  );

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        exam.title.toLowerCase().includes(q) ||
        (exam.description || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === "published" && exam.status?.toLowerCase() !== "published") return false;
      if (statusFilter === "draft" && exam.status?.toLowerCase() === "published") return false;
      if (departmentFilter !== "all" && exam.settings?.department_id !== departmentFilter) return false;
      return true;
    });
  }, [exams, searchQuery, statusFilter, departmentFilter]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (instructions.trim()) formData.append("instructions", instructions.trim());
    if (departmentId) formData.append("departmentId", departmentId);
    if (targetDurationMinutes) formData.append("targetDurationMinutes", String(targetDurationMinutes));
    if (passingPercentage) formData.append("passingPercentage", String(passingPercentage));

    if (enableNegativeMarking) {
      formData.append("enableNegativeMarking", "on");
      formData.append("defaultNegativePenalty", String(defaultNegativePenalty));
    }
    if (enablePartialMarking) formData.append("enablePartialMarking", "on");
    if (requireSectionalCutoff) formData.append("requireSectionalCutoff", "on");

    if (requireSafeBrowser) formData.append("requireSafeBrowser", "on");
    if (enableWebcamProctoring) formData.append("enableWebcamProctoring", "on");
    if (shuffleQuestions) formData.append("shuffleQuestions", "on");
    if (shuffleOptions) formData.append("shuffleOptions", "on");
    if (allowBacktracking) formData.append("allowBacktracking", "on");
    formData.append("calculatorType", calculatorType);

    startTransition(async () => {
      const res = await createExamAction(formData);
      if (res.success && res.data) {
        setIsCreateModalOpen(false);
        router.push(`/examiner/exams/${(res.data as any).id}`);
      } else {
        alert(res.error || "Failed to create exam blueprint");
      }
    });
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* 4 Clean Metric Cards (Above Search Toolbar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Blueprints */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Total Blueprints
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {exams.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Configured entrance papers
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Published Papers */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Published Papers
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {publishedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Live & ready for delivery
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Drafts in Progress */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Drafts in Progress
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {draftCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              In curriculum assembly
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Curriculum Scale */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Curriculum Scale
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalQuestionsLinked}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalSections} Sections linked
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search exam blueprints by title, syllabus, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
          >
            <option value="all">All Statuses ({exams.length})</option>
            <option value="published">Published ({publishedCount})</option>
            <option value="draft">Drafts ({draftCount})</option>
          </select>

          {/* Quick Setup Wizard CTA */}
          <Link
            href="/examiner/quick-setup"
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ Quick Setup Wizard</span>
          </Link>

          {/* Compose Exam CTA */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Advanced Modal</span>
          </button>
        </div>
      </div>

      {/* Examination Blueprints Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredExams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Examination Blueprint</th>
                  <th className="py-3 px-4">Paper Structure</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => {
                  const secCount = examSectionsMap[exam.id] || 0;
                  const qCount = examQuestionsCountMap[exam.id] || 0;
                  const isPublished = exam.status?.toLowerCase() === "published";

                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Examination Blueprint Title & Specs */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/examiner/exams/${exam.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-700 transition-colors flex items-center gap-1 group"
                            >
                              <span>{exam.title}</span>
                              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                              {exam.description || "University qualifying entrance assessment."}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                              {exam.settings?.enable_negative_marking ? (
                                <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  -{exam.settings?.default_negative_penalty || 0.25} Neg
                                </span>
                              ) : (
                                <span className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  No Neg
                                </span>
                              )}
                              {exam.settings?.target_duration_minutes && (
                                <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  {exam.settings.target_duration_minutes}m
                                </span>
                              )}
                              {exam.settings?.require_safe_browser && (
                                <span className="font-medium text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  Lockdown
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Structure */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {secCount} {secCount === 1 ? "Section" : "Sections"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {qCount} Questions Linked
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase ${
                            isPublished
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(exam.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link
                          href={`/examiner/exams/${exam.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          Composer ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-800">
              {searchQuery || statusFilter !== "all" || departmentFilter !== "all"
                ? "No matching examination blueprints found"
                : "No Examination Blueprints Created"}
            </div>
            <div className="text-slate-400 mt-0.5">
              {searchQuery || statusFilter !== "all" || departmentFilter !== "all"
                ? "Clear your search or filters to see all examination blueprints."
                : "Create your first exam blueprint using the button above."}
            </div>
          </div>
        )}
      </div>

      {/* Create Exam Blueprint Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">New Examination Blueprint</h3>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                      Draft Setup
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Configure curriculum parameters, academic faculty, negative scoring, and proctoring safeguards.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateExam} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden space-y-6 text-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT COLUMN: Blueprint Essentials & Timing (5 Cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Curriculum & Assessment Specs</span>
                    </div>

                    {/* Examination Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Examination Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Ph.D. Entrance Assessment 2026 — Engineering & Technology"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Official title displayed on admit cards and candidate test screens.
                      </p>
                    </div>

                    {/* Faculty / Dept */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic Faculty / Department
                      </label>
                      <div className="relative">
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-medium transition-all cursor-pointer appearance-none pr-8"
                        >
                          <option value="">Universal Common (All Faculties)</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code || "DEPT"})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Filters eligible question banks and candidate registration pools.
                      </p>
                    </div>

                    {/* Duration & Cutoff Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Duration
                          </label>
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                            {Math.floor(targetDurationMinutes / 60)}h {targetDurationMinutes % 60}m
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={15}
                            max={600}
                            value={targetDurationMinutes}
                            onChange={(e) => setTargetDurationMinutes(Number(e.target.value))}
                            className="w-full pl-3 pr-10 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                            mins
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Cutoff Score
                          </label>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Pass Mark
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={passingPercentage}
                            onChange={(e) => setPassingPercentage(Number(e.target.value))}
                            className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description / Syllabus Scope */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Syllabus Scope & Topics
                        </label>
                        <span className="text-[10px] text-slate-400">Optional</span>
                      </div>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Doctoral entrance curriculum, subject syllabus topics, and qualifying criteria..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 resize-none"
                      />
                    </div>

                    {/* Candidate Guidelines */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Candidate Guidelines & Instructions
                        </label>
                        <span className="text-[10px] text-slate-400">Optional</span>
                      </div>
                      <textarea
                        rows={2}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Lockdown browser mandatory. Scientific calculator permitted. No external reference aids."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 resize-none font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Grading Engine & Security Safeguards (7 Cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Scale className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Evaluation Rules & Security Policies</span>
                    </div>

                    {/* Scoring & Negative Marking Scheme Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                      {/* Negative Marking Main Toggle */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Negative Marking Scheme</span>
                            <InfoHelp
                              title="Negative Marking Scheme"
                              content="Deducts penalty marks for incorrect objective responses to eliminate random guessing."
                              align="left"
                            />
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                enableNegativeMarking
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-200/70 text-slate-600"
                              }`}
                            >
                              {enableNegativeMarking ? "Active" : "Disabled"}
                            </span>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={enableNegativeMarking}
                            onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {/* Penalty Rate Pill Bar */}
                      {enableNegativeMarking && (
                        <div className="p-2.5 bg-white border border-indigo-100 rounded-lg space-y-1.5 animate-in fade-in duration-150 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">Deduction Penalty Rate:</span>
                            <span className="font-bold text-indigo-700 font-mono">
                              -{defaultNegativePenalty} marks/wrong
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: "-0.25", val: 0.25, desc: "1/4 Mark" },
                              { label: "-0.33", val: 0.33, desc: "1/3 Mark" },
                              { label: "-0.50", val: 0.5, desc: "1/2 Mark" },
                              { label: "-1.00", val: 1.0, desc: "Full Mark" },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => setDefaultNegativePenalty(opt.val)}
                                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer ${
                                  defaultNegativePenalty === opt.val
                                    ? "bg-indigo-600 text-white font-bold shadow-2xs"
                                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300"
                                }`}
                              >
                                <span className="block text-[10px] font-bold">{opt.label}</span>
                                <span className={`block text-[8px] ${defaultNegativePenalty === opt.val ? "text-indigo-100" : "text-slate-400"}`}>
                                  {opt.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Partial & Sectional Cutoff Rules */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">
                        {/* Partial Marking Tile */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                            enablePartialMarking
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={enablePartialMarking}
                              onChange={(e) => setEnablePartialMarking(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                enablePartialMarking
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {enablePartialMarking && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-bold text-slate-800 text-xs truncate">Partial Credit MCQs</span>
                          </div>
                          <InfoHelp
                            title="Partial Marks for Multiple Answers"
                            content="If a question has multiple right answers, students get points for each correct option they pick, instead of getting zero."
                          />
                        </label>

                        {/* Sectional Cutoff Tile */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                            requireSectionalCutoff
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={requireSectionalCutoff}
                              onChange={(e) => setRequireSectionalCutoff(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                requireSectionalCutoff
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {requireSectionalCutoff && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-bold text-slate-800 text-xs truncate">Mandate Sectional Cutoff</span>
                          </div>
                          <InfoHelp
                            title="Pass Each Section Separately"
                            content="Students must score above the passing mark in each section individually to pass the overall exam."
                          />
                        </label>
                      </div>
                    </div>

                    {/* Security & Integrity Safeguards Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Security & Delivery Safeguards</span>
                          <span className="text-[10px] text-slate-500">
                            Automated lockdown controls and anti-collusion measures
                          </span>
                        </div>
                      </div>

                      {/* Interactive Safeguards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Safe Lockdown Browser */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                            requireSafeBrowser
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={requireSafeBrowser}
                              onChange={(e) => setRequireSafeBrowser(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                requireSafeBrowser
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {requireSafeBrowser && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold text-slate-800 text-xs truncate">Safe Lockdown Browser</span>
                            </div>
                          </div>
                          <InfoHelp
                            title="Safe Lockdown Browser"
                            content="Enforces full-screen kiosk mode, disabling alt-tab, new browser tabs, copy/paste, dual displays, and screenshots."
                          />
                        </label>

                        {/* Webcam & AI Proctoring */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                            enableWebcamProctoring
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={enableWebcamProctoring}
                              onChange={(e) => setEnableWebcamProctoring(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                enableWebcamProctoring
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {enableWebcamProctoring && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold text-slate-800 text-xs truncate">Live Webcam Proctoring</span>
                            </div>
                          </div>
                          <InfoHelp
                            title="Live Webcam Proctoring"
                            content="Streams candidate video feed and flags missing face, looking away, or unauthorized multiple people in frame."
                          />
                        </label>

                        {/* Randomize Questions */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                            shuffleQuestions
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={shuffleQuestions}
                              onChange={(e) => setShuffleQuestions(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                shuffleQuestions
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {shuffleQuestions && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Shuffle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold text-slate-800 text-xs truncate">Randomize Questions</span>
                            </div>
                          </div>
                          <InfoHelp
                            title="Randomize Question Order"
                            content="Generates a unique, non-sequential question order for each candidate to prevent peer screen copying."
                          />
                        </label>

                        {/* Shuffle Options (A-D) */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                            shuffleOptions
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={shuffleOptions}
                              onChange={(e) => setShuffleOptions(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                shuffleOptions
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {shuffleOptions && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Shuffle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold text-slate-800 text-xs truncate">Shuffle Option Choices</span>
                            </div>
                          </div>
                          <InfoHelp
                            title="Shuffle Option Choices"
                            content="Permutes option choices (A–D) randomly for each candidate test instance."
                          />
                        </label>

                        {/* Allow Question Backtracking & Review */}
                        <label
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none sm:col-span-2 ${
                            allowBacktracking
                              ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={allowBacktracking}
                              onChange={(e) => setAllowBacktracking(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                allowBacktracking
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {allowBacktracking && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-bold text-slate-800 text-xs truncate">Allow Question Backtracking & Review</span>
                          </div>
                          <InfoHelp
                            title="Question Backtracking & Review"
                            content="Enforces candidates to freely navigate back and forth, bookmark questions, and edit responses before final submission."
                          />
                        </label>
                      </div>

                      {/* Calculator Policy Interactive 3-Card Selector */}
                      <div className="pt-3 border-t border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Calculator className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">In-Exam Digital Calculator</span>
                              <InfoHelp
                                title="In-Exam Calculator Policy"
                                content="Embeds an on-screen calculation tool directly inside the lockdown exam window."
                                align="left"
                              />
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {calculatorType === "none" ? "Disabled" : calculatorType === "basic" ? "Basic Arithmetic" : "Scientific / LaTeX"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {/* Prohibited */}
                          <button
                            type="button"
                            onClick={() => setCalculatorType("none")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              calculatorType === "none"
                                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-bold">Prohibited</span>
                              <div className={`w-2 h-2 rounded-full ${calculatorType === "none" ? "bg-rose-400" : "bg-slate-300"}`} />
                            </div>
                            <span className={`text-[10px] leading-tight ${calculatorType === "none" ? "text-slate-300" : "text-slate-400"}`}>
                              No tool allowed
                            </span>
                          </button>

                          {/* Basic Arithmetic */}
                          <button
                            type="button"
                            onClick={() => setCalculatorType("basic")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              calculatorType === "basic"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-bold">Basic</span>
                              <div className={`w-2 h-2 rounded-full ${calculatorType === "basic" ? "bg-emerald-300" : "bg-slate-300"}`} />
                            </div>
                            <span className={`text-[10px] leading-tight ${calculatorType === "basic" ? "text-indigo-100" : "text-slate-400"}`}>
                              + − × ÷ % Arithmetic
                            </span>
                          </button>

                          {/* Scientific */}
                          <button
                            type="button"
                            onClick={() => setCalculatorType("scientific")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              calculatorType === "scientific"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-bold">Scientific</span>
                              <div className={`w-2 h-2 rounded-full ${calculatorType === "scientific" ? "bg-amber-300" : "bg-slate-300"}`} />
                            </div>
                            <span className={`text-[10px] leading-tight ${calculatorType === "scientific" ? "text-indigo-100" : "text-slate-400"}`}>
                              LaTeX, Trig, Log, √
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Sections, question items, and mark allocation will be assembled in the composer next.
                </span>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending || !title.trim()}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isPending ? "Creating..." : "Create & Launch Composer"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
