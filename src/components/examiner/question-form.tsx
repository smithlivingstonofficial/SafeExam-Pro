"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuestionAction } from "@/app/actions/examiner";
import {
  Code,
  CheckCircle,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  Calculator,
  Binary,
  BookOpen,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface QuestionFormProps {
  bankId: string;
  bankName: string;
  availableDepartments?: Array<{ id: string; name: string; code?: string | null }>;
}

export function QuestionForm({
  bankId,
  bankName,
  availableDepartments = [],
}: QuestionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Department & Applicability Criteria
  const [isCommon, setIsCommon] = useState<boolean>(true);
  const [departmentId, setDepartmentId] = useState<string>("");

  // Form State
  const [type, setType] = useState<
    "mcq_single" | "mcq_multiple" | "true_false" | "fill_blank" | "numerical" | "descriptive" | "coding"
  >("mcq_single");

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [bloomLevel, setBloomLevel] = useState("Applying");
  const [questionText, setQuestionText] = useState("");
  const [latexCode, setLatexCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [correctAnswerText, setCorrectAnswerText] = useState("");

  // Options for MCQ
  const [options, setOptions] = useState([
    { id: "opt_1", text: "", isCorrect: true },
    { id: "opt_2", text: "", isCorrect: false },
    { id: "opt_3", text: "", isCorrect: false },
    { id: "opt_4", text: "", isCorrect: false },
  ]);

  // Coding specific
  const [language, setLanguage] = useState("python");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [testCases, setTestCases] = useState([
    { input: "5\n1 2 3 4 5", output: "15", isHidden: false },
  ]);

  // Handlers
  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: `opt_${Date.now()}`, text: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text } : opt))
    );
  };

  const handleOptionCorrectToggle = (index: number) => {
    if (type === "mcq_single" || type === "true_false") {
      setOptions((prev) =>
        prev.map((opt, i) => ({ ...opt, isCorrect: i === index }))
      );
    } else {
      setOptions((prev) =>
        prev.map((opt, i) =>
          i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
        )
      );
    }
  };

  const handleAddTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: "", output: "", isHidden: false },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isCommon && !departmentId) {
      setError("Please select a specific academic department for this question.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        bankId,
        type,
        subject: subject || "Core Examination",
        topic: topic || null,
        subTopic: subTopic || null,
        difficulty: Number(difficulty),
        bloomLevel: bloomLevel || null,
        questionText,
        latexCode: latexCode || null,
        explanation: explanation || null,
        isCommon,
        departmentId: isCommon ? null : (departmentId || null),
        options: type.startsWith("mcq") || type === "true_false" ? options : [],
        correctAnswerText:
          type === "fill_blank" || type === "numerical" || type === "descriptive"
            ? correctAnswerText
            : null,
        codeSnippet: type === "coding" ? codeSnippet : null,
        programmingLanguage: type === "coding" ? language : null,
        testCases: type === "coding" ? testCases : [],
        tags: [subject, topic].filter(Boolean),
      };

      const result = await createQuestionAction(payload);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/examiner/banks/${bankId}`);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Item Type & Metadata Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Question Format & Classification</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Question Type *
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as any;
                setType(newType);
                if (newType === "true_false") {
                  setOptions([
                    { id: "opt_t", text: "True", isCorrect: true },
                    { id: "opt_f", text: "False", isCorrect: false },
                  ]);
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            >
              <option value="mcq_single">Single Choice MCQ</option>
              <option value="mcq_multiple">Multiple Choice MCQ (Multi-select)</option>
              <option value="true_false">True / False</option>
              <option value="numerical">Numerical Response</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="descriptive">Descriptive / Essay</option>
              <option value="coding">Automated Code Execution</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Area *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Distributed Operating Systems"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic / Unit
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Consensus Protocols (Paxos / Raft)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Difficulty Level (1 = Easy, 5 = Doctoral)
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            >
              <option value={1}>Level 1 - Fundamental</option>
              <option value={2}>Level 2 - Intermediate</option>
              <option value={3}>Level 3 - Advanced UG/PG</option>
              <option value={4}>Level 4 - Entrance Specialist</option>
              <option value={5}>Level 5 - Research & Doctoral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bloom's Taxonomy Level
            </label>
            <select
              value={bloomLevel}
              onChange={(e) => setBloomLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            >
              <option value="Remembering">Remembering (Recall facts)</option>
              <option value="Understanding">Understanding (Explain ideas)</option>
              <option value="Applying">Applying (Use information in new situations)</option>
              <option value="Analyzing">Analyzing (Draw connections)</option>
              <option value="Evaluating">Evaluating (Justify a stance)</option>
              <option value="Creating">Creating (Produce new work)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sub-Topic / Tag
            </label>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              placeholder="e.g. Byzantine Fault Tolerance"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Academic Applicability & Department Criteria Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Academic Applicability & Department Criteria</span>
            </h2>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                isCommon
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-purple-50 border-purple-200 text-purple-700"
              }`}
            >
              {isCommon ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Universal Common</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3 h-3" />
                  <span>Department Specific</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Specify whether this item is universally served to all doctoral candidates or strictly reserved for a single enrolled department.
          </p>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Universal Common Option */}
          <button
            type="button"
            onClick={() => {
              setIsCommon(true);
              setDepartmentId("");
            }}
            className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
              isCommon
                ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isCommon
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    Universal / Common Question
                  </span>
                  {isCommon && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Delivered to <strong>all doctoral candidates</strong> across every department (e.g., General Research Methodology, Logic & Verbal Aptitude).
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Available to 100% of candidate pool</span>
            </div>
          </button>

          {/* Department Specific Option */}
          <button
            type="button"
            onClick={() => setIsCommon(false)}
            className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
              !isCommon
                ? "border-purple-600 bg-purple-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !isCommon
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    Department-Specific Question
                  </span>
                  {!isCommon && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Strictly restricted to candidates enrolled in the <strong>designated department</strong>. Candidates from other disciplines will never see this item.
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Matched via candidate Department ID</span>
            </div>
          </button>
        </div>

        {/* Department Dropdown (shown only when !isCommon) */}
        {!isCommon && (
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="departmentSelect"
                className="text-xs font-bold text-purple-950 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Select Target Academic Department *</span>
              </label>
              <span className="text-[10px] font-semibold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">
                Required for Departmental Items
              </span>
            </div>

            <select
              id="departmentSelect"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white text-slate-900 font-medium"
            >
              <option value="">-- Choose Academic Department --</option>
              {availableDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ""}
                </option>
              ))}
            </select>

            {availableDepartments.length === 0 && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                No departments available. Please create departments under Admin &gt; Departments first.
              </p>
            )}

            <div className="text-[11px] text-purple-800/80 bg-white/80 p-2.5 rounded-lg border border-purple-100 flex items-start gap-2">
              <span className="font-bold text-purple-700">Relational Rule:</span>
              <span>
                During automated question dispatching, the engine validates that candidate&#39;s <code className="font-mono bg-purple-100/60 px-1 py-0.5 rounded">profiles.department_id</code> matches this question&#39;s department foreign key.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Question Statement & LaTeX Math Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span>Question Statement & Mathematical Formulation</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Question Text *
          </label>
          <textarea
            required
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="State the problem clearly. Mention assumptions, input constraints, or problem context..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
          ></textarea>
        </div>

        {/* Optional LaTeX Math Expression */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>LaTeX Math Expression (Optional)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {"e.g. \\sum_{i=1}^n x_i^2 = \\frac{n(n+1)(2n+1)}{6}"}
            </span>
          </div>
          <input
            type="text"
            value={latexCode}
            onChange={(e) => setLatexCode(e.target.value)}
            placeholder="\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-900"
          />

          {latexCode && (
            <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs text-indigo-950 font-mono shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">
                Rendered Formula Notation:
              </span>
              <span className="text-sm font-semibold tracking-wide text-slate-900">
                {latexCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Answer Configuration Based on Question Type */}
      {(type === "mcq_single" || type === "mcq_multiple" || type === "true_false") && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Options & Correct Answer Selection</span>
            </h2>
            {type !== "true_false" && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Choice</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  opt.isCorrect
                    ? "bg-emerald-50/70 border-emerald-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleOptionCorrectToggle(idx)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    opt.isCorrect
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-300 text-slate-400 hover:border-emerald-500"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </button>

                <input
                  type="text"
                  required
                  value={opt.text}
                  disabled={type === "true_false"}
                  onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)} Statement`}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-900"
                />

                <span
                  onClick={() => handleOptionCorrectToggle(idx)}
                  className={`text-[11px] font-bold px-2 py-1 rounded cursor-pointer select-none ${
                    opt.isCorrect
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {opt.isCorrect ? "Correct Choice" : "Mark Correct"}
                </span>

                {type !== "true_false" && options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coding Question Setup */}
      {type === "coding" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" />
              <span>Programming Language & Test Harness</span>
            </h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
            >
              <option value="python">Python 3.12</option>
              <option value="cpp">C++ 20 (GCC)</option>
              <option value="java">Java 21 (OpenJDK)</option>
              <option value="typescript">TypeScript / Node.js</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Starter Code Template (Presented to Candidate)
            </label>
            <textarea
              rows={4}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="def solve(n, arr):&#10;    # Write your solution here&#10;    pass"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            ></textarea>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Automated Test Cases
              </label>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test Case</span>
              </button>
            </div>

            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 relative"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Standard Input (stdin)
                  </span>
                  <textarea
                    rows={2}
                    value={tc.input}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTestCases((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, input: val } : item
                        )
                      );
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                  ></textarea>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Expected Output (stdout)
                  </span>
                  <textarea
                    rows={2}
                    value={tc.output}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTestCases((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, output: val } : item
                        )
                      );
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                  ></textarea>
                </div>

                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(idx)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numerical / Fill-in / Descriptive Answer Box */}
      {(type === "fill_blank" || type === "numerical" || type === "descriptive") && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Target Answer / Scoring Rubric</span>
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {type === "numerical"
                ? "Accepted Exact Numeric Value"
                : type === "fill_blank"
                ? "Accepted Keyword or Phrase"
                : "Descriptive Rubric & Key Evaluation Criteria"}
            </label>
            <input
              type="text"
              required
              value={correctAnswerText}
              onChange={(e) => setCorrectAnswerText(e.target.value)}
              placeholder={
                type === "numerical"
                  ? "e.g. 42 or 3.14159"
                  : type === "fill_blank"
                  ? "e.g. Byzantine fault tolerance"
                  : "Key points candidate must explain..."
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
        </div>
      )}

      {/* Explanation & Rationale */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Solution Explanation & Educational Rationale</span>
        </h2>
        <textarea
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why the correct answer is valid, citing theorems, formulas, or standard textbooks. Displayed during candidate post-result review."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
        ></textarea>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          {submitting ? "Saving Item..." : "Publish to Question Bank"}
        </button>
      </div>
    </form>
  );
}
