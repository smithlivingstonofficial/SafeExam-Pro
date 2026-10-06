"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExamSectionItem, ExamQuestionItem } from "@/lib/exam/sample-exam-data";
import { ExamTimer } from "./exam-timer";
import { ExamQuestionView } from "./exam-question-view";
import { ExamQuestionPalette } from "./exam-question-palette";
import { ExamSubmitModal } from "./exam-submit-modal";
import { ExamCompleted } from "./exam-completed";
import {
  saveExamResponseAction,
  recordProctorIncidentAction,
  submitExamAction,
  checkExamSessionStatusAction,
} from "@/app/actions/exam";
import { ExamCalculator } from "./exam-calculator";
import { ExamPaperModal } from "./exam-paper-modal";
import { ExamInstructionsModal } from "./exam-instructions-modal";
import { ExamQueryDrawer } from "./exam-query-drawer";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  BellRing,
  Send,
  Layers,
  Sparkles,
  Lock,
  Maximize2,
  MessageSquare,
  ShieldAlert,
  Calculator,
  FileText,
  Type,
  BookOpen,
  Wifi,
  WifiOff,
  X,
  MonitorOff,
  ExternalLink,
  Clock,
} from "lucide-react";

interface InitialResponseItem {
  question_id: string;
  response: Record<string, unknown>;
  is_flagged: boolean;
}

interface ExamRoomProps {
  assignmentId: string;
  examTitle: string;
  universityName: string;
  candidateName: string;
  candidateEmail: string;
  durationMinutes: number;
  startedAt?: string | null;
  serverNow?: string | null;
  scheduleEndAt?: string | null;
  sections: ExamSectionItem[];
  initialResponses?: InitialResponseItem[];
  isDesktopClient?: boolean;
  hardwareId?: string;
}

export function ExamRoom({
  assignmentId,
  examTitle,
  universityName,
  candidateName,
  candidateEmail,
  durationMinutes,
  startedAt,
  serverNow,
  scheduleEndAt,
  sections,
  initialResponses = [],
  isDesktopClient = false,
  hardwareId,
}: ExamRoomProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Detect native SafeExam Pro Desktop Client
  const isNativeClient = isDesktopClient || (typeof window !== "undefined" && !!(window as any).safeExamDesktop);
  const [latestServerNow, setLatestServerNow] = useState<string | null>(serverNow || null);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // Flattens all questions across all sections
  const allQuestions: ExamQuestionItem[] = sections.flatMap((s) => s.questions);

  // Active question index (1 to N directly)
  const [currentGlobalIndex, setCurrentGlobalIndex] = useState(0);

  const activeQuestion = allQuestions[currentGlobalIndex] || allQuestions[0];

  // Responses dictionary: questionId -> response object
  const [responses, setResponses] = useState<Record<string, Record<string, unknown>>>(() => {
    const dict: Record<string, Record<string, unknown>> = {};
    initialResponses.forEach((ir) => {
      dict[ir.question_id] = ir.response || {};
    });
    return dict;
  });

  // Flagged question IDs set
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    initialResponses.forEach((ir) => {
      if (ir.is_flagged) s.add(ir.question_id);
    });
    return s;
  });

  // Auto-save sync status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // Modals & Submission state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  // Anti-cheat alert banners & granular category counters
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [infractionCategory, setInfractionCategory] = useState<"FULLSCREEN_EXIT" | "TAB_SWITCH" | "GENERAL">("GENERAL");
  const [fullscreenExitsCount, setFullscreenExitsCount] = useState(0);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [otherInfractionsCount, setOtherInfractionsCount] = useState(0);
  const totalFlagsCount = fullscreenExitsCount + tabSwitchesCount + otherInfractionsCount;

  // Proctor direct warning modal state
  const [proctorDirectWarning, setProctorDirectWarning] = useState<{
    message: string;
    issuedBy?: string;
    timestamp: string;
  } | null>(null);
  const [lastAckTime, setLastAckTime] = useState<string | null>(null);

  // Proctor Disqualification / Termination State
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState<string | null>(null);

  // Fullscreen lockdown enforcement state
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [hasWindowFocus, setHasWindowFocus] = useState(true);

  // CBT Examination Tools State
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isQueryDrawerOpen, setIsQueryDrawerOpen] = useState(false);
  const [unreadRepliesCount, setUnreadRepliesCount] = useState(0);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  // Visited Questions tracking for TCS iON 5-State status
  const [visitedQuestionIds, setVisitedQuestionIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (allQuestions[0]?.id) s.add(allQuestions[0].id);
    initialResponses.forEach((ir) => {
      if (ir.response && Object.keys(ir.response).length > 0) s.add(ir.question_id);
    });
    return s;
  });

  // Track active question visited
  useEffect(() => {
    if (activeQuestion?.id) {
      setVisitedQuestionIds((prev) => {
        if (prev.has(activeQuestion.id)) return prev;
        const next = new Set(prev);
        next.add(activeQuestion.id);
        return next;
      });
    }
  }, [activeQuestion?.id]);

  // Network connection state & auto sync
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // Auto-flush cached answers on network re-connect
      try {
        const cached = localStorage.getItem(`safeexam_resp_${assignmentId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            Object.entries(parsed).forEach(([qId, ans]) => {
              if (ans && typeof ans === "object") {
                saveExamResponseAction({
                  assignmentId,
                  questionId: qId,
                  response: ans as Record<string, unknown>,
                  isFlagged: flaggedIds.has(qId),
                  timeSpentSeconds: 15,
                }).catch(() => {});
              }
            });
          }
        }
      } catch {
        // quiet fallback
      }
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [assignmentId, flaggedIds]);

  // Final submission handler
  const handleFinalSubmit = useCallback(async (isForcedByTimer: boolean = false) => {
    setIsSubmitModalOpen(false);

    if (isForcedByTimer) {
      setIsAutoSubmitting(true);
    }

    // If manual submit (not auto time-over), enforce that ALL questions must be answered
    if (!isForcedByTimer) {
      const currentAnswered = Object.keys(responses).filter((k) => {
        const r = responses[k];
        return (
          r &&
          (Boolean(r.selectedOptionId) ||
            (Array.isArray(r.selectedOptionIds) && r.selectedOptionIds.length > 0) ||
            (typeof r.numericalValue === "string" && r.numericalValue.trim().length > 0) ||
            (typeof r.descriptiveText === "string" && r.descriptiveText.trim().length > 0))
        );
      }).length;

      if (currentAnswered < allQuestions.length) {
        alert(
          `Submission Locked: You must attempt all ${allQuestions.length} questions before submitting early (${allQuestions.length - currentAnswered} remaining).`
        );
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await submitExamAction(assignmentId);
        if (res.success) {
          setIsSubmitted(true);
          setSubmittedAt(new Date().toISOString());
        } else {
          if (!isForcedByTimer) {
            alert(res.error || "Submission failed. Please try again.");
          } else {
            // If forced by timer and error, assume sealed
            setIsSubmitted(true);
            setSubmittedAt(new Date().toISOString());
          }
        }
      } catch {
        if (!isForcedByTimer) {
          alert("Network failure submitting examination. Please retry.");
        } else {
          setIsSubmitted(true);
          setSubmittedAt(new Date().toISOString());
        }
      } finally {
        setIsAutoSubmitting(false);
      }
    });
  }, [assignmentId, responses, allQuestions.length]);

  // Real-time Proctor Event Poller (Checks for invigilator warnings or session termination)
  useEffect(() => {
    if (isSubmitted || isDisqualified) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await checkExamSessionStatusAction(assignmentId);
        if (!isMounted || !res.success || !res.data) return;

        // Synchronize authoritative server timestamp
        if (res.data.serverNow) {
          setLatestServerNow(res.data.serverNow);
        }

        // Server-enforced time expiry check
        if (res.data.isTimeExpired) {
          handleFinalSubmit(true);
          return;
        }

        if (res.data.isTerminated) {
          setIsDisqualified(true);
          setDisqualifyReason(res.data.terminationReason || "Disqualified by exam proctor for rule infraction.");
          return;
        }

        // Sync granular flag counts from server
        if (typeof res.data.fullscreenExits === "number") {
          setFullscreenExitsCount((prev) => Math.max(prev, res.data!.fullscreenExits));
        }
        if (typeof res.data.tabSwitches === "number") {
          setTabSwitchesCount((prev) => Math.max(prev, res.data!.tabSwitches));
        }
        if (typeof res.data.otherFlags === "number") {
          setOtherInfractionsCount((prev) => Math.max(prev, res.data!.otherFlags));
        }

        if (res.data.latestWarning) {
          const warnTime = res.data.latestWarning.timestamp;
          if (!lastAckTime || new Date(warnTime).getTime() > new Date(lastAckTime).getTime()) {
            setProctorDirectWarning(res.data.latestWarning);
          }
        }
      } catch {
        // quiet fallback
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [assignmentId, isSubmitted, isDisqualified, lastAckTime, handleFinalSubmit]);

  function cycleFontSize() {
    setFontSize((prev) => (prev === "normal" ? "large" : prev === "large" ? "xlarge" : "normal"));
  }

  // Local Storage Answer Backup (Prevents loss during accidental refresh / transient network drop)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(`safeexam_resp_${assignmentId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setResponses((prev) => ({ ...parsed, ...prev }));
        }
      }
    } catch {
      // quiet fallback
    }
  }, [assignmentId]);

  useEffect(() => {
    try {
      if (Object.keys(responses).length > 0) {
        localStorage.setItem(`safeexam_resp_${assignmentId}`, JSON.stringify(responses));
      }
    } catch {
      // quiet fallback
    }
  }, [responses, assignmentId]);


  // Re-enter Fullscreen Action
  const handleReEnterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setHasWindowFocus(true);
    } catch (err) {
      console.warn("Fullscreen request error:", err);
      setIsFullscreen(true);
      setHasWindowFocus(true);
    }
  }, []);

  // Anti-Cheat: Event listeners for Fullscreen and Visibility/Tab switch
  useEffect(() => {
    // Initial verification on mount
    if (typeof document !== "undefined") {
      setIsFullscreen(!!document.fullscreenElement);
      setHasWindowFocus(!document.hidden);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        setHasWindowFocus(false);
        if (!isSubmitted) {
          setTabSwitchesCount((c) => c + 1);
          setInfractionCategory("TAB_SWITCH");
          setWarningMessage("Warning: Focus lost! Switching tabs, minimizing windows, or navigating away is strictly logged.");
          recordProctorIncidentAction(assignmentId, "TAB_SWITCH", {
            timestamp: new Date().toISOString(),
            questionId: activeQuestion?.id,
          }).catch(() => {});
        }
      } else {
        setHasWindowFocus(true);
      }
    }

    function handleFullscreenChange() {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      if (!isFs && !isSubmitted) {
        setFullscreenExitsCount((c) => c + 1);
        setInfractionCategory("FULLSCREEN_EXIT");
        setWarningMessage("Warning: Fullscreen exited! Security policy mandates remaining in full screen throughout the exam.");
        recordProctorIncidentAction(assignmentId, "FULLSCREEN_EXIT", {
          timestamp: new Date().toISOString(),
          questionId: activeQuestion?.id,
        }).catch(() => {});
      }
    }

    function handleWindowBlur() {
      if (!isSubmitted) {
        setHasWindowFocus(false);
      }
    }

    function handleWindowFocus() {
      setHasWindowFocus(true);
    }

    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
      setOtherInfractionsCount((c) => c + 1);
      setInfractionCategory("GENERAL");
      setWarningMessage("Action restricted: Context menu and inspect elements are disabled.");
      recordProctorIncidentAction(assignmentId, "RIGHT_CLICK_ATTEMPT", {}).catch(() => {});
    }

    function handleCopy(e: ClipboardEvent) {
      e.preventDefault();
      setOtherInfractionsCount((c) => c + 1);
      setInfractionCategory("GENERAL");
      setWarningMessage("Warning: Copying test content is strictly prohibited.");
      recordProctorIncidentAction(assignmentId, "COPY_PASTE_ATTEMPT", { action: "copy" }).catch(() => {});
    }

    function handlePaste(e: ClipboardEvent) {
      e.preventDefault();
      setOtherInfractionsCount((c) => c + 1);
      setInfractionCategory("GENERAL");
      setWarningMessage("Warning: Pasting external text is prohibited.");
      recordProctorIncidentAction(assignmentId, "COPY_PASTE_ATTEMPT", { action: "paste" }).catch(() => {});
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Intercept DevTools shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "p" || e.key === "P"))
      ) {
        e.preventDefault();
        setOtherInfractionsCount((c) => c + 1);
        setInfractionCategory("GENERAL");
        setWarningMessage("Warning: Inspection, printing, and source view shortcuts are blocked.");
        recordProctorIncidentAction(assignmentId, "DEVTOOLS_ATTEMPT", { key: e.key }).catch(() => {});
      }

      // Intercept PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        setOtherInfractionsCount((c) => c + 1);
        setInfractionCategory("GENERAL");
        setWarningMessage("Warning: Screen capture attempt detected.");
        recordProctorIncidentAction(assignmentId, "SCREEN_CAPTURE_ATTEMPT", {}).catch(() => {});
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignmentId, activeQuestion?.id, isSubmitted]);

  // Anti-Cheat: Clock Anomaly / OS System Time Tamper Detection
  const handleClockTamper = useCallback(
    (details: { alteredBySeconds: number }) => {
      setOtherInfractionsCount((c) => c + 1);
      setInfractionCategory("GENERAL");
      setWarningMessage(
        `Security Alert: Device system clock manipulation detected (${details.alteredBySeconds}s shift). Examination timing is strictly anchored to server time.`
      );
      recordProctorIncidentAction(assignmentId, "CLOCK_ANOMALY_DETECTED", details).catch(() => {});
    },
    [assignmentId]
  );

  // Handle saving an answer
  const handleSaveAnswer = useCallback(
    async (answerPayload: Record<string, unknown>, flagged: boolean, advanceToNext: boolean) => {
      if (!activeQuestion) return;

      const qId = activeQuestion.id;
      setSaveStatus("saving");

      // Update local state immediately
      setResponses((prev) => ({
        ...prev,
        [qId]: answerPayload,
      }));

      setFlaggedIds((prev) => {
        const next = new Set(prev);
        if (flagged) next.add(qId);
        else next.delete(qId);
        return next;
      });

      // Background persistence via Server Action
      try {
        await saveExamResponseAction({
          assignmentId,
          questionId: qId,
          response: answerPayload,
          isFlagged: flagged,
          timeSpentSeconds: 30,
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("saved"); // keep user flow uninterrupted
      }

      if (advanceToNext && currentGlobalIndex < allQuestions.length - 1) {
        setCurrentGlobalIndex(currentGlobalIndex + 1);
      }
    },
    [activeQuestion, assignmentId, currentGlobalIndex, allQuestions]
  );

  // Jump to specific question from palette
  function handleSelectQuestion(index: number) {
    if (index >= 0 && index < allQuestions.length) {
      setCurrentGlobalIndex(index);
    }
  }

  if (isSubmitted) {
    return (
      <ExamCompleted
        examTitle={examTitle}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        assignmentId={assignmentId}
        submittedAt={submittedAt}
        universityName={universityName}
      />
    );
  }

  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border border-rose-600/50 rounded-2xl p-8 text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
              Exam Disqualified
            </span>
            <h1 className="text-xl font-bold text-white mt-3">
              Session Terminated by Invigilator
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Your examination session has been terminated by the university invigilation committee.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-left">
            <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
              Disqualification Reason:
            </span>
            <p className="text-xs text-rose-200 font-medium">
              {disqualifyReason || "Malpractice or protocol violation observed during surveillance."}
            </p>
          </div>

          <button
            onClick={() => router.push("/candidate")}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Return to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Answer statistics
  const answeredCount = Object.keys(responses).filter((k) => {
    const r = responses[k];
    return (
      r &&
      (r.selectedOptionId ||
        (Array.isArray(r.selectedOptionIds) && r.selectedOptionIds.length > 0) ||
        r.numericalValue ||
        r.descriptiveText)
    );
  }).length;

  const flaggedCount = flaggedIds.size;
  const unansweredCount = Math.max(0, allQuestions.length - answeredCount);

  const isLockdownActive = (!isFullscreen || !hasWindowFocus) && !isSubmitted;

  return (
    <div className="relative h-screen bg-slate-100 flex flex-col overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Main Examination Interface (Blurred and inert during security breach) */}
      <div
        className={`h-screen flex flex-col overflow-hidden transition-all duration-300 ${
          isLockdownActive
            ? "filter blur-xl pointer-events-none select-none overflow-hidden"
            : ""
        }`}
      >
        {/* Top Fixed Header */}
        <header className="h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30 shadow-2xs">
          {/* Left Column: University Emblem, Title & Save Status */}
          <div className="flex items-center gap-3 min-w-0 max-w-[340px] xl:max-w-[420px]">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate leading-tight">
                {examTitle}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                <span className="truncate">
                  Candidate: <strong className="text-slate-800 font-semibold">{candidateName}</strong>
                </span>
                <span className="text-slate-300 shrink-0">•</span>
                {saveStatus === "saving" ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-[10px]">Syncing...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px]">Saved</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Column: Prominently Centered Countdown Timer */}
          <div className="flex items-center justify-center shrink-0">
            <ExamTimer
              initialDurationMinutes={durationMinutes}
              startedAt={startedAt}
              serverNow={latestServerNow}
              scheduleEndAt={scheduleEndAt}
              onTimeExpired={() => handleFinalSubmit(true)}
              onClockTamperDetected={handleClockTamper}
            />
          </div>

          {/* Right Column: Unified Professional CBT Toolbar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* 1. Official Support Desk Trigger */}
            <button
              type="button"
              onClick={() => setIsQueryDrawerOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-indigo-200/90 bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer relative whitespace-nowrap active:scale-[0.98]"
              title="Ask Official Invigilator / Technical Help Desk"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span>Ask Invigilator</span>
              {unreadRepliesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </button>

            {/* 2. Unified Segmented CBT Tools Group */}
            <div className="h-9 bg-slate-50/90 border border-slate-200/90 rounded-xl p-1 flex items-center gap-0.5 shadow-2xs">
              {/* Instructions Modal Button */}
              <button
                type="button"
                onClick={() => setIsInstructionsOpen(true)}
                className="h-7 px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Read Exam Instructions & Regulations"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Instructions</span>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-slate-200/80 shrink-0" />

              {/* Question Paper View Button */}
              <button
                type="button"
                onClick={() => setIsPaperModalOpen(true)}
                className="h-7 px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="View Full Question Paper"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Question Paper</span>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-slate-200/80 shrink-0" />

              {/* On-Screen Calculator Button */}
              <button
                type="button"
                onClick={() => setIsCalcOpen(!isCalcOpen)}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isCalcOpen
                    ? "bg-indigo-700 text-white shadow-2xs font-bold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-2xs"
                }`}
                title="Toggle On-Screen Calculator"
              >
                <Calculator className={`w-3.5 h-3.5 shrink-0 ${isCalcOpen ? "text-white" : "text-slate-500"}`} />
                <span className="hidden sm:inline">Calculator</span>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-slate-200/80 shrink-0" />

              {/* Font Size Accessibility Button */}
              <button
                type="button"
                onClick={cycleFontSize}
                className="h-7 px-2 rounded-lg text-xs font-bold font-mono text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Adjust Question Text Size"
              >
                <Type className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{fontSize === "normal" ? "A" : fontSize === "large" ? "A+" : "A++"}</span>
              </button>
            </div>

            {/* 3. AI Proctor Status Pill */}
            <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 shadow-2xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-xs text-emerald-900">AI Proctor Active</span>
              {(fullscreenExitsCount > 0 || tabSwitchesCount > 0) && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-emerald-200/80">
                  {fullscreenExitsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100/90 border border-rose-200 text-rose-800" title="Fullscreen Exit Violations">
                      <MonitorOff className="w-3 h-3 text-rose-700 shrink-0" />
                      <span>{fullscreenExitsCount} FS</span>
                    </span>
                  )}
                  {tabSwitchesCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/90 border border-amber-200 text-amber-900" title="Tab / Window Blur Violations">
                      <ExternalLink className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{tabSwitchesCount} Tab</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 4. Desktop Client Lockdown Pill */}
            {isNativeClient && (
              <div
                className="hidden xl:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-indigo-50/90 border border-indigo-200/90 shadow-2xs whitespace-nowrap text-xs text-indigo-950 font-bold"
                title={hardwareId ? `SafeExam Hardware Attestation: ${hardwareId}` : "SafeExam Pro Desktop Lockdown Client Active"}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span>Desktop Lockdown Sealed</span>
              </div>
            )}

            {!isOnline && (
              <div className="h-9 px-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </header>

      {/* Main Workspace: Question Area (left) + Question Palette (right) */}
      <main className="flex-1 min-h-0 px-3 sm:px-5 lg:px-6 py-2.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 w-full max-w-[1760px] mx-auto overflow-hidden">
        {/* Left Column: Question Workspace (9 cols) */}
        <div className="lg:col-span-9 flex flex-col h-full min-h-0">
          {activeQuestion ? (
            <ExamQuestionView
              key={activeQuestion.id}
              question={activeQuestion}
              questionNumber={currentGlobalIndex + 1}
              totalQuestions={allQuestions.length}
              currentResponse={responses[activeQuestion.id]}
              isFlagged={flaggedIds.has(activeQuestion.id)}
              onSaveAnswer={handleSaveAnswer}
              onPrevious={() => {
                if (currentGlobalIndex > 0) {
                  setCurrentGlobalIndex(currentGlobalIndex - 1);
                }
              }}
              isFirst={currentGlobalIndex === 0}
              isLast={currentGlobalIndex === allQuestions.length - 1}
              fontSize={fontSize}
            />
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-400 mb-2" />
              <h3 className="text-base font-bold text-slate-800">
                Examination Paper Ready
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select a question from the palette on the right to start answering.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Question Palette & Proctor Feed (3 cols) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <ExamQuestionPalette
            questions={allQuestions}
            currentQuestionIndex={currentGlobalIndex}
            onSelectQuestion={handleSelectQuestion}
            responses={responses}
            flaggedQuestionIds={flaggedIds}
            visitedQuestionIds={visitedQuestionIds}
            onSubmitClick={() => setIsSubmitModalOpen(true)}
            candidateName={candidateName}
            assignmentId={assignmentId}
            fullscreenExits={fullscreenExitsCount}
            tabSwitches={tabSwitchesCount}
            infractionCount={totalFlagsCount}
          />
        </div>
      </main>

      </div>

      {/* Strict Fullscreen Lockdown Modal Dialog */}
      {isLockdownActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200 select-none">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-red-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200 relative">
            {/* Red Lock Icon with Ping Indicator */}
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-inner">
              <Lock className="w-10 h-10" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Security Perimeter Lock Active</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {!isFullscreen ? "Fullscreen Lockdown Required" : "Exam Window Focus Lost"}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                SafeExam Pro institutional policy strictly prohibits taking examinations outside of full-screen mode or switching windows. The examination paper has been blurred and locked to protect test integrity.
              </p>
            </div>

            {/* Infraction Counter Alert with Granular Breakdown */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">Anti-Cheat Infraction Logged</span>
                  <span className="text-[11px] text-amber-700">All breaches are recorded with exact timestamps</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-center px-2 py-1 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-xs font-black font-mono text-rose-700 block">{fullscreenExitsCount}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">FS Exits</span>
                </div>
                <div className="text-center px-2 py-1 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-xs font-black font-mono text-amber-700 block">{tabSwitchesCount}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Tab Sw</span>
                </div>
              </div>
            </div>

            {/* Action Button: Return to Full Screen */}
            <button
              type="button"
              onClick={handleReEnterFullscreen}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-indigo-700/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Maximize2 className="w-5 h-5" />
              <span>{!isFullscreen ? "Back to Full Screen" : "Resume Fullscreen Exam"}</span>
            </button>

            <p className="text-[11px] text-slate-400 font-medium">
              Clicking above will re-lock the secure browser perimeter and restore examination access.
            </p>
          </div>
        </div>
      )}

      {/* Floating Granular Security Alert Toast (With Separate Fullscreen & Tab Switch Counters) */}
      {warningMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white border border-amber-300 rounded-2xl p-4 shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              infractionCategory === "FULLSCREEN_EXIT"
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : infractionCategory === "TAB_SWITCH"
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-slate-50 text-slate-600 border border-slate-200"
            }`}
          >
            {infractionCategory === "FULLSCREEN_EXIT" ? (
              <AlertOctagon className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 block">
                {infractionCategory === "FULLSCREEN_EXIT"
                  ? "Fullscreen Perimeter Breach"
                  : infractionCategory === "TAB_SWITCH"
                  ? "Tab Switch / Window Blur Logged"
                  : "Proctor Security Notice"}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug mt-0.5">{warningMessage}</p>

            {/* Separate Flag Counters Breakdown */}
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  fullscreenExitsCount > 0
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <span>Fullscreen Exits:</span>
                <strong>{fullscreenExitsCount}</strong>
              </span>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  tabSwitchesCount > 0
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <span>Tab Switches:</span>
                <strong>{tabSwitchesCount}</strong>
              </span>

              {otherInfractionsCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                  Other: {otherInfractionsCount}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Offline Notification Toast */}
      {!isOnline && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 border border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block">Offline Mode</span>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
              Responses are securely preserved on local disk and will auto-sync when online.
            </p>
          </div>
        </div>
      )}

      {/* On-Screen Virtual Calculator */}
      <ExamCalculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />

      {/* Full Question Paper View Modal */}
      <ExamPaperModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        examTitle={examTitle}
        universityName={universityName}
        questions={allQuestions}
        responses={responses}
        onJumpToQuestion={(idx) => handleSelectQuestion(idx)}
      />

      {/* Exam Instructions & Regulations Modal */}
      <ExamInstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        examTitle={examTitle}
        universityName={universityName}
        durationMinutes={durationMinutes}
      />

      {/* Urgent Proctor Warning Modal Dialog */}
      {proctorDirectWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white border-2 border-amber-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Direct Invigilator Alert
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Official Proctor Warning
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-950 leading-relaxed">
                &ldquo;{proctorDirectWarning.message}&rdquo;
              </p>
              <div className="mt-2 text-[10px] text-amber-700 font-medium flex items-center justify-between">
                <span>Issued by: <strong>{proctorDirectWarning.issuedBy || "Exam Invigilator"}</strong></span>
                <span>{new Date(proctorDirectWarning.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              This message has been logged in your audit record. Continued non-compliance will result in immediate disqualification.
            </p>

            <button
              type="button"
              onClick={() => {
                setLastAckTime(proctorDirectWarning.timestamp);
                setProctorDirectWarning(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              I Acknowledge & Understand — Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal Dialog */}
      <ExamSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={() => handleFinalSubmit(false)}
        isSubmitting={isPending}
        totalQuestions={allQuestions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        unansweredCount={unansweredCount}
      />

      {/* Real-time Invigilator Support / Queries Drawer */}
      <ExamQueryDrawer
        isOpen={isQueryDrawerOpen}
        onClose={() => setIsQueryDrawerOpen(false)}
        assignmentId={assignmentId}
        candidateName={candidateName}
        currentQuestionNumber={currentGlobalIndex + 1}
        onUnreadCountChange={(count) => setUnreadRepliesCount(count)}
      />

      {/* Auto-Submitting on Expiration Overlay */}
      {isAutoSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 text-indigo-700 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Allotted Time Over
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                Securing Examination Submission
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your examination window has concluded. Finalizing and saving your responses for institutional evaluation...
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
