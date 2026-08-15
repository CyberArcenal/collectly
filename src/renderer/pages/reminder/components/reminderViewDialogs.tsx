// src/renderer/pages/notification/components/reminderViewDialogs.tsx
import React from "react";
import { X, Mail, Smartphone, AlertCircle, User, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "../../../utils/formatters";
import type { NotificationLogEntry } from "../../../api/core/reminder_log";

interface NotificationViewDialogProps {
  log: NotificationLogEntry;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationViewDialog: React.FC<NotificationViewDialogProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

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
      case "sent": return <CheckCircle className="w-4 h-4" />;
      case "queued": return <Clock className="w-4 h-4" />;
      case "failed": return <XCircle className="w-4 h-4" />;
      case "resend": return <Mail className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const statusBadge = getStatusBadge(log.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-2xl max-h-[90vh] shadow-xl border flex flex-col"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--primary-color)]" />
            Notification Details
            <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
              #{log.id}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
              {getStatusIcon(log.status)}
              {log.status.toUpperCase()}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              ID: #{log.id}
            </span>
          </div>

          {/* Channel */}
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            {log.channel === 'email' ? <Mail className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" /> : <Smartphone className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Channel</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{log.channel}</p>
            </div>
          </div>

          {/* Recipient */}
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <User className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Recipient</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{log.recipient_email || log.recipientEmail || log.recipient}</p>
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <Mail className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Subject</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {log.subject || "(No subject)"}
              </p>
            </div>
          </div>

          {/* Payload / Body */}
          {log.payload && (
            <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
              <FileText className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Message Content</p>
                <pre className="mt-1 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-48" style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                }}>
                  {log.payload}
                </pre>
              </div>
            </div>
          )}

          {/* Error Message */}
          {log.error_message && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--status-overdue-bg)",
                color: "var(--danger-color)",
                border: "1px solid var(--danger-color)",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider">Error</p>
                <p>{log.error_message || log.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Created</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(log.created_at || log.createdAt)}</p>
            </div>
            {log.sent_at && (
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Sent</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(log.sent_at || log.sentAt)}</p>
              </div>
            )}
            {log.last_error_at && (
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Last Error</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(log.last_error_at || log.lastErrorAt)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Retry Count</p>
              <p className="text-sm text-[var(--text-primary)]">{log.retry_count || log.retryCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Resend Count</p>
              <p className="text-sm text-[var(--text-primary)]">{log.resend_count || log.resendCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Updated</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(log.updated_at || log.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-[var(--border-color)] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
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