import { ReactNode } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import { getUniversitySettings } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/admin-nav";
import {
  ShieldCheck,
  LogOut,
  Building2,
  BookOpen,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Enforce server-side RBAC: Only admin role permitted
  const user = await requireRole(["admin"]);
  const settings = await getUniversitySettings();

  const initials =
    (user.fullName || "Admin")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40">
        <div className="max-w-[1640px] mx-auto w-full h-14 flex items-stretch">
          {/* Brand Area - Pixel-perfect aligned with Sidebar width (w-60) */}
          <div className="w-60 shrink-0 border-r border-slate-200/80 h-full flex items-center px-4 gap-2.5 bg-white">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-2xs group-hover:bg-purple-800 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors">
                  SafeExam Pro
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200/80 uppercase">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Main Top Header Controls & Institution Context */}
          <div className="flex-1 h-full flex items-center justify-between px-4 sm:px-6 min-w-0">
            {/* Institution Badge / Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
              <div className="w-5 h-5 rounded bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                <Building2 className="w-3 h-3" />
              </div>
              <span
                className="font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-md lg:max-w-lg"
                title={settings.name}
              >
                {settings.name}
              </span>
            </div>

            {/* Right Controls & User Info */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Docs Quick Link */}
              <Link
                href="/admin/docs"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 transition-colors cursor-pointer"
                title="Open Administrative Operation Manual & Interactive Guide"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">Docs &amp; Guide</span>
              </Link>

              {/* System Active Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>System Active</span>
              </div>

              {/* User Profile Capsule */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/80 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.fullName || "Administrator"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                    Institution Admin
                  </div>
                </div>

                {/* Sign Out */}
                <form action={logoutAction} className="ml-1">
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Sign out of SafeExam Pro"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 max-w-[1640px] w-full mx-auto flex min-w-0">
        <AdminSidebar user={user} institutionName={settings.name} />
        <main className="flex-1 p-5 sm:p-6 bg-slate-50/70 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
