// src/renderer/pages/audit/components/AuditViewDialog.tsx
import React from "react";
import { X, Calendar, User, Tag, FileText, Database, Code, Clock } from "lucide-react";
import { getActionColor } from "../hooks/useAuditLogs";
import type { AuditLogEntry } from "../../../api/core/audit";

interface AuditViewDialogProps {
  isOpen: boolean;
  log: AuditLogEntry | null;
  onClose: () => void;
}

const formatDate = (date: string | Date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString();
};

const parseJson = (data: string | null) => {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

// ✅ Safely convert any value to a string for rendering
const safeStringify = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Unserializable Object]";
    }
  }
  return String(value);
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export const AuditViewDialog: React.FC<AuditViewDialogProps> = ({
  isOpen,
  log,
  onClose,
}) => {
  if (!isOpen || !log) return null;

  const oldData = parseJson(log.oldData);
  const newData = parseJson(log.newData);
  const hasChanges = !!(oldData || newData);

  // ✅ Safely get description as string
  const description = log.changes ? safeStringify(log.changes) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl border overflow-hidden"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getActionColor(log.action) }}
            />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Audit Log #{log.id}
            </h2>
            <span
              className="px-2 py-0.5 text-xs rounded-full font-medium"
              style={{
                backgroundColor: `${getActionColor(log.action)}20`,
                color: getActionColor(log.action),
              }}
            >
              {log.action}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4 max-h-[calc(90vh-80px)]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Timestamp
              </label>
              <p className="text-sm text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                {formatDate(log.timestamp)}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> User
              </label>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {log.user || "System"}
                {log.userType && (
                  <span className="text-xs text-[var(--text-tertiary)] ml-1.5">
                    ({log.userType})
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Entity
              </label>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {log.entity}
                {log.entityId && (
                  <span className="text-[var(--text-tertiary)] ml-1.5">
                    #{log.entityId}
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Action Type
              </label>
              <span
                className="inline-block px-2 py-0.5 text-xs rounded-full font-medium mt-1"
                style={{
                  backgroundColor: `${getActionColor(log.action)}20`,
                  color: getActionColor(log.action),
                }}
              >
                {log.action}
              </span>
            </div>
          </div>

          {/* Description / Changes - ✅ fixed to handle objects */}
          {description && (
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 border border-[var(--border-color)]">
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Description
              </label>
              <pre className="mt-1 text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans">
                {description}
              </pre>
            </div>
          )}

          {/* Data Changes */}
          {hasChanges && (
            <div className="space-y-3">
              {oldData && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 border border-[var(--border-color)]">
                  <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3 h-3" /> Old Data
                  </label>
                  <pre className="mt-1 p-2 rounded text-xs overflow-auto max-h-32 font-mono" style={{
                    backgroundColor: "var(--background-color)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}>
                    {formatValue(oldData)}
                  </pre>
                </div>
              )}

              {newData && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 border border-[var(--border-color)]">
                  <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3 h-3" /> New Data
                  </label>
                  <pre className="mt-1 p-2 rounded text-xs overflow-auto max-h-32 font-mono" style={{
                    backgroundColor: "var(--background-color)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}>
                    {formatValue(newData)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {(log.ipAddress || log.userAgent) && (
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 border border-[var(--border-color)]">
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Request Metadata
              </label>
              <div className="mt-1 space-y-1 text-sm">
                {log.ipAddress && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-tertiary)] text-xs">IP:</span>
                    <span className="text-[var(--text-primary)] font-mono text-xs">
                      {log.ipAddress}
                    </span>
                  </div>
                )}
                {log.userAgent && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-tertiary)] text-xs">Agent:</span>
                    <span className="text-[var(--text-secondary)] text-xs truncate">
                      {log.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasChanges && !description && !log.ipAddress && !log.userAgent && (
            <p className="text-sm text-[var(--text-tertiary)] italic text-center py-4">
              No additional data available for this log entry.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors btn-secondary"
            style={{
              backgroundColor: "var(--btn-secondary-bg)",
              color: "var(--btn-secondary-text)",
              border: "1px solid var(--btn-secondary-border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};