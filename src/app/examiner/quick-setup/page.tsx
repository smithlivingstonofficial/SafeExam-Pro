import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import { ExamSetupWizard } from "@/components/examiner/exam-setup-wizard";

export const metadata: Metadata = {
  title: "Quick Exam Setup Wizard | SafeExam Pro",
  description: "Unified 4-step wizard to create entrance exams, configure 20/30 question blueprint, schedule and assign candidates.",
};

export default async function QuickExamSetupPage() {
  await requireRole(["examiner", "admin"]);
  const supabase = await createClient();

  // 1. Fetch departments
  const { data: rawDepts } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name", { ascending: true });

  const departments = (rawDepts || []).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }));

  // 2. Fetch question banks
  const { data: rawBanks } = await supabase
    .from("question_banks")
    .select("id, name, is_common, department_id")
    .order("name", { ascending: true });

  const questionBanks = (rawBanks || []).map((b) => ({
    id: b.id,
    name: b.name,
    isCommon: b.is_common,
    departmentId: b.department_id,
  }));

  // 3. Fetch questions with metadata needed for pool selection & auto-picking
  const { data: rawQuestions } = await supabase
    .from("questions")
    .select("id, bank_id, department_id, is_common, subject, topic, difficulty, type, content, options, correct_answer, explanation")
    .order("created_at", { ascending: false });

  const availableQuestions = (rawQuestions || []).map((q) => ({
    id: q.id,
    bank_id: q.bank_id,
    department_id: q.department_id,
    is_common: q.is_common,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    content: q.content,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
  }));

  // 4. Fetch candidate profiles
  const { data: rawCandidates } = await supabase
    .from("profiles")
    .select("id, full_name, department, department_id, is_active, metadata")
    .eq("role", "candidate")
    .order("full_name", { ascending: true });

  interface ProfileRow {
    id: string;
    full_name: string;
    department: string | null;
    department_id: string | null;
    is_active: boolean | null;
    metadata: any;
  }

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  const candidates = ((rawCandidates || []) as ProfileRow[]).map((c) => ({
    id: c.id,
    fullName: c.full_name,
    email: c.metadata?.email || c.department || "Candidate",
    departmentId: c.department_id,
    departmentName: c.department_id ? deptMap.get(c.department_id) : undefined,
    isActive: c.is_active !== false,
  }));

  return (
    <ExamSetupWizard
      departments={departments}
      availableQuestions={availableQuestions}
      questionBanks={questionBanks}
      candidates={candidates}
    />
  );
}
