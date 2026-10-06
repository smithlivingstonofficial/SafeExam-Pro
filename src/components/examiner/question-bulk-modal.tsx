"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { parseCsv, generateCsv, downloadCsvFile } from "@/lib/bulk-upload/csv-parser";
import { parseAikenFormat, validateQuestionCsvRow, DepartmentReference } from "@/lib/bulk-upload/question-parser";
import { bulkCreateQuestionsAction } from "@/app/actions/examiner";
import { BulkQuestionItemInput } from "@/lib/validations/examiner";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ArrowRight,
  HelpCircle,
  Sparkles,
  BookOpen,
  Globe,
  Building2,
} from "lucide-react";

interface QuestionBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  bankName: string;
  isCommon?: boolean | null;
  departmentId?: string | null;
  departments?: DepartmentReference[];
  onSuccess?: () => void;
}

type TabMode = "csv" | "aiken";
type Step = "input" | "preview" | "processing" | "complete";
type ScopeMode = "auto" | "common" | "dept";

const SAMPLE_CSV_QUESTIONS = [
  {
    question: "What is the average time complexity of QuickSort algorithm?",
    type: "mcq_single",
    option_a: "O(n log n)",
    option_b: "O(n^2)",
    option_c: "O(log n)",
    option_d: "O(n)",
    option_e: "O(1)",
    correct_answer: "A",
    difficulty: "medium",
    explanation: "QuickSort achieves O(n log n) average time by dividing array around a balanced pivot.",
    topic: "Sorting Algorithms",
  },
  {
    question: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
    type: "mcq_single",
    option_a: "Queue",
    option_b: "Stack",
    option_c: "Binary Tree",
    option_d: "Linked List",
    option_e: "",
    correct_answer: "B",
    difficulty: "easy",
    explanation: "A Stack pushes and pops items from the top, adhering to LIFO order.",
    topic: "Data Structures",
  },
  {
    question: "Which of the following are ACID properties in Database Management Systems?",
    type: "mcq_multiple",
    option_a: "Atomicity",
    option_b: "Consistency",
    option_c: "Isolation",
    option_d: "Durability",
    option_e: "Redundancy",
    correct_answer: "A,B,C,D",
    difficulty: "medium",
    explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability.",
    topic: "DBMS Fundamentals",
  },
];

const SAMPLE_AIKEN_TEXT = `What is the primary key constraint in relational databases?
A. Allows multiple null values
B. Uniquely identifies each row in a database table
C. Automatically defines foreign key references
D. Indexes character columns only
ANSWER: B

Which language is primarily used for asynchronous event-driven web servers?
A. Node.js (JavaScript)
B. Fortran
C. COBOL
D. Pascal
ANSWER: A

In object-oriented programming, which concept refers to bundling data and methods?
A. Inheritance
B. Polymorphism
C. Encapsulation
D. Abstraction
ANSWER: C`;

export function QuestionBulkModal({
  isOpen,
  onClose,
  bankId,
  bankName,
  isCommon = true,
  departmentId,
  departments = [],
  onSuccess,
}: QuestionBulkModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tabMode, setTabMode] = useState<TabMode>("csv");
  const [step, setStep] = useState<Step>("input");
  const [aikenText, setAikenText] = useState(SAMPLE_AIKEN_TEXT);
  const [fileName, setFileName] = useState("");

  // Scope Preference
  const [scopeMode, setScopeMode] = useState<ScopeMode>("auto");
  const [targetDeptId, setTargetDeptId] = useState<string>(
    departmentId || (departments.length > 0 ? departments[0].id : "")
  );

  const deptMap = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments]
  );

  const [validatedQuestions, setValidatedQuestions] = useState<
    Array<{
      rowNumber: number;
      statement: string;
      type: string;
      answerKey: string;
      isCommon: boolean;
      departmentId?: string | null;
      isValid: boolean;
      errors: string[];
      parsed?: BulkQuestionItemInput;
    }>
  >([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  if (!isOpen) return null;

  const validQuestions = validatedQuestions.filter((q) => q.isValid);
  const invalidQuestions = validatedQuestions.filter((q) => !q.isValid);
  const commonQuestionsCount = validQuestions.filter((q) => q.isCommon).length;
  const deptQuestionsCount = validQuestions.filter((q) => !q.isCommon).length;

  function resetState() {
    setStep("input");
    setFileName("");
    setValidatedQuestions([]);
    setIsProcessing(false);
    setServerError(null);
    setCreatedCount(0);
    setScopeMode("auto");
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // Download Sample CSV Template (50 Questions)
  async function handleDownloadCsvTemplate() {
    try {
      const res = await fetch("/api/examiner/questions/sample-csv");
      if (res.ok) {
        const text = await res.text();
        downloadCsvFile("questions_50_bulk_upload_template.csv", text);
        return;
      }
    } catch (e) {
      console.warn("Could not fetch 50-question API template, using fallback", e);
    }

    const columns = [
      { key: "question", label: "Question Statement" },
      { key: "type", label: "Question Type" },
      { key: "option_a", label: "Option A" },
      { key: "option_b", label: "Option B" },
      { key: "option_c", label: "Option C" },
      { key: "option_d", label: "Option D" },
      { key: "option_e", label: "Option E" },
      { key: "correct_answer", label: "Correct Answer Key" },
      { key: "difficulty", label: "Difficulty (easy/medium/hard)" },
      { key: "explanation", label: "Explanation" },
      { key: "topic", label: "Topic" },
      { key: "scope", label: "Scope (Common / Dept-Specific)" },
      { key: "department", label: "Department Code (e.g. MCA, CSE)" },
    ];

    const csv = generateCsv(columns, SAMPLE_CSV_QUESTIONS);
    downloadCsvFile("questions_50_bulk_upload_template.csv", csv);
  }

  // Handle CSV file selection
  function handleCsvFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setServerError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsv(text);

        if (parsed.rows.length === 0) {
          setServerError("The uploaded CSV file contains no questions.");
          return;
        }

        const evaluated = parsed.rows.map((row, idx) => {
          const defaultBankCommon =
            scopeMode === "common"
              ? true
              : scopeMode === "dept"
              ? false
              : isCommon !== false;

          const defaultDept =
            scopeMode === "dept"
              ? targetDeptId
              : isCommon === false
              ? departmentId
              : undefined;

          const res = validateQuestionCsvRow(
            row,
            bankName,
            defaultBankCommon,
            defaultDept,
            departments
          );

          let finalIsCommon = res.parsed?.isCommon !== false;
          let finalDeptId = res.parsed?.departmentId;

          // Override if user explicitly forced scopeMode
          if (scopeMode === "common") {
            finalIsCommon = true;
            finalDeptId = undefined;
          } else if (scopeMode === "dept") {
            finalIsCommon = false;
            finalDeptId = targetDeptId || res.parsed?.departmentId;
          }

          return {
            rowNumber: idx + 1,
            statement: (row.questionText || row.question || "").trim(),
            type: res.parsed?.type || "mcq_single",
            answerKey: (row.correctAnswer || row.answer || "").trim(),
            isCommon: finalIsCommon,
            departmentId: finalDeptId,
            isValid: res.isValid,
            errors: res.errors,
            parsed: res.parsed
              ? {
                  ...res.parsed,
                  isCommon: finalIsCommon,
                  departmentId: finalIsCommon ? undefined : finalDeptId,
                }
              : undefined,
          };
        });

        setValidatedQuestions(evaluated);
        setStep("preview");
      } catch {
        setServerError("Failed to parse CSV file. Ensure valid CSV encoding.");
      }
    };
    reader.readAsText(file);
  }

  // Process Aiken Format
  function handleProcessAikenText() {
    setServerError(null);
    if (!aikenText.trim()) {
      setServerError("Please enter or paste Aiken formatted questions.");
      return;
    }

    const defaultBankCommon =
      scopeMode === "common"
        ? true
        : scopeMode === "dept"
        ? false
        : isCommon !== false;

    const defaultDept =
      scopeMode === "dept"
        ? targetDeptId
        : isCommon === false
        ? departmentId
        : undefined;

    const parsedAiken = parseAikenFormat(
      aikenText,
      bankName,
      defaultBankCommon,
      defaultDept
    );

    if (parsedAiken.length === 0) {
      setServerError("Could not detect any valid questions in Aiken format.");
      return;
    }

    const evaluated = parsedAiken.map((q, idx) => {
      let finalIsCommon = q.parsed?.isCommon !== false;
      let finalDeptId = q.parsed?.departmentId;

      if (scopeMode === "common") {
        finalIsCommon = true;
        finalDeptId = undefined;
      } else if (scopeMode === "dept") {
        finalIsCommon = false;
        finalDeptId = targetDeptId || q.parsed?.departmentId;
      }

      return {
        rowNumber: idx + 1,
        statement: q.parsed?.questionText || q.raw.text || "Question",
        type: q.parsed?.type || "mcq_single",
        answerKey: q.raw.answer || "N/A",
        isCommon: finalIsCommon,
        departmentId: finalDeptId,
        isValid: q.isValid,
        errors: q.errors,
        parsed: q.parsed
          ? {
              ...q.parsed,
              isCommon: finalIsCommon,
              departmentId: finalIsCommon ? undefined : finalDeptId,
            }
          : undefined,
      };
    });

    setValidatedQuestions(evaluated);
    setStep("preview");
  }

  // Confirm Import
  async function handleConfirmImport() {
    if (validQuestions.length === 0) return;

    setIsProcessing(true);
    setStep("processing");
    setServerError(null);

    try {
      const itemsToIngest = validQuestions.map((q) => q.parsed).filter((p): p is BulkQuestionItemInput => Boolean(p));
      const res = await bulkCreateQuestionsAction(bankId, itemsToIngest);

      if (!res.success || !res.data) {
        setServerError(res.error || "Failed to import questions.");
        setStep("preview");
      } else {
        setCreatedCount(res.data.createdCount);
        setStep("complete");
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Server error during question import.");
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Bulk Import Questions
              </h2>
              <p className="text-[11px] text-slate-500">
                Target Bank: <strong className="text-slate-700">{bankName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* STEP 1: INPUT */}
          {step === "input" && (
            <div className="space-y-4">
              {/* Format Switcher */}
              <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setTabMode("csv")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tabMode === "csv"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Spreadsheet (CSV Format)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabMode("aiken")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tabMode === "aiken"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Aiken Standard Text Format</span>
                </button>
              </div>

              {/* Academic Scope Configuration Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Academic Scope & Department Criteria
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Controls Part A (Common) vs Part B (Dept) tagging
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScopeMode("auto")}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      scopeMode === "auto"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Auto-Detect</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      From tags & columns
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeMode("common")}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      scopeMode === "common"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>All Universal</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      100% common pool
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeMode("dept")}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      scopeMode === "dept"
                        ? "bg-purple-50 border-purple-300 text-purple-950 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Dept-Specific</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      Force department
                    </div>
                  </button>
                </div>

                {scopeMode === "dept" && departments.length > 0 && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Select Target Academic Department:
                    </label>
                    <select
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white text-slate-900 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {tabMode === "csv" ? (
                <div className="space-y-4">
                  {/* Template Card */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          Pre-Formatted Question Template
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Download the sample CSV spreadsheet with single/multi-choice sample questions and department tags.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .CSV Template</span>
                    </button>
                  </div>

                  {/* Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvFileSelected}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 group-hover:text-indigo-700 group-hover:border-indigo-300 flex items-center justify-center mx-auto mb-3 transition-colors shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Click to choose question CSV or drag and drop
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Batch ingestion up to 1,000 items per question bank
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Paste Aiken Formatted Questions
                    </span>
                    <button
                      type="button"
                      onClick={() => setAikenText(SAMPLE_AIKEN_TEXT)}
                      className="text-indigo-600 hover:underline text-[11px] font-semibold"
                    >
                      Reset to Sample
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={aikenText}
                    onChange={(e) => setAikenText(e.target.value)}
                    placeholder="Enter questions statement followed by options and ANSWER: X"
                    className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
                  />

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      <strong>Aiken Rule:</strong> Question statement on top, choices labeled A. B. C. D., ending with <code className="font-mono font-bold text-slate-700">ANSWER: X</code>. Separate questions with a blank line.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && (
            <div className="space-y-5">
              {/* Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Items</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {validatedQuestions.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] uppercase font-bold text-indigo-700">Universal Common</div>
                  <div className="text-lg font-extrabold text-indigo-900 mt-0.5">
                    {commonQuestionsCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] uppercase font-bold text-purple-700">Dept-Specific</div>
                  <div className="text-lg font-extrabold text-purple-900 mt-0.5">
                    {deptQuestionsCount}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    invalidQuestions.length > 0
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold">
                    {invalidQuestions.length > 0 ? "Invalid Syntax" : "All Valid Ready"}
                  </div>
                  <div className="text-lg font-extrabold mt-0.5">
                    {invalidQuestions.length > 0 ? invalidQuestions.length : validQuestions.length}
                  </div>
                </div>
              </div>

              {invalidQuestions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{invalidQuestions.length} item(s) failed syntax checks and will be omitted:</span>
                  </div>
                  <div className="text-[11px] font-medium text-rose-700 pl-5 space-y-1 max-h-24 overflow-y-auto">
                    {invalidQuestions.slice(0, 4).map((q) => (
                      <div key={q.rowNumber}>
                        Item #{q.rowNumber}: {q.errors.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Preview Data ({validatedQuestions.length} Total Items)
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Question Statement</th>
                        <th className="py-2.5 px-3">Scope / Department</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Answer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validatedQuestions.slice(0, 10).map((q) => {
                        const boundDept = q.departmentId ? deptMap.get(q.departmentId) : null;

                        return (
                          <tr key={q.rowNumber} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              {q.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">#{q.rowNumber}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-xs">
                              {q.statement}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {q.isCommon ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Globe className="w-3 h-3 text-indigo-500" />
                                  <span>Universal</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Building2 className="w-3 h-3 text-purple-500" />
                                  <span>{boundDept?.code || boundDept?.name || "Dept Specific"}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                {q.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-indigo-700">
                              {q.answerKey}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === "processing" && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Saving {validQuestions.length} Questions to Bank...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Batch writing structured item choices, answer keys, and LaTeX parameters into database.
              </p>
            </div>
          )}

          {/* STEP 4: COMPLETE */}
          {step === "complete" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {createdCount} Questions Imported Successfully
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Questions are now active and ready for exam blueprint composition.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          {step === "input" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {tabMode === "csv" ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Question CSV</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProcessAikenText}
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Parse Questions →</span>
                </button>
              )}
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("input")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validQuestions.length === 0 || isProcessing}
                className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Commit {validQuestions.length} Questions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  router.refresh();
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Done & View Bank
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
