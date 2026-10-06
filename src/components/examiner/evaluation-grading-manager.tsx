"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Clock,
  Search,
  X,
  TrendingUp,
  UserCheck,
  Building2,
  Download,
  Send,
  EyeOff,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  RefreshCw,
  MonitorOff,
  ExternalLink,
  FileText,
  Percent,
} from "lucide-react";
import {
  updateExamResultStatusAction,
  bulkUpdateExamResultsStatusAction,
  recalculateCohortScoresAndPercentilesAction,
} from "@/app/actions/examiner";
import { CandidateEvaluationDrawer } from "./candidate-evaluation-drawer";

interface GradingResultItem {
  id: string;
  assignment_id: string;
  candidate_name: string;
  candidate_department: string;
  exam_title: string;
  total_score: number;
  max_score: number;
  percentage: number;
  percentile: number | null;
  status: string;
  created_at: string;
  risk_score?: number;
  fullscreen_exits?: number;
  tab_switches?: number;
  total_flags?: number;
}

interface EvaluationGradingManagerProps {
  results: GradingResultItem[];
}

export function EvaluationGradingManager({ results }: EvaluationGradingManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "flagged">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Candidate Evaluation Drawer State
  const [selectedAssignmentIdForReview, setSelectedAssignmentIdForReview] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const totalEvaluated = results.length;
  const publishedCount = results.filter((r) => r.status === "published").length;
  const pendingReviewCount = results.filter((r) => r.status !== "published").length;
  const flaggedCount = results.filter(
    (r) => (r.total_flags || 0) > 0 || (r.fullscreen_exits || 0) > 0 || (r.tab_switches || 0) > 0
  ).length;

  const avgPercentage = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
    return Math.round((total / results.length) * 10) / 10;
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const matchesSearch =
        item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.candidate_department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.exam_title.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "published") return item.status === "published";
      if (statusFilter === "draft") return item.status !== "published";
      if (statusFilter === "flagged")
        return (item.total_flags || 0) > 0 || (item.fullscreen_exits || 0) > 0 || (item.tab_switches || 0) > 0;
      return true;
    });
  }, [results, searchQuery, statusFilter]);

  const isAllFilteredSelected =
    filteredResults.length > 0 && filteredResults.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredResults.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSingleStatus = (resultId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    setFeedback(null);

    startTransition(async () => {
      const res = await updateExamResultStatusAction(resultId, nextStatus);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            nextStatus === "published"
              ? "Scorecard published to candidate portal."
              : "Scorecard reverted to draft.",
        });
        router.refresh();
      }
    });
  };

  const handleBulkStatusChange = (status: "published" | "draft") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await bulkUpdateExamResultsStatusAction(ids, status);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Successfully ${status === "published" ? "published" : "reverted"} ${ids.length} scorecards.`,
        });
        setSelectedIds(new Set());
        router.refresh();
      }
    });
  };

  const handlePublishAllDrafts = () => {
    const draftIds = results.filter((r) => r.status !== "published").map((r) => r.id);
    if (!draftIds.length) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await bulkUpdateExamResultsStatusAction(draftIds, "published");
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Successfully published all ${draftIds.length} pending candidate scorecards.`,
        });
        setSelectedIds(new Set());
        router.refresh();
      }
    });
  };

  const handleRecalculatePercentiles = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await recalculateCohortScoresAndPercentilesAction();
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Dynamic cohort percentiles recomputed for ${res.data?.updatedCount || 0} candidate records.`,
        });
        router.refresh();
      }
    });
  };

  const handleOpenReview = (assignmentId: string) => {
    setSelectedAssignmentIdForReview(assignmentId);
    setIsDrawerOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredResults.length) return;
    const headers = [
      "Candidate Name",
      "Department",
      "Exam Title",
      "Raw Score",
      "Max Score",
      "Percentage",
      "Percentile",
      "Status",
      "Surveillance Flags",
      "Date",
    ];
    const rows = filteredResults.map((r) => [
      `"${r.candidate_name.replace(/"/g, '""')}"`,
      `"${r.candidate_department.replace(/"/g, '""')}"`,
      `"${r.exam_title.replace(/"/g, '""')}"`,
      r.total_score,
      r.max_score,
      `${r.percentage}%`,
      r.percentile !== null ? `${r.percentile}th` : "N/A",
      r.status,
      r.total_flags || 0,
      new Date(r.created_at).toISOString().split("T")[0],
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `evaluation_results_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Evaluated */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Evaluated</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalEvaluated}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Candidate submissions</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Published Results */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Published Results</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{publishedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {publishedCount > 0 ? "Released to candidates" : "No results released"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Pending Moderation */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Pending Moderation</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{pendingReviewCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting grade sign-off</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Cohort Mean Score */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Cohort Mean Score</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{avgPercentage}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Aggregate performance</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search evaluation records by candidate name, department, or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "published" | "draft" | "flagged")
            }
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
          >
            <option value="all">All Statuses ({totalEvaluated})</option>
            <option value="published">Published ({publishedCount})</option>
            <option value="draft">Pending Review ({pendingReviewCount})</option>
            {flaggedCount > 0 && (
              <option value="flagged">⚠️ Surveillance Flagged ({flaggedCount})</option>
            )}
          </select>

          {/* Recalculate Cohort Percentiles CTA */}
          <button
            onClick={handleRecalculatePercentiles}
            disabled={isPending}
            className="px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Recalculate percentile rankings across all candidates in each cohort"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">Sync Percentiles</span>
          </button>

          {/* Bulk Selection Actions (When items selected) */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg animate-in fade-in">
              <span className="text-[11px] font-bold text-indigo-700 px-1">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => handleBulkStatusChange("published")}
                disabled={isPending}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Publish</span>
              </button>
              <button
                onClick={() => handleBulkStatusChange("draft")}
                disabled={isPending}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <EyeOff className="w-3 h-3 text-slate-500" />
                <span>Revert</span>
              </button>
            </div>
          )}

          {/* 1-Click Publish All Pending CTA */}
          {pendingReviewCount > 0 && selectedIds.size === 0 && (
            <button
              onClick={handlePublishAllDrafts}
              disabled={isPending}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Release all moderated scorecards to candidate portals"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Publish All Pending ({pendingReviewCount})</span>
            </button>
          )}

          {/* Export CSV CTA */}
          <button
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download CSV report of filtered score records"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer flex items-center justify-center mx-auto"
                      title={isAllFilteredSelected ? "Deselect all" : "Select all"}
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-28">Status</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Examination Paper</th>
                  <th className="py-3 px-4 w-28">Raw Score</th>
                  <th className="py-3 px-4 w-24">Percentage</th>
                  <th className="py-3 px-4 w-24">Percentile</th>
                  <th className="py-3 px-4 w-44 text-right">Actions &amp; Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((res) => {
                  const isPublished = res.status === "published";
                  const isSelected = selectedIds.has(res.id);

                  return (
                    <tr
                      key={res.id}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(res.id);
                        }}
                      >
                        <button className="text-slate-400 hover:text-indigo-600 cursor-pointer flex items-center justify-center mx-auto">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Status */}
                      <td
                        className="py-3.5 px-3 whitespace-nowrap"
                        onClick={() => handleOpenReview(res.assignment_id)}
                      >
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Candidate */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={() => handleOpenReview(res.assignment_id)}
                      >
                        <div className="font-bold text-slate-900 hover:text-indigo-700 transition-colors">
                          {res.candidate_name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{res.candidate_department}</span>
                        </div>
                        {((res.fullscreen_exits || 0) > 0 || (res.tab_switches || 0) > 0) && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {(res.fullscreen_exits || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                                <MonitorOff className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{res.fullscreen_exits} FS</span>
                              </span>
                            )}
                            {(res.tab_switches || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                                <ExternalLink className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{res.tab_switches} Tab</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Exam */}
                      <td
                        className="py-3.5 px-4 min-w-[200px]"
                        onClick={() => handleOpenReview(res.assignment_id)}
                      >
                        <div className="font-semibold text-slate-800 line-clamp-1">{res.exam_title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Evaluated on{" "}
                          {new Date(res.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Score */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={() => handleOpenReview(res.assignment_id)}
                      >
                        <span className="font-bold text-slate-900 text-sm">{res.total_score}</span>
                        <span className="text-slate-400 font-medium"> / {res.max_score}</span>
                      </td>

                      {/* Percentage */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={() => handleOpenReview(res.assignment_id)}
                      >
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-xs">
                          {res.percentage}%
                        </span>
                      </td>

                      {/* Percentile */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold"
                        onClick={() => handleOpenReview(res.assignment_id)}
                      >
                        {res.percentile !== null ? `${res.percentile}th` : "—"}
                      </td>

                      {/* Actions: Review Script & Toggle Publish */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReview(res.assignment_id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Open detailed answer script and evaluation drawer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Evaluate</span>
                          </button>

                          <button
                            onClick={() => handleToggleSingleStatus(res.id, res.status)}
                            disabled={isPending}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                              isPublished
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
                            } disabled:opacity-50`}
                            title={isPublished ? "Revert to draft review" : "Release scorecard to candidate"}
                          >
                            {isPublished ? (
                              <EyeOff className="w-3 h-3 text-slate-500" />
                            ) : (
                              <Send className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>{isPublished ? "Revert" : "Publish"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2.5">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Score Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "No evaluation records found matching your filter criteria. Try adjusting or clearing filters."
                : "Once candidates complete scheduled exams, auto-tabulated score sheets and evaluation data will appear here."}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <div className="mt-3.5">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Detailed Candidate Evaluation & Script Review Drawer */}
      <CandidateEvaluationDrawer
        assignmentId={selectedAssignmentIdForReview}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAssignmentIdForReview(null);
        }}
        onGradingUpdated={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
