"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  Award,
  Layers,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  PlusCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/rbac";

const examinerNavItems = [
  {
    label: "Control Center",
    href: "/examiner",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Exam Composer",
    href: "/examiner/exams",
    icon: Layers,
  },
  {
    label: "Schedules & Roster",
    href: "/examiner/schedules",
    icon: CalendarCheck,
  },
  {
    label: "Question Banks",
    href: "/examiner/banks",
    icon: BookOpen,
  },
  {
    label: "Evaluation & Grading",
    href: "/examiner/grading",
    icon: Award,
  },
];

interface ExaminerNavProps {
  user?: AuthenticatedUser;
}

export function ExaminerNav({ user }: ExaminerNavProps) {
  const pathname = usePathname();

  const initials = (user?.fullName || "Examiner")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "EX";

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Sidebar Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Faculty Workspace
        </span>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
          v2.4
        </span>
      </div>

      {/* Primary Action Button */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/examiner/exams"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-indigo-600/20 transition-all cursor-pointer group"
        >
          <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>Compose New Exam</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        Navigation
      </div>

      <nav className="px-2 space-y-1">
        {examinerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all group ${
                isActive
                  ? "bg-indigo-50/90 text-indigo-950 font-bold border border-indigo-200/90 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Fast Operations */}
      <div className="px-4 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        Quick Access
      </div>
      <div className="px-2 space-y-1">
        <Link
          href="/examiner/banks"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Question Bank</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </Link>
        <Link
          href="/examiner/schedules"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Test Schedules</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </Link>
      </div>

      {/* Quality Badge */}
      <div className="p-3 m-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs mt-auto">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Exam Engine
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified
          </span>
        </div>
      </div>

      {/* User Info Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 truncate">
            {user?.fullName || "Examiner"}
          </div>
          <div className="text-[10px] text-slate-500 truncate capitalize font-medium">
            {user?.role || "Examiner"} • Apex State Univ
          </div>
        </div>
      </div>
    </aside>
  );
}
