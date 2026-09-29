import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionForm } from "@/components/examiner/question-form";
import { ArrowLeft, ChevronRight, PenTool } from "lucide-react";

interface Props {
  params: Promise<{ bankId: string }>;
}

export default async function NewQuestionPage({ params }: Props) {
  const { bankId } = await params;
  const supabase = await createClient();

  const { data: bank } = await supabase
    .from("question_banks")
    .select("id, name")
    .eq("id", bankId)
    .single();

  if (!bank) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href={`/examiner/banks/${bank.id}`}
          className="hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{bank.name}</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-bold">New Question Item</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
          <PenTool className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Author Question Item
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add items to <span className="font-semibold text-slate-700">{bank.name}</span>. Supports LaTeX mathematics, MCQ single/multi, coding test cases, and difficulty indexing.
          </p>
        </div>
      </div>

      {/* Authoring Form */}
      <QuestionForm bankId={bank.id} bankName={bank.name} />
    </div>
  );
}
