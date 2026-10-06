"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  HelpCircle,
  X,
  Send,
} from "lucide-react";

interface ExamSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  isSubmitting: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  unansweredCount: number;
}

export function ExamSubmitModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  isSubmitting,
  totalQuestions,
  answeredCount,
  flaggedCount,
  unansweredCount,
}: ExamSubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Confirm Examination Submission
              </h3>
              <p className="text-xs text-slate-500">
                Review your test summary before final submission.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breakdown Card */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Answered</span>
            <span className="text-xl font-extrabold text-emerald-800">{answeredCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">For Review</span>
            <span className="text-xl font-extrabold text-amber-800">{flaggedCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Unanswered</span>
            <span className="text-xl font-extrabold text-slate-700">{unansweredCount}</span>
          </div>
        </div>

        {unansweredCount > 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Submission Locked ({answeredCount}/{totalQuestions})</strong>
              <span>
                You must attempt all <strong>{totalQuestions} questions</strong> to submit early. Please return and complete the remaining <strong>{unansweredCount} question{unansweredCount === 1 ? "" : "s"}</strong>.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">All Questions Answered ({answeredCount}/{totalQuestions})</strong>
              <span>
                You have answered all questions. Clicking submit will finalize and grade your examination docket.
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            Return to Questions
          </button>

          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isSubmitting || unansweredCount > 0}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? "Finalizing Submission..."
                : unansweredCount > 0
                ? `Complete All (${unansweredCount} left)`
                : "Yes, Submit Exam"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
