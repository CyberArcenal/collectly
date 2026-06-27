// src/renderer/pages/payments/amortization/components/AmortizationSummary.tsx

import React from 'react';
import { formatCurrency } from '../../../../utils/formatters';
import type { AmortizationSchedule } from '../types';

interface AmortizationSummaryProps {
  schedule: AmortizationSchedule | null;
}

const AmortizationSummary: React.FC<AmortizationSummaryProps> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
        Select a debt to view summary.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Principal</div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(schedule.principal)}</div>
      </div>
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Payments</div>
        <div className="text-lg font-bold" style={{ color: 'var(--success-color)' }}>{formatCurrency(schedule.totalPayments)}</div>
      </div>
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Interest</div>
        <div className="text-lg font-bold" style={{ color: 'var(--warning-color)' }}>{formatCurrency(schedule.totalInterest)}</div>
      </div>
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Number of Payments</div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{schedule.totalPeriods}</div>
      </div>
    </div>
  );
};

export default AmortizationSummary;