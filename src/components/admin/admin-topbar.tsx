"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Lock,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  Search,
  Radio,
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/rbac";

interface AdminTopbarProps {
  user: AuthenticatedUser;
  institutionName: string;
}

const PAGE_TITLES: Record<string, { category: string; title: string }> = {
  "/admin": { category: "Governance", title: "Executive Overview" },
  "/admin/settings": { category: "Configuration", title: "University Settings & Policies" },
  "/admin/departments": { category: "Academic Structure", title: "Academic Departments" },
  "/admin/students": { category: "Candidate Management", title: "Students & Enrollments" },
  "/admin/users": { category: "Access Control", title: "User & Faculty Roster" },
  "/admin/audit": { category: "Security & Compliance", title: "Cryptographic Audit Trail" },
};

export function AdminTopbar({ user, institutionName }: AdminTopbarProps) {
  const pathname = usePathname();

  // Determine current page title & category
  const pageMeta =
    PAGE_TITLES[pathname] ||
    (pathname.startsWith("/admin/departments/")
      ? { category: "Academic Structure", title: "Department Details" }
      : { category: "Administration", title: "Console" });

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Dynamic Breadcrumb & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">
            {pageMeta.category}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="font-extrabold text-slate-900 tracking-tight">
            {pageMeta.title}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200">
          <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200/70 truncate max-w-xs">
            {institutionName}
          </span>
        </div>
      </div>

      {/* Right: Security Telemetry & Fast Portals */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Cross-Role External Launchers */}
        <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200">
          <Link
            href="/examiner"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70 border border-slate-200/80 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Examiner Suite</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/proctor"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70 border border-slate-200/80 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Proctor Live</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* System Health Status Badge */}
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">All Systems Operational</span>
          <span className="sm:hidden">Healthy</span>
        </div>
      </div>
    </header>
  );
}
