// src/renderer/pages/audit/components/AuditTable.tsx
import React from "react";
import { Eye, FileText, Clock } from "lucide-react";
import { getActionColor } from "../hooks/useAuditLogs";
import type { AuditLogEntry } from "../../../api/core/audit";

interface AuditTableProps {
  logs: AuditLogEntry[];
  onView: (log: AuditLogEntry) => void;
  loading?: boolean;
}

const formatDate = (date: string | Date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString();
};

const formatAction = (action: string) => {
  return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
};

export const AuditTable: React.FC<AuditTableProps> = ({ logs, onView, loading }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
        <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
        No audit logs found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Date & Time
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              User
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Action
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Entity
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Details
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
              onClick={() => onView(log)}
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span className="text-xs">{formatDate(log.timestamp)}</span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-xs font-medium">
                    {(log.user || "S")[0].toUpperCase()}
                  </div>
                  <span className="text-[var(--text-primary)] text-sm">
                    {log.user || "System"}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <span
                  className="px-2 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: `${getActionColor(log.action)}20`,
                    color: getActionColor(log.action),
                  }}
                >
                  {formatAction(log.action)}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <span className="text-[var(--text-secondary)] text-sm">
                  {log.entity}
                  {log.entityId && (
                    <span className="text-[var(--text-tertiary)] ml-1">
                      #{log.entityId}
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <span className="text-[var(--text-tertiary)] text-sm truncate block max-w-[200px]">
                  {log.oldData || log.newData ? (
                    <span className="text-[var(--text-secondary)]">
                      {log.oldData ? "Modified" : "Created"}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(log);
                  }}
                  className="p-1.5 rounded transition-colors hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)] hover:text-[var(--primary-color)]"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};