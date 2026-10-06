"use client";

import { useState } from "react";
import {
  Search,
  ShieldCheck,
  X,
  Terminal,
  Copy,
  CheckCircle2,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = initialLogs.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      l.id.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.ip.includes(q);

    const matchesAction =
      actionFilter === "all" || l.action.startsWith(actionFilter);

    return matchesQuery && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.startsWith("EXAM")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (action.startsWith("STUDENT")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    if (action.startsWith("USER")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.startsWith("DEPT") || action.startsWith("DEPARTMENT")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (action.startsWith("SETTINGS")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search audit trail by event action, actor, entity, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Action Status */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Action Category Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
          >
            <option value="all">All Event Categories ({initialLogs.length})</option>
            <option value="USER">User Events</option>
            <option value="EXAM">Exam Events</option>
            <option value="STUDENT">Student Events</option>
            <option value="QUESTION">Question Events</option>
            <option value="DEPARTMENT">Department Events</option>
            <option value="SETTINGS">Settings Changes</option>
          </select>

          {/* Tamper-Resistant Status Badge */}
          <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tamper-Resistant</span>
          </div>
        </div>
      </div>

      {/* Logs Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Initiating Actor</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Network IP</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {l.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(l.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border ${getActionBadge(
                          l.action
                        )}`}
                      >
                        {l.action.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {l.user}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 capitalize">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {l.entityType.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {l.ip || "127.0.0.1"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Inspect ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-2 border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-800">
              {searchQuery || actionFilter !== "all" ? "No matching audit events found" : "No Audit Events Logged"}
            </div>
            <div className="text-slate-400 mt-0.5">
              {searchQuery || actionFilter !== "all"
                ? "Clear your search query or filter to see all events."
                : "All operations across the platform are logged automatically."}
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Terminal className="w-4 h-4 text-purple-700" />
                <span>Audit Event Payload</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  ({selectedLog.id})
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Action Event
                  </span>
                  <span className="font-extrabold text-purple-800 text-xs">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Timestamp (UTC)
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Initiating Actor
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.user}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Network IP
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLog.ip || "127.0.0.1"}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    Metadata JSON Payload
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.details, null, 2))}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId ? "Copied!" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
