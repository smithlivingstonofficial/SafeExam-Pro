"use client";

import { useState, useEffect, useTransition } from "react";
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Building2,
  Mail,
  ShieldAlert,
  Send,
  EyeOff,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Percent,
  TrendingUp,
  Layers,
  HelpCircle,
  ExternalLink,
  MonitorOff,
  Code,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  getDetailedCandidateSubmissionAction,
  updateCandidateManualGradeAction,
  updateExamResultStatusAction,
  CandidateSubmissionDetails,
  QuestionReviewItem,
} from "@/app/actions/examiner";

interface CandidateEvaluationDrawerProps {
  assignmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onGradingUpdated?: () => void;
}

export function CandidateEvaluationDrawer({
  assignmentId,
  isOpen,
  onClose,
  onGradingUpdated,
}: CandidateEvaluationDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [details, setDetails] = useState<CandidateSubmissionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab: "script" | "surveillance" | "moderation"
  const [activeTab, setActiveTab] = useState<"script" | "surveillance" | "moderation">("script");
  const [scriptFilter, setScriptFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");

  // Local overrides state: questionId -> modified mark
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, number>>({});
  const [questionComments, setQuestionComments] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState("");

  // Load details whenever assignmentId changes
  useEffect(() => {
    if (!isOpen || !assignmentId) {
      setDetails(null);
      setScoreOverrides({});
      setQuestionComments({});
      setOverallFeedback("");
      setError(null);
      setSuccessMsg(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getDetailedCandidateSubmissionAction(assignmentId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setDetails(res.data);
          // Preload existing marks
          const overrides: Record<string, number> = {};
          res.data.questions.forEach((q) => {
            overrides[q.questionId] = q.awardedMarks;
          });
          setScoreOverrides(overrides);
          setOverallFeedback(res.data.examinerFeedback || "");
        } else {
          setError(res.error || "Failed to load candidate submission details.");
        }
      })
      .catch(() => {
        if (isMounted) setError("Network error retrieving examination details.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [assignmentId, isOpen]);

  if (!isOpen) return null;

  // Calculate live modified total score & percentage
  const liveTotalScore = details
    ? details.questions.reduce((sum, q) => {
        const mark = typeof scoreOverrides[q.questionId] === "number" ? scoreOverrides[q.questionId] : q.awardedMarks;
        return sum + mark;
      }, 0)
    : 0;

  const liveMaxScore = details?.maxScore || 1;
  const livePercentage = Math.max(0, Math.round((liveTotalScore / liveMaxScore) * 1000) / 10);

  const handleScoreChange = (qId: string, val: string) => {
    const num = parseFloat(val);
    setScoreOverrides((prev) => ({
      ...prev,
      [qId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveEvaluation = (publishStatus?: "draft" | "published") => {
    if (!details) return;
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await updateCandidateManualGradeAction({
        resultId: details.resultId,
        assignmentId: details.assignmentId,
        questionScores: scoreOverrides,
        questionComments,
        overallFeedback,
        status: publishStatus || (details.status as any),
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          publishStatus === "published"
            ? "Scorecard finalized and published to candidate portal!"
            : "Marks and moderation remarks saved successfully."
        );
        if (publishStatus) {
          setDetails((prev) => (prev ? { ...prev, status: publishStatus } : null));
        }
        onGradingUpdated?.();
      }
    });
  };

  const handleTogglePublish = (nextStatus: "published" | "draft") => {
    if (!details?.resultId) return;
    startTransition(async () => {
      const res = await updateExamResultStatusAction(details.resultId, nextStatus);
      if (res.error) {
        setError(res.error);
      } else {
        setDetails((prev) => (prev ? { ...prev, status: nextStatus } : null));
        setSuccessMsg(nextStatus === "published" ? "Scorecard released to candidate." : "Scorecard reverted to draft.");
        onGradingUpdated?.();
      }
    });
  };

  // Filtered questions
  const filteredQuestions = (details?.questions || []).filter((q) => {
    if (scriptFilter === "all") return true;
    if (scriptFilter === "correct") return q.isCorrect;
    if (scriptFilter === "incorrect") return q.isAttempted && !q.isCorrect;
    if (scriptFilter === "unattempted") return !q.isAttempted;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  {details?.candidateName || "Candidate Evaluation"}
                </h2>
                {details?.candidateDepartment && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                    {details.candidateDepartment}
                  </span>
                )}
                {details?.status === "published" ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Published
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Draft Review
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 truncate mt-0.5">
                <span className="truncate">{details?.examTitle || "Entrance Exam"}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">{details?.assignmentId.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            title="Close Evaluation Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Retrieving candidate answer script & surveillance logs...</p>
            </div>
          </div>
        ) : details ? (
          <>
            {/* KPI Performance Header Strip */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              {/* Raw Score */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Raw Score</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {liveTotalScore}{" "}
                  <span className="text-xs font-normal text-slate-400">/ {liveMaxScore}</span>
                </div>
              </div>

              {/* Percentage */}
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Percentage</div>
                <div className="text-lg font-extrabold text-indigo-900 mt-0.5">{livePercentage}%</div>
              </div>

              {/* Percentile Rank */}
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80">
                <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Cohort Percentile</div>
                <div className="text-lg font-extrabold text-purple-900 mt-0.5">
                  {details.percentile !== null ? `${details.percentile}th` : "Pending Cohort"}
                </div>
              </div>

              {/* Proctor Surveillance */}
              <div
                className={`p-2.5 rounded-xl border ${
                  details.proctoring.riskScore > 30 || details.proctoring.fullscreenExits > 0 || details.proctoring.tabSwitches > 0
                    ? "bg-rose-50 border-rose-200"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Surveillance</span>
                  <span className="font-extrabold">{details.proctoring.riskScore}% Risk</span>
                </div>
                <div className="text-xs font-bold mt-1 text-slate-800 flex items-center gap-1.5 flex-wrap">
                  {details.proctoring.fullscreenExits > 0 && (
                    <span className="text-[10px] text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                      {details.proctoring.fullscreenExits} FS Exits
                    </span>
                  )}
                  {details.proctoring.tabSwitches > 0 && (
                    <span className="text-[10px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      {details.proctoring.tabSwitches} Tabs
                    </span>
                  )}
                  {details.proctoring.fullscreenExits === 0 && details.proctoring.tabSwitches === 0 && (
                    <span className="text-emerald-700 text-[11px] font-semibold">Clean Surveillance</span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 -mb-px">
                <button
                  onClick={() => setActiveTab("script")}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "script"
                      ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Answer Script ({details.questions.length} Qs)</span>
                </button>

                <button
                  onClick={() => setActiveTab("surveillance")}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "surveillance"
                      ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Proctoring Audit ({details.proctoring.totalFlags} Logs)</span>
                </button>

                <button
                  onClick={() => setActiveTab("moderation")}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "moderation"
                      ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Section Scores &amp; Sign-off</span>
                </button>
              </div>

              {activeTab === "script" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Filter:</span>
                  <select
                    value={scriptFilter}
                    onChange={(e) => setScriptFilter(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="all">All Questions ({details.questions.length})</option>
                    <option value="correct">
                      Correct Only ({details.questions.filter((q) => q.isCorrect).length})
                    </option>
                    <option value="incorrect">
                      Incorrect ({details.questions.filter((q) => q.isAttempted && !q.isCorrect).length})
                    </option>
                    <option value="unattempted">
                      Unattempted ({details.questions.filter((q) => !q.isAttempted).length})
                    </option>
                  </select>
                </div>
              )}
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: ANSWER SCRIPT */}
              {activeTab === "script" && (
                <div className="space-y-4">
                  {filteredQuestions.map((q, idx) => {
                    const currentAwarded =
                      typeof scoreOverrides[q.questionId] === "number"
                        ? scoreOverrides[q.questionId]
                        : q.awardedMarks;

                    return (
                      <div
                        key={q.questionId}
                        className={`bg-white border rounded-xl p-5 shadow-2xs space-y-4 transition-all ${
                          q.isCorrect
                            ? "border-emerald-200/90"
                            : q.isAttempted
                            ? "border-rose-200/90"
                            : "border-slate-200"
                        }`}
                      >
                        {/* Question Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                              {q.orderIndex || idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{q.sectionTitle}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500 font-medium">{q.subject}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {q.isCorrect ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Correct (+{q.maxMarks})
                              </span>
                            ) : q.isAttempted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" /> Incorrect (-{q.negativeMarks})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Unattempted (0)
                              </span>
                            )}

                            {/* Manual Marks Input */}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Marks:</span>
                              <input
                                type="number"
                                step="0.5"
                                value={currentAwarded}
                                onChange={(e) => handleScoreChange(q.questionId, e.target.value)}
                                className="w-14 text-xs font-extrabold text-indigo-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-600"
                              />
                              <span className="text-[10px] text-slate-400">/ {q.maxMarks}</span>
                            </div>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                            {q.questionText}
                          </p>
                          {q.codeSnippet && (
                            <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                              <code>{q.codeSnippet}</code>
                            </pre>
                          )}
                        </div>

                        {/* Options List (for MCQ types) */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Options &amp; Candidate Selection
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt) => {
                                const isChosen =
                                  q.selectedOptionId === opt.id ||
                                  (q.selectedOptionIds && q.selectedOptionIds.includes(opt.id));
                                const isOptCorrect = opt.isCorrect || q.correctOptionId === opt.id;

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 transition-all ${
                                      isChosen && isOptCorrect
                                        ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200 text-emerald-950 font-bold"
                                        : isChosen && !isOptCorrect
                                        ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 text-rose-950 font-bold"
                                        : isOptCorrect
                                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 font-semibold"
                                        : "bg-slate-50 border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 shrink-0">
                                        {opt.id}
                                      </span>
                                      <span className="leading-snug">{opt.text}</span>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1">
                                      {isChosen && (
                                        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                                          Chosen
                                        </span>
                                      )}
                                      {isOptCorrect && (
                                        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                          Key
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Numerical / Typed Value */}
                        {q.type === "numerical" && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Candidate Response:</span>
                              <strong className="font-mono text-slate-900">
                                {q.numericalValue || "None provided"}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-emerald-800">
                              <span>Official Accepted Value:</span>
                              <strong className="font-mono">{q.correctNumericValue ?? "Exact match"}</strong>
                            </div>
                          </div>
                        )}

                        {/* Explanation Note */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
                            <strong className="text-indigo-800 block mb-0.5 text-[10px] uppercase font-bold">
                              Marking Scheme Explanation:
                            </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: PROCTORING & SURVEILLANCE */}
              {activeTab === "surveillance" && (
                <div className="space-y-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-700" />
                      <span>Surveillance Risk Assessment</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <div className="text-[10px] font-semibold text-slate-500">Risk Score</div>
                        <div
                          className={`text-xl font-extrabold ${
                            details.proctoring.riskScore > 30 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {details.proctoring.riskScore}%
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <div className="text-[10px] font-semibold text-slate-500">Fullscreen Exits</div>
                        <div className="text-xl font-extrabold text-slate-900">
                          {details.proctoring.fullscreenExits}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <div className="text-[10px] font-semibold text-slate-500">Tab / Focus Switches</div>
                        <div className="text-xl font-extrabold text-slate-900">
                          {details.proctoring.tabSwitches}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Incident Log Timeline */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Surveillance Flag Logs ({details.proctoring.flags.length})
                    </h4>
                    {details.proctoring.flags.length > 0 ? (
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {details.proctoring.flags.map((f, fIdx) => (
                          <div key={fIdx} className="p-3 text-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {f.type === "FULLSCREEN_EXIT" ? (
                                <MonitorOff className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR" ? (
                                <ExternalLink className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-slate-900">{f.type}</span>
                                {f.message && <p className="text-[11px] text-slate-500 mt-0.5">{f.message}</p>}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {new Date(f.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-semibold">
                        No surveillance flags recorded during this examination session.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SECTION BREAKDOWN & MODERATION */}
              {activeTab === "moderation" && (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Curriculum Section Breakdown
                    </h3>
                    <div className="divide-y divide-slate-100">
                      {Object.entries(details.sectionScores).map(([secId, sec]) => (
                        <div key={secId} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{sec.title}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-700">
                              {sec.score} / {sec.maxScore}
                            </span>
                            <span className="text-slate-400 text-[10px] block">
                              {sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examiner Feedback Textarea */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-2xs">
                    <label className="text-xs font-bold text-slate-900 block">
                      Institutional Faculty Moderation Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={overallFeedback}
                      onChange={(e) => setOverallFeedback(e.target.value)}
                      placeholder="Add examiner sign-off comments, verification notes, or special considerations..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white bg-slate-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-600">
                  Moderated Total:{" "}
                  <strong className="text-sm font-extrabold text-slate-900">
                    {liveTotalScore} / {liveMaxScore}
                  </strong>{" "}
                  <span className="text-indigo-700 font-bold">({livePercentage}%)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveEvaluation()}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Draft Marks</span>
                </button>

                {details.status === "published" ? (
                  <button
                    onClick={() => handleTogglePublish("draft")}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Revert to Draft</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveEvaluation("published")}
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Publish Scorecard</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
