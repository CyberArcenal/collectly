// src/renderer/pages/loans/closed/components/ReopenConfirmationModal.tsx
import React, { useState } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import type { ClosedLoan } from "../hooks/useClosedLoans";
import debtsAPI from "../../../../api/core/debt";
import { dialogs } from "../../../../utils/dialogs";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ReopenConfirmationModalProps {
  isOpen: boolean;
  loan: ClosedLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReopenConfirmationModal: React.FC<ReopenConfirmationModalProps> = ({
  isOpen,
  loan,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !loan) return null;

  const handleReopen = async () => {
    setSubmitting(true);
    try {
      await debtsAPI.update(loan.id, { status: "active" });
      dialogs.success(`Loan "${loan.name}" has been reopened.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
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
            <RefreshCw className="w-4 h-4 text-[var(--warning-color)]" />
            Reopen Closed Loan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Loan Info */}
          <div
            className="p-3 rounded-lg space-y-1.5"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Debt:</span>
              <span className="font-medium text-[var(--text-primary)]">{loan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Borrower:</span>
              <span className="text-[var(--text-primary)]">{loan.borrower?.name || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Closed Date:</span>
              <span className="text-[var(--text-primary)]">{formatDate(loan.closedAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total Paid:</span>
              <span className="font-semibold text-[var(--success-color)]">
                {formatCurrency(loan.paidAmount)}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div
            className="p-3 rounded-lg text-sm flex items-start gap-2"
            style={{
              backgroundColor: "var(--status-warning-bg)",
              color: "var(--warning-color)",
              border: "1px solid var(--warning-color)",
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>Are you sure you want to reopen this loan?</p>
              <p className="text-xs opacity-80 mt-0.5">
                It will become active again and appear in Active Loans.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
                border: "1px solid var(--btn-secondary-border)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReopen}
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "var(--warning-color)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--btn-warning-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--warning-color)";
              }}
            >
              {submitting ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                "Yes, Reopen"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReopenConfirmationModal;