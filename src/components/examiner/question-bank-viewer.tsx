"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteQuestionAction } from "@/app/actions/examiner";
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
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "common" | "department">("all");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const deptMap = new Map(departments.map((d) => [d.id, d]));

  // Statistical counts
  const totalCount = questions.length;
  const commonCount = questions.filter((q) => q.is_common !== false).length;
  const deptSpecificCount = questions.filter((q) => q.is_common === false).length;

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    // Scope filter
    const isQCommon = q.is_common !== false;
    if (scopeFilter === "common" && !isQCommon) return false;
    if (scopeFilter === "department" && isQCommon) return false;

    // Specific department filter
    if (selectedDeptId !== "all") {
      if (q.department_id !== selectedDeptId) return false;
    }

    // Type filter
    if (typeFilter !== "all" && q.type !== typeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const qText = (q.content?.text || "").toLowerCase();
      const qSubject = (q.subject || "").toLowerCase();
      const qTopic = (q.topic || "").toLowerCase();
      const term = searchQuery.toLowerCase();
      return qText.includes(term) || qSubject.includes(term) || qTopic.includes(term);
    }

    return true;
  });

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

  return (
    <div className="space-y-6">
      {/* Bank Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              Department Repository
            </span>
            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {totalCount} Total Items
            </span>
            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{commonCount} Common</span>
            </span>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50/60 px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>{deptSpecificCount} Dept-Specific</span>
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-900">{bank.name}</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {bank.description || "All items adhere to verified institutional entrance syllabus."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/examiner/banks/${bank.id}/new-question`}
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Author Question</span>
          </Link>
        </div>
      </div>

      {/* Filter and Criteria Control Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by statement, subject area, or unit topic..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>

          {/* Scope Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => setScopeFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setScopeFilter("common")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                scopeFilter === "common"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Universal ({commonCount})</span>
            </button>
            <button
              onClick={() => setScopeFilter("department")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                scopeFilter === "department"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Dept Specific ({deptSpecificCount})</span>
            </button>
          </div>
        </div>

        {/* Secondary dropdown row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Department filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Department:</span>
            </span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Academic Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Format:</span>
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Question Types</option>
              <option value="mcq_single">Single Choice MCQ</option>
              <option value="mcq_multiple">Multiple Choice MCQ</option>
              <option value="true_false">True / False</option>
              <option value="numerical">Numerical Response</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="descriptive">Descriptive / Essay</option>
              <option value="coding">Coding Execution</option>
            </select>
          </div>

          {(searchQuery || scopeFilter !== "all" || selectedDeptId !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setScopeFilter("all");
                setSelectedDeptId("all");
                setTypeFilter("all");
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-indigo-600" />
            <span>Repository Questions</span>
          </h2>
          <span className="text-xs text-slate-500">
            Showing {filteredQuestions.length} of {totalCount} active questions
          </span>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="space-y-4">
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
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-indigo-200 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                        Q{index + 1}
                      </span>

                      {/* Scope & Department Badges */}
                      {isQCommon ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Universal Common (All Candidates)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>
                            Dept: {dept?.name || "Specialized"} {dept?.code ? `(${dept.code})` : ""}
                          </span>
                        </span>
                      )}

                      <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">
                        {q.type.replace("_", " ")}
                      </span>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                        {q.subject}
                      </span>

                      {q.topic && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                          {q.topic}
                        </span>
                      )}

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                        Difficulty: {q.difficulty}/5
                      </span>

                      {q.bloom_level && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                          Bloom: {q.bloom_level}
                        </span>
                      )}
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

                  {/* Question Body */}
                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {content?.text || "No question statement provided."}
                  </div>

                  {/* LaTeX Math Formula */}
                  {content?.latex && (
                    <div className="p-3.5 bg-slate-50 border border-indigo-200/80 rounded-xl font-mono text-xs text-indigo-950">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">
                        Mathematical Formula:
                      </span>
                      {content.latex}
                    </div>
                  )}

                  {/* Code Snippet for coding questions */}
                  {content?.codeSnippet && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
                      <div className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-2">
                        Starter Template ({content.programmingLanguage || "Code"}):
                      </div>
                      <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                        {content.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Options List */}
                  {options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {options.map((opt, optIdx) => {
                        const isCorrect =
                          Array.isArray(correctAnswer)
                            ? correctAnswer.includes(opt.id)
                            : correctAnswer === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
                              isCorrect
                                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Solution Rationale */}
                  {q.explanation && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-700">
                      <span className="font-bold text-indigo-900 block mb-0.5">
                        Grading Explanation / Reference:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Questions Matching Filters
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or scope filters to locate repository questions.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setScopeFilter("all");
                  setSelectedDeptId("all");
                  setTypeFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
              >
                Clear All Filters
              </button>
              <Link
                href={`/examiner/banks/${bank.id}/new-question`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Author New Question</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
