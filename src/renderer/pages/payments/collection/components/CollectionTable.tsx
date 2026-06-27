// src/renderer/pages/payments/collection/components/CollectionTable.tsx

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
} from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";
import type { DebtorCollection } from "../types";

interface CollectionTableProps {
  debtors: DebtorCollection[];
  onMarkPaid: (debtor: DebtorCollection) => void;
}

const CollectionTable: React.FC<CollectionTableProps> = ({
  debtors,
  onMarkPaid,
}) => {
  const [expandedDebtor, setExpandedDebtor] = useState<number | null>(null);

  if (debtors.length === 0) {
    return (
      <div
        className="text-center py-8"
        style={{ color: "var(--text-tertiary)" }}
      >
        No debtors with due payments for this period.
      </div>
    );
  }

  const toggleExpand = (borrowerId: number) => {
    setExpandedDebtor(expandedDebtor === borrowerId ? null : borrowerId);
  };

  return (
    <div
      className="overflow-x-auto rounded-md border"
      style={{ borderColor: "var(--border-color)" }}
    >
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="w-10 px-2 py-2"></th>
            <th
              className="px-4 py-2 text-left text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Debtor
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Contact
            </th>
            <th
              className="px-4 py-2 text-right text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Period Amount
            </th>
            <th
              className="px-4 py-2 text-right text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Paid
            </th>
            <th
              className="px-4 py-2 text-center text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Status
            </th>
            <th
              className="px-4 py-2 text-right text-xs font-medium uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {debtors.map((debtor) => {
            const isExpanded = expandedDebtor === debtor.borrowerId;
            return (
              <React.Fragment key={debtor.borrowerId}>
                <tr
                  className="hover:bg-[var(--card-hover-bg)] transition-colors border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="px-2 py-2">
                    <button
                      onClick={() => toggleExpand(debtor.borrowerId)}
                      className="p-1 rounded hover:bg-[var(--card-hover-bg)]"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td
                    className="px-4 py-2 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {debtor.borrowerName}
                  </td>
                  <td className="px-4 py-2">
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {debtor.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {debtor.contact}
                        </span>
                      )}
                      {debtor.email && (
                        <span className="flex items-center gap-1 ml-2">
                          <Mail className="w-3 h-3" /> {debtor.email}
                        </span>
                      )}
                      {!debtor.contact && !debtor.email && "—"}
                    </div>
                  </td>
                  <td
                    className="px-4 py-2 text-right font-semibold"
                    style={{ color: "var(--debt-high)" }}
                  >
                    {formatCurrency(debtor.totalPeriodAmount)}
                  </td>
                  <td
                    className="px-4 py-2 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatCurrency(debtor.totalPaidInPeriod)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {debtor.allPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                        <XCircle className="w-3 h-3" /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!debtor.allPaid && (
                      <button
                        onClick={() => onMarkPaid(debtor)}
                        className="px-3 py-1 rounded text-white text-sm"
                        style={{ backgroundColor: "var(--success-color)" }}
                      >
                        Mark Paid
                      </button>
                    )}
                    {debtor.allPaid && (
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        ✓ Paid
                      </span>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} className="px-2 pb-2">
                      <div
                        className="rounded-md overflow-hidden border"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <table className="min-w-full text-sm">
                          <thead
                            style={{
                              backgroundColor: "var(--card-secondary-bg)",
                            }}
                          >
                            <tr>
                              <th
                                className="px-3 py-1 text-left text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Debt
                              </th>
                              <th
                                className="px-3 py-1 text-right text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Period Amount
                              </th>
                              <th
                                className="px-3 py-1 text-right text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Paid
                              </th>
                              <th
                                className="px-3 py-1 text-center text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Status
                              </th>
                              <th
                                className="px-3 py-1 text-left text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Next Due
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {debtor.debts.map((debt) => (
                              <tr
                                key={debt.debtId}
                                className="border-t"
                                style={{ borderColor: "var(--border-color)" }}
                              >
                                <td
                                  className="px-3 py-1"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {debt.debtName}
                                </td>
                                <td
                                  className="px-3 py-1 text-right"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {formatCurrency(debt.periodAmount)}
                                </td>
                                <td
                                  className="px-3 py-1 text-right"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {formatCurrency(debt.totalPaidInPeriod)}
                                </td>
                                <td className="px-3 py-1 text-center">
                                  {debt.isPaid ? (
                                    <span className="text-green-500">✓</span>
                                  ) : (
                                    <span className="text-yellow-500">○</span>
                                  )}
                                </td>
                                <td
                                  className="px-3 py-1"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {debt.nextDueDate}
                                </td>
                              </tr>
                            ))}
                          </tbody>
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
