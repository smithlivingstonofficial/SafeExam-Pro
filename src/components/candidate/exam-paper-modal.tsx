"use client";

import { ExamQuestionItem } from "@/lib/exam/sample-exam-data";
import { X, FileText, CheckCircle2, ArrowRight } from "lucide-react";

interface ExamPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  universityName: string;
  questions: ExamQuestionItem[];
  responses: Record<string, Record<string, unknown>>;
  onJumpToQuestion: (index: number) => void;
}

export function ExamPaperModal({
  isOpen,
  onClose,
  examTitle,
  universityName,
  questions,
  responses,
  onJumpToQuestion,
}: ExamPaperModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Full Question Paper View
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">{universityName}</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                {examTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1">
          {questions.map((q, idx) => {
            const resp = responses[q.id];
            const isAnswered = Boolean(
              resp &&
                (resp.selectedOptionId ||
                  (Array.isArray(resp.selectedOptionIds) && resp.selectedOptionIds.length > 0) ||
                  resp.numericalValue ||
                  resp.descriptiveText)
            );

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      Q{idx + 1}
                    </span>
                    {q.subject && (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {q.subject}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      {q.type.replace("_", " ")}
                    </span>
                    {isAnswered && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Answered</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-600">
                      +{q.marks}.0 pts{q.negativeMarks > 0 ? ` / -${q.negativeMarks}.0` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToQuestion(idx);
                        onClose();
                      }}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Go to Question</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected =
                        resp?.selectedOptionId === opt.id ||
                        (Array.isArray(resp?.selectedOptionIds) &&
                          resp.selectedOptionIds.includes(opt.id));

                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Click any &quot;Go to Question&quot; to jump directly into that item.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Close Paper View
          </button>
        </div>
      </div>
    </div>
  );
}
