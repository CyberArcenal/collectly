// src/renderer/pages/loans/overdue/components/OverdueLoansTable.tsx
import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Bell,
  CreditCard,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface OverdueLoansTableProps {
  loans: OverdueLoan[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSendReminder: (loan: OverdueLoan) => void;
  onRecordPayment: (loan: OverdueLoan) => void;
  onApplyPenalty: (loan: OverdueLoan) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getDaysOverdueClass = (days: number): string => {
  if (days >= 90) return "bg-red-700 text-white";
  if (days >= 60) return "bg-red-600 text-white";
  if (days >= 30) return "bg-orange-600 text-white";
  return "bg-yellow-600 text-white";
};

const OverdueLoansTable: React.FC<OverdueLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onSendReminder,
  onRecordPayment,
  onApplyPenalty,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  };

  const allSelected = loans.length > 0 && selectedLoans.length === loans.length;
  const someSelected = selectedLoans.length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="py-2.5 px-3 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={onToggleSelectAll}
                className="rounded border-[var(--border-color)] cursor-pointer"
              />
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-1">
                Debt Name {getSortIcon("name")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("borrower")}
            >
              <div className="flex items-center gap-1">
                Borrower {getSortIcon("borrower")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("remainingAmount")}
            >
              <div className="flex items-center gap-1">
                Remaining {getSortIcon("remainingAmount")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("dueDate")}
            >
              <div className="flex items-center gap-1">
                Due Date {getSortIcon("dueDate")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("daysOverdue")}
            >
              <div className="flex items-center gap-1">
                Days Overdue {getSortIcon("daysOverdue")}
              </div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Penalties
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => {
            const borrowerName = loan.borrower?.name ?? "—";
            return (
              <tr
                key={loan.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onRecordPayment(loan)}
              >
                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedLoans.includes(loan.id)}
                    onChange={() => onToggleSelect(loan.id)}
                    className="rounded border-[var(--border-color)] cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-medium text-[var(--text-primary)] text-sm truncate max-w-[150px]">
                    {loan.name ?? "Unnamed Debt"}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--danger-color)] to-[var(--danger-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {borrowerName !== "—" ? getInitials(borrowerName) : "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[var(--text-primary)] text-sm truncate max-w-[100px]">
                        {borrowerName}
                      </div>
                      {loan.borrower?.contact && (
                        <div className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
                          <Phone className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[80px]">{loan.borrower.contact}</span>
                        </div>
                      )}
                      {loan.borrower?.email && !loan.borrower?.contact && (
                        <div className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
                          <Mail className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[80px]">{loan.borrower.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-semibold text-sm" style={{ color: "var(--debt-high)" }}>
                    {formatCurrency(loan.remainingAmount ?? 0)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {loan.dueDate ? formatDate(loan.dueDate) : "—"}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${getDaysOverdueClass(
                      loan.stats?.daysOverdue ?? 0
                    )}`}
                  >
                    {loan.stats?.daysOverdue ?? 0} days
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {loan.stats?.totalPenalty
                      ? formatCurrency(loan.stats.totalPenalty)
                      : "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onSendReminder(loan)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="Send Reminder"
                    >
                      <Bell className="w-4 h-4 text-[var(--accent-blue)]" />
                    </button>
                    <button
                      onClick={() => onRecordPayment(loan)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="Record Payment"
                    >
                      <CreditCard className="w-4 h-4 text-[var(--success-color)]" />
                    </button>
                    <button
                      onClick={() => onApplyPenalty(loan)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="Apply Penalty"
                    >
                      <AlertTriangle className="w-4 h-4 text-[var(--warning-color)]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OverdueLoansTable;