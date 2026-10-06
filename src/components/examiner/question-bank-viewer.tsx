"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteQuestionAction, deleteQuestionBankAction } from "@/app/actions/examiner";
import { QuestionBulkModal } from "@/components/examiner/question-bulk-modal";
import {
  PlusCircle,
  Trash2,
  CheckCircle2,
  FileQuestion,
  Globe,
  Building2,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  FileSpreadsheet,
  ArrowLeft,
  X,
  LayoutList,
  LayoutGrid,
  Check,
  Code2,
  Binary,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface QuestionItem {
  id: string;
  bank_id: string;
  type: string;
  subject: string;
  topic?: string | null;
  sub_topic?: string | null;
  difficulty: number;
  bloom_level?: string | null;
  content: any;
  options?: any;
  correct_answer?: any;
  explanation?: string | null;
  is_common?: boolean | null;
  department_id?: string | null;
  created_at: string;
}

interface QuestionBankViewerProps {
  bank: {
    id: string;
    name: string;
    description?: string | null;
    is_common?: boolean | null;
    department_id?: string | null;
  };
  initialQuestions: QuestionItem[];
  departments: Department[];
}

export function QuestionBankViewer({
  bank,
  initialQuestions,
  departments,
}: QuestionBankViewerProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Delete Bank State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingBank, setIsDeletingBank] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "common" | "department">("all");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);

  // Statistical counts
  const totalCount = questions.length;
  const commonCount = questions.filter((q) => q.is_common !== false).length;
  const deptSpecificCount = questions.filter((q) => q.is_common === false).length;

  // Question Types count
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      map[q.type] = (map[q.type] || 0) + 1;
    });
    return map;
  }, [questions]);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const isQCommon = q.is_common !== false;
      if (scopeFilter === "common" && !isQCommon) return false;
      if (scopeFilter === "department" && isQCommon) return false;

      if (selectedDeptId !== "all") {
        if (q.department_id !== selectedDeptId) return false;
      }

      if (typeFilter !== "all" && q.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const qText = (q.content?.text || "").toLowerCase();
        const qSubject = (q.subject || "").toLowerCase();
        const qTopic = (q.topic || "").toLowerCase();
        const term = searchQuery.toLowerCase();
        return qText.includes(term) || qSubject.includes(term) || qTopic.includes(term);
      }

      return true;
    });
  }, [questions, scopeFilter, selectedDeptId, typeFilter, searchQuery]);

  const handleDelete = (questionId: string) => {
    if (!confirm("Are you sure you want to permanently remove this question from the bank?")) {
      return;
    }

    setDeletingId(questionId);
    startTransition(async () => {
      const res = await deleteQuestionAction(questionId, bank.id);
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      } else {
        alert(res.error || "Failed to delete question");
      }
      setDeletingId(null);
    });
  };

  const formatTypeName = (type: string) => {
    switch (type) {
      case "mcq_single":
        return "Single MCQ";
      case "mcq_multiple":
        return "Multi MCQ";
      case "true_false":
        return "True / False";
      case "numerical":
        return "Numerical";
      case "fill_blank":
        return "Fill Blank";
      case "descriptive":
        return "Descriptive";
      case "coding":
        return "Coding";
      default:
        return type.replace("_", " ");
    }
  };

  return (
    <div className="space-y-4">
      {/* Executive Clean Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border ${
                bank.is_common
                  ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                  : "bg-purple-50 border-purple-200 text-purple-800"
              }`}
            >
              {bank.is_common ? "Universal Repository" : "Department Repository"}
            </span>

            <span className="text-[11px] font-semibold text-slate-500">
              {totalCount} {totalCount === 1 ? "Item" : "Items"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-semibold text-slate-500">
              {commonCount} Common
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-semibold text-purple-700">
              {deptSpecificCount} Dept-Specific
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {bank.name}
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            {bank.description || "All questions adhere to verified institutional entrance syllabus."}
          </p>
        </div>

        {/* Action Suite */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Bulk Import (CSV / Aiken)</span>
          </button>

          <Link
            href={`/examiner/banks/${bank.id}/new-question`}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Author Question</span>
          </Link>

          <button
            onClick={() => {
              setIsDeleteModalOpen(true);
              setErrorMessage(null);
            }}
            title="Delete Question Repository"
            className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete Bank</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between text-xs shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 p-1 rounded hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* High-Density KPI Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Questions
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{totalCount}</span>
              <span className="text-[11px] text-slate-500 font-medium">In Bank</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <FileQuestion className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Universal Common
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{commonCount}</span>
              <span className="text-[11px] text-indigo-700 font-medium">Cross-Dept</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Dept-Specific
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{deptSpecificCount}</span>
              <span className="text-[11px] text-purple-700 font-medium">Bound</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Question Formats
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{Object.keys(typeCounts).length}</span>
              <span className="text-[11px] text-slate-500 font-medium">Distinct Types</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Pills, Format Dropdowns, Search & View Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Scope Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          <button
            onClick={() => setScopeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "all"
                ? "bg-indigo-50 text-indigo-950 font-bold border border-indigo-200/80 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>All Items</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-bold">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setScopeFilter("common")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "common"
                ? "bg-indigo-50 text-indigo-950 font-bold border border-indigo-200/80 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>Universal</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
              {commonCount}
            </span>
          </button>

          <button
            onClick={() => setScopeFilter("department")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "department"
                ? "bg-purple-50 text-purple-950 font-bold border border-purple-200/80 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Dept-Specific</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">
              {deptSpecificCount}
            </span>
          </button>
        </div>

        {/* Secondary Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Formats</option>
            <option value="mcq_single">Single MCQ</option>
            <option value="mcq_multiple">Multi MCQ</option>
            <option value="true_false">True / False</option>
            <option value="numerical">Numerical</option>
            <option value="fill_blank">Fill in Blank</option>
            <option value="descriptive">Descriptive</option>
            <option value="coding">Coding Execution</option>
          </select>

          {/* Department Filter (if departments exist) */}
          {departments.length > 0 && (
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600 max-w-[140px] truncate"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code ? `${d.code} - ${d.name}` : d.name}
                </option>
              ))}
            </select>
          )}

          {/* Live Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search statement, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="h-8 p-0.5 rounded-lg border border-slate-200 bg-slate-100 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Card View (Compact)"
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View (Dense)"
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Card View or Dense Table View */}
      {filteredQuestions.length > 0 ? (
        viewMode === "cards" ? (
          /* Cards View */
          <div className="space-y-3">
            {filteredQuestions.map((q, index) => {
              const content = q.content as {
                text?: string;
                latex?: string;
                codeSnippet?: string;
                programmingLanguage?: string;
              } | null;

              const options = (q.options as Array<{ id: string; text: string }>) || [];
              const correctAnswer = q.correct_answer;
              const isQCommon = q.is_common !== false;
              const dept = q.department_id ? deptMap.get(q.department_id) : null;

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>

                      {/* Scope Badge */}
                      {isQCommon ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Universal Common</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>Dept: {dept?.code || "Specialized"}</span>
                        </span>
                      )}

                      <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                        {formatTypeName(q.type)}
                      </span>

                      <span className="text-[10px] font-medium px-2 py-0.2 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                        {q.subject}
                      </span>

                      {q.topic && (
                        <span className="text-[10px] font-medium px-2 py-0.2 rounded-md bg-slate-50 border border-slate-200 text-slate-500">
                          {q.topic}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${
                          q.difficulty <= 2
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : q.difficulty === 3
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        Lvl {q.difficulty}/5
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingId === q.id}
                      title="Delete Question"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Statement */}
                  <div className="text-xs font-semibold text-slate-900 leading-relaxed">
                    {content?.text || "No question statement provided."}
                  </div>

                  {/* LaTeX Math Formula */}
                  {content?.latex && (
                    <div className="p-2.5 bg-slate-50 border border-indigo-100 rounded-lg font-mono text-xs text-indigo-950">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-0.5">
                        Mathematical Formula:
                      </span>
                      {content.latex}
                    </div>
                  )}

                  {/* Code Snippet */}
                  {content?.codeSnippet && (
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-3">
                      <div className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">
                        Starter Template ({content.programmingLanguage || "Code"}):
                      </div>
                      <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                        {content.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Option Choices */}
                  {options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {options.map((opt, optIdx) => {
                        const isCorrect =
                          Array.isArray(correctAnswer)
                            ? correctAnswer.includes(opt.id)
                            : correctAnswer === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                              isCorrect
                                ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold"
                                : "bg-slate-50/70 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-4.5 h-4.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 min-w-0 truncate">{opt.text}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation (if present) */}
                  {q.explanation && (
                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-slate-600">
                      <span className="font-bold text-indigo-900 block text-[11px] mb-0.5">
                        Rationale / Reference:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Dense Table View */
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4 w-28">Format</th>
                    <th className="py-2.5 px-4">Statement</th>
                    <th className="py-2.5 px-4 w-36">Subject / Topic</th>
                    <th className="py-2.5 px-4 w-24">Difficulty</th>
                    <th className="py-2.5 px-4 w-28">Scope</th>
                    <th className="py-2.5 px-4 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredQuestions.map((q, index) => {
                    const content = q.content as { text?: string } | null;
                    const isQCommon = q.is_common !== false;
                    const dept = q.department_id ? deptMap.get(q.department_id) : null;

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400 text-center">
                          {index + 1}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                            {formatTypeName(q.type)}
                          </span>
                        </td>

                        <td className="py-3 px-4 min-w-[280px]">
                          <div className="font-semibold text-slate-900 line-clamp-2">
                            {content?.text || "No question statement"}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{q.subject}</div>
                          {q.topic && (
                            <div className="text-[11px] text-slate-400 line-clamp-1">{q.topic}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                              q.difficulty <= 2
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : q.difficulty === 3
                                ? "bg-amber-50 border-amber-200 text-amber-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                            }`}
                          >
                            Lvl {q.difficulty}/5
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isQCommon ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 inline-flex items-center gap-1">
                              <Globe className="w-3 h-3 text-indigo-600" />
                              <span>Common</span>
                            </span>
                          ) : (
                            <span
                              title={dept ? `${dept.code || ""} - ${dept.name}` : "Department-Specific Question"}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 inline-flex items-center gap-1 cursor-help"
                            >
                              <Building2 className="w-3 h-3 text-purple-600" />
                              <span>{dept?.code || "Dept Bound"}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(q.id)}
                            disabled={deletingId === q.id}
                            title="Delete Question"
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2.5">
            <FileQuestion className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            No Questions Matching Filter Criteria
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || scopeFilter !== "all" || typeFilter !== "all" || selectedDeptId !== "all"
              ? "Try resetting your search query or adjusting scope and format filters."
              : "This question repository is currently empty. Author your first item or import via CSV/Aiken format."}
          </p>
          <div className="mt-3.5 flex items-center justify-center gap-2">
            {searchQuery || scopeFilter !== "all" || typeFilter !== "all" || selectedDeptId !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setScopeFilter("all");
                  setSelectedDeptId("all");
                  setTypeFilter("all");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                  <span>Bulk Import</span>
                </button>
                <Link
                  href={`/examiner/banks/${bank.id}/new-question`}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Author First Question</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Question Bulk Import Modal */}
      <QuestionBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        bankId={bank.id}
        bankName={bank.name}
        isCommon={bank.is_common}
        departmentId={bank.department_id}
        departments={departments}
        onSuccess={() => {
          // Modal will auto refresh
        }}
      />

      {/* Delete Question Bank Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Question Bank</h3>
                  <p className="text-[11px] text-slate-500">Permanent removal of repository</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete <strong className="font-bold text-slate-900">{bank.name}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] space-y-1">
                  <span className="font-bold">Caution:</span>
                  <p>
                    This repository currently contains{" "}
                    <strong className="font-bold text-slate-900">{questions.length} question(s)</strong>.
                    Deleting this repository will permanently delete all its questions from the database.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingBank}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeletingBank(true);
                  setErrorMessage(null);
                  try {
                    const res = await deleteQuestionBankAction(bank.id);
                    if (res.success) {
                      router.push("/examiner/banks");
                    } else {
                      setErrorMessage(res.error || "Failed to delete question bank");
                      setIsDeletingBank(false);
                    }
                  } catch (err: any) {
                    setErrorMessage(err?.message || "An unexpected error occurred while deleting.");
                    setIsDeletingBank(false);
                  }
                }}
                disabled={isDeletingBank}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingBank ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Repository</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
