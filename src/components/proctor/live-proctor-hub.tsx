"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  AlertTriangle,
  Send,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  X,
  Search,
  Users,
  Eye,
  Radio,
  Clock,
  Building2,
  FileText,
  Loader2,
  Volume2,
  Filter,
  Maximize2,
  RefreshCw,
  Info,
  MonitorOff,
  ExternalLink,
  Layers,
  MessageSquare,
  HelpCircle,
  UserCheck,
  Wrench,
  FileQuestion,
  Check,
  User,
  Sparkles,
  Wifi,
  Video,
  CornerDownRight,
  ShieldAlert,
} from "lucide-react";
import {
  sendProctorWarningAction,
  terminateExamSessionAction,
  respondToCandidateQueryAction,
  getAllActiveQueriesAction,
  CandidateQueryItem,
} from "@/app/actions/exam";

export interface ProctorCandidateFeed {
  assignmentId: string;
  candidateId: string;
  candidateName: string;
  candidateDepartment: string;
  candidateEmail?: string;
  startedAt: string | null;
  riskScore: number;
  flags: Array<{
    type: string;
    message?: string;
    timestamp: string;
    issuedBy?: string;
    reason?: string;
    details?: Record<string, unknown>;
  }>;
}

interface LiveProctorHubProps {
  candidates: ProctorCandidateFeed[];
  universityName: string;
  proctorName: string;
}

const PRESET_WARNINGS = [
  "Please keep your eyes focused on the computer screen.",
  "Fullscreen perimeter lost! Return to full screen exam immediately.",
  "Tab or window navigation detected. Return focus to test immediately.",
  "Suspicious movement or unauthorized person detected in surroundings.",
  "Background audio or conversation detected. Please maintain silence.",
  "External device or unauthorized material observed.",
];

const TERMINATION_REASONS = [
  "Repeated fullscreen perimeter exits after formal warning.",
  "Repeated unauthorized tab / application switching.",
  "Multiple people assisting or communicating in testing room.",
  "Use of unauthorized mobile phone, secondary screen, or materials.",
  "Failure to comply with invigilator instructions.",
];

const PRESET_QUERY_REPLIES = [
  "We have noted your issue. It is logged with the exam committee; please continue answering.",
  "The formula and question statement have been verified. Please proceed.",
  "Your camera and connection status are verified active on our proctor console.",
  "An exam invigilator has been notified and is attending to your station.",
  "Please re-read the question carefully; hints or answers cannot be provided.",
];

export function LiveProctorHub({ candidates, universityName, proctorName }: LiveProctorHubProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Primary Hub Tab: Surveillance Grid vs Support Desk
  const [activeHubTab, setActiveHubTab] = useState<"surveillance" | "queries">("surveillance");

  // Surveillance Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "high_risk" | "fullscreen_violators" | "tab_switchers">("all");

  // Queries Support Desk State
  const [allQueries, setAllQueries] = useState<CandidateQueryItem[]>([]);
  const [queryFilter, setQueryFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [queryCategoryFilter, setQueryCategoryFilter] = useState<string>("all");
  const [querySearch, setQuerySearch] = useState("");
  const [isRefreshingQueries, setIsRefreshingQueries] = useState(false);

  // Interactive Modal States
  const [activeWarningCandidate, setActiveWarningCandidate] = useState<ProctorCandidateFeed | null>(null);
  const [warningText, setWarningText] = useState("");
  const [activeTerminateCandidate, setActiveTerminateCandidate] = useState<ProctorCandidateFeed | null>(null);
  const [terminateReason, setTerminateReason] = useState(TERMINATION_REASONS[0]);
  const [activeLogsCandidate, setActiveLogsCandidate] = useState<ProctorCandidateFeed | null>(null);
  const [incidentCategoryFilter, setIncidentCategoryFilter] = useState<"all" | "fullscreen" | "tabs" | "other">("all");

  // Focus modal state (enlarged live view)
  const [focusedCandidate, setFocusedCandidate] = useState<ProctorCandidateFeed | null>(null);

  // Query Reply Modal State
  const [activeReplyQuery, setActiveReplyQuery] = useState<CandidateQueryItem | null>(null);
  const [replyText, setReplyText] = useState("");

  // Global toast feedback
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Poll real-time queries from database / proctoring sessions every 4 seconds
  const fetchQueries = useCallback(async () => {
    try {
      const res = await getAllActiveQueriesAction();
      if (res.success && res.data) {
        setAllQueries(res.data);
      }
    } catch {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 4000);
    return () => clearInterval(interval);
  }, [fetchQueries]);

  // Helper metrics per candidate
  const candidateStats = useMemo(() => {
    return new Map(
      candidates.map((c) => {
        const fsCount = c.flags.filter((f) => f.type === "FULLSCREEN_EXIT").length;
        const tabCount = c.flags.filter((f) => f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR").length;
        const otherCount = c.flags.filter(
          (f) =>
            f.type !== "FULLSCREEN_EXIT" &&
            f.type !== "TAB_SWITCH" &&
            f.type !== "WINDOW_BLUR" &&
            f.type !== "PROCTOR_WARNING" &&
            f.type !== "TERMINATED_BY_PROCTOR"
        ).length;

        return [c.assignmentId, { fsCount, tabCount, otherCount, totalFlags: c.flags.length }];
      })
    );
  }, [candidates]);

  // Map of candidate assignmentId -> list of active queries
  const candidateQueriesMap = useMemo(() => {
    const map = new Map<string, CandidateQueryItem[]>();
    for (const q of allQueries) {
      const current = map.get(q.assignmentId) || [];
      current.push(q);
      map.set(q.assignmentId, current);
    }
    return map;
  }, [allQueries]);

  const openQueriesCount = useMemo(() => {
    return allQueries.filter((q) => q.status === "open" || q.status === "in_progress").length;
  }, [allQueries]);

  const totalActive = candidates.length;
  const highRiskCount = candidates.filter((c) => c.riskScore >= 60).length;
  const totalFullscreenExits = candidates.reduce(
    (acc, c) => acc + (candidateStats.get(c.assignmentId)?.fsCount || 0),
    0
  );
  const totalTabSwitches = candidates.reduce(
    (acc, c) => acc + (candidateStats.get(c.assignmentId)?.tabCount || 0),
    0
  );

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const stats = candidateStats.get(c.assignmentId) || { fsCount: 0, tabCount: 0, otherCount: 0, totalFlags: 0 };
      const matchesSearch =
        c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.candidateDepartment.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterMode === "high_risk") return c.riskScore >= 60;
      if (filterMode === "fullscreen_violators") return stats.fsCount > 0;
      if (filterMode === "tab_switchers") return stats.tabCount > 0;
      return true;
    });
  }, [candidates, searchQuery, filterMode, candidateStats]);

  // Filtered queries list
  const filteredQueries = useMemo(() => {
    return allQueries.filter((q) => {
      const matchesSearch =
        (q.candidateName || "").toLowerCase().includes(querySearch.toLowerCase()) ||
        (q.candidateDepartment || "").toLowerCase().includes(querySearch.toLowerCase()) ||
        q.message.toLowerCase().includes(querySearch.toLowerCase()) ||
        (q.questionNumber && `q${q.questionNumber}`.includes(querySearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (queryFilter === "open") return q.status === "open";
      if (queryFilter === "in_progress") return q.status === "in_progress";
      if (queryFilter === "resolved") return q.status === "resolved";

      if (queryCategoryFilter !== "all" && q.category !== queryCategoryFilter) return false;

      return true;
    });
  }, [allQueries, querySearch, queryFilter, queryCategoryFilter]);

  const handleSendWarning = () => {
    if (!activeWarningCandidate || !warningText.trim()) return;

    startTransition(async () => {
      const res = await sendProctorWarningAction(activeWarningCandidate.assignmentId, warningText.trim());
      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: `Official warning transmitted directly to ${activeWarningCandidate.candidateName}'s exam screen.`,
        });
        setActiveWarningCandidate(null);
        setWarningText("");
        router.refresh();
      }
    });
  };

  const handleTerminateSession = () => {
    if (!activeTerminateCandidate || !terminateReason.trim()) return;

    startTransition(async () => {
      const res = await terminateExamSessionAction(activeTerminateCandidate.assignmentId, terminateReason);
      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: `Examination session terminated and locked for ${activeTerminateCandidate.candidateName}.`,
        });
        setActiveTerminateCandidate(null);
        router.refresh();
      }
    });
  };

  const handleSendQueryReply = (targetStatus: "resolved" | "in_progress") => {
    if (!activeReplyQuery || !replyText.trim()) return;

    startTransition(async () => {
      const res = await respondToCandidateQueryAction({
        queryId: activeReplyQuery.id,
        assignmentId: activeReplyQuery.assignmentId,
        responseMessage: replyText.trim(),
        status: targetStatus,
      });

      if (res.error) {
        setToast({ type: "error", message: res.error });
      } else {
        setToast({
          type: "success",
          message: `Response transmitted to ${activeReplyQuery.candidateName || "candidate"} (${targetStatus === "resolved" ? "Marked Resolved" : "In Progress"}).`,
        });
        // Optimistically update local queries
        setAllQueries((prev) =>
          prev.map((q) =>
            q.id === activeReplyQuery.id
              ? {
                  ...q,
                  status: targetStatus,
                  responseMessage: replyText.trim(),
                  resolvedAt: new Date().toISOString(),
                  resolvedByName: proctorName,
                }
              : q
          )
        );
        setActiveReplyQuery(null);
        setReplyText("");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 5 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Supervised Feeds */}
        <div
          onClick={() => setActiveHubTab("surveillance")}
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            activeHubTab === "surveillance"
              ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Supervised Feeds
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalActive}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Candidate Support Queries */}
        <div
          onClick={() => setActiveHubTab("queries")}
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            activeHubTab === "queries"
              ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-300"
              : openQueriesCount > 0
              ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-200"
              : "bg-white border-slate-200/80 hover:border-blue-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
              <span>Candidate Desk</span>
              {openQueriesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-0.5">
              {openQueriesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {openQueriesCount === 1 ? "1 Open inquiry" : `${openQueriesCount} Open inquiries`}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            openQueriesCount > 0
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : "bg-blue-50 text-blue-700 border-blue-100"
          }`}>
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Fullscreen Exits Total */}
        <div
          onClick={() => {
            setActiveHubTab("surveillance");
            setFilterMode(filterMode === "fullscreen_violators" ? "all" : "fullscreen_violators");
          }}
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            filterMode === "fullscreen_violators" && activeHubTab === "surveillance"
              ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-300"
              : "bg-white border-slate-200/80 hover:border-rose-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-rose-700">
              Fullscreen Exits
            </div>
            <div className="text-2xl font-bold text-rose-800 mt-0.5">
              {totalFullscreenExits}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Perimeter breach flags
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
            <MonitorOff className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Tab Switches Total */}
        <div
          onClick={() => {
            setActiveHubTab("surveillance");
            setFilterMode(filterMode === "tab_switchers" ? "all" : "tab_switchers");
          }}
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            filterMode === "tab_switchers" && activeHubTab === "surveillance"
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-300"
              : "bg-white border-slate-200/80 hover:border-amber-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-amber-700">
              Tab / Window Switches
            </div>
            <div className="text-2xl font-bold text-amber-800 mt-0.5">
              {totalTabSwitches}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Focus blur events
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <ExternalLink className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 5: Elevated Risk Alert */}
        <div
          onClick={() => {
            setActiveHubTab("surveillance");
            setFilterMode(filterMode === "high_risk" ? "all" : "high_risk");
          }}
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all col-span-2 lg:col-span-1 ${
            filterMode === "high_risk" && activeHubTab === "surveillance"
              ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-300"
              : "bg-white border-slate-200/80 hover:border-purple-200"
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-purple-700">
              High Risk (&gt;60%)
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-0.5">
              {highRiskCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Require intervention
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveHubTab("surveillance")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeHubTab === "surveillance"
                ? "bg-indigo-700 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Surveillance Mosaic ({totalActive})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab("queries")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeHubTab === "queries"
                ? "bg-indigo-700 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Candidate Support Desk</span>
            {openQueriesCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeHubTab === "queries"
                  ? "bg-white text-indigo-700"
                  : "bg-amber-500 text-white animate-pulse"
              }`}>
                {openQueriesCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              setIsRefreshingQueries(true);
              await fetchQueries();
              router.refresh();
              setIsRefreshingQueries(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Sync all feeds and queries"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshingQueries ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync All</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LIVE SURVEILLANCE MOSAIC */}
      {activeHubTab === "surveillance" && (
        <div className="space-y-6">
          {/* Search & Actions Toolbar Container */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Inner Search Input */}
            <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search active feeds by candidate name or department..."
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as typeof filterMode)}
                className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
              >
                <option value="all">All Candidates ({totalActive})</option>
                <option value="fullscreen_violators">Fullscreen Exits ({candidates.filter((c) => (candidateStats.get(c.assignmentId)?.fsCount || 0) > 0).length})</option>
                <option value="tab_switchers">Tab Switches ({candidates.filter((c) => (candidateStats.get(c.assignmentId)?.tabCount || 0) > 0).length})</option>
                <option value="high_risk">High Risk (&gt;60%) ({highRiskCount})</option>
              </select>
            </div>
          </div>

          {/* Video Mosaic Grid */}
          {filteredCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCandidates.map((c) => {
                const risk = c.riskScore;
                const stats = candidateStats.get(c.assignmentId) || { fsCount: 0, tabCount: 0, otherCount: 0, totalFlags: 0 };
                const isHighRisk = risk >= 60;
                const isMediumRisk = risk >= 30 && risk < 60;

                const candidateQueries = candidateQueriesMap.get(c.assignmentId) || [];
                const candidateOpenQueries = candidateQueries.filter((q) => q.status === "open" || q.status === "in_progress");

                const startedTime = c.startedAt
                  ? new Date(c.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Just now";

                return (
                  <div
                    key={c.assignmentId}
                    className={`bg-white border rounded-2xl overflow-hidden shadow-2xs transition-all ${
                      candidateOpenQueries.length > 0
                        ? "border-blue-400 ring-2 ring-blue-100"
                        : isHighRisk
                        ? "border-rose-300 ring-1 ring-rose-200"
                        : isMediumRisk
                        ? "border-amber-300 ring-1 ring-amber-100"
                        : "border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Video Window Preview */}
                    <div className="h-44 bg-slate-900 relative flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                      <div className="absolute inset-0 bg-radial from-slate-800 to-slate-950 opacity-90" />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 mb-1.5 shadow-inner">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300">
                          {c.candidateName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          720p HD • Live Stream
                        </span>
                      </div>

                      {/* Badges on Video */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </div>

                      {/* Risk Score Pill */}
                      <div
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 shadow-xs ${
                          isHighRisk
                            ? "bg-rose-600 text-white"
                            : isMediumRisk
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-700 text-white"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Risk {risk}%</span>
                      </div>

                      {/* Expand Preview CTA */}
                      <button
                        onClick={() => setFocusedCandidate(c)}
                        className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                        title="Enlarge Video Stream"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Candidate Info & Controls */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">
                            {c.candidateName}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{c.candidateDepartment}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Started
                          </span>
                          <div className="text-xs font-semibold text-slate-700">
                            {startedTime}
                          </div>
                        </div>
                      </div>

                      {/* PENDING QUERY BANNER IF CANDIDATE RAISED A QUERY */}
                      {candidateOpenQueries.length > 0 && (
                        <div
                          onClick={() => {
                            const latest = candidateOpenQueries[candidateOpenQueries.length - 1];
                            setActiveReplyQuery(latest);
                            setReplyText(PRESET_QUERY_REPLIES[0]);
                          }}
                          className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-700 shrink-0" />
                            <div className="text-left">
                              <span className="text-xs font-bold block">
                                {candidateOpenQueries.length === 1 ? "1 Candidate Query Pending" : `${candidateOpenQueries.length} Queries Pending`}
                              </span>
                              <span className="text-[10px] text-blue-700 line-clamp-1">
                                &ldquo;{candidateOpenQueries[0].message}&rdquo;
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-md bg-blue-700 text-white text-[10px] font-bold shrink-0">
                            Reply
                          </span>
                        </div>
                      )}

                      {/* SEPARATE FLAG METRICS: Fullscreen vs Tab Switches */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => {
                            setActiveLogsCandidate(c);
                            setIncidentCategoryFilter("fullscreen");
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                            stats.fsCount > 0
                              ? "bg-rose-50/80 border-rose-200 text-rose-900 hover:bg-rose-100"
                              : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <MonitorOff className={`w-3.5 h-3.5 ${stats.fsCount > 0 ? "text-rose-600" : "text-slate-400"}`} />
                            <span className="text-[11px] font-semibold">FS Exits</span>
                          </div>
                          <span className={`text-xs font-bold ${stats.fsCount > 0 ? "text-rose-700" : "text-slate-400"}`}>
                            {stats.fsCount}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveLogsCandidate(c);
                            setIncidentCategoryFilter("tabs");
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                            stats.tabCount > 0
                              ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100"
                              : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className={`w-3.5 h-3.5 ${stats.tabCount > 0 ? "text-amber-600" : "text-slate-400"}`} />
                            <span className="text-[11px] font-semibold">Tab Switch</span>
                          </div>
                          <span className={`text-xs font-bold ${stats.tabCount > 0 ? "text-amber-700" : "text-slate-400"}`}>
                            {stats.tabCount}
                          </span>
                        </button>
                      </div>

                      {/* Incident Summary & Log Trigger */}
                      <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium">Total Flags: {stats.totalFlags}</span>
                        <button
                          onClick={() => {
                            setActiveLogsCandidate(c);
                            setIncidentCategoryFilter("all");
                          }}
                          className="font-bold text-indigo-700 hover:text-indigo-800 text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Full Log</span>
                          <Info className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Invigilator Action Toolbar */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {/* Send Warning Button */}
                        <button
                          onClick={() => {
                            setActiveWarningCandidate(c);
                            setWarningText(PRESET_WARNINGS[0]);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          title="Issue official proctor warning directly to candidate"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Warn</span>
                        </button>

                        {/* Force Disqualify Button */}
                        <button
                          onClick={() => {
                            setActiveTerminateCandidate(c);
                            setTerminateReason(TERMINATION_REASONS[0]);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          title="Disqualify and terminate candidate session"
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                          <span>Disqualify</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-14 text-center shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Active Examination Feeds
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || filterMode !== "all"
                  ? "No candidate feeds match your filter criteria. Try resetting filters."
                  : "There are currently no candidates actively executing an examination session. Surveillance feeds will initialize automatically when examinees launch tests."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CANDIDATE SUPPORT DESK (REAL-TIME QUERIES) */}
      {activeHubTab === "queries" && (
        <div className="space-y-5">
          {/* Support Desk Search and Filters */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="flex-1 bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search queries by candidate name, department, question #, or message text..."
                  value={querySearch}
                  onChange={(e) => setQuerySearch(e.target.value)}
                  className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                />
                {querySearch && (
                  <button
                    onClick={() => setQuerySearch("")}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={queryCategoryFilter}
                  onChange={(e) => setQueryCategoryFilter(e.target.value)}
                  className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="technical">Technical / Platform</option>
                  <option value="question_clarity">Question / Formula Clarity</option>
                  <option value="connectivity">Network / Connectivity</option>
                  <option value="audio_video">Camera / Audio Feed</option>
                  <option value="general">General Invigilation</option>
                </select>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filter Status:
              </span>
              <button
                onClick={() => setQueryFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  queryFilter === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                All Queries ({allQueries.length})
              </button>
              <button
                onClick={() => setQueryFilter("open")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  queryFilter === "open"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Needs Attention ({allQueries.filter((q) => q.status === "open").length})</span>
              </button>
              <button
                onClick={() => setQueryFilter("in_progress")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  queryFilter === "in_progress"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/60"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>In Progress ({allQueries.filter((q) => q.status === "in_progress").length})</span>
              </button>
              <button
                onClick={() => setQueryFilter("resolved")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  queryFilter === "resolved"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/60"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Resolved ({allQueries.filter((q) => q.status === "resolved").length})</span>
              </button>
            </div>
          </div>

          {/* Query Cards Feed */}
          {filteredQueries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQueries.map((q) => {
                const isResolved = q.status === "resolved";
                const isProgress = q.status === "in_progress";
                const isOpen = q.status === "open";

                // Matching candidate feed
                const matchingCandidate = candidates.find((c) => c.assignmentId === q.assignmentId);

                return (
                  <div
                    key={q.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 transition-all ${
                      isOpen
                        ? "border-amber-300 ring-2 ring-amber-100/60"
                        : isProgress
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-slate-200/80"
                    }`}
                  >
                    {/* Card Header: Candidate info + Status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">
                            {q.candidateName || matchingCandidate?.candidateName || "Candidate"}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {q.candidateDepartment || matchingCandidate?.candidateDepartment || "Department"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>Submitted {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                        </div>
                      </div>

                      <div>
                        {isResolved ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolved</span>
                          </span>
                        ) : isProgress ? (
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Waiting for Response</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges: Category & Question reference */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{q.category.replace("_", " ")}</span>
                      </span>
                      {q.questionNumber && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <FileQuestion className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Referencing Question #{q.questionNumber}</span>
                        </span>
                      )}
                    </div>

                    {/* Candidate's Message Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                      &ldquo;{q.message}&rdquo;
                    </div>

                    {/* Official Response Box if already replied */}
                    {q.responseMessage && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Official Invigilator Response</span>
                          </span>
                          <span className="text-emerald-700 font-normal">
                            {q.resolvedAt ? new Date(q.resolvedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <p className="text-emerald-950 font-semibold leading-relaxed">
                          {q.responseMessage}
                        </p>
                        {q.resolvedByName && (
                          <span className="text-[10px] text-emerald-700 block pt-0.5">
                            Answered by: {q.resolvedByName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Invigilator Action Toolbar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {matchingCandidate && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWarningCandidate(matchingCandidate);
                              setWarningText(PRESET_WARNINGS[0]);
                            }}
                            className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-transparent hover:border-amber-200"
                            title="Send proctor warning to this student"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Warn</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyQuery(q);
                          setReplyText(q.responseMessage || PRESET_QUERY_REPLIES[0]);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                          isResolved
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-indigo-700 hover:bg-indigo-800 text-white"
                        }`}
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>{isResolved ? "Update Response" : "Reply to Candidate"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty Queries State */
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Candidate Inquiries Matching Filters
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {querySearch || queryFilter !== "all" || queryCategoryFilter !== "all"
                  ? "No candidate queries match your search or filter settings. Try clearing active filters."
                  : "No students have submitted support queries yet. Any inquiries raised from the examination window will appear here in real-time."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Send Proctor Warning */}
      {activeWarningCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Issue Proctor Warning
                  </h3>
                  <p className="text-xs text-slate-500">
                    To: {activeWarningCandidate.candidateName} ({activeWarningCandidate.candidateDepartment})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveWarningCandidate(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Message Templates */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Select Pre-set Template
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {PRESET_WARNINGS.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setWarningText(tpl)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                      warningText === tpl
                        ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold"
                        : "bg-slate-50/80 border-slate-100 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Warning Textarea */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Warning Message (Appears as prominent modal on candidate screen)
              </label>
              <textarea
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                rows={3}
                placeholder="Type custom warning message..."
                className="w-full p-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveWarningCandidate(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWarning}
                disabled={isPending || !warningText.trim()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Warning</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Force Terminate / Disqualify */}
      {activeTerminateCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Disqualify Candidate Session
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold">
                    Target: {activeTerminateCandidate.candidateName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTerminateCandidate(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs">
              <strong>Warning:</strong> Disqualifying immediately freezes and locks the candidate&apos;s exam room, records a disciplinary audit log, and revokes examination authorization.
            </div>

            {/* Disqualification Reason */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Select Disqualification Reason
              </label>
              <div className="space-y-1.5">
                {TERMINATION_REASONS.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setTerminateReason(r)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                      terminateReason === r
                        ? "bg-rose-50 border-rose-300 text-rose-900 font-semibold"
                        : "bg-slate-50/80 border-slate-100 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveTerminateCandidate(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateSession}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                <span>Confirm Disqualification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Granular Incident Log Viewer */}
      {activeLogsCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Surveillance Log &amp; Flag History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidate: {activeLogsCandidate.candidateName} • Risk: {activeLogsCandidate.riskScore}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLogsCandidate(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Tabs inside Modal */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <button
                onClick={() => setIncidentCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  incidentCategoryFilter === "all"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                All ({activeLogsCandidate.flags.length})
              </button>
              <button
                onClick={() => setIncidentCategoryFilter("fullscreen")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  incidentCategoryFilter === "fullscreen"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <MonitorOff className="w-3 h-3" />
                <span>Fullscreen ({activeLogsCandidate.flags.filter((f) => f.type === "FULLSCREEN_EXIT").length})</span>
              </button>
              <button
                onClick={() => setIncidentCategoryFilter("tabs")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  incidentCategoryFilter === "tabs"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>Tab Switches ({activeLogsCandidate.flags.filter((f) => f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR").length})</span>
              </button>
            </div>

            {/* Filtered Incidents List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const visibleFlags = activeLogsCandidate.flags.filter((f) => {
                  if (incidentCategoryFilter === "fullscreen") return f.type === "FULLSCREEN_EXIT";
                  if (incidentCategoryFilter === "tabs") return f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR";
                  if (incidentCategoryFilter === "other")
                    return f.type !== "FULLSCREEN_EXIT" && f.type !== "TAB_SWITCH" && f.type !== "WINDOW_BLUR";
                  return true;
                });

                if (visibleFlags.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No incidents matching this category filter.
                    </div>
                  );
                }

                return visibleFlags.map((flag, idx) => {
                  const isFs = flag.type === "FULLSCREEN_EXIT";
                  const isTab = flag.type === "TAB_SWITCH" || flag.type === "WINDOW_BLUR";
                  const isWarn = flag.type === "PROCTOR_WARNING";
                  const isTerm = flag.type === "TERMINATED_BY_PROCTOR";

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        isFs
                          ? "bg-rose-50/70 border-rose-200 text-rose-900"
                          : isTab
                          ? "bg-amber-50/70 border-amber-200 text-amber-900"
                          : isTerm
                          ? "bg-rose-100 border-rose-300 text-rose-950"
                          : isWarn
                          ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                          : "bg-slate-50 border-slate-100 text-slate-800"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isFs
                            ? "bg-rose-200/80 text-rose-700"
                            : isTab
                            ? "bg-amber-200/80 text-amber-700"
                            : isTerm
                            ? "bg-rose-300 text-rose-900"
                            : isWarn
                            ? "bg-indigo-200/80 text-indigo-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isFs ? (
                          <MonitorOff className="w-3.5 h-3.5" />
                        ) : isTab ? (
                          <ExternalLink className="w-3.5 h-3.5" />
                        ) : isTerm ? (
                          <AlertOctagon className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {isFs
                              ? "FULLSCREEN EXIT"
                              : isTab
                              ? "TAB SWITCH / WINDOW BLUR"
                              : flag.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {new Date(flag.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        {flag.message && (
                          <p className="text-xs mt-0.5 opacity-90">
                            {flag.message}
                          </p>
                        )}
                        {flag.reason && (
                          <p className="text-xs font-bold text-rose-700 mt-0.5">
                            Reason: {flag.reason}
                          </p>
                        )}
                        {flag.issuedBy && (
                          <p className="text-[10px] opacity-70 mt-0.5">
                            Invigilator: {flag.issuedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveLogsCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Enlarged Focus Stream */}
      {focusedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold">{focusedCandidate.candidateName}</h3>
                <span className="text-xs text-slate-400">({focusedCandidate.candidateDepartment})</span>
              </div>
              <button
                onClick={() => setFocusedCandidate(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-80 bg-slate-950 rounded-xl relative flex items-center justify-center border border-slate-800 text-slate-500">
              <Camera className="w-16 h-16 opacity-30" />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">
                Surveillance Camera Feed
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] uppercase">
                Risk: {focusedCandidate.riskScore}%
              </div>
            </div>

            {/* Separate Counts in Focus View */}
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <MonitorOff className="w-3.5 h-3.5" />
                  <span>Fullscreen Exits: {candidateStats.get(focusedCandidate.assignmentId)?.fsCount || 0}</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tab Switches: {candidateStats.get(focusedCandidate.assignmentId)?.tabCount || 0}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveWarningCandidate(focusedCandidate);
                  setWarningText(PRESET_WARNINGS[0]);
                  setFocusedCandidate(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Issue Warning</span>
              </button>
              <button
                onClick={() => {
                  setActiveTerminateCandidate(focusedCandidate);
                  setTerminateReason(TERMINATION_REASONS[0]);
                  setFocusedCandidate(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Disqualify</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Support Desk Quick Reply & Resolution */}
      {activeReplyQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Respond to Candidate Inquiry
                  </h3>
                  <p className="text-xs text-slate-500">
                    To: {activeReplyQuery.candidateName || "Candidate"} {activeReplyQuery.candidateDepartment ? `(${activeReplyQuery.candidateDepartment})` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReplyQuery(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Inquiry Context Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {activeReplyQuery.category.replace("_", " ")}
                </span>
                {activeReplyQuery.questionNumber && (
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Question #{activeReplyQuery.questionNumber}
                  </span>
                )}
              </div>
              <p className="text-slate-800 font-semibold leading-relaxed pt-1">
                &ldquo;{activeReplyQuery.message}&rdquo;
              </p>
            </div>

            {/* Preset Fast Reply Chips */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Quick Invigilator Presets
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {PRESET_QUERY_REPLIES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyText(tpl)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                      replyText === tpl
                        ? "bg-blue-50 border-blue-200 text-blue-900 font-semibold"
                        : "bg-slate-50/80 border-slate-100 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reply Textarea */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Official Response Message
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Type response message..."
                className="w-full p-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveReplyQuery(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendQueryReply("in_progress")}
                  disabled={isPending || !replyText.trim()}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Send response and leave status as in progress"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>Keep In-Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendQueryReply("resolved")}
                  disabled={isPending || !replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Send response and mark resolved"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Send &amp; Mark Resolved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
