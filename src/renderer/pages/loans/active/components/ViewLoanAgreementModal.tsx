// src/renderer/pages/loans/active/components/ViewLoanAgreementModal.tsx
import React, { useState, useEffect } from "react";
import { X, FileText, Download, User, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";
import { dialogs } from "../../../../utils/dialogs";
import { formatDate } from "../../../../utils/formatters";

interface ViewLoanAgreementModalProps {
  isOpen: boolean;
  debtId: number | null;
  debtName: string;
  onClose: () => void;
}

const ViewLoanAgreementModal: React.FC<ViewLoanAgreementModalProps> = ({
  isOpen,
  debtId,
  debtName,
  onClose,
}) => {
  const [agreement, setAgreement] = useState<LoanAgreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && debtId) {
      const fetchAgreement = async () => {
        setLoading(true);
        setError(null);
        try {
          const agreements = await loanAgreementsAPI.getByDebtId(debtId);
          setAgreement(agreements.length > 0 ? agreements[0] : null);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAgreement();
    } else {
      setAgreement(null);
      setError(null);
    }
  }, [isOpen, debtId]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (agreement?.filePath) {
      window.backendAPI.openExternal(agreement.filePath).catch((err: any) => {
        dialogs.error("Could not open file: " + err.message);
      });
    } else {
      dialogs.error("No file attached to this agreement");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "signed") {
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-text)]" };
    }
    return { icon: <AlertCircle className="w-3.5 h-3.5" />, bg: "bg-[var(--status-pending-bg)]", text: "text-[var(--status-pending-text)]" };
  };

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
            Loan Agreement - {debtName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-4 text-[var(--text-tertiary)]">Loading agreement...</div>
          )}
          {error && (
            <div className="text-center py-4 text-[var(--danger-color)]">Error: {error}</div>
          )}
          {!loading && !error && !agreement && (
            <div className="text-center py-4 text-[var(--text-secondary)]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No loan agreement found for this debt.
            </div>
          )}
          {!loading && !error && agreement && (
            <div className="space-y-3">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Lender
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">{agreement.lenderName || "—"}</p>
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full mt-0.5 ${getStatusBadge(agreement.status).bg} ${getStatusBadge(agreement.status).text}`}>
                    {getStatusBadge(agreement.status).icon}
                    {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                  </span>
                </div>
                {agreement.signedBy && (
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Signed By</p>
                    <p className="text-sm text-[var(--text-primary)]">{agreement.signedBy}</p>
                  </div>
                )}
              </div>

              {/* Terms */}
              {agreement.termsText && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Terms</p>
                  <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {agreement.termsText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)] flex-shrink-0">
          {agreement?.filePath && (
            <button
              onClick={handleDownload}
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
              Download
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

export default ViewLoanAgreementModal;