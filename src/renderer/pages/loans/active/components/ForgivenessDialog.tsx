// src/renderer/pages/loans/active/components/ForgivenessDialog.tsx
import React, { useState, useEffect } from "react";
import { X, Gift, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";

interface ForgivenessDialogProps {
  isOpen: boolean;
  remainingBalance: number;
  onClose: () => void;
  onConfirm: (amount: number, reason?: string) => void;
  isLoading?: boolean;
}

export const ForgivenessDialog: React.FC<ForgivenessDialogProps> = ({
  isOpen,
  remainingBalance,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState<number>(remainingBalance);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(remainingBalance);
      setReason("");
    }
  }, [isOpen, remainingBalance]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (amount <= 0 || amount > remainingBalance) return;
    onConfirm(amount, reason.trim() || undefined);
  };

  const isValid = amount > 0 && amount <= remainingBalance;

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
            <Gift className="w-4 h-4 text-[var(--warning-color)]" />
            Apply Forgiveness
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <AlertCircle className="w-4 h-4 text-[var(--warning-color)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Forgiving a portion of this loan will permanently reduce the remaining balance.
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Current remaining: <span className="font-medium" style={{ color: "var(--debt-high)" }}>
                  {formatCurrency(remainingBalance)}
                </span>
              </p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Amount to Forgive *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
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
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Max: {formatCurrency(remainingBalance)}</p>
            {(!isValid || amount <= 0) && (
              <p className="text-xs text-[var(--danger-color)] mt-1">
                Amount must be between 0.01 and {formatCurrency(remainingBalance)}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Good payer, hardship, promo discount, etc."
              rows={3}
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
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
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
              {isLoading ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Applying...
                </>
              ) : (
                "Apply Forgiveness"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};