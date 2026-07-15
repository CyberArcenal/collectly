// src/renderer/pages/loans/agreements/components/ViewAgreementModal.tsx
import React from "react";
import { X, User, Building, Calendar, FileText, Download, CheckCircle, FileArchive } from "lucide-react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ViewAgreementModalProps {
  isOpen: boolean;
  agreement: LoanAgreement | null;
  onClose: () => void;
  onDownload: () => void;
}

const ViewAgreementModal: React.FC<ViewAgreementModalProps> = ({
  isOpen,
  agreement,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !agreement) return null;

  const getStatusBadge = (status: string) => {
    if (status === "signed") {
      return {
        bg: "bg-[var(--status-success-bg)]",
        text: "text-[var(--status-success-text)]",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      };
    }
    return {
      bg: "bg-[var(--status-pending-bg)]",
      text: "text-[var(--status-pending-text)]",
      icon: <FileArchive className="w-3.5 h-3.5" />,
    };
  };

  const status = getStatusBadge(agreement.status);

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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-[var(--primary-color)] flex-shrink-0" />
            Loan Agreement Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Info */}
          <div
            className="grid grid-cols-2 gap-3 p-3 rounded-lg"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Debt</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {agreement.debt?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Borrower</p>
              <p className="text-sm text-[var(--text-primary)]">
                {agreement.debt?.borrower?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                <Building className="w-3 h-3" /> Lender
              </p>
              <p className="text-sm text-[var(--text-primary)]">
                {agreement.lenderName || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Agreement Date
              </p>
              <p className="text-sm text-[var(--text-primary)]">
                {agreement.agreementDate ? formatDate(agreement.agreementDate) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.text}`}>
                {status.icon}
                {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
              </span>
            </div>
            {agreement.signedBy && (
              <>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Signed By
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">{agreement.signedBy}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Signed At
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {agreement.signedAt ? formatDate(agreement.signedAt) : "—"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Loan Terms Snapshot */}
          {(agreement.principalAmount || agreement.interestRate || agreement.penaltyRate ||
            agreement.dueDate || agreement.purpose) && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                Loan Terms (as of signing)
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {agreement.principalAmount && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Principal:</span>
                    <span className="ml-1 font-medium text-[var(--text-primary)]">
                      {formatCurrency(agreement.principalAmount)}
                    </span>
                  </div>
                )}
                {agreement.interestRate && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Interest Rate:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                      {agreement.interestRate}% p.a.
                    </span>
                  </div>
                )}
                {agreement.penaltyRate && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Penalty Rate:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                      {agreement.penaltyRate}% p.a.
                    </span>
                  </div>
                )}
                {agreement.dueDate && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Due Date:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                      {formatDate(agreement.dueDate)}
                    </span>
                  </div>
                )}
                {agreement.purpose && (
                  <div className="col-span-2">
                    <span className="text-[var(--text-tertiary)]">Purpose:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{agreement.purpose}</span>
                  </div>
                )}
                {agreement.loanStartDate && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Loan Start Date:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                      {formatDate(agreement.loanStartDate)}
                    </span>
                  </div>
                )}
                {agreement.anniversaryDay && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Anniversary Day:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                      Every {agreement.anniversaryDay}th of the month
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms Text */}
          {agreement.termsText && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                <FileText className="w-3 h-3 inline mr-1" /> Additional Terms
              </p>
              <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {agreement.termsText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)] flex-shrink-0">
          {agreement.filePath && (
            <button
              onClick={onDownload}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
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
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--primary-color)",
              color: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-color)";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAgreementModal;