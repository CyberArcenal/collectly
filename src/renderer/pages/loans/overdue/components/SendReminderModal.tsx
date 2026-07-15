// src/renderer/pages/loans/overdue/components/SendReminderModal.tsx

import React, { useState, useEffect } from "react";
import { X, Bell, Mail, User, AlertTriangle } from "lucide-react";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import { formatCurrency } from "../../../../utils/formatters";
import reminderLogAPI from "../../../../api/core/reminder_log";
import { dialogs } from "../../../../utils/dialogs";

interface SendReminderModalProps {
  isOpen: boolean;
  loan: OverdueLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  loan,
  onClose,
  onSuccess,
}) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      const daysOverdue = loan.stats?.daysOverdue ?? 0;
      const remaining = loan.remainingAmount ?? 0;

      setMessage(
        `Dear ${loan.borrower?.name || "Valued Customer"},

Your loan "${loan.name}" is overdue by ${daysOverdue} days. Remaining balance: ${formatCurrency(remaining)}. Please make a payment as soon as possible to avoid additional penalties.

Thank you.`
      );
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = loan.borrower?.email;
    if (!email) {
      dialogs.error("This debtor has no email address configured.");
      return;
    }

    setSubmitting(true);
    try {
      await reminderLogAPI.createReminder({
        to: email,
        subject: `Overdue Reminder: ${loan.name}`,
        html: message.replace(/\n/g, "<br/>"),
        text: message,
      });
      dialogs.success("Reminder email sent successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to send reminder");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-md shadow-xl border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--accent-blue)]" />
            Send Overdue Reminder
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Recipient Info */}
          <div
            className="p-3 rounded-lg space-y-1.5"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <User className="w-3 h-3" /> To:
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {loan.borrower?.name || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email:
              </span>
              <span className={loan.borrower?.email ? "text-[var(--text-primary)]" : "text-[var(--danger-color)]"}>
                {loan.borrower?.email || "No email configured"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Overdue:</span>
              <span className="font-medium text-[var(--danger-color)]">
                {loan.stats?.daysOverdue ?? 0} days
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Remaining:</span>
              <span className="font-bold" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(loan.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" /> Message
            </label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !loan.borrower?.email}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "var(--accent-blue)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--accent-blue-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent-blue)";
              }}
            >
              {submitting ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                "Send Reminder"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendReminderModal;