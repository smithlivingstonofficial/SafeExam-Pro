import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  DepartmentDetailClient,
  DepartmentProfile,
  DepartmentExam,
  DepartmentQuestionBank,
} from "@/components/admin/department-detail-client";
import { UserRole } from "@/types/database";

interface PageProps {
  params: Promise<{ departmentId: string }>;
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { departmentId } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Fetch Department Details
  const { data: dept, error: deptError } = await supabase
    .from("departments")
    .select("id, name, code, head_name, contact_email, description, created_at")
    .eq("id", departmentId)
    .single();

  if (deptError || !dept) {
    notFound();
  }

  // 2. Fetch Profiles for this department
  // Check both dept.name and dept.code if present
  let profilesQuery = adminClient
    .from("profiles")
    .select("id, full_name, role, department, is_active, created_at");

  if (dept.code) {
    profilesQuery = profilesQuery.or(`department.eq.${dept.name},department.eq.${dept.code}`);
  } else {
    profilesQuery = profilesQuery.eq("department", dept.name);
  }

  const { data: rawProfiles } = await profilesQuery.order("created_at", { ascending: false });

  // 3. Fetch user emails from auth.users
  const { data: authUsers } = await adminClient.auth.admin.listUsers();
  const emailMap = new Map<string, string>(
    (authUsers?.users || []).map((u: { id: string; email?: string }) => [u.id, u.email || ""])
  );

  interface RawProfile {
    id: string;
    full_name: string;
    role: UserRole;
    department: string | null;
    is_active: boolean;
    created_at: string;
  }

  const typedProfiles = (rawProfiles || []) as RawProfile[];

  const profileMap = new Map<string, string>(
    typedProfiles.map((p) => [p.id, p.full_name])
  );

  const allProfiles: DepartmentProfile[] = typedProfiles.map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: emailMap.get(p.id) || "No email registered",
    role: p.role,
    department: p.department,
    isActive: p.is_active,
    createdAt: p.created_at,
  }));

  const faculty = allProfiles.filter(
    (p) => p.role === "examiner" || p.role === "proctor" || p.role === "admin"
  );
  const candidates = allProfiles.filter((p) => p.role === "candidate");

  // 4. Fetch Question Banks and Exams created by department faculty
  const facultyIds = faculty.map((f) => f.id);

  let exams: DepartmentExam[] = [];
  let questionBanks: DepartmentQuestionBank[] = [];

  if (facultyIds.length > 0) {
    const { data: examData } = await adminClient
      .from("exams")
      .select("id, title, status, created_at, created_by")
      .in("created_by", facultyIds)
      .order("created_at", { ascending: false });

    interface RawExam {
      id: string;
      title: string;
      status: string;
      created_at: string;
      created_by: string | null;
    }

    if (examData) {
      exams = ((examData || []) as RawExam[]).map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        createdAt: e.created_at,
        creatorName: e.created_by ? profileMap.get(e.created_by) : undefined,
      }));
    }

    const { data: qbData } = await adminClient
      .from("question_banks")
      .select("id, name, description, created_at, created_by")
      .in("created_by", facultyIds)
      .order("created_at", { ascending: false });

    interface RawQuestionBank {
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      created_by: string | null;
    }

    if (qbData) {
      questionBanks = ((qbData || []) as RawQuestionBank[]).map((qb) => ({
        id: qb.id,
        name: qb.name,
        description: qb.description,
        createdAt: qb.created_at,
        creatorName: qb.created_by ? profileMap.get(qb.created_by) : undefined,
      }));
    }
  }

  return (
    <DepartmentDetailClient
      department={{
        id: dept.id,
        name: dept.name,
        code: dept.code,
        headName: dept.head_name,
        contactEmail: dept.contact_email,
        description: dept.description,
        createdAt: dept.created_at,
      }}
      faculty={faculty}
      candidates={candidates}
      exams={exams}
      questionBanks={questionBanks}
    />
  );
}
