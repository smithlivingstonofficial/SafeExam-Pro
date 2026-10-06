"use client";

import { X, BookOpen, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Layers, FileText } from "lucide-react";

interface ExamInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  universityName: string;
  durationMinutes: number;
}

export function ExamInstructionsModal({
  isOpen,
  onClose,
  examTitle,
  universityName,
  durationMinutes,
}: ExamInstructionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Examination Regulations &amp; Scheme
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

        {/* Instructions Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed flex-1">
          {/* Section 1: General Timing & Structure */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span>General Timing &amp; Duration</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p>
                • Total allotted time is <strong>{durationMinutes} Minutes</strong>. The server clock synchronizes automatically in the top header countdown.
              </p>
              <p>
                • When the timer expires, your test will <strong>automatically finish and submit</strong> all saved answers to the examination repository.
              </p>
              <p>
                • You may submit the examination early once you have attempted your paper by clicking the <strong>&quot;Finish &amp; Submit&quot;</strong> button.
              </p>
            </div>
          </div>

          {/* Section 2: Question Palette & Navigation Legend */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span>Question Palette Color Symbols (GATE / NTA Standard)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Answered</span>
                  <span className="text-[11px] text-slate-500">You have answered this question.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✕
                </div>
                <div>
                  <span className="font-bold text-rose-950 block">Not Answered</span>
                  <span className="text-[11px] text-rose-700">Question visited, but left blank.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ★
                </div>
                <div>
                  <span className="font-bold text-amber-950 block">Marked for Review</span>
                  <span className="text-[11px] text-amber-700">Flagged to revisit later without an answer.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✦
                </div>
                <div>
                  <span className="font-bold text-purple-950 block">Answered &amp; Marked for Review</span>
                  <span className="text-[11px] text-purple-700">Answered, flagged for review (will be evaluated).</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3 sm:col-span-2">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 border border-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                  •
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Not Visited</span>
                  <span className="text-[11px] text-slate-500">You have not opened or navigated to this question yet.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Marking Scheme & Answering Procedure */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <span>Marking Scheme &amp; Response Rules</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p>
                • <strong>Correct Objective Response:</strong> Each correct response is awarded <strong>+4.0 Marks</strong>.
              </p>
              <p>
                • <strong>Negative Marking:</strong> For each incorrect response in Multiple Choice Single Answer questions, <strong>1.0 Mark</strong> is deducted (-1.0).
              </p>
              <p>
                • <strong>Numerical Questions:</strong> Negative marking is <em>NOT</em> applied for Numerical response questions.
              </p>
              <p>
                • <strong>Saving Answers:</strong> To record your answer, click <strong>&quot;Save &amp; Next&quot;</strong>. Simply selecting an option without clicking Save will not register the answer.
              </p>
            </div>
          </div>

          {/* Section 4: Security Perimeter & Academic Honor Code */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              <span>Surveillance Perimeter &amp; Disciplinary Code</span>
            </h3>
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-red-950 space-y-2">
              <p>
                • <strong>Fullscreen Lockdown:</strong> Exiting full screen, alt-tabbing, or switching windows immediately blurs your screen and records a high-risk proctor incident.
              </p>
              <p>
                • <strong>Anti-Cheat Keyboard Guard:</strong> Developer Tools (F12, Inspect), PrintScreen, and Copy/Paste are blocked and flagged.
              </p>
              <p>
                • <strong>Continuous AI Proctoring:</strong> Your camera feed and audio stream are under continuous institutional surveillance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            SafeExam Pro • Institutional Entrance Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            I Understand, Resume Test
          </button>
        </div>
      </div>
    </div>
  );
}
