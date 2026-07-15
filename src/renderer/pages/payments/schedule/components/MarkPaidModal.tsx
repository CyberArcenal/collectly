// src/renderer/pages/payments/schedule/components/MarkPaidModal.tsx
import React, { useState, useEffect } from "react";
import { X, CreditCard, Calendar, DollarSign, User, CheckCircle } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { dialogs } from "../../../../utils/dialogs";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import PaymentMethodSelect from "../../../../components/Selects/PaymentMethod";

interface MarkPaidModalProps {
  isOpen: boolean;
  payment: ScheduledPayment | null;
  onClose: () => void;
  onConfirm: (amount: number, paymentDate: string, methodId: number) => Promise<void>;
}

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  payment,
  onClose,
  onConfirm,
}) => {
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [methodId, setMethodId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMethodId(null);
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodId) {
      dialogs.error("Please select a payment method");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(payment.amountDue, paymentDate, methodId);
      dialogs.success("Payment recorded successfully");
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
          {/* Payment Info */}
          <div
            className="p-3 rounded-lg space-y-1.5"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <User className="w-3 h-3" /> Debtor:
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {payment.borrowerName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Debt:</span>
              <span className="text-[var(--text-primary)]">{payment.debtName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Due Date:</span>
              <span className="text-[var(--text-primary)]">{formatDate(payment.dueDate)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-[var(--border-color)] pt-1.5 mt-1">
              <span className="text-[var(--text-secondary)]">Amount:</span>
              <span className="font-bold" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(payment.amountDue)}
              </span>
            </div>
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

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <CreditCard className="w-3 h-3 inline mr-1" /> Payment Method *
            </label>
            <PaymentMethodSelect
              value={methodId}
              onChange={(id) => setMethodId(id)}
              placeholder="Select payment method..."
              className="w-full"
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-1.5 text-xs text-[var(--text-tertiary)]">
            <CheckCircle className="w-3.5 h-3.5 text-[var(--primary-color)] flex-shrink-0 mt-0.5" />
            <span>
              This will record a payment of <strong>{formatCurrency(payment.amountDue)}</strong> for this scheduled payment.
            </span>
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

export default MarkPaidModal;