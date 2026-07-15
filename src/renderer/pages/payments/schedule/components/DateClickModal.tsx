// src/renderer/pages/payments/schedule/components/DateClickModal.tsx
import React from "react";
import { X, Calendar, User, DollarSign, CreditCard, Phone, Mail } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface DateClickModalProps {
  isOpen: boolean;
  date: string;
  payments: ScheduledPayment[];
  onClose: () => void;
  onMarkPaid: (payment: ScheduledPayment) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const DateClickModal: React.FC<DateClickModalProps> = ({
  isOpen,
  date,
  payments,
  onClose,
  onMarkPaid,
}) => {
  if (!isOpen) return null;

  const totalAmount = payments.reduce((sum, p) => sum + p.amountDue, 0);

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
            <Calendar className="w-4 h-4 text-[var(--primary-color)]" />
            Payments due on {formatDate(date)}
            <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
              ({payments.length})
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total */}
        <div className="px-4 py-2 border-b border-[var(--border-color)] flex justify-between text-sm" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <span className="text-[var(--text-secondary)]">Total Due:</span>
          <span className="font-bold" style={{ color: "var(--debt-high)" }}>
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Payments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {payments.map((p) => (
            <div
              key={p.debtId}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                  {getInitials(p.borrowerName)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text-primary)] text-sm truncate">
                    {p.borrowerName}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {p.debtName}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {p.contact && (
                      <span className="flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        {p.contact}
                      </span>
                    )}
                    {p.email && (
                      <span className="flex items-center gap-0.5">
                        <Mail className="w-2.5 h-2.5" />
                        {p.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-semibold" style={{ color: "var(--debt-high)" }}>
                  {formatCurrency(p.amountDue)}
                </span>
                <button
                  onClick={() => onMarkPaid(p)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1"
                  style={{ backgroundColor: "var(--success-color)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--success-color)";
                  }}
                >
                  <CreditCard className="w-3 h-3" />
                  Mark Paid
                </button>
              </div>
            </div>
          ))}
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

export default DateClickModal;