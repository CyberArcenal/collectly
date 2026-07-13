// src/renderer/pages/payments/amortization/components/AmortizationTable.tsx

import React from 'react';
import type { AmortizationEntry } from '../types';
import { formatCurrency, formatDate } from '../../../../utils/formatters';

interface AmortizationTableProps {
  entries: AmortizationEntry[];
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
        No schedule to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Period
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Payment Date
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Payment
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Interest
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Principal
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Remaining Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isLast = entry.period === entries.length;
            return (
              <tr
                key={entry.period}
                className={`border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors ${
                  isLast ? "bg-[var(--status-success-bg)]" : ""
                }`}
              >
                <td className="py-2.5 px-3 text-[var(--text-primary)]">
                  {entry.period}
                  {isLast && (
                    <span className="ml-2 text-[10px] text-[var(--success-color)] font-medium">
                      Final
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[var(--text-primary)]">
                  {formatDate(entry.paymentDate)}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-[var(--success-color)]">
                  {formatCurrency(entry.paymentAmount)}
                </td>
                <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">
                  {formatCurrency(entry.interestAmount)}
                </td>
                <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">
                  {formatCurrency(entry.principalAmount)}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-[var(--text-primary)]">
                  {formatCurrency(entry.remainingBalance)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-[var(--card-secondary-bg)] border-t border-[var(--border-color)]">
          <tr>
            <td colSpan={2} className="py-2.5 px-3 font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider">
              Totals
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-[var(--success-color)]">
              {formatCurrency(entries.reduce((sum, e) => sum + e.paymentAmount, 0))}
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-[var(--warning-color)]">
              {formatCurrency(entries.reduce((sum, e) => sum + e.interestAmount, 0))}
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-[var(--text-primary)]">
              {formatCurrency(entries.reduce((sum, e) => sum + e.principalAmount, 0))}
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-[var(--text-primary)]">
              {formatCurrency(entries[entries.length - 1]?.remainingBalance || 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AmortizationTable;