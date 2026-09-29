import { createClient } from "@/lib/supabase/server";
import { RegisterFormClient } from "@/components/auth/register-form-client";

const DEFAULT_DEPARTMENTS = [
  "Master of Computer Applications (MCA)",
  "Computer Science & Engineering (Ph.D / M.Tech)",
  "Information Technology & Data Science",
  "Electronics & Communication Engineering",
  "Mathematical Sciences & Statistics",
  "Physical Sciences & Nanotechnology",
  "Biotechnology & Bioinformatics",
  "Management Studies & MBA",
];

export default async function RegisterPage() {
  const supabase = await createClient();

  // Fetch real academic departments from Supabase
  const { data: depts } = await supabase
    .from("departments")
    .select("name, code")
    .order("name", { ascending: true });

  const departmentList: string[] =
    depts && depts.length > 0
      ? depts.map((d) => (d.code ? `${d.name} (${d.code})` : d.name))
      : DEFAULT_DEPARTMENTS;

  return <RegisterFormClient departments={departmentList} />;
}
