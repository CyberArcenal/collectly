// src/renderer/pages/loans/active/components/PaymentScheduleModal.tsx
import React, { useEffect, useState } from "react";
import { X, Calendar, Wallet, TrendingDown, AlertCircle } from "lucide-react";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import type { Debt } from "../../../../api/core/debt";
import type { PenaltyTransaction } from "../../../../api/core/pernalty_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface PaymentScheduleModalProps {
  isOpen: boolean;
  debt: Debt | null;
  onClose: () => void;
}

type TabType = "payments" | "penalties";

const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({ isOpen, debt, onClose }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("payments");

  useEffect(() => {
    if (isOpen && debt) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [paymentsRes, penaltiesRes] = await Promise.all([
            paymentsAPI.getByDebtId(debt.id).catch(() => []),
            penaltiesAPI.getByDebtId(debt.id).catch(() => []),
          ]);
          setPayments(paymentsRes);
          setPenalties(penaltiesRes);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, debt]);

  if (!isOpen || !debt) return null;

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalPenalty = penalties.reduce((sum, p) => sum + (p.amount ?? 0), 0);

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
            <Calendar className="w-4 h-4 text-[var(--primary-color)] flex-shrink-0" />
            Payment Schedule - {debt.name ?? "Debt"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-[var(--border-color)] flex-shrink-0">
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Paid</p>
            <p className="text-sm font-semibold text-[var(--success-color)]">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Penalties</p>
            <p className="text-sm font-semibold text-[var(--danger-color)]">{formatCurrency(totalPenalty)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Remaining</p>
            <p className="text-sm font-semibold" style={{ color: "var(--debt-high)" }}>
              {formatCurrency(debt.remainingAmount ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Due Date</p>
            <p className="text-sm text-[var(--text-primary)]">{debt.dueDate ? formatDate(debt.dueDate) : "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] flex-shrink-0 px-4">
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
          {loading ? (
            <div className="text-center py-4 text-[var(--text-tertiary)]">Loading...</div>
          ) : activeTab === "payments" ? (
            payments.length === 0 ? (
              <div className="text-center py-4 text-[var(--text-tertiary)]">No payments recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Date</th>
                      <th className="text-right py-1.5 px-2 text-[10px] uppercase tracking-wider">Amount</th>
                      <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Reference</th>
                      <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border-color)]">
                        <td className="py-1.5 px-2">{p.paymentDate ? formatDate(p.paymentDate) : "—"}</td>
                        <td className="py-1.5 px-2 text-right font-medium text-[var(--success-color)]">
                          {formatCurrency(p.amount ?? 0)}
                        </td>
                        <td className="py-1.5 px-2 text-[var(--text-secondary)]">{p.reference || "—"}</td>
                        <td className="py-1.5 px-2 text-[var(--text-secondary)]">{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            penalties.length === 0 ? (
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
                </table>
              </div>
            )
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

export default PaymentScheduleModal;