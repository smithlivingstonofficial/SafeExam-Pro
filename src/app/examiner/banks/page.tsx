import { createClient } from "@/lib/supabase/server";
import { QuestionBankManager } from "@/components/examiner/question-bank-manager";

export default async function ExaminerQuestionBanksPage() {
  const supabase = await createClient();

  // Fetch all question banks
  const { data: banks } = await supabase
    .from("question_banks")
    .select(`
      id,
      name,
      description,
      is_common,
      department_id,
      created_at
    `)
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

  const departments = (depts || []) as RawDept[];

  // Fetch question counts per bank
  const { data: questions } = await supabase
    .from("questions")
    .select("bank_id, type, is_common, department_id");

  // Count questions per bank
  const questionCountMap: Record<string, number> = {};
  let totalCommonQuestions = 0;
  let totalDeptQuestions = 0;

  questions?.forEach((q) => {
    questionCountMap[q.bank_id] = (questionCountMap[q.bank_id] || 0) + 1;
    if (q.is_common !== false) {
      totalCommonQuestions++;
    } else {
      totalDeptQuestions++;
    }
  });

  const totalQuestions = questions?.length || 0;

  return (
    <QuestionBankManager
      banks={(banks as any[]) || []}
      departments={departments}
      questionCountMap={questionCountMap}
      totalQuestions={totalQuestions}
      totalCommonQuestions={totalCommonQuestions}
      totalDeptQuestions={totalDeptQuestions}
    />
  );
}
