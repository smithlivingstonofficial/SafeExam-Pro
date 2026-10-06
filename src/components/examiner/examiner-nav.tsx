"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  Award,
  Layers,
  LayoutDashboard,
  Video,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/rbac";

const coreExaminerNavItems = [
  {
    label: "Control Center",
    href: "/examiner",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Quick Setup Wizard",
    href: "/examiner/quick-setup",
    icon: Sparkles,
    badge: "Fast",
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

const crossPlatformNavItems = [
  {
    label: "Live Proctor Hub",
    href: "/proctor",
    icon: Video,
  },
];

interface ExaminerNavProps {
  user?: AuthenticatedUser;
  institutionName?: string;
}

export function ExaminerNav({ user, institutionName }: ExaminerNavProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200/80 bg-white flex flex-col justify-between sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto [scrollbar-width:none] z-30">
      <div className="flex flex-col py-3.5">
        {/* Core Examination Section */}
        <div className="px-3 pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
            Examination Workflow
          </span>
          <nav className="space-y-0.5">
            {coreExaminerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Cross Suite Section */}
        <div className="pt-3 px-3">
          <div className="border-t border-slate-100 mx-2 mb-2.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
            Platform Suites
          </span>
          <nav className="space-y-0.5">
            {crossPlatformNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 font-medium"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-purple-700" />
                <span className="truncate">Admin Console</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
