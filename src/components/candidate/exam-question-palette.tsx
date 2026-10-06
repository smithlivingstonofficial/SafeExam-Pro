"use client";

import { useRef, useEffect } from "react";
import { ExamQuestionItem } from "@/lib/exam/sample-exam-data";
import {
  Send,
  Camera,
  ShieldCheck,
  User,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
} from "lucide-react";

export type QuestionStatus = "answered" | "not_answered" | "not_visited" | "flagged" | "answered_and_flagged";

interface ExamQuestionPaletteProps {
  questions: ExamQuestionItem[];
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  responses: Record<string, Record<string, unknown>>;
  flaggedQuestionIds: Set<string>;
  visitedQuestionIds?: Set<string>;
  onSubmitClick: () => void;
  hasCamera?: boolean;
  candidateName?: string;
  assignmentId?: string;
  fullscreenExits?: number;
  tabSwitches?: number;
  infractionCount?: number;
}

export function ExamQuestionPalette({
  questions,
  currentQuestionIndex,
  onSelectQuestion,
  responses,
  flaggedQuestionIds,
  visitedQuestionIds = new Set(),
  onSubmitClick,
  hasCamera = true,
  candidateName = "Candidate",
  assignmentId,
  fullscreenExits = 0,
  tabSwitches = 0,
  infractionCount = 0,
}: ExamQuestionPaletteProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hook up mini proctor webcam feed if available
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function initMiniCam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 160, height: 120 },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }
      } catch {
        // quiet fallback
      }
    }
    initMiniCam();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Compute question statuses (TCS iON / GATE 5-State standard)
  function getStatus(q: ExamQuestionItem): QuestionStatus {
    const resp = responses[q.id];
    const isAnswered = Boolean(
      resp &&
      (resp.selectedOptionId ||
        (Array.isArray(resp.selectedOptionIds) && resp.selectedOptionIds.length > 0) ||
        (typeof resp.numericalValue === "string" && resp.numericalValue.length > 0) ||
        (typeof resp.descriptiveText === "string" && resp.descriptiveText.length > 0))
    );

    const isFlagged = flaggedQuestionIds.has(q.id);
    const isVisited = visitedQuestionIds.has(q.id);

    if (isAnswered && isFlagged) return "answered_and_flagged";
    if (isFlagged) return "flagged";
    if (isAnswered) return "answered";
    if (isVisited) return "not_answered";
    return "not_visited";
  }

  // Count summaries
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let flaggedCount = 0;
  let answeredAndFlaggedCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q) => {
    const s = getStatus(q);
    if (s === "answered") answeredCount++;
    else if (s === "not_answered") notAnsweredCount++;
    else if (s === "flagged") flaggedCount++;
    else if (s === "answered_and_flagged") answeredAndFlaggedCount++;
    else notVisitedCount++;
  });

  const completionPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full justify-between">
      {/* 1. Candidate Identity & Live Proctor Feed */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-3 shrink-0">
        {/* Video Thumbnail */}
        <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 relative shrink-0 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: "scaleX(-1)" }}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Identity Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs text-slate-900 truncate block">
              {candidateName}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block truncate">
            Roll: {assignmentId ? assignmentId.slice(0, 8).toUpperCase() : "VERIFIED"}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>AI Surveillance Active</span>
          </div>
          {(fullscreenExits > 0 || tabSwitches > 0) && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {fullscreenExits > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800">
                  {fullscreenExits} FS {fullscreenExits === 1 ? "Exit" : "Exits"}
                </span>
              )}
              {tabSwitches > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800">
                  {tabSwitches} Tab {tabSwitches === 1 ? "Switch" : "Switches"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Progress Meter Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-slate-700 text-[11px]">Exam Progress</span>
          <span className="font-mono text-[11px] font-extrabold text-indigo-700">
            {answeredCount}/{questions.length} ({completionPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(completionPercent > 0 ? 5 : 0, completionPercent)}%` }}
          />
        </div>
      </div>

      {/* 3. GATE / TCS iON 5-State Legend */}
      <div className="p-2 px-3 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <div className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
            ✓
          </div>
          <span>Answered ({answeredCount})</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <div className="w-3.5 h-3.5 rounded bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold">
            ✕
          </div>
          <span>Not Answered ({notAnsweredCount})</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <div className="w-3.5 h-3.5 rounded bg-amber-500 text-white flex items-center justify-center text-[8px] font-bold">
            ★
          </div>
          <span>Review ({flaggedCount})</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <div className="w-3.5 h-3.5 rounded bg-purple-700 text-white flex items-center justify-center text-[8px] font-bold">
            ✦
          </div>
          <span>Ans &amp; Review ({answeredAndFlaggedCount})</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-slate-500 col-span-2">
          <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center text-[8px] font-bold">
            •
          </div>
          <span>Not Visited ({notVisitedCount})</span>
        </div>
      </div>

      {/* 4. Question Palette Grid (Maximized Area to display more question buttons) */}
      <div className="p-3 bg-white flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-2.5 shrink-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
            Question Palette ({questions.length})
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 pr-0.5">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            const status = getStatus(q);

            let bgClass = "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200";
            if (status === "answered") {
              bgClass = "bg-emerald-600 text-white border border-emerald-700 shadow-2xs font-black";
            } else if (status === "not_answered") {
              bgClass = "bg-rose-500 text-white border border-rose-600 shadow-2xs font-black";
            } else if (status === "flagged") {
              bgClass = "bg-amber-500 text-white border border-amber-600 shadow-2xs font-black";
            } else if (status === "answered_and_flagged") {
              bgClass = "bg-purple-700 text-white border border-purple-800 shadow-2xs font-black";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`h-9 sm:h-10 rounded-xl text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer font-bold relative ${bgClass} ${
                  isCurrent ? "ring-2 ring-slate-900 ring-offset-2 font-black shadow-md scale-105 z-10" : ""
                }`}
              >
                <span>{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Submit Examination Button */}
      <div className="p-3 bg-slate-50/90 border-t border-slate-200 shrink-0 space-y-1.5">
        {questions.length - answeredCount > 0 ? (
          <button
            type="button"
            onClick={onSubmitClick}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold text-xs shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            title={`Attempt all ${questions.length} questions to submit (${questions.length - answeredCount} remaining)`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Submit Locked ({answeredCount}/{questions.length})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitClick}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer animate-pulse"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Examination ({answeredCount}/{questions.length})</span>
          </button>
        )}
        {questions.length - answeredCount > 0 && (
          <p className="text-[10.5px] text-center text-slate-500 font-medium leading-tight">
            Attempt all {questions.length} questions to submit early ({questions.length - answeredCount} remaining)
          </p>
        )}
      </div>
    </div>
  );
}
