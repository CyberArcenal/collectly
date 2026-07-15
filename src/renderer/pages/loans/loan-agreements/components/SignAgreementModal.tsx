// src/renderer/pages/loans/agreements/components/SignAgreementModal.tsx
import React from "react";
import { X, FileSignature, AlertTriangle, User, Calendar } from "lucide-react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import { formatDate } from "../../../../utils/formatters";

interface SignAgreementModalProps {
  isOpen: boolean;
  agreement: LoanAgreement | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const SignAgreementModal: React.FC<SignAgreementModalProps> = ({
  isOpen,
  agreement,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !agreement) return null;

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
            <FileSignature className="w-4 h-4 text-[var(--success-color)]" />
            Sign Loan Agreement
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
          {/* Agreement Info */}
          <div
            className="p-3 rounded-lg space-y-1.5"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Debt:</span>
              <span className="font-medium text-[var(--text-primary)]">
                {agreement.debt?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Lender:</span>
              <span className="text-[var(--text-primary)]">
                {agreement.lenderName || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Agreement Date:</span>
              <span className="text-[var(--text-primary)]">
                {agreement.agreementDate ? formatDate(agreement.agreementDate) : "—"}
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
              <p className="font-medium">This action is irreversible.</p>
              <p className="text-xs opacity-80 mt-0.5">
                After signing, the agreement cannot be edited.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              disabled={isLoading}
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
              onClick={onConfirm}
              disabled={isLoading}
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
              {isLoading ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Signing...
                </>
              ) : (
                "Confirm Sign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignAgreementModal;