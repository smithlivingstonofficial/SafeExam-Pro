import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import {
  Building2,
  FileSpreadsheet,
  History,
  GraduationCap,
  ArrowRight,
  Settings,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const adminClient = createAdminClient();

  // 1. Fetch system metrics in parallel
  const [
    { count: candidateCount },
    { count: deptCount },
    { count: questionCount },
    { count: auditCount },
    { data: activeSchedules },
    { data: latestAuditLogs },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
    adminClient.from("departments").select("*", { count: "exact", head: true }),
    adminClient.from("questions").select("*", { count: "exact", head: true }),
    adminClient.from("audit_logs").select("*", { count: "exact", head: true }),
    adminClient
      .from("exam_schedules")
      .select("id, duration_minutes, proctoring_level, status, start_at, end_at, exams(title)")
      .order("start_at", { ascending: true })
      .limit(2),
    adminClient
      .from("audit_logs")
      .select("id, action, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Lookup users for recent audit logs
  const typedLogs = (latestAuditLogs || []) as Array<{
    id: string;
    action: string;
    created_at: string;
    user_id: string | null;
  }>;

  const userIds = typedLogs.map((l) => l.user_id).filter(Boolean) as string[];
  const { data: userProfiles } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const typedProfiles = (userProfiles || []) as Array<{
    id: string;
    full_name: string;
  }>;

  const userMap = new Map<string, string>(typedProfiles.map((u: { id: string; full_name: string }) => [u.id, u.full_name]));

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const activeSchedule = activeSchedules?.[0] as {
    id: string;
    duration_minutes: number;
    proctoring_level: string;
    status: string;
    exams: { title: string } | null;
  } | null;

  return (
    <div className="space-y-6 max-w-full">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Admin Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Entrance examination status, candidates, and real-time activity log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/students"
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Manage Candidates</span>
          </Link>
          <Link
            href="/admin/settings"
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Candidates */}
        <Link
          href="/admin/students"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Candidates
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {candidateCount || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Registered applicants
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
        </Link>

        {/* Departments */}
        <Link
          href="/admin/departments"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Departments
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {deptCount || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Academic units
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
        </Link>

        {/* Question Pool */}
        <Link
          href="/examiner/banks"
          target="_blank"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Question Pool
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {questionCount || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Questions in bank
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </Link>

        {/* Audit Events */}
        <Link
          href="/admin/audit"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Audit Logs
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {auditCount || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Logged events
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Main 2-Column Section: Active Exam Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card: Active Examination Status (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-purple-700" />
                <span>Active Examination Status</span>
              </h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                System Healthy
              </span>
            </div>

            <div className="mt-3.5 space-y-3">
              {activeSchedule ? (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {activeSchedule.exams?.title || "Active Examination Session"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      In Progress
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5">
                    Duration: {activeSchedule.duration_minutes} Mins • Proctoring: {activeSchedule.proctoring_level}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600">
                  <div className="font-bold text-slate-800 text-xs">
                    No Live Exam Running
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Testing nodes will activate automatically during scheduled exam windows.
                  </div>
                </div>
              )}

              {/* Quick Status Checks */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50/70 text-slate-600">
                  <span>Lockdown Browser:</span>
                  <span className="font-semibold text-slate-800">SafeExam Enforced</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50/70 text-slate-600">
                  <span>Auto-Save Frequency:</span>
                  <span className="font-semibold text-slate-800">Every 30s</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50/70 text-slate-600">
                  <span>Security & WAF:</span>
                  <span className="font-semibold text-emerald-700">Protected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/admin/students"
              className="w-full py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs text-center border border-purple-200/70 transition-colors flex items-center justify-center gap-1"
            >
              <span>View Candidate Enrollments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Card: Recent Activity Stream (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-700" />
                <span>Recent System Activity</span>
              </h2>
              <Link
                href="/admin/audit"
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 group"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              {typedLogs && typedLogs.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-2 px-2">Action</th>
                      <th className="py-2 px-2">User</th>
                      <th className="py-2 px-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {typedLogs.map((log) => {
                      const userName = log.user_id ? userMap.get(log.user_id) : "System";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-slate-800">
                            {formatAction(log.action)}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 text-xs">
                            {userName || "System"}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity logged yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-purple-700 hover:underline"
            >
              Open Complete Audit Trail &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
