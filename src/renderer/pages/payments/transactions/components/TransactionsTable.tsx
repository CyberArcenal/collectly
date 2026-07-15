// src/renderer/pages/payments/transactions/components/TransactionsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Edit, Trash2, Eye, User, Calendar, CreditCard } from "lucide-react";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface TransactionsTableProps {
  transactions: PaymentTransaction[];
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  isAdmin?: boolean;
  onView: (tx: PaymentTransaction) => void;
  onEdit: (tx: PaymentTransaction) => void;
  onDelete: (tx: PaymentTransaction) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onSort,
  sortConfig,
  isAdmin = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("paymentDate")}
            >
              <div className="flex items-center gap-1">
                Date {getSortIcon("paymentDate")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("borrower")}
            >
              <div className="flex items-center gap-1">
                Debtor {getSortIcon("borrower")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("debtName")}
            >
              <div className="flex items-center gap-1">
                Debt {getSortIcon("debtName")}
              </div>
            </th>
            <th
              className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("amount")}
            >
              <div className="flex items-center justify-end gap-1">
                Amount {getSortIcon("amount")}
              </div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Reference
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Method
            </th>
            {isAdmin && (
              <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const borrowerName = tx.debt?.borrower?.name ?? "—";
            return (
              <tr
                key={tx.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onView(tx)}
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {formatDate(tx.paymentDate)}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {borrowerName !== "—" ? getInitials(borrowerName) : "?"}
                    </div>
                    <span className="text-[var(--text-primary)] text-sm truncate max-w-[120px]">
                      {borrowerName}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[var(--text-secondary)] text-sm truncate max-w-[150px] block">
                    {tx.debt?.name || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="font-semibold text-[var(--success-color)]">
                    {formatCurrency(tx.amount)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {tx.reference || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {tx.methodId ? (
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-[var(--text-tertiary)]" />
                        #{tx.methodId}
                      </span>
                    ) : "—"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => onView(tx)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                      </button>
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors hidden"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-yellow-500" />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors hidden"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--danger-color)]" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;