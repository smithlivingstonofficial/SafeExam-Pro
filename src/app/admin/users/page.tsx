import { createAdminClient } from "@/lib/supabase/server";
import { UserManagementClient, UserItem } from "@/components/admin/user-management-client";
import { UserRole } from "@/types/database";

export default async function UserManagementPage() {
  const adminClient = createAdminClient();

  // Fetch real profiles from Supabase database
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, role, department, is_active, created_at")
    .order("created_at", { ascending: false });

  // Fetch emails from auth.users
  const { data: authUsers } = await adminClient.auth.admin.listUsers();
  const emailMap = new Map<string, string>(
    (authUsers?.users || []).map((u: { id: string; email?: string }) => [u.id, u.email || ""])
  );

  // Fetch academic departments from Supabase
  const { data: deptData } = await adminClient
    .from("departments")
    .select("id, name, code")
    .order("name", { ascending: true });

  const availableDepartments = ((deptData || []) as Array<{
    id: string;
    name: string;
    code: string | null;
  }>).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }));

  const initialUsers: UserItem[] = ((profiles || []) as Array<{
    id: string;
    full_name: string;
    role: UserRole;
    department: string | null;
    is_active: boolean;
  }>).map((p) => ({
    id: p.id,
    name: p.full_name,
    email: emailMap.get(p.id) || "",
    role: p.role,
    department: p.department || "General",
    isActive: p.is_active,
  }));

  return (
    <UserManagementClient
      initialUsers={initialUsers}
      availableDepartments={availableDepartments}
    />
  );
}
