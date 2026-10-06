"use client";

import { useState, useEffect } from "react";
import { ExamQuestionItem } from "@/lib/exam/sample-exam-data";
import {
  Bookmark,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Code2,
  HelpCircle,
  Hash,
  Layers,
} from "lucide-react";
import { ExamSectionItem } from "@/lib/exam/sample-exam-data";

interface ExamQuestionViewProps {
  question: ExamQuestionItem;
  questionNumber: number;
  totalQuestions: number;
  currentResponse: Record<string, unknown> | undefined;
  isFlagged: boolean;
  onSaveAnswer: (response: Record<string, unknown>, flagged: boolean, advanceToNext: boolean) => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  fontSize?: "normal" | "large" | "xlarge";
}

export function ExamQuestionView({
  question,
  questionNumber,
  totalQuestions,
  currentResponse,
  isFlagged,
  onSaveAnswer,
  onPrevious,
  isFirst,
  isLast,
  fontSize = "normal",
}: ExamQuestionViewProps) {
  // Local state for options selected
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    (currentResponse?.selectedOptionId as string) || ""
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    (currentResponse?.selectedOptionIds as string[]) || []
  );
  const [numericalValue, setNumericalValue] = useState<string>(
    (currentResponse?.numericalValue as string) || ""
  );
  const [descriptiveText, setDescriptiveText] = useState<string>(
    (currentResponse?.descriptiveText as string) || ""
  );
  const [flagged, setFlagged] = useState<boolean>(isFlagged);

  // Sync state whenever question or external response changes
  useEffect(() => {
    setSelectedOptionId((currentResponse?.selectedOptionId as string) || "");
    setSelectedOptionIds((currentResponse?.selectedOptionIds as string[]) || []);
    setNumericalValue((currentResponse?.numericalValue as string) || "");
    setDescriptiveText((currentResponse?.descriptiveText as string) || "");
    setFlagged(isFlagged);
  }, [question.id, currentResponse, isFlagged]);

  const questionKey = question.id;

  // Helper to get current response payload
  function getCurrentPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    if (question.type === "mcq_single" || question.type === "true_false") {
      if (selectedOptionId) payload.selectedOptionId = selectedOptionId;
    } else if (question.type === "mcq_multiple") {
      if (selectedOptionIds.length > 0) payload.selectedOptionIds = selectedOptionIds;
    } else if (question.type === "numerical") {
      if (numericalValue.trim()) payload.numericalValue = numericalValue.trim();
    } else if (question.type === "descriptive") {
      if (descriptiveText.trim()) payload.descriptiveText = descriptiveText.trim();
    }
    return payload;
  }

  // Toggle single MCQ option - Auto-saves immediately
  function handleSelectSingle(optId: string) {
    setSelectedOptionId(optId);
    onSaveAnswer({ selectedOptionId: optId }, flagged, false);
  }

  // Toggle multiple MCQ option - Auto-saves immediately
  function handleToggleMultiple(optId: string) {
    const nextIds = selectedOptionIds.includes(optId)
      ? selectedOptionIds.filter((id) => id !== optId)
      : [...selectedOptionIds, optId];
    setSelectedOptionIds(nextIds);
    onSaveAnswer({ selectedOptionIds: nextIds }, flagged, false);
  }

  // Clear answer
  function handleClear() {
    setSelectedOptionId("");
    setSelectedOptionIds([]);
    setNumericalValue("");
    setDescriptiveText("");
    onSaveAnswer({}, false, false);
  }

  // Previous Question - Auto-saves current selection first
  function handlePrevious() {
    const payload = getCurrentPayload();
    if (Object.keys(payload).length > 0) {
      onSaveAnswer(payload, flagged, false);
    }
    onPrevious();
  }

  // Save & Next
  function handleSaveAndNext() {
    const payload = getCurrentPayload();
    onSaveAnswer(payload, flagged, true);
  }

  // Mark for review & Next
  function handleMarkForReviewAndNext() {
    const payload = getCurrentPayload();
    const nextFlagState = !flagged;
    setFlagged(nextFlagState);
    onSaveAnswer(payload, nextFlagState, true);
  }

  // Dynamic typography classes
  const questionTitleClass =
    fontSize === "xlarge"
      ? "text-xl sm:text-2xl font-bold"
      : fontSize === "large"
      ? "text-lg sm:text-xl font-bold"
      : "text-base sm:text-lg font-bold";

  const optionTextClass =
    fontSize === "xlarge"
      ? "text-base sm:text-lg"
      : fontSize === "large"
      ? "text-sm sm:text-base"
      : "text-xs sm:text-sm";

  return (
    <div key={questionKey} className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* 1. Integrated Question Info Header */}
      <div className="h-12 px-4 sm:px-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Subject / Topic Info */}
        <div className="flex items-center gap-2 min-w-0">
          {question.subject ? (
            <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs truncate">
              {question.subject}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              Question #{questionNumber}
            </span>
          )}
          {question.topic && (
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline truncate">
              • {question.topic}
            </span>
          )}
        </div>

        {/* Right: Question Index & Scoring Badges */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200" title="Marks for correct answer">
              +{question.marks}.0
            </span>
            {question.negativeMarks > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200" title="Penalty for wrong answer">
                -{question.negativeMarks}.0
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Question Body (Scrollable if question or options are extensive) */}
      <div className="p-5 sm:p-7 flex-1 min-h-0 overflow-y-auto space-y-6">
        <div className="space-y-5">
          {/* Framed Question Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5 shadow-2xs">
            <h2 className={`${questionTitleClass} text-slate-900 leading-relaxed tracking-tight`}>
              {question.questionText}
            </h2>

            {/* Optional LaTeX Display Card */}
            {question.latexCode && (
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-indigo-950 font-mono text-xs overflow-x-auto shadow-2xs">
                <span className="text-[10px] text-slate-400 block uppercase font-sans mb-1 font-bold tracking-wider">
                  Mathematical Expression
                </span>
                <code className="text-indigo-900 font-semibold">{question.latexCode}</code>
              </div>
            )}

            {/* Optional Code Snippet Card */}
            {question.codeSnippet && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 font-mono text-xs shadow-sm">
                <div className="px-4 py-1.5 bg-slate-800 border-b border-slate-700 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{question.programmingLanguage || "Code Snippet"}</span>
                  </span>
                </div>
                <pre className="p-4 overflow-x-auto leading-relaxed">
                  <code>{question.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Options / Input Workspace */}
          <div className="space-y-3">
            {/* 1. MCQ Single / True False Options */}
            {(question.type === "mcq_single" || question.type === "true_false") && (
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Select one correct option:
                </span>
                <div className="space-y-2.5">
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    const letter = String.fromCharCode(65 + idx);

                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectSingle(opt.id)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-indigo-50/80 border-indigo-600 shadow-xs ring-1 ring-indigo-600/30"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-indigo-700 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <span className={`${optionTextClass} text-slate-800 font-medium leading-relaxed block`}>
                            {opt.text}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. MCQ Multiple Options */}
            {question.type === "mcq_multiple" && (
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Select all options that apply (Multiple correct answers):
                </span>
                <div className="space-y-2.5">
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOptionIds.includes(opt.id);
                    const letter = String.fromCharCode(65 + idx);

                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleToggleMultiple(opt.id)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-indigo-50/80 border-indigo-600 shadow-xs ring-1 ring-indigo-600/30"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-indigo-700 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <span className={`${optionTextClass} text-slate-800 font-medium leading-relaxed block`}>
                            {opt.text}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Numerical Input */}
            {question.type === "numerical" && (
              <div className="max-w-md space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enter Numerical Answer:</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={numericalValue}
                  onChange={(e) => {
                    setNumericalValue(e.target.value);
                    if (e.target.value.trim()) {
                      onSaveAnswer({ numericalValue: e.target.value.trim() }, flagged, false);
                    }
                  }}
                  onBlur={() => {
                    onSaveAnswer({ numericalValue: numericalValue.trim() }, flagged, false);
                  }}
                  placeholder="Type numeric value here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-[11px] text-slate-500 block">
                  Enter numeric decimal or integer answer. Negative marking is not applicable for numerical responses.
                </span>
              </div>
            )}

            {/* 4. Descriptive Input */}
            {question.type === "descriptive" && (
              <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">
                    Research / Essay Response:
                  </label>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>
                      Words:{" "}
                      <strong className="text-indigo-700 font-bold">
                        {descriptiveText.trim() ? descriptiveText.trim().split(/\s+/).length : 0}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{descriptiveText.length} chars</span>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={descriptiveText}
                  onChange={(e) => {
                    setDescriptiveText(e.target.value);
                  }}
                  onBlur={() => {
                    onSaveAnswer({ descriptiveText: descriptiveText.trim() }, flagged, false);
                  }}
                  placeholder="Type your structured academic response here..."
                  className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 leading-relaxed font-sans"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sticky Action Bar */}
      <div className="h-14 px-4 sm:px-6 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirst}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleMarkForReviewAndNext}
            className={`px-3.5 sm:px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
              flagged
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : "bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600 fill-current" />
            <span>{flagged ? "Flagged (Unmark)" : "Mark for Review & Next"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndNext}
            className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <span>{isLast ? "Save Response" : "Save & Next"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
