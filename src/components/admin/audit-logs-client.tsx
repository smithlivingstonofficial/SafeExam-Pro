"use client";

import { useState } from "react";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileCode2,
  X,
  ExternalLink,
  Laptop,
} from "lucide-react";

export interface AuditLogItem {
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

interface Props {
  initialLogs: AuditLogItem[];
}

export function AuditLogsClient({ initialLogs }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = initialLogs.filter((l) => {
    const matchesQuery =
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ip.includes(searchQuery);

    const matchesAction =
      actionFilter === "all" || l.action.startsWith(actionFilter);

    return matchesQuery && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Compliance & Transparency
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, append-only security logs recording every user action, exam mutation, and administrative operation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tamper-Resistant Log</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by event action, user, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-700 shadow-2xs"
          >
            <option value="all">All Events</option>
            <option value="USER">User Events</option>
            <option value="EXAM">Exam Events</option>
            <option value="QUESTION">Question Events</option>
            <option value="SETTINGS">Settings Changes</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Timestamp (UTC)</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Initiating Entity</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Network IP</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-200">
                        {l.action}
                      </span>
                    </td>

                    <td className="p-4 text-slate-800 font-semibold">
                      {l.user}
                    </td>

                    <td className="p-4 text-slate-600 capitalize">
                      {l.entityType.replace("_", " ")}
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {l.ip}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Audit Logs Recorded
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Every administrative action, user login, and exam modification is cryptographically recorded here.
            </p>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileCode2 className="w-4 h-4 text-purple-700" />
                <span>Audit Entry Payload: {selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Action Event
                  </span>
                  <span className="font-bold text-slate-800">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Timestamp
                  </span>
                  <span className="font-semibold text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Entity Type
                  </span>
                  <span className="font-semibold text-slate-800">{selectedLog.entityType}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Source IP
                  </span>
                  <span className="font-mono text-slate-800">{selectedLog.ip}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Metadata JSON Payload:
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
