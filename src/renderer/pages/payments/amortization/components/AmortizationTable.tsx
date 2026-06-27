// src/renderer/pages/payments/amortization/components/AmortizationTable.tsx

import React from 'react';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import type { AmortizationEntry } from '../types';

interface AmortizationTableProps {
  entries: AmortizationEntry[];
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
        No schedule to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border" style={{ borderColor: 'var(--border-color)' }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: 'var(--card-secondary-bg)' }}>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Period
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Payment Date
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Payment
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Interest
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Principal
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
              Remaining Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.period} className="border-t hover:bg-[var(--card-hover-bg)] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
              <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{entry.period}</td>
              <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{formatDate(entry.paymentDate)}</td>
              <td className="px-4 py-2 text-right font-medium" style={{ color: 'var(--success-color)' }}>
                {formatCurrency(entry.paymentAmount)}
              </td>
              <td className="px-4 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                {formatCurrency(entry.interestAmount)}
              </td>
              <td className="px-4 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(entry.principalAmount)}
              </td>
              <td className="px-4 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(entry.remainingBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AmortizationTable;