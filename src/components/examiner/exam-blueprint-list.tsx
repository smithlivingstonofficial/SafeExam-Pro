"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createExamAction } from "@/app/actions/examiner";
import {
  Layers,
  PlusCircle,
  Clock,
  Shield,
  FileCheck,
  ArrowRight,
  Settings2,
  FolderOpen,
  X,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  settings?: any;
  created_at: string;
}

interface ExamBlueprintListProps {
  exams: ExamItem[];
  examSectionsMap: Record<string, number>;
  examQuestionsCountMap: Record<string, number>;
}

export function ExamBlueprintList({
  exams,
  examSectionsMap,
  examQuestionsCountMap,
}: ExamBlueprintListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [requireSafeBrowser, setRequireSafeBrowser] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowBacktracking, setAllowBacktracking] = useState(true);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (instructions) formData.append("instructions", instructions);
    if (requireSafeBrowser) formData.append("requireSafeBrowser", "on");
    if (shuffleQuestions) formData.append("shuffleQuestions", "on");
    if (shuffleOptions) formData.append("shuffleOptions", "on");
    if (allowBacktracking) formData.append("allowBacktracking", "on");

    startTransition(async () => {
      const res = await createExamAction(formData);
      if (res.success && res.data) {
        setIsCreateModalOpen(false);
        router.push(`/examiner/exams/${(res.data as any).id}`);
      } else {
        alert(res.error || "Failed to create exam");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Examination Blueprints & Composer
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Assemble multi-section entrance exams, configure marking rules, and link verified universal and departmental questions.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Compose New Exam</span>
        </button>
      </div>

      {/* Exam Blueprints Grid */}
      <div className="space-y-4">
        {exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const secCount = examSectionsMap[exam.id] || 0;
              const qCount = examQuestionsCountMap[exam.id] || 0;
              const isPublished = exam.status === "published";

              return (
                <div
                  key={exam.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isPublished
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-3 line-clamp-1">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {exam.description || "University qualifying entrance assessment."}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>{secCount} {secCount === 1 ? "Section" : "Sections"}</span>
                      <span>•</span>
                      <span>{qCount} Questions Linked</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/examiner/exams/${exam.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 group"
                      >
                        <span>Open Composer</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Examination Blueprints Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create an exam blueprint to organize sections, configure marking rules, and assemble entrance test papers.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Compose First Exam</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Exam Blueprint Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  New Examination Blueprint
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up title, candidate instructions, and anti-cheat policies.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ph.D. Entrance Assessment 2026 — Engineering"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Syllabus Scope
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Standard doctoral qualifying examination syllabus..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Lockdown browser required. Scientific calculator allowed in Section B..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Anti-Cheat & Surveillance Policies
                </span>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireSafeBrowser}
                    onChange={(e) => setRequireSafeBrowser(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enforce Safe Lockdown Browser</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Randomize Question Sequence per Candidate</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Shuffle MCQ Options per Candidate</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowBacktracking}
                    onChange={(e) => setAllowBacktracking(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Allow Backtracking & Question Revisit</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Create & Launch Composer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
