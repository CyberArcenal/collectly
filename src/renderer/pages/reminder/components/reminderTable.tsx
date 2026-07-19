// src/renderer/pages/notification/components/reminderTable.tsx
import React from "react";
import {
  Eye,
  RefreshCw,
  Send,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  RotateCw,
  Mail,
  Loader2,
  User,
} from "lucide-react";
import { formatDate } from "../../../utils/formatters";
import type { NotificationLogEntry } from "../../../api/core/reminder_log";

interface NotificationTableProps {
  logs: NotificationLogEntry[];
  onView: (log: NotificationLogEntry) => void;
  onRetry: (id: number) => void;
  onResend: (id: number) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  sendingIds?: Set<number>;
}

const getInitials = (email: string) => {
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "sent":
      return { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-text)]" };
    case "queued":
      return { bg: "bg-[var(--status-pending-bg)]", text: "text-[var(--status-pending-text)]" };
    case "failed":
      return { bg: "bg-[var(--status-overdue-bg)]", text: "text-[var(--status-overdue-text)]" };
    case "resend":
      return { bg: "bg-[var(--status-partial-bg)]", text: "text-[var(--status-partial-text)]" };
    default:
      return { bg: "bg-[var(--status-inactive-bg)]", text: "text-[var(--status-inactive-text)]" };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "sent": return <CheckCircle className="w-3 h-3" />;
    case "queued": return <Clock className="w-3 h-3" />;
    case "failed": return <XCircle className="w-3 h-3" />;
    case "resend": return <RotateCw className="w-3 h-3" />;
    default: return <Mail className="w-3 h-3" />;
  }
};

export const NotificationTable: React.FC<NotificationTableProps> = ({
  logs,
  onView,
  onRetry,
  onResend,
  onDelete,
  isLoading,
  sendingIds = new Set(),
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
        <Mail className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
        <p>No email records found</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Recipient
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Subject
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Retries/Resends
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Sent At
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isSending = sendingIds.has(log.id);
            const statusBadge = getStatusBadge(log.status);

            return (
              <tr
                key={log.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onView(log)}
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {getInitials(log.recipient_email || log.recipient)}
                    </div>
                    <div>
                      <div className="text-[var(--text-primary)] text-sm truncate max-w-[150px]">
                        {log.recipient_email || log.recipient}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[var(--text-secondary)] text-sm truncate max-w-[200px] block">
                    {log.subject || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                    {getStatusIcon(log.status)}
                    {log.status}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {log.retry_count} / {log.resend_count}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {log.sent_at ? formatDate(log.sent_at) : "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView(log)}
                      disabled={isSending}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
                      title="View details"
                    >
                      <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                    </button>
                    {log.status === "failed" && (
                      <button
                        onClick={() => onRetry(log.id)}
                        disabled={isSending}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
                        title="Retry failed email"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-color)]" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-[var(--warning-color)]" />
                        )}
                      </button>
                    )}
                    {(log.status === "sent" || log.status === "resend") && (
                      <button
                        onClick={() => onResend(log.id)}
                        disabled={isSending}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
                        title="Resend email"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-color)]" />
                        ) : (
                          <Send className="w-4 h-4 text-[var(--success-color)]" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(log.id)}
                      disabled={isSending}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--danger-color)]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};