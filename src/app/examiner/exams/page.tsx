import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
} from "lucide-react";

export default async function ExaminerExamsPage() {
  const supabase = await createClient();

  // Fetch all exams
  const { data: exams } = await supabase
    .from("exams")
    .select(`
      id,
      title,
      description,
      status,
      settings,
      created_at
    `)
    .order("created_at", { ascending: false });

  // Fetch sections and assigned questions to compute counts
  const { data: sections } = await supabase
    .from("exam_sections")
    .select("id, exam_id, title");

  const { data: sectionQuestions } = await supabase
    .from("exam_section_questions")
    .select("id, section_id, marks");

  // Build section and question count maps
  const examSectionsMap: Record<string, number> = {};
  sections?.forEach((s) => {
    examSectionsMap[s.exam_id] = (examSectionsMap[s.exam_id] || 0) + 1;
  });

  const totalExams = exams?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header with Exam Creation Dialog */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Examination Blueprints & Composer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assemble multi-section entrance exams, configure marking rules, and link verified questions.
          </p>
        </div>

        <details className="group relative">
          <summary className="list-none inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer select-none transition-all">
            <PlusCircle className="w-4 h-4" />
            <span>Compose New Exam</span>
          </summary>

          <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl z-30">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              New Examination Blueprint
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set up title, instructions, and anti-cheat policies.
            </p>

            <form
              action={async (formData: FormData) => {
                "use server";
                await createExamAction(formData);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Ph.D. Entrance Assessment 2026 — Engineering"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Standard doctoral qualifying examination syllabus..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Instructions
                </label>
                <textarea
                  name="instructions"
                  rows={2}
                  placeholder="Calculator permitted in Section B only. Safe lockdown browser required."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  Security & Anti-Cheat Controls
                </span>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireSafeBrowser"
                    defaultChecked
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enforce Safe Lockdown Browser</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="shuffleQuestions"
                    defaultChecked
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Randomize Question Sequence per Candidate</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="shuffleOptions"
                    defaultChecked
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Shuffle MCQ Options per Candidate</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowBacktracking"
                    defaultChecked
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Allow Backtracking & Question Revisit</span>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  Create Blueprint
                </button>
              </div>
            </form>
          </div>
        </details>
      </div>

      {/* Exam Blueprints Grid */}
      <div className="space-y-4">
        {exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const secCount = examSectionsMap[exam.id] || 0;
              const settings = exam.settings as {
                require_safe_browser?: boolean;
                shuffle_questions?: boolean;
              } | null;

              return (
                <div
                  key={exam.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                          exam.status === "published"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : exam.status === "archived"
                            ? "bg-slate-100 border-slate-200 text-slate-600"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        {exam.status}
                      </span>

                      {settings?.require_safe_browser && (
                        <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          <Shield className="w-3 h-3" />
                          <span>Lockdown On</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mt-3">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {exam.description || "Comprehensive entrance examination blueprint."}
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {secCount} {secCount === 1 ? "Section" : "Sections"}
                      </span>
                      <span>•</span>
                      <span>Created {new Date(exam.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/examiner/exams/${exam.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 group"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Edit Blueprint & Sections</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Examination Blueprints Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Use the &ldquo;Compose New Exam&rdquo; button above to create an exam blueprint, organize sections, and link verified questions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
