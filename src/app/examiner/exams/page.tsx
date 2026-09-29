import { createClient } from "@/lib/supabase/server";
import { ExamBlueprintList } from "@/components/examiner/exam-blueprint-list";

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

  const sectionExamMap: Record<string, string> = {};
  const examSectionsMap: Record<string, number> = {};
  sections?.forEach((s) => {
    sectionExamMap[s.id] = s.exam_id;
    examSectionsMap[s.exam_id] = (examSectionsMap[s.exam_id] || 0) + 1;
  });

  const examQuestionsCountMap: Record<string, number> = {};
  sectionQuestions?.forEach((sq) => {
    const examId = sectionExamMap[sq.section_id];
    if (examId) {
      examQuestionsCountMap[examId] = (examQuestionsCountMap[examId] || 0) + 1;
    }
  });

  return (
    <ExamBlueprintList
      exams={(exams as any[]) || []}
      examSectionsMap={examSectionsMap}
      examQuestionsCountMap={examQuestionsCountMap}
    />
  );
}
