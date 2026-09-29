import Link from "next/link";
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

export default function AdminOverviewPage() {
  const auditLogs = [
    { id: "AUD-9912", action: "EXAM_SCHEDULE_ACTIVATED", user: "Admin (admin@apex.edu)", ip: "192.168.1.10", time: "2 mins ago" },
    { id: "AUD-9911", action: "CANDIDATE_REGISTERED", user: "Alexander Vance", ip: "172.20.100.45", time: "14 mins ago" },
    { id: "AUD-9910", action: "QUESTION_BANK_UPDATED", user: "Prof. Eleanor Vance", ip: "10.0.4.12", time: "32 mins ago" },
    { id: "AUD-9909", action: "PROCTOR_SESSION_INITIALIZED", user: "Dr. M. Jenkins", ip: "192.168.1.15", time: "45 mins ago" },
    { id: "AUD-9908", action: "SYSTEM_DIAGNOSTIC_COMPLETED", user: "System Telemetry", ip: "127.0.0.1", time: "1 hour ago" },
  ];

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
          <div className="text-2xl font-extrabold text-slate-900">1,420</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">8 Academic Programs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Departments</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">8 Units</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">All Rosters Active</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Question Repository</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">450+ Items</div>
          <div className="text-xs text-indigo-700 mt-1 font-medium">12 Exam Banks</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-extrabold text-slate-500">Audit Trail</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">12,480</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">100% Tamper-Proof</div>
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
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-purple-900 text-xs">Ph.D Entrance Exam 2026</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  In Progress
                </span>
              </div>
              <div className="text-[11px] text-purple-700 mt-1">Computer Applications & Science</div>
              <div className="mt-3 flex items-center justify-between text-slate-600 border-t border-purple-100 pt-2 text-[11px]">
                <span>Candidates Online: <strong>42</strong></span>
                <span>Proctor Feeds: <strong>Active</strong></span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Lockdown Mode Enforcement:</span>
                <strong className="text-purple-700 font-bold">Strict Kiosk</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Auto-Save Frequency:</span>
                <strong className="text-slate-800 font-bold">Every 30s</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Proctor-to-Student Ratio:</span>
                <strong className="text-slate-800 font-bold">1 : 25</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Cloudflare WAF Threat Score:</span>
                <strong className="text-emerald-700 font-bold">0 (Clean)</strong>
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
                Manage Faculty & Candidates →
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
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">{log.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                      <td className="py-3 px-4 text-slate-700">{log.user}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.ip}</td>
                      <td className="py-3 px-4 text-right text-slate-400 font-medium">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
