// src/renderer/pages/loans/active/components/ViewDebtModal.tsx
import React, { useEffect, useState } from "react";
import { X, User, Calendar, Wallet, TrendingUp, AlertCircle, FileText, Loader2 } from "lucide-react";
import paymentsAPI, { type PaymentTransaction } from "../../../../api/core/payment_transaction";
import penaltiesAPI, { type PenaltyTransaction } from "../../../../api/core/pernalty_transaction";
import debtsAPI, { type Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { showError } from "../../../../utils/notification";

interface ExtendedDebt extends Debt {
  lastInterestAccrualDate?: string | null;
  interestCalculationPeriod?: "per_annum" | "per_month";
  borrower?: {
    id: number;
    name: string;
    contact: string | null;
    email: string | null;
    address?: string | null;
    notes?: string | null;
  };
}

interface ViewDebtModalProps {
  isOpen: boolean;
  debt: ExtendedDebt | null;  // Initial data from table (may be incomplete)
  onClose: () => void;
}

type TabType = "details" | "payments" | "penalties";

const ViewDebtModal: React.FC<ViewDebtModalProps> = ({ isOpen, debt: initialDebt, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [fullDebt, setFullDebt] = useState<ExtendedDebt | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state and fetch data when modal opens
  useEffect(() => {
    if (isOpen && initialDebt?.id) {
      // Reset state
      setFullDebt(null);
      setPayments([]);
      setPenalties([]);
      setError(null);
      setActiveTab("details");

      // Fetch full debt details
      setLoading(true);
      debtsAPI.getById(initialDebt.id)
        .then(response => {
          if (response.status) {
            setFullDebt(response.data);
          } else {
            throw new Error(response.message || "Failed to fetch debt details");
          }
        })
        .catch(err => {
          setError(err.message);
          showError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });

      // Fetch payments and penalties in parallel
      setLoadingPayments(true);
      setLoadingPenalties(true);
      Promise.all([
        paymentsAPI.getByDebtId(initialDebt.id).catch(() => []),
        penaltiesAPI.getByDebtId(initialDebt.id).catch(() => []),
      ])
        .then(([paymentsData, penaltiesData]) => {
          setPayments(paymentsData);
          setPenalties(penaltiesData);
        })
        .finally(() => {
          setLoadingPayments(false);
          setLoadingPenalties(false);
        });
    } else if (!isOpen) {
      // Cleanup on close
      setFullDebt(null);
      setPayments([]);
      setPenalties([]);
      setError(null);
    }
  }, [isOpen, initialDebt?.id]);

  if (!isOpen) return null;

  // Show loading state while fetching debt
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--card-bg)] rounded-xl p-8 shadow-xl border border-[var(--border-color)] flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
          <p className="mt-4 text-[var(--text-secondary)]">Loading debt details...</p>
        </div>
      </div>
    );
  }

  // Show error if failed to load
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--card-bg)] rounded-xl p-8 shadow-xl border border-[var(--border-color)] max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-[var(--danger-color)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Failed to load debt</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--primary-color)] hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use the fetched full debt, fallback to initial prop if something went wrong
  const debt = fullDebt || initialDebt;
  if (!debt) return null;

  const totalPaid = debt.paidAmount ?? 0;
  const remainingBalance = debt.remainingAmount ?? 0;
  const totalPenalty = penalties.reduce((sum, p) => sum + p.amount, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = debt.dueDate ? new Date(debt.dueDate) : null;
  if (dueDateObj) dueDateObj.setHours(0, 0, 0, 0);
  const daysOverdue = dueDateObj ? Math.max(0, Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-[var(--status-success-bg)] text-[var(--status-success-text)]";
      case "overdue": return "bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)]";
      case "paid": return "bg-[var(--status-paid-bg)] text-[var(--status-paid-text)]";
      case "defaulted": return "bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)]";
      default: return "bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)]";
    }
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
            <Wallet className="w-4 h-4 text-[var(--primary-color)] flex-shrink-0" />
            {debt.name ?? "Unnamed Debt"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] flex-shrink-0 px-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "payments"
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("penalties")}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "penalties"
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Penalties ({penalties.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "details" && (
            <div className="space-y-3">
              {/* Debt Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Status</p>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-0.5 ${getStatusBadge(debt.status)}`}>
                    {debt.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Due Date</p>
                  <p className="text-[var(--text-primary)]">{debt.dueDate ? formatDate(debt.dueDate) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Amount</p>
                  <p className="text-[var(--text-primary)] font-medium">{formatCurrency(debt.totalAmount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Remaining</p>
                  <p className="font-bold" style={{ color: "var(--debt-high)" }}>{formatCurrency(remainingBalance)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Penalties</p>
                  <p className="text-[var(--text-primary)]">{formatCurrency(totalPenalty)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Days Overdue</p>
                  <p className={daysOverdue > 0 ? "text-[var(--danger-color)] font-semibold" : "text-[var(--text-secondary)]"}>
                    {daysOverdue > 0 ? `${daysOverdue} days` : "—"}
                  </p>
                </div>
              </div>

              {/* Borrower Info */}
              {debt.borrower && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Borrower
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-sm mt-1">
                    <div>
                      <span className="text-[var(--text-tertiary)]">Name:</span>
                      <span className="ml-1 text-[var(--text-primary)] font-medium">{debt.borrower.name}</span>
                    </div>
                    {debt.borrower.contact && (
                      <div>
                        <span className="text-[var(--text-tertiary)]">Contact:</span>
                        <span className="ml-1 text-[var(--text-primary)]">{debt.borrower.contact}</span>
                      </div>
                    )}
                    {debt.borrower.email && (
                      <div className="col-span-2">
                        <span className="text-[var(--text-tertiary)]">Email:</span>
                        <span className="ml-1 text-[var(--text-primary)]">{debt.borrower.email}</span>
                      </div>
                    )}
                    {debt.borrower.address && (
                      <div className="col-span-2">
                        <span className="text-[var(--text-tertiary)]">Address:</span>
                        <span className="ml-1 text-[var(--text-primary)]">{debt.borrower.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rates */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Interest & Penalty Rates
                </p>
                <div className="grid grid-cols-2 gap-1 text-sm mt-1">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Interest Rate:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{debt.interestRate != null ? `${debt.interestRate}%` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Penalty Rate:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{debt.penaltyRate != null ? `${debt.penaltyRate}%` : "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--text-tertiary)]">Calculation:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                      {debt.interestCalculationPeriod === "per_annum" ? "Per Annum" :
                       debt.interestCalculationPeriod === "per_month" ? "Per Month" : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Important Dates
                </p>
                <div className="grid grid-cols-2 gap-1 text-sm mt-1">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Created:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{debt.createdAt ? formatDate(debt.createdAt) : "—"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Updated:</span>
                    <span className="ml-1 text-[var(--text-primary)]">{debt.updatedAt ? formatDate(debt.updatedAt) : "—"}</span>
                  </div>
                  {debt.lastInterestAccrualDate && (
                    <div className="col-span-2">
                      <span className="text-[var(--text-tertiary)]">Last Interest Accrual:</span>
                      <span className="ml-1 text-[var(--text-primary)]">{formatDate(debt.lastInterestAccrualDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              {loadingPayments ? (
                <div className="text-center py-4 text-[var(--text-tertiary)]">Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-4 text-[var(--text-tertiary)]">No payments recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                      <tr>
                        <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Date</th>
                        <th className="text-right py-1.5 px-2 text-[10px] uppercase tracking-wider">Amount</th>
                        <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--border-color)]">
                          <td className="py-1.5 px-2">{p.paymentDate ? formatDate(p.paymentDate) : "—"}</td>
                          <td className="py-1.5 px-2 text-right font-medium" style={{ color: "var(--debt-low)" }}>
                            {formatCurrency(p.amount ?? 0)}
                          </td>
                          <td className="py-1.5 px-2 text-[var(--text-secondary)]">{p.reference || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-[var(--border-color)]">
                      <tr>
                        <td className="py-2 px-2 font-medium">Total</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ color: "var(--debt-low)" }}>
                          {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "penalties" && (
            <div>
              {loadingPenalties ? (
                <div className="text-center py-4 text-[var(--text-tertiary)]">Loading penalties...</div>
              ) : penalties.length === 0 ? (
                <div className="text-center py-4 text-[var(--text-tertiary)]">No penalties recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                      <tr>
                        <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Date</th>
                        <th className="text-right py-1.5 px-2 text-[10px] uppercase tracking-wider">Amount</th>
                        <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {penalties.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--border-color)]">
                          <td className="py-1.5 px-2">{p.penaltyDate ? formatDate(p.penaltyDate) : "—"}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-[var(--danger-color)]">
                            {formatCurrency(p.amount ?? 0)}
                          </td>
                          <td className="py-1.5 px-2 text-[var(--text-secondary)]">{p.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-[var(--border-color)]">
                      <tr>
                        <td className="py-2 px-2 font-medium">Total</td>
                        <td className="py-2 px-2 text-right font-bold text-[var(--danger-color)]">
                          {formatCurrency(penalties.reduce((sum, p) => sum + p.amount, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
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

export default ViewDebtModal;