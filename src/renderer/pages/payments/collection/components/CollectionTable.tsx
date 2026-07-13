// src/renderer/pages/payments/collection/components/CollectionTable.tsx

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  User,
  DollarSign,
} from "lucide-react";
import type { DebtorCollection } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface CollectionTableProps {
  debtors: DebtorCollection[];
  onMarkPaid: (debtor: DebtorCollection) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const CollectionTable: React.FC<CollectionTableProps> = ({
  debtors,
  onMarkPaid,
}) => {
  const [expandedDebtor, setExpandedDebtor] = useState<number | null>(null);

  if (debtors.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
        No debtors with due payments for this period.
      </div>
    );
  }

  const toggleExpand = (borrowerId: number) => {
    setExpandedDebtor(expandedDebtor === borrowerId ? null : borrowerId);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="w-8 py-2.5 px-3"></th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Debtor
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Contact
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Period Amount
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Paid
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {debtors.map((debtor) => {
            const isExpanded = expandedDebtor === debtor.borrowerId;
            const remaining = debtor.totalPeriodAmount - debtor.totalPaidInPeriod;

            return (
              <React.Fragment key={debtor.borrowerId}>
                <tr
                  className="hover:bg-[var(--card-hover-bg)] transition-colors border-b border-[var(--border-color)] cursor-pointer"
                  onClick={() => toggleExpand(debtor.borrowerId)}
                >
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <button className="p-0.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)]">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                        {getInitials(debtor.borrowerName)}
                      </div>
                      <span className="font-medium text-[var(--text-primary)] text-sm">
                        {debtor.borrowerName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-0.5 text-xs text-[var(--text-secondary)]">
                      {debtor.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[var(--text-tertiary)]" />
                          {debtor.contact}
                        </span>
                      )}
                      {debtor.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[var(--text-tertiary)]" />
                          {debtor.email}
                        </span>
                      )}
                      {!debtor.contact && !debtor.email && (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-semibold" style={{ color: "var(--debt-high)" }}>
                      {formatCurrency(debtor.totalPeriodAmount)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">
                    {formatCurrency(debtor.totalPaidInPeriod)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {debtor.allPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--status-success-bg)] text-[var(--status-success-text)]">
                        <CheckCircle className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]">
                        <XCircle className="w-3 h-3" />
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {!debtor.allPaid ? (
                      <button
                        onClick={() => onMarkPaid(debtor)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: "var(--success-color)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--success-color)";
                        }}
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} className="px-3 pb-3">
                      <div
                        className="rounded-lg overflow-hidden border"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <table className="w-full text-sm">
                          <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                            <tr>
                              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                Debt
                              </th>
                              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                Period Amount
                              </th>
                              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                Paid
                              </th>
                              <th className="px-3 py-1.5 text-center text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                Next Due
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {debtor.debts.map((debt) => (
                              <tr
                                key={debt.debtId}
                                className="border-t border-[var(--border-color)]"
                              >
                                <td className="px-3 py-1.5 text-[var(--text-primary)]">
                                  {debt.debtName}
                                </td>
                                <td className="px-3 py-1.5 text-right text-[var(--text-primary)]">
                                  {formatCurrency(debt.periodAmount)}
                                </td>
                                <td className="px-3 py-1.5 text-right text-[var(--text-secondary)]">
                                  {formatCurrency(debt.totalPaidInPeriod)}
                                </td>
                                <td className="px-3 py-1.5 text-center">
                                  {debt.isPaid ? (
                                    <span className="text-[var(--success-color)]">✓</span>
                                  ) : (
                                    <span className="text-[var(--warning-color)]">○</span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 text-[var(--text-secondary)] text-xs">
                                  {debt.nextDueDate}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t border-[var(--border-color)] bg-[var(--card-secondary-bg)]">
                            <tr>
                              <td className="px-3 py-1.5 font-medium text-[var(--text-primary)] text-xs">
                                Total
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold" style={{ color: "var(--debt-high)" }}>
                                {formatCurrency(debtor.totalPeriodAmount)}
                              </td>
                              <td className="px-3 py-1.5 text-right font-medium text-[var(--success-color)]">
                                {formatCurrency(debtor.totalPaidInPeriod)}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {debtor.allPaid ? (
                                  <span className="text-[var(--success-color)] text-xs font-medium">Fully Paid</span>
                                ) : (
                                  <span className="text-[var(--warning-color)] text-xs font-medium">
                                    Remaining: {formatCurrency(remaining)}
                                  </span>
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CollectionTable;