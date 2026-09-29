import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/database";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

/**
 * Retrieves the currently logged-in user and their verified role from the database.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Retrieve user profile to determine verified role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // If user is suspended, treat as unauthenticated
  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return null;
  }

  // Fallback to metadata role or default candidate
  const role = (profile?.role as UserRole) || (user.user_metadata?.role as UserRole) || "candidate";
  const fullName = profile?.full_name || user.user_metadata?.full_name || user.email || "User";

  return {
    id: user.id,
    email: user.email || "",
    role,
    fullName,
  };
}

/**
 * Enforces role-based access for Server Components.
 * Redirects unauthenticated users to /login and unauthorized roles to their assigned dashboard.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Admins always have full institutional access across all roles
  if (user.role === "admin") {
    return user;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate portal based on their actual role
    switch (user.role) {
      case "candidate":
        redirect("/candidate");
      case "examiner":
        redirect("/examiner");
      case "proctor":
        redirect("/proctor");
      case "viewer":
        redirect("/admin/audit");
      default:
        redirect("/login");
    }
  }

  return user;
}

/**
 * Granular Permission Matrix for SafeExam Pro
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "settings:manage",
    "departments:manage",
    "users:manage",
    "exams:read",
    "exams:write",
    "exams:publish",
    "questions:read",
    "questions:write",
    "proctoring:monitor",
    "proctoring:intervene",
    "results:publish",
    "audit:read",
  ],
  examiner: [
    "questions:read",
    "questions:write",
    "exams:read",
    "exams:write",
    "results:grade",
  ],
  proctor: [
    "proctoring:monitor",
    "proctoring:intervene",
    "exams:read",
  ],
  candidate: [
    "exams:take",
    "results:read_own",
  ],
  viewer: [
    "audit:read",
    "results:read",
    "exams:read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  if (role === "admin") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
