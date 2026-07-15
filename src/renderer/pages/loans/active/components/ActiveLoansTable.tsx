// src/renderer/pages/loans/active/components/ActiveLoansTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, User, Calendar, Clock } from "lucide-react";
import ActiveLoanActionsDropdown from "./ActiveLoanActionsDropdown";
import type { Debt } from "../../../../api/core/debt";
import { daysUntil, formatCurrency, formatDate } from "../../../../utils/formatters";

interface ActiveLoansTableProps {
  loans: Debt[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (loan: Debt) => void;
  onEdit: (loan: Debt) => void;
  onRecordPayment: (loan: Debt) => void;
  onViewSchedule: (loan: Debt) => void;
  onForgiveness: (loan: Debt) => void;
  onViewAgreement: (loan: Debt) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getDaysLeftClass = (days: number) => {
  if (days < 0) return "text-[var(--danger-color)] font-bold";
  if (days <= 7) return "text-[var(--warning-color)] font-semibold";
  return "text-[var(--success-color)]";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-text)]" };
    case "overdue":
      return { bg: "bg-[var(--status-overdue-bg)]", text: "text-[var(--status-overdue-text)]" };
    default:
      return { bg: "bg-[var(--status-inactive-bg)]", text: "text-[var(--status-inactive-text)]" };
  }
};

const ActiveLoansTable: React.FC<ActiveLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onRecordPayment,
  onViewSchedule,
  onForgiveness,
  onViewAgreement,
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
                Loan Name {getSortIcon("name")}
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
              onClick={() => onSort("totalAmount")}
            >
              <div className="flex items-center gap-1">
                Total {getSortIcon("totalAmount")}
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
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Days Left
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => {
            const borrowerName = loan.borrower?.name ?? "—";
            const dueDate = loan.dueDate ?? "";
            const daysLeft = dueDate ? daysUntil(dueDate) : 0;
            const statusBadge = getStatusBadge(loan.status);
            const isOverdue = daysLeft < 0;

            return (
              <tr
                key={loan.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onView(loan)}
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
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {borrowerName !== "—" ? getInitials(borrowerName) : "?"}
                    </div>
                    <span className="text-[var(--text-primary)] text-sm truncate max-w-[100px]">
                      {borrowerName}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                  {formatCurrency(loan.totalAmount ?? 0)}
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-semibold" style={{ color: "var(--debt-high)" }}>
                    {formatCurrency(loan.remainingAmount ?? 0)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {dueDate ? formatDate(dueDate) : "—"}
                  </div>
                </td>
                <td className={`py-2.5 px-3 ${getDaysLeftClass(daysLeft)} text-sm`}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {daysLeft < 0 ? `Overdue by ${-daysLeft}d` : `${daysLeft}d`}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                  >
                    {isOverdue ? "overdue" : loan.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <ActiveLoanActionsDropdown
                    loan={loan}
                    onView={onView}
                    onEdit={onEdit}
                    onRecordPayment={onRecordPayment}
                    onViewSchedule={onViewSchedule}
                    onForgiveness={onForgiveness}
                    onViewAgreement={onViewAgreement}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveLoansTable;