// src/renderer/pages/loans/overdue/components/RecordPartialPaymentModal.tsx
import React, { useState, useEffect } from "react";
import { X, CreditCard, Calendar, DollarSign, AlertCircle } from "lucide-react";
import paymentsAPI from "../../../../api/core/payment_transaction";
import { dialogs } from "../../../../utils/dialogs";
import { formatCurrency } from "../../../../utils/formatters";
import type { OverdueLoan } from "../hooks/useOverdueLoans";

interface RecordPartialPaymentModalProps {
  isOpen: boolean;
  loan: OverdueLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPartialPaymentModal: React.FC<RecordPartialPaymentModalProps> = ({
  isOpen,
  loan,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      setAmount(loan.remainingAmount);
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      dialogs.error("Amount must be greater than zero");
      return;
    }
    if (amount > loan.remainingAmount) {
      dialogs.error(`Amount cannot exceed remaining balance (${formatCurrency(loan.remainingAmount)})`);
      return;
    }
    setSubmitting(true);
    try {
      await paymentsAPI.create({
        amount,
        paymentDate,
        reference: reference || null,
        notes: notes || null,
        debtId: loan.id,
        methodId: 1, // Default payment method
      });
      dialogs.success("Payment recorded successfully");
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
            <CreditCard className="w-4 h-4 text-[var(--success-color)]" />
            Record Payment
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
              <span className="text-[var(--text-secondary)]">Borrower:</span>
              <span className="text-[var(--text-primary)]">{loan.borrower?.name || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Remaining:</span>
              <span className="font-bold" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(loan.remainingAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Overdue:</span>
              <span className="font-medium text-[var(--danger-color)]">
                {loan.stats?.daysOverdue ?? 0} days
              </span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <DollarSign className="w-3 h-3 inline mr-1" /> Payment Amount *
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

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3 inline mr-1" /> Payment Date *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Reference (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., OR-2024-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Additional notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              style={{ backgroundColor: "var(--success-color)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--success-color)";
              }}
            >
              {submitting ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                "Record Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPartialPaymentModal;