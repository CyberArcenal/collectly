// src/renderer/pages/loans/closed/components/ClosedLoansTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Eye, RefreshCw, User, Calendar, CheckCircle } from "lucide-react";
import type { ClosedLoan } from "../hooks/useClosedLoans";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ClosedLoansTableProps {
  loans: ClosedLoan[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (loan: ClosedLoan) => void;
  onReopen: (loan: ClosedLoan) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ClosedLoansTable: React.FC<ClosedLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onReopen,
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
              onClick={() => onSort("totalAmount")}
            >
              <div className="flex items-center gap-1">
                Total {getSortIcon("totalAmount")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("paidAmount")}
            >
              <div className="flex items-center gap-1">
                Paid {getSortIcon("paidAmount")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("lastPaymentDate")}
            >
              <div className="flex items-center gap-1">
                Last Payment {getSortIcon("lastPaymentDate")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("closedAt")}
            >
              <div className="flex items-center gap-1">
                Closed Date {getSortIcon("closedAt")}
              </div>
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
                  <span className="font-semibold text-[var(--success-color)]">
                    {formatCurrency(loan.paidAmount ?? 0)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {loan.lastPaymentDate ? formatDate(loan.lastPaymentDate) : "—"}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <CheckCircle className="w-3 h-3 text-[var(--success-color)]" />
                    {formatDate(loan.closedAt)}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView(loan)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                    </button>
                    <button
                      onClick={() => onReopen(loan)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors hidden"
                      title="Reopen Loan"
                    >
                      <RefreshCw className="w-4 h-4 text-[var(--warning-color)]" />
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

export default ClosedLoansTable;