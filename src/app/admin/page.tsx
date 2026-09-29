import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import {
  ShieldCheck,
  Award,
  Users,
  Building2,
  FileText,
  Activity,
  LogOut,
  User,
  Settings,
  Database,
  History,
} from "lucide-react";

export default function AdminDashboard() {
  const auditLogs = [
    { id: "AUD-9912", action: "EXAM_SCHEDULE_ACTIVATED", user: "Admin (admin@apex.edu)", ip: "192.168.1.10", time: "2 mins ago" },
    { id: "AUD-9911", action: "CANDIDATE_REGISTERED", user: "Alexander Vance", ip: "172.20.100.45", time: "14 mins ago" },
    { id: "AUD-9910", action: "QUESTION_BANK_UPDATED", user: "Prof. Eleanor Vance", ip: "10.0.4.12", time: "32 mins ago" },
    { id: "AUD-9909", action: "PROCTOR_SESSION_INITIALIZED", user: "Dr. M. Jenkins", ip: "192.168.1.15", time: "45 mins ago" },
    { id: "AUD-9908", action: "SYSTEM_DIAGNOSTIC_COMPLETED", user: "System Telemetry", ip: "127.0.0.1", time: "1 hour ago" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                SafeExam Pro
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                University Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>Controller of Examinations (Dr. R. Sterling)</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Registered Applicants</div>
            <div className="text-2xl font-extrabold text-slate-900">1,420</div>
            <div className="text-xs text-blue-700 font-semibold mt-1">Across 8 Academic Depts</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Active Exam Center</div>
            <div className="text-2xl font-extrabold text-purple-700">Apex State Campus</div>
            <div className="text-xs text-slate-500 mt-1">Single University Instance</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Audit Ledger</div>
            <div className="text-2xl font-extrabold text-emerald-700">100% Immutable</div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">Append-Only Logs</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Cloudflare Edge & WAF</div>
            <div className="text-2xl font-extrabold text-slate-900">Protected</div>
            <div className="text-xs text-slate-500 mt-1">DDoS & Bot Mitigation Active</div>
          </div>
        </div>

        {/* Administration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Audit Logs Stream (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-700" />
                <span>Live Administrative Audit Trail</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">Auto-refreshing</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Audit ID</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Initiator</th>
                      <th className="py-3 px-4">Source IP</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500">{log.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                        <td className="py-3 px-4">{log.user}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{log.ip}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-medium">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Institutional Settings Card (1 Col) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-700" />
              <span>University Settings</span>
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Institution Name</span>
                <span className="font-bold text-slate-900 text-sm">Apex State University</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Admissions Email</span>
                <span className="font-semibold text-slate-800">exams@apex-university.edu</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium block mb-1">Examination Policies</span>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center justify-between">
                    <span>Lockdown Browser:</span>
                    <strong className="text-blue-700 font-semibold">Enforced</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Auto-Save Frequency:</span>
                    <strong className="text-slate-800 font-semibold">Every 30 Seconds</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Proctoring Default:</span>
                    <strong className="text-slate-800 font-semibold">Standard (Webcam + Audio)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Candidate Self-Registration:</span>
                    <strong className="text-emerald-700 font-semibold">Enabled</strong>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer">
                  Configure Exam Policies →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
