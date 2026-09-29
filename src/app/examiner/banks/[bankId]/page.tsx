import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteQuestionAction } from "@/app/actions/examiner";
import {
  BookOpen,
  PlusCircle,
  ArrowLeft,
  Trash2,
  Tag,
  CheckCircle2,
  Code2,
  Calculator,
  Filter,
  FileQuestion,
  ChevronRight,
} from "lucide-react";

interface Props {
  params: Promise<{ bankId: string }>;
}

export default async function QuestionBankDetailPage({ params }: Props) {
  const { bankId } = await params;
  const supabase = await createClient();

  // Fetch question bank details
  const { data: bank } = await supabase
    .from("question_banks")
    .select("id, name, description, created_at")
    .eq("id", bankId)
    .single();

  if (!bank) {
    notFound();
  }

  // Fetch all questions in this bank
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("bank_id", bankId)
    .order("created_at", { ascending: false });

  const totalQuestions = questions?.length || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href="/examiner"
          className="hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Question Banks</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-bold truncate">{bank.name}</span>
      </div>

      {/* Bank Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              Department Repository
            </span>
            <span className="text-xs font-bold text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              {totalQuestions} {totalQuestions === 1 ? "Item" : "Items"} Total
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{bank.name}</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {bank.description || "All items adhere to verified institutional entrance syllabus."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/examiner/banks/${bank.id}/new-question`}
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Author Question</span>
          </Link>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-indigo-600" />
            <span>Repository Questions</span>
          </h2>
          <span className="text-xs text-slate-500">
            Showing {totalQuestions} active questions
          </span>
        </div>

        {questions && questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q, index) => {
              const content = q.content as {
                text?: string;
                latex?: string;
                codeSnippet?: string;
                programmingLanguage?: string;
              } | null;

              const options = (q.options as Array<{ id: string; text: string }>) || [];
              const correctAnswer = q.correct_answer;

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-indigo-200 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                        Q{index + 1}
                      </span>

                      <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800">
                        {q.type.replace("_", " ")}
                      </span>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {q.subject}
                      </span>

                      {q.topic && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                          {q.topic}
                        </span>
                      )}

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                        Difficulty: {q.difficulty}/5
                      </span>

                      {q.bloom_level && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                          Bloom: {q.bloom_level}
                        </span>
                      )}
                    </div>

                    <form
                      action={async () => {
                        "use server";
                        await deleteQuestionAction(q.id, bank.id);
                      }}
                    >
                      <button
                        type="submit"
                        title="Delete Question"
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* Question Body */}
                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {content?.text || "No question statement provided."}
                  </div>

                  {/* LaTeX Math Formula */}
                  {content?.latex && (
                    <div className="p-3.5 bg-slate-50 border border-indigo-200/80 rounded-xl font-mono text-xs text-indigo-950">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">
                        Mathematical Formula:
                      </span>
                      {content.latex}
                    </div>
                  )}

                  {/* Code Snippet for coding questions */}
                  {content?.codeSnippet && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
                      <div className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-2">
                        Starter Template ({content.programmingLanguage || "Code"}):
                      </div>
                      <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                        {content.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Options List */}
                  {options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {options.map((opt, optIdx) => {
                        const isCorrect =
                          Array.isArray(correctAnswer)
                            ? correctAnswer.includes(opt.id)
                            : correctAnswer === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
                              isCorrect
                                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Solution Rationale */}
                  {q.explanation && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-700">
                      <span className="font-bold text-indigo-900 block mb-0.5">
                        Grading Explanation / Reference:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Questions in this Bank Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start building this repository with single/multi-choice MCQs, LaTeX math equations, or coding test questions.
            </p>
            <div className="mt-4">
              <Link
                href={`/examiner/banks/${bank.id}/new-question`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Author First Question</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
