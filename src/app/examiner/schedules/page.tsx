import { createClient } from "@/lib/supabase/server";
import { ExamScheduleManager } from "@/components/examiner/exam-schedule-manager";

export default async function ExaminerSchedulesPage() {
  const supabase = await createClient();

  // Fetch all exam schedules
  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("*")
    .order("start_at", { ascending: true });

  // Fetch available exams
  const { data: availableExams } = await supabase
    .from("exams")
    .select("id, title, description, status")
    .order("title", { ascending: true });

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

  // Fetch assignments
  const { data: assignments } = await supabase
    .from("exam_assignments")
    .select("id, schedule_id, candidate_id, status, assigned_at");

  // Fetch all candidate profiles
  const { data: candidateProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, department, department_id, metadata")
    .eq("role", "candidate");

  interface ProfileRow {
    id: string;
    full_name: string;
    department: string | null;
    department_id: string | null;
    metadata: any;
  }

  const candidatePool = ((candidateProfiles || []) as ProfileRow[]).map((c) => ({
    id: c.id,
    fullName: c.full_name,
    email: c.metadata?.email || c.department || "Candidate",
    departmentId: c.department_id,
  }));

  return (
    <ExamScheduleManager
      schedules={(schedules as any[]) || []}
      availableExams={(availableExams as any[]) || []}
      departments={departments}
      initialAssignments={(assignments as any[]) || []}
      candidatePool={candidatePool}
    />
  );
}
