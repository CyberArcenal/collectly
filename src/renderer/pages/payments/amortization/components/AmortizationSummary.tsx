// src/renderer/pages/payments/amortization/components/AmortizationSummary.tsx

import React from 'react';
import type { AmortizationSchedule } from '../types';
import { formatCurrency } from '../../../../utils/formatters';

interface AmortizationSummaryProps {
  schedule: AmortizationSchedule | null;
}

const AmortizationSummary: React.FC<AmortizationSummaryProps> = ({ schedule }) => {
  if (!schedule) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
      <div>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Debt</p>
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{schedule.debtName}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{schedule.borrowerName}</p>
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Principal</p>
        <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(schedule.principal)}</p>
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Interest</p>
        <p className="text-sm font-bold text-[var(--warning-color)]">{formatCurrency(schedule.totalInterest)}</p>
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Payment</p>
        <p className="text-sm font-bold text-[var(--success-color)]">{formatCurrency(schedule.totalPayments)}</p>
      </div>
    </div>
  );
};

export default AmortizationSummary;