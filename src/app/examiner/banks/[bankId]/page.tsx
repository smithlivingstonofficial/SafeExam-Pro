import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankViewer } from "@/components/examiner/question-bank-viewer";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ bankId: string }>;
}

export default async function QuestionBankDetailPage({ params }: Props) {
  const { bankId } = await params;
  const supabase = await createClient();

  // Fetch question bank details
  const { data: bank } = await supabase
    .from("question_banks")
    .select("id, name, description, is_common, department_id, created_at")
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

  // Fetch all departments
  const { data: depts } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name", { ascending: true });

  interface RawDept {
    id: string;
    name: string;
    code: string | null;
  }

  const departments = ((depts || []) as RawDept[]).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }));

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

      {/* Main Interactive Question Bank Viewer */}
      <QuestionBankViewer
        bank={bank}
        initialQuestions={(questions as any[]) || []}
        departments={departments}
      />
    </div>
  );
}
