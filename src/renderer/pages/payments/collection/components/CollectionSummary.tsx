// src/renderer/pages/payments/collection/components/CollectionSummary.tsx

import React from 'react';
import { formatCurrency } from '../../../../utils/formatters';
import type { CollectionScheduleResponse } from '../types';

interface CollectionSummaryProps {
  data: CollectionScheduleResponse | null;
}

const CollectionSummary: React.FC<CollectionSummaryProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
        No data available.
      </div>
    );
  }

  const paidCount = data.debtors.filter(d => d.allPaid).length;
  const unpaidCount = data.debtors.length - paidCount;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Period</div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{data.periodLabel}</div>
      </div>
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Due</div>
        <div className="text-lg font-bold" style={{ color: 'var(--debt-high)' }}>{formatCurrency(data.totalDue)}</div>
      </div>
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Debtors</div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {data.totalDebtors}
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>
            ({paidCount} paid, {unpaidCount} unpaid)
          </span>
        </div>
      </div>
      <div className="p-3 rounded-md border" style={{ backgroundColor: 'var(--card-secondary-bg)', borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Collection Rate</div>
        <div className="text-lg font-bold" style={{ color: 'var(--success-color)' }}>
          {data.totalDue > 0 ? `${((1 - unpaidCount / data.totalDebtors) * 100).toFixed(1)}%` : '100%'}
        </div>
      </div>
    </div>
  );
};

export default CollectionSummary;