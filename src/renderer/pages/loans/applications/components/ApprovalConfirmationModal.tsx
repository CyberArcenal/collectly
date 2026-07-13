// src/renderer/pages/loans/applications/components/ApprovalConfirmationModal.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { LoanApplication } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  application: LoanApplication | null;
  type: "approve" | "reject";
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

const ApprovalConfirmationModal: React.FC<ApprovalConfirmationModalProps> = ({
  isOpen,
  application,
  type,
  onClose,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onConfirm(type === "reject" ? rejectionReason : undefined);
      if (isMountedRef.current) {
        onClose();
      }
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isLoading, onConfirm, onClose, rejectionReason, type]);

  if (!isOpen || !application) return null;

  const isApprove = type === "approve";
  const titleText = isApprove ? "Approve Application" : "Reject Application";
  const icon = isApprove ? (
    <CheckCircle className="w-5 h-5 text-[var(--success-color)]" />
  ) : (
    <XCircle className="w-5 h-5 text-[var(--danger-color)]" />
  );
  const confirmText = isApprove ? "Approve" : "Reject";
  const confirmColor = isApprove ? "var(--success-color)" : "var(--danger-color)";
  const confirmHoverColor = isApprove ? "var(--btn-success-hover)" : "var(--btn-danger-hover)";

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
            {icon}
            {titleText}
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
          {/* Application Summary */}
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div>
                <span className="text-[var(--text-tertiary)]">Debtor:</span>
                <span className="ml-1 font-medium text-[var(--text-primary)]">
                  {application.debtorName}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Amount:</span>
                <span className="ml-1 font-medium text-[var(--text-primary)]">
                  {formatCurrency(application.requestedAmount)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[var(--text-tertiary)]">Purpose:</span>
                <span className="ml-1 text-[var(--text-secondary)]">
                  {application.purpose}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          {isApprove ? (
            <div
              className="p-3 rounded-lg text-sm flex items-start gap-2"
              style={{
                backgroundColor: "var(--status-success-bg)",
                color: "var(--status-success-text)",
                border: "1px solid var(--status-success-text)",
              }}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>Approving this application will create an active loan for the debtor.</p>
                <p className="text-xs opacity-80 mt-0.5">
                  The debtor will be notified via email/SMS if configured.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="p-3 rounded-lg text-sm flex items-start gap-2"
              style={{
                backgroundColor: "var(--status-overdue-bg)",
                color: "var(--status-overdue-text)",
                border: "1px solid var(--status-overdue-text)",
              }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>Rejecting this application will archive it.</p>
                <p className="text-xs opacity-80 mt-0.5">
                  The debtor will be notified if contact info is provided.
                </p>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {!isApprove && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Rejection Reason <span className="text-[10px] font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="Why is this application being rejected? (will be shared with the debtor)"
                disabled={isLoading}
              />
            </div>
          )}

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
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: confirmColor }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = confirmHoverColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = confirmColor;
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalConfirmationModal;