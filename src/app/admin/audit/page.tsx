"use client";

import { useState } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  X,
  Calendar,
  User,
  Monitor,
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const logs: AuditEntry[] = [
    {
      id: "AUD-9912",
      action: "EXAM_SCHEDULE_ACTIVATED",
      user: "Admin (admin@apex.edu)",
      ip: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0",
      timestamp: "2026-09-29 10:25:14 IST",
      entityType: "exam_schedules",
      entityId: "sch-4819-2026",
      details: {
        exam_id: "ex-algorithms-phd",
        duration_minutes: 120,
        enforced_browser: "SafeExam Lockdown v2.1",
        window_type: "fixed",
      },
    },
    {
      id: "AUD-9911",
      action: "CANDIDATE_REGISTERED",
      user: "Alexander Vance",
      ip: "172.20.100.45",
      userAgent: "SafeExam-Lockdown/1.4.2 (Windows 11)",
      timestamp: "2026-09-29 10:14:02 IST",
      entityType: "profiles",
      entityId: "usr-alexander-084",
      details: {
        department: "Master of Computer Applications",
        degree: "Ph.D Entrance",
        admit_card_generated: true,
      },
    },
    {
      id: "AUD-9910",
      action: "QUESTION_BANK_UPDATED",
      user: "Prof. Eleanor Vance",
      ip: "10.0.4.12",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      timestamp: "2026-09-29 09:58:33 IST",
      entityType: "question_banks",
      entityId: "qb-discrete-math-804",
      details: {
        operation: "ITEM_INSERT",
        question_type: "mcq_multiple",
        difficulty: 4,
        latex_equations_count: 3,
      },
    },
    {
      id: "AUD-9909",
      action: "PROCTOR_SESSION_INITIALIZED",
      user: "Dr. M. Jenkins",
      ip: "192.168.1.15",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      timestamp: "2026-09-29 09:45:00 IST",
      entityType: "proctoring_sessions",
      entityId: "proc-grid-desk-03",
      details: {
        assigned_candidates_count: 24,
        webrtc_sfu_room: "livekit-apex-grid-03",
        ai_anomaly_detection: "active",
      },
    },
    {
      id: "AUD-9908",
      action: "SYSTEM_DIAGNOSTIC_COMPLETED",
      user: "System Telemetry",
      ip: "127.0.0.1",
      userAgent: "SafeExam-Core-Health/2.0",
      timestamp: "2026-09-29 09:30:19 IST",
      entityType: "system",
      entityId: "diag-check-pass",
      details: {
        database_ping_ms: 38,
        storage_bucket_health: "ok",
        cloudflare_waf_sync: "active",
      },
    },
  ];

  const filteredLogs = logs.filter((l) => {
    const matchesQuery =
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ip.includes(searchQuery);

    const matchesAction = actionFilter === "all" || l.action.includes(actionFilter.toUpperCase());
    return matchesQuery && matchesAction;
  });

  const exportAuditCSV = () => {
    const headers = "ID,Action,User,IP,Timestamp\n";
    const rows = filteredLogs
      .map((l) => `"${l.id}","${l.action}","${l.user}","${l.ip}","${l.timestamp}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safeexam_audit_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Compliance & Forensic Audit
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Immutable Audit Trail Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-proof, append-only record of every administrative, authoring, and examination operation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Append-Only Postgres Store</span>
          </div>

          <button
            onClick={exportAuditCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Audit ID, Action Name, Initiator, or IP..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {["all", "exam", "candidate", "question", "proctor", "system"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActionFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                actionFilter === cat
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Audit ID</th>
                <th className="py-3 px-5">Event Action</th>
                <th className="py-3 px-5">Initiating Actor</th>
                <th className="py-3 px-5">Source IP</th>
                <th className="py-3 px-5">Recorded Timestamp</th>
                <th className="py-3 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-500">
                    {log.id}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-slate-900 block font-mono text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">Target: {log.entityType}</span>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-800">
                    {log.user}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px]">
                    {log.ip}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-purple-700 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-700" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Audit Log Entry: {selectedLog.id}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedLog.action}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Initiator</span>
                  <span className="font-semibold text-slate-800">{selectedLog.user}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client IP</span>
                  <span className="font-mono text-slate-800">{selectedLog.ip}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Entity</span>
                  <span className="font-mono text-slate-800">{selectedLog.entityType} ({selectedLog.entityId})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="text-slate-800">{selectedLog.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">User Agent</span>
                <span className="font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg block break-all border border-slate-200">
                  {selectedLog.userAgent}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Metadata Payload</span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
