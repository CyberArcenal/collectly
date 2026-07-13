// src/renderer/pages/loans/applications/components/ApplicationDetailModal.tsx
import React, { useState, useEffect } from "react";
import { X, User, Calendar, DollarSign, FileText, CreditCard, TrendingUp } from "lucide-react";
import type { LoanApplication } from "../types";
import type { Debt } from "../../../../api/core/debt";
import debtsAPI from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ApplicationDetailModalProps {
  isOpen: boolean;
  application: LoanApplication | null;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return { bg: "bg-[var(--status-pending-bg)]", text: "text-[var(--status-pending-text)]" };
    case "approved":
      return { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-text)]" };
    case "rejected":
      return { bg: "bg-[var(--status-overdue-bg)]", text: "text-[var(--status-overdue-text)]" };
    default:
      return { bg: "bg-[var(--status-inactive-bg)]", text: "text-[var(--text-tertiary)]" };
  }
};

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  application,
  onClose,
  onApprove,
  onReject,
}) => {
  const [debt, setDebt] = useState<Debt | null>(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  useEffect(() => {
    if (isOpen && application && application.status === "approved" && application.id) {
      const fetchDebt = async () => {
        setLoadingDebt(true);
        try {
          const response = await debtsAPI.getByApplicationId?.(application.id);
          if (response?.status && response.data) {
            setDebt(response.data);
          } else {
            const debtsRes = await debtsAPI.getAll({
              borrowerId: application.debtorId as number | undefined,
              limit: 1,
              sortBy: "createdAt",
              sortOrder: "DESC",
            });
            if (debtsRes.status && debtsRes.data.data.length > 0) {
              setDebt(debtsRes.data.data[0]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch associated debt", error);
        } finally {
          setLoadingDebt(false);
        }
      };
      fetchDebt();
    } else {
      setDebt(null);
    }
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const statusBadge = getStatusBadge(application.status);

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
            Loan Application Details
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
          {/* Application Info */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <div className="col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="font-medium text-[var(--text-primary)]">{application.debtorName || application.debtor_name}</span>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                {application.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Requested Amount</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(application.requestedAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Purpose</p>
              <p className="text-sm text-[var(--text-secondary)]">{application.purpose}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Proposed Due Date</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(application.proposedDueDate)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Interest Rate</p>
              <p className="text-sm text-[var(--text-primary)]">{application.interestRate ? `${application.interestRate}%` : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Applied On</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(application.createdAt)}</p>
            </div>
            {application.approvedAt && (
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Approved On</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(application.approvedAt)}</p>
              </div>
            )}
            {application.rejectedAt && (
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Rejected On</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(application.rejectedAt)}</p>
              </div>
            )}
            {application.rejectionReason && (
              <div className="col-span-2">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Rejection Reason</p>
                <p className="text-sm text-[var(--text-primary)]">{application.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Associated Debt (if approved) */}
          {application.status === "approved" && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Approved Loan Details
              </p>
              {loadingDebt ? (
                <div className="text-sm text-[var(--text-tertiary)] py-2">Loading debt details...</div>
              ) : debt ? (
                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Name:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{debt.name}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Status:</span>
                    <span className={`ml-1 font-medium ${debt.status === "paid" ? "text-[var(--success-color)]" : "text-[var(--warning-color)]"}`}>
                      {debt.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Total:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{formatCurrency(debt.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Remaining:</span>
                    <span className="ml-1 font-bold" style={{ color: "var(--debt-high)" }}>
                      {formatCurrency(debt.remainingAmount)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--text-tertiary)]">Due Date:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{formatDate(debt.dueDate)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] py-2">No associated debt record found.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)] flex-shrink-0">
          {application.status === "pending" && (
            <>
              <button
                onClick={onReject}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--danger-color)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--btn-danger-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--danger-color)";
                }}
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--success-color)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--success-color)";
                }}
              >
                Approve
              </button>
            </>
          )}
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

export default ApplicationDetailModal;