// src/renderer/pages/loans/active/components/ViewDebtModal.tsx
import React, { useEffect, useState, useRef } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import type { PenaltyTransaction } from "../../../../api/core/pernalty_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";

// Extend Debt type para sa mga field na hindi pa kasama sa interface
interface ExtendedDebt extends Debt {
  lastInterestAccrualDate?: string | null;
  interestCalculationPeriod: "per_annum" | "per_month"; // ✅ idinagdag
  borrower?: {
    id: number;
    name: string;
    contact: string | null;
    email: string | null;
    address?: string | null;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface ViewDebtModalProps {
  isOpen: boolean;
  debt: ExtendedDebt | null;
  onClose: () => void;
}

type TabType = "details" | "payments" | "penalties";

const ViewDebtModal: React.FC<ViewDebtModalProps> = ({ isOpen, debt, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (isOpen && debt) {
      dataFetchedRef.current = false;
      setPayments([]);
      setPenalties([]);
      setLoadingPayments(true);
      setLoadingPenalties(true);
      
      Promise.all([
        paymentsAPI.getByDebtId(debt.id).catch(err => {
          console.error("Failed to fetch payments", err);
          return [];
        }),
        penaltiesAPI.getByDebtId(debt.id).catch(err => {
          console.error("Failed to fetch penalties", err);
          return [];
        })
      ]).then(([paymentsData, penaltiesData]) => {
        setPayments(paymentsData);
        setPenalties(penaltiesData);
        dataFetchedRef.current = true;
      }).finally(() => {
        setLoadingPayments(false);
        setLoadingPenalties(false);
      });
    } else if (!isOpen) {
      setActiveTab("details");
      setPayments([]);
      setPenalties([]);
      dataFetchedRef.current = false;
    }
  }, [isOpen, debt?.id]);

  if (!debt) return null;

  // ✅ Gumamit ng direktang fields (hindi na umaasa sa stats)
  const totalPaid = debt.paidAmount;
  const remainingBalance = debt.remainingAmount;
  
  // ✅ Compute total penalty mula sa penalties list (kung na-load na)
  const totalPenalty = penalties.reduce((sum, p) => sum + p.amount, 0);
  
  // ✅ Compute days overdue batay sa dueDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = new Date(debt.dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));

  // ✅ Accrued interest (interes + penalty na naipon)
  const accruedInterest = Math.max(0, remainingBalance - (debt.totalAmount - totalPaid));

  // Optional: logging para ma-verify
  console.group(`🔍 ViewDebtModal - Debt: ${debt.name} (ID: ${debt.id})`);
  console.log("totalAmount:", debt.totalAmount);
  console.log("paidAmount (direct):", debt.paidAmount);
  console.log("totalPaid (used):", totalPaid);
  console.log("remainingAmount (direct):", debt.remainingAmount);
  console.log("remainingBalance (used):", remainingBalance);
  console.log("totalAmount - totalPaid:", debt.totalAmount - totalPaid);
  console.log("accruedInterest (computed):", accruedInterest);
  console.log("totalPenalty (from list):", totalPenalty);
  console.log("daysOverdue (computed):", daysOverdue);
  console.log("lastInterestAccrualDate:", debt.lastInterestAccrualDate);
  console.log("interestCalculationPeriod:", debt.interestCalculationPeriod); // ✅ idinagdag
  console.groupEnd();

  const SkeletonTableRow = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-2"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-2"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-2"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
    </tr>
  );

  const renderDetailsTab = () => (
    <div className="space-y-4">
      {/* Debt Information */}
      <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
        <h4 className="font-semibold mb-2 text-[var(--text-primary)]">📋 Debt Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-[var(--text-secondary)]">Debt Name:</span> <div className="font-medium">{debt.name}</div></div>
          <div><span className="text-[var(--text-secondary)]">Status:</span> 
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${debt.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
              ${debt.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
              ${debt.status === 'paid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
              ${debt.status === 'defaulted' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : ''}
            `}>{debt.status}</span>
          </div>
          <div><span className="text-[var(--text-secondary)]">Total Amount:</span> <div>{formatCurrency(debt.totalAmount)}</div></div>
          <div><span className="text-[var(--text-secondary)]">Paid Amount:</span> <div>{formatCurrency(totalPaid)}</div></div>
          <div><span className="text-[var(--text-secondary)]">Remaining Balance:</span> <div className="font-bold text-[var(--debt-high)]">{formatCurrency(remainingBalance)}</div></div>
          <div><span className="text-[var(--text-secondary)]">Due Date:</span> <div>{formatDate(debt.dueDate)}</div></div>
        </div>
      </div>

      {/* Borrower Information */}
      {debt.borrower && (
        <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <h4 className="font-semibold mb-2 text-[var(--text-primary)]">👤 Borrower Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[var(--text-secondary)]">Name:</span> <div>{debt.borrower.name}</div></div>
            <div><span className="text-[var(--text-secondary)]">Contact:</span> <div>{debt.borrower.contact || "—"}</div></div>
            <div><span className="text-[var(--text-secondary)]">Email:</span> <div>{debt.borrower.email || "—"}</div></div>
            <div><span className="text-[var(--text-secondary)]">Address:</span> <div>{debt.borrower.address || "—"}</div></div>
            {debt.borrower.notes && <div className="col-span-2"><span className="text-[var(--text-secondary)]">Notes:</span> <div>{debt.borrower.notes}</div></div>}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
        <h4 className="font-semibold mb-2 text-[var(--text-primary)]">💰 Financial Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-[var(--text-secondary)]">Total Penalty:</span> <div>{formatCurrency(totalPenalty)}</div></div>
          <div><span className="text-[var(--text-secondary)]">Accrued Interest + Penalty:</span> <div className="text-amber-600 dark:text-amber-400">{formatCurrency(accruedInterest)}</div></div>
          {daysOverdue > 0 && (
            <div><span className="text-[var(--text-secondary)]">Days Overdue:</span> <div className="text-red-500 font-semibold">{daysOverdue} days</div></div>
          )}
        </div>
      </div>

      {/* Interest & Penalty Rates */}
      <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
        <h4 className="font-semibold mb-2 text-[var(--text-primary)]">📈 Interest & Penalty Rates</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-[var(--text-secondary)]">Interest Rate:</span> <div>{debt.interestRate ? `${debt.interestRate}%` : "—"}</div></div>
          <div><span className="text-[var(--text-secondary)]">Penalty Rate:</span> <div>{debt.penaltyRate ? `${debt.penaltyRate}%` : "—"}</div></div>
          {/* ✅ Idinagdag: Interest Calculation Period */}
          <div className="col-span-2">
            <span className="text-[var(--text-secondary)]">Interest Calculation Period:</span> 
            <div className="font-medium">
              {debt.interestCalculationPeriod === "per_annum" ? "Per Annum (yearly)" : 
               debt.interestCalculationPeriod === "per_month" ? "Per Month (monthly)" : 
               "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
        <h4 className="font-semibold mb-2 text-[var(--text-primary)]">📅 Important Dates</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-[var(--text-secondary)]">Created At:</span> <div>{formatDate(debt.createdAt)}</div></div>
          <div><span className="text-[var(--text-secondary)]">Last Updated:</span> <div>{formatDate(debt.updatedAt)}</div></div>
          {debt.lastInterestAccrualDate && (
            <div className="col-span-2"><span className="text-[var(--text-secondary)]">Last Interest Accrual:</span> <div>{formatDate(debt.lastInterestAccrualDate)}</div></div>
          )}
          {debt.deletedAt && (
            <div className="col-span-2"><span className="text-red-500">Deleted At:</span> <div>{formatDate(debt.deletedAt)}</div></div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <>
      {loadingPayments ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reference</th></tr>
            </thead>
            <tbody><SkeletonTableRow /><SkeletonTableRow /><SkeletonTableRow /></tbody>
          </table>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center text-[var(--text-tertiary)] py-4">No payments recorded.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reference</th></tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-[var(--border-color)]">
                  <td className="px-3 py-1">{formatDate(p.paymentDate)}</td>
                  <td className="px-3 py-1 text-right">{formatCurrency(p.amount)}</td>
                  <td className="px-3 py-1">{p.reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderPenaltiesTab = () => (
    <>
      {loadingPenalties ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reason</th></tr>
            </thead>
            <tbody><SkeletonTableRow /><SkeletonTableRow /><SkeletonTableRow /></tbody>
          </table>
        </div>
      ) : penalties.length === 0 ? (
        <div className="text-center text-[var(--text-tertiary)] py-4">No penalties recorded.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reason</th></tr>
            </thead>
            <tbody>
              {penalties.map(p => (
                <tr key={p.id} className="border-b border-[var(--border-color)]">
                  <td className="px-3 py-1">{formatDate(p.penaltyDate)}</td>
                  <td className="px-3 py-1 text-right">{formatCurrency(p.amount)}</td>
                  <td className="px-3 py-1">{p.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Debt Details: ${debt.name}`} size="lg">
      <div className="space-y-4">
        <div className="flex border-b" style={{ borderColor: "var(--border-color)" }}>
          <button onClick={() => setActiveTab("details")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "details" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Details</button>
          <button onClick={() => setActiveTab("payments")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "payments" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Payments ({payments.length})</button>
          <button onClick={() => setActiveTab("penalties")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "penalties" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Penalties ({penalties.length})</button>
        </div>
        <div className="min-h-[200px] max-h-[60vh] overflow-y-auto">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "payments" && renderPaymentsTab()}
          {activeTab === "penalties" && renderPenaltiesTab()}
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewDebtModal;