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
} from "lucide-react";

const examinerNavItems = [
  {
    label: "Control Center",
    href: "/examiner",
    icon: LayoutDashboard,
    description: "Executive overview & exam pipeline",
    exact: true,
  },
  {
    label: "Exam Composer",
    href: "/examiner/exams",
    icon: Layers,
    description: "Blueprints, sections & question assembly",
  },
  {
    label: "Exam Schedules & Roster",
    href: "/examiner/schedules",
    icon: CalendarCheck,
    description: "Time windows & candidate enrollment",
  },
  {
    label: "Question Banks",
    href: "/examiner/banks",
    icon: BookOpen,
    description: "Common & department repositories",
  },
  {
    label: "Evaluation & Grading",
    href: "/examiner/grading",
    icon: Award,
    description: "Descriptive scoring & automated results",
  },
];

export function ExaminerNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-100">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Faculty Examination Portal
        </div>
      </div>

      <nav className="p-3 space-y-1.5 flex-1">
        {examinerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  isActive ? "text-indigo-600" : "text-slate-400"
                }`}
              />
              <div>
                <div>{item.label}</div>
                <div className="text-[11px] font-normal text-slate-400 leading-tight mt-0.5">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* University Exam Standard Badge */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quality Assurance</span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
          Questions undergo peer review and automatic item discrimination indexing prior to publication.
        </p>
      </div>
    </aside>
  );
}
