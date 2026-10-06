import { requireRole } from "@/lib/auth/rbac";
import { getUniversitySettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { AdminDocsClient } from "@/components/admin/admin-docs-client";

export const dynamic = "force-dynamic";

export default async function AdminDocsPage() {
  // Strict admin-only access
  const user = await requireRole(["admin"]);
  const settings = await getUniversitySettings();
  const supabase = await createClient();

  // Fetch live system stats for contextual guidance in the docs
  const [
    { count: departmentsCount },
    { count: candidatesCount },
    { count: facultyCount },
    { count: examsCount },
    { count: schedulesCount },
    { count: activeProctorSessionsCount },
  ] = await Promise.all([
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["examiner", "proctor", "admin"]),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("exam_schedules").select("*", { count: "exact", head: true }),
    supabase.from("exam_assignments").select("*", { count: "exact", head: true }).eq("status", "started"),
  ]);

  return (
    <AdminDocsClient
      adminName={user.fullName || "Administrator"}
      universityName={settings.name}
      stats={{
        departments: departmentsCount || 0,
        candidates: candidatesCount || 0,
        faculty: facultyCount || 0,
        exams: examsCount || 0,
        schedules: schedulesCount || 0,
        activeExams: activeProctorSessionsCount || 0,
      }}
    />
  );
}
