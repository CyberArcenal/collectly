// src/renderer/pages/loans/overdue/components/ApplyPenaltyModal.tsx

import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Calendar, DollarSign, FileText } from "lucide-react";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import { dialogs } from "../../../../utils/dialogs";
import { formatCurrency } from "../../../../utils/formatters";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";

interface ApplyPenaltyModalProps {
  isOpen: boolean;
  loan: OverdueLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ApplyPenaltyModal: React.FC<ApplyPenaltyModalProps> = ({
  isOpen,
  loan,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [penaltyDate, setPenaltyDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      const suggested = loan.penaltyRate
        ? loan.remainingAmount * (loan.penaltyRate / 100)
        : 500;
      const suggestedAmount = Math.min(suggested, loan.remainingAmount);
      setAmount(Number(suggestedAmount.toFixed(2)));
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      dialogs.error("Penalty amount must be greater than zero");
      return;
    }
    if (amount > loan.remainingAmount) {
      dialogs.error(`Amount cannot exceed remaining balance (${formatCurrency(loan.remainingAmount)})`);
      return;
    }
    setSubmitting(true);
    try {
      await penaltiesAPI.create({
        amount,
        penaltyDate,
        reason: reason || null,
        debtId: loan.id,
      });
      dialogs.success("Penalty applied successfully");
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
            <AlertTriangle className="w-4 h-4 text-[var(--warning-color)]" />
            Apply Penalty
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <DollarSign className="w-3 h-3 inline mr-1" /> Penalty Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={loan.remainingAmount}
                required
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Max: {formatCurrency(loan.remainingAmount)}</p>
          </div>

          {/* Penalty Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3 inline mr-1" /> Penalty Date *
            </label>
            <input
              type="date"
              required
              value={penaltyDate}
              onChange={(e) => setPenaltyDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <FileText className="w-3 h-3 inline mr-1" /> Reason (optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Late payment fee, Interest penalty..."
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
                  Applying...
                </>
              ) : (
                "Apply Penalty"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyPenaltyModal;