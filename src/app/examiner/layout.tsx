import { ReactNode } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import { getUniversitySettings } from "@/lib/settings";
import { ExaminerNav } from "@/components/examiner/examiner-nav";
import {
  GraduationCap,
  ShieldCheck,
  LogOut,
  Building2,
} from "lucide-react";

export default async function ExaminerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(["examiner", "admin"]);
  const settings = await getUniversitySettings();

  const initials = (user.fullName || "Examiner")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "EX";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40">
        <div className="max-w-[1640px] mx-auto w-full h-14 flex items-stretch">
          {/* Brand Area - Pixel-perfect aligned with Sidebar width (w-60) */}
          <div className="w-60 shrink-0 border-r border-slate-200/80 h-full flex items-center px-4 gap-2.5 bg-white">
            <Link
              href="/examiner"
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs group-hover:bg-indigo-700 transition-colors">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  SafeExam Pro
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase">
                  Examiner
                </span>
              </div>
            </Link>
          </div>

          {/* Main Top Header Controls & Institution Context */}
          <div className="flex-1 h-full flex items-center justify-between px-4 sm:px-6 min-w-0">
            {/* Institution Badge / Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
              <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
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
              {/* Switch to Admin View (if admin) */}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden md:flex text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 border border-slate-200 transition-colors items-center gap-1.5"
                  title="Switch to Institution Admin Console"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                  <span>Admin Console</span>
                </Link>
              )}

              {/* System Active Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Examiner Active</span>
              </div>

              {/* User Profile Capsule */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.fullName || "Examiner"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                    Faculty Examiner
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
        <ExaminerNav user={user} institutionName={settings.name} />
        <main className="flex-1 p-5 sm:p-6 bg-slate-50/70 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
