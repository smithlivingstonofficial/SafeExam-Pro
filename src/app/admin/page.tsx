import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import {
  Users,
  Building2,
  FileSpreadsheet,
  History,
  ShieldCheck,
  ArrowRight,
  Settings,
  Lock,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const adminClient = createAdminClient();

  // 1. Fetch real counts
  const [
    { count: candidateCount },
    { count: staffCount },
    { count: deptCount },
    { count: questionCount },
    { count: auditCount },
    { data: activeSchedules },
    { data: latestAuditLogs },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).neq("role", "candidate"),
    adminClient.from("departments").select("*", { count: "exact", head: true }),
    adminClient.from("questions").select("*", { count: "exact", head: true }),
    adminClient.from("audit_logs").select("*", { count: "exact", head: true }),
    adminClient.from("exam_schedules").select("id, duration_minutes, proctoring_level, status, exams(title)").eq("status", "active").limit(1),
    adminClient.from("audit_logs").select("id, action, ip_address, created_at, user_id").order("created_at", { ascending: false }).limit(6),
  ]);

  // Lookup users for recent audit logs
  const typedLatestLogs = (latestAuditLogs || []) as Array<{
    id: string;
    action: string;
    ip_address: string | null;
    created_at: string;
    user_id: string | null;
  }>;

  const userIds = typedLatestLogs.map((l) => l.user_id).filter(Boolean) as string[];
  const { data: userProfiles } = await adminClient
    .from("profiles")
    .select("id, full_name, role")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const typedUserProfiles = (userProfiles || []) as Array<{
    id: string;
    full_name: string;
    role: string;
  }>;

  const userMap = new Map(typedUserProfiles.map((u) => [u.id, u]));

  const activeSchedule = activeSchedules?.[0] as {
    id: string;
    duration_minutes: number;
    proctoring_level: string;
    status: string;
    exams: { title: string } | null;
  } | null;

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Institutional Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Examination Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform oversight, institutional policies, and tamper-resistant audit monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Institution Settings</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Registered Candidates</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{candidateCount || 0}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">{staffCount || 0} Faculty / Staff</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Departments</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{deptCount || 0} Units</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Academic Roster</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Question Repository</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{questionCount || 0} Items</div>
          <div className="text-xs text-indigo-700 mt-1 font-medium">Verified Active Questions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Audit Trail</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{auditCount || 0}</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">Immutable Security Events</div>
        </div>
      </div>

      {/* Main Grid: Live Session Status & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Examination Pulse (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-700" />
            <span>Live Exam Center Status</span>
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
            {activeSchedule ? (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 text-xs">
                    {activeSchedule.exams?.title || "Active Examination"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    In Progress
                  </span>
                </div>
                <div className="text-[11px] text-purple-700 mt-1">
                  Duration: {activeSchedule.duration_minutes} Mins • Proctoring: {activeSchedule.proctoring_level}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">No Active Exam Session</span>
                <span className="text-[11px]">Next session will appear when scheduled delivery windows open.</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Lockdown Mode Enforcement:</span>
                <strong className="text-purple-700 font-bold">SafeExam Lockdown Protocol</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Auto-Save Frequency:</span>
                <strong className="text-slate-800 font-bold">Every 30s</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Security Infrastructure:</span>
                <strong className="text-emerald-700 font-bold">Cloudflare WAF / Active</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/admin/departments"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-center border border-slate-200 transition-colors"
              >
                Manage Academic Departments →
              </Link>
              <Link
                href="/admin/users"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-center border border-slate-200 transition-colors"
              >
                Manage Institutional Roster →
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time Audit Ledger Preview (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-700" />
              <span>Real-Time Audit & Security Stream</span>
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline"
            >
              View Full Audit Ledger →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {latestAuditLogs && latestAuditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Audit ID</th>
                      <th className="py-3 px-4">Event Action</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4 text-right">Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {typedLatestLogs.map((log) => {
                      const userObj = log.user_id ? userMap.get(log.user_id) : null;
                      const userDisplay = userObj ? `${userObj.full_name} (${userObj.role})` : log.user_id ? `User ${log.user_id.slice(0, 6)}` : "System";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-500">{log.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                          <td className="py-3 px-4 text-slate-700">{userDisplay}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{log.ip_address || "127.0.0.1"}</td>
                          <td className="py-3 px-4 text-right text-slate-400 font-medium">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-slate-500">
                No audit events recorded yet. Operations will be logged here in real-time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
