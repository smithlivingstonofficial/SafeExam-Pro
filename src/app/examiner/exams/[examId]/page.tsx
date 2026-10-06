import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamBlueprintComposer } from "@/components/examiner/exam-blueprint-composer";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ examId: string }>;
}

export default async function ExamBlueprintDetailPage({ params }: Props) {
  const { examId } = await params;
  const supabase = await createClient();

  // Fetch exam blueprint
  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (!exam) {
    notFound();
  }

  // Fetch departments
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

  // Fetch sections
  const { data: sections } = await supabase
    .from("exam_sections")
    .select("*")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });

  // Fetch section questions
  const sectionIds = sections?.map((s) => s.id) || [];
  const { data: sectionQuestions } = await supabase
    .from("exam_section_questions")
    .select("id, section_id, question_id, order_index, marks")
    .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_index", { ascending: true });

  const linkedQuestionIds = sectionQuestions?.map((sq) => sq.question_id) || [];
  const { data: linkedQuestions } = await supabase
    .from("questions")
    .select("id, type, subject, difficulty, content, bank_id, is_common, department_id")
    .in("id", linkedQuestionIds.length ? linkedQuestionIds : ["00000000-0000-0000-0000-000000000000"]);

  // Fetch all available questions from banks for linking
  const { data: availableQuestions } = await supabase
    .from("questions")
    .select("id, subject, type, difficulty, content, bank_id, is_common, department_id")
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch question banks
  const { data: banks } = await supabase
    .from("question_banks")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <ExamBlueprintComposer
      exam={exam}
      initialSections={(sections as any[]) || []}
      initialSectionQuestions={(sectionQuestions as any[]) || []}
      initialLinkedQuestions={(linkedQuestions as any[]) || []}
      availableQuestions={(availableQuestions as any[]) || []}
      banks={(banks as any[]) || []}
      departments={departments}
    />
  );
}
