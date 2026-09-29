import { createClient } from "@/lib/supabase/server";
import { DepartmentsClient, DepartmentItem } from "@/components/admin/departments-client";

export default async function DepartmentsPage() {
  const supabase = await createClient();

  // Fetch real departments from Supabase
  const { data: deptData } = await supabase
    .from("departments")
    .select("id, name, code, head_name, contact_email, description, created_at")
    .order("name", { ascending: true });

  // Fetch user profiles to calculate real staff and candidate counts per department
  const { data: profiles } = await supabase
    .from("profiles")
    .select("role, department");

  const examinerCountMap: Record<string, number> = {};
  const candidateCountMap: Record<string, number> = {};

  profiles?.forEach((p) => {
    if (!p.department) return;
    if (p.role === "examiner" || p.role === "admin" || p.role === "proctor") {
      examinerCountMap[p.department] = (examinerCountMap[p.department] || 0) + 1;
    } else if (p.role === "candidate") {
      candidateCountMap[p.department] = (candidateCountMap[p.department] || 0) + 1;
    }
  });

  const initialDepartments: DepartmentItem[] = (deptData || []).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code || undefined,
    head: d.head_name || "Not Assigned",
    contactEmail: d.contact_email || undefined,
    description: d.description || undefined,
    examiners: (examinerCountMap[d.name] || 0) + (d.code ? examinerCountMap[d.code] || 0 : 0),
    candidates: (candidateCountMap[d.name] || 0) + (d.code ? candidateCountMap[d.code] || 0 : 0),
    createdAt: d.created_at,
  }));

  return <DepartmentsClient initialDepartments={initialDepartments} />;
}
