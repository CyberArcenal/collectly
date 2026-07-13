// src/renderer/pages/payments/collection/components/CollectionSummary.tsx

import React from 'react';
import { Calendar as CalendarIcon, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { CollectionScheduleResponse } from '../types';
import { formatCurrency } from '../../../../utils/formatters';

interface CollectionSummaryProps {
  data: CollectionScheduleResponse | null;
}

const CollectionSummary: React.FC<CollectionSummaryProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  const paidCount = data.debtors.filter(d => d.allPaid).length;
  const unpaidCount = data.debtors.length - paidCount;
  const collectionRate = data.totalDue > 0 
    ? ((data.totalDue - data.debtors.reduce((sum, d) => sum + (d.totalPeriodAmount - d.totalPaidInPeriod), 0)) / data.totalDue * 100)
    : 100;

  const cards = [
    {
      title: "Period",
      value: data.periodLabel,
      icon: CalendarIcon,
      color: "bg-blue-500",
      format: (v: string) => v,
    },
    {
      title: "Total Due",
      value: data.totalDue,
      icon: DollarSign,
      color: "bg-red-500",
      format: formatCurrency,
    },
    {
      title: "Debtors",
      value: `${data.totalDebtors}`,
      icon: Users,
      color: "bg-purple-500",
      format: (v: string) => (
        <>
          {v}
          <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">
            ({paidCount} paid, {unpaidCount} unpaid)
          </span>
        </>
      ),
    },
    {
      title: "Collection Rate",
      value: collectionRate,
      icon: TrendingUp,
      color: "bg-green-500",
      format: (v: number) => `${v.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {typeof card.value === 'string' 
                  ? card.value 
                  : card.format(card.value)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${card.color} bg-opacity-10`}>
              <card.icon className={`w-4 h-4 ${card.color.replace("bg-", "text-")}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionSummary;