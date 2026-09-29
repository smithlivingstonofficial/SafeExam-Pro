"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Building2,
  Users,
  History,
  LogOut,
  ExternalLink,
  Award,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/admin/settings", label: "University Settings", icon: Settings },
  { href: "/admin/departments", label: "Academic Departments", icon: Building2 },
  { href: "/admin/users", label: "User & Faculty Roster", icon: Users },
  { href: "/admin/audit", label: "Audit & Compliance Logs", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-xs">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
            SafeExam Pro
          </span>
          <span className="text-[10px] uppercase font-bold text-purple-700 block">
            Admin Console
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
          Institution Control
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-purple-50 text-purple-800 border border-purple-200/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-purple-700" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
          Cross-Role Quick Links
        </div>
        <Link
          href="/examiner"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <span>Examiner Suite</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>
        <Link
          href="/proctor"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <span>Proctor Monitor</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>
        <Link
          href="/candidate"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <span>Candidate Lobby</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="mb-3 px-1">
          <div className="text-xs font-bold text-slate-900 truncate">
            Dr. R. Sterling
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Controller of Examinations
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
