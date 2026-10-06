"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  MessageSquare,
  Send,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Wrench,
  Wifi,
  Video,
  FileQuestion,
  UserCheck,
  BellRing,
} from "lucide-react";
import {
  submitCandidateQueryAction,
  getCandidateQueriesAction,
  CandidateQueryItem,
} from "@/app/actions/exam";

interface ExamQueryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  candidateName: string;
  currentQuestionNumber?: number;
  onUnreadCountChange?: (count: number) => void;
}

export function ExamQueryDrawer({
  isOpen,
  onClose,
  assignmentId,
  candidateName,
  currentQuestionNumber = 1,
  onUnreadCountChange,
}: ExamQueryDrawerProps) {
  const [queries, setQueries] = useState<CandidateQueryItem[]>([]);
  const [category, setCategory] = useState<
    "technical" | "question_clarity" | "audio_video" | "connectivity" | "general"
  >("technical");
  const [message, setMessage] = useState("");
  const [includeQuestionRef, setIncludeQuestionRef] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch existing queries
  const loadQueries = useCallback(async () => {
    try {
      const res = await getCandidateQueriesAction(assignmentId);
      if (res.success && res.data) {
        setQueries(res.data);
        // Calculate unread resolved replies (e.g. resolved queries)
        const resolvedCount = res.data.filter((q) => q.status === "resolved").length;
        if (onUnreadCountChange) {
          onUnreadCountChange(resolvedCount);
        }
      }
    } catch {
      // quiet fallback
    }
  }, [assignmentId, onUnreadCountChange]);

  useEffect(() => {
    loadQueries();
    // Poll every 4 seconds for real-time proctor replies
    const timer = setInterval(() => {
      loadQueries();
    }, 4000);
    return () => clearInterval(timer);
  }, [loadQueries]);

  // Quick preset template chips
  const presets = [
    {
      label: `Question #${currentQuestionNumber} statement / formula clarification`,
      category: "question_clarity" as const,
      text: `Need clarification on Question #${currentQuestionNumber}. The equation/options formatting needs confirmation.`,
    },
    {
      label: "Calculator / input lag issue",
      category: "technical" as const,
      text: "Experiencing interface lag while using the CBT input controls. Please note for time tracking.",
    },
    {
      label: "Network or audio warning check",
      category: "connectivity" as const,
      text: "Received a brief network latency flag; my internet is now stable. Requesting verification.",
    },
    {
      label: "General invigilator assistance",
      category: "general" as const,
      text: "Requesting guidance from the university invigilator regarding exam instructions.",
    },
  ];

  // Submit query handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    startTransition(async () => {
      try {
        const res = await submitCandidateQueryAction({
          assignmentId,
          category,
          questionNumber: includeQuestionRef ? currentQuestionNumber : undefined,
          message: message.trim(),
        });

        if (res.success && res.data) {
          setQueries((prev) => [...prev, res.data!]);
          setMessage("");
          setSubmitSuccess("Query transmitted to official invigilator desk.");
          setTimeout(() => setSubmitSuccess(null), 4000);
        } else {
          setSubmitError(res.error || "Could not transmit query. Please try again.");
        }
      } catch {
        setSubmitError("Network connection glitch. Please retry.");
      }
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-lg h-full flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250">
        {/* 1. Header */}
        <div className="h-16 px-6 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Official Support &amp; Queries Desk
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Live communication with exam invigilators &amp; IT officials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                await loadQueries();
                setIsRefreshing(false);
              }}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Thread & Messages History */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/40">
          {/* Security Notice Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-[11px] text-indigo-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All messages are audited by the <strong>University Examination Committee</strong>. Officials will respond directly within this live console. Answers to exam questions cannot be provided.
            </p>
          </div>

          {/* Queries Thread History */}
          <div className="space-y-3.5">
            {queries.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Inquiries Raised</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  If you experience any technical glitches, formula rendering issues, or need invigilator clarification, use the form below to contact officials.
                </p>
              </div>
            ) : (
              queries.map((q) => {
                const isResolved = q.status === "resolved";
                const isProgress = q.status === "in_progress";

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                  >
                    {/* Query Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {q.category.replace("_", " ")}
                        </span>
                        {q.questionNumber && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            Q#{q.questionNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        {isResolved ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolved</span>
                          </span>
                        ) : isProgress ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Waiting for Official</span>
                          </span>
                        )}
                        <span className="text-slate-400 font-normal">
                          {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Candidate Message */}
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {q.message}
                    </p>

                    {/* Official Response Box (if replied) */}
                    {q.responseMessage && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{q.resolvedByName || "Official Invigilator Desk"}</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 text-[9px]">
                              Official Reply
                            </span>
                          </div>
                          {q.resolvedAt && (
                            <span className="text-emerald-700 font-mono">
                              {new Date(q.resolvedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-950 font-semibold leading-relaxed">
                          &ldquo;{q.responseMessage}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. New Query Submission Form */}
        <div className="p-5 border-t border-slate-200 bg-white space-y-3 shrink-0">
          {submitError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Quick Preset Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Inquiries:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCategory(p.category);
                    setMessage(p.text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Category Selectors */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setCategory("technical")}
                className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === "technical"
                    ? "bg-indigo-700 text-white border-indigo-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>Technical</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("question_clarity")}
                className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === "question_clarity"
                    ? "bg-indigo-700 text-white border-indigo-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <FileQuestion className="w-3 h-3" />
                <span>Question</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("connectivity")}
                className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === "connectivity"
                    ? "bg-indigo-700 text-white border-indigo-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Wifi className="w-3 h-3" />
                <span>Network</span>
              </button>
            </div>

            {/* Input Message Area */}
            <div className="relative">
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or inquiry for the official invigilator desk..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 leading-relaxed resize-none"
              />
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeQuestionRef}
                  onChange={(e) => setIncludeQuestionRef(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-700 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Attach Current Question (Q#{currentQuestionNumber})</span>
              </label>

              <button
                type="submit"
                disabled={isPending || !message.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPending ? "Transmitting..." : "Send Query"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
