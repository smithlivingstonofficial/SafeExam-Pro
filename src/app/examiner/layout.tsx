import { ReactNode } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import { ExaminerNav } from "@/components/examiner/examiner-nav";
import {
  GraduationCap,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default async function ExaminerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(["examiner", "admin"]);

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
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/examiner"
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 group-hover:text-indigo-950 transition-colors">
                SafeExam Pro
              </span>
            </Link>

            <span className="text-slate-300 font-light select-none">/</span>

            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
              Examiner
            </span>

            <span className="h-4 w-px bg-slate-200 hidden md:block" />

            <span className="hidden md:inline-flex text-xs font-medium text-slate-500 truncate">
              Apex State University
            </span>
          </div>

          {/* Right Controls & User Info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Switch to Admin View (if admin) */}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                title="Switch to Institution Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Admin Console</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </Link>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium capitalize">
                  {user.role}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                title="Sign out of SafeExam Pro"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 max-w-[1560px] w-full mx-auto flex">
        <ExaminerNav user={user} />
        <main className="flex-1 p-6 sm:p-8 lg:p-9 bg-slate-50/70 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

