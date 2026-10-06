"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Building2,
  Users,
  History,
  GraduationCap,
  Video,
  Layers,
  BookOpen,
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/rbac";

const coreAdminNavItems = [
  {
    label: "Executive Overview",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Academic Departments",
    href: "/admin/departments",
    icon: Building2,
  },
  {
    label: "Candidate Roster",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    label: "User & Faculty Roster",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Audit & Security Logs",
    href: "/admin/audit",
    icon: History,
  },
  {
    label: "System Manual & Docs",
    href: "/admin/docs",
    icon: BookOpen,
  },
  {
    label: "University Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

const crossPlatformNavItems = [
  {
    label: "Examiner Suite",
    href: "/examiner",
    icon: Layers,
  },
  {
    label: "Live Proctor Hub",
    href: "/proctor",
    icon: Video,
  },
];

interface AdminSidebarProps {
  user?: AuthenticatedUser;
  institutionName?: string;
}

export function AdminSidebar({ user, institutionName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200/80 bg-white flex flex-col justify-between sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto [scrollbar-width:none] z-30">
      <div className="flex flex-col py-3.5">
        {/* Core Admin Section */}
        <div className="px-3 pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
            Core Administration
          </span>
          <nav className="space-y-0.5">
            {coreAdminNavItems.map((item) => {
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
                      ? "bg-purple-50 text-purple-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-purple-700" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
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
                      ? "bg-purple-50 text-purple-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-purple-700" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
