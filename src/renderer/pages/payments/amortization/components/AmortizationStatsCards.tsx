// src/renderer/pages/payments/amortization/components/AmortizationStatsCards.tsx

import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';

interface AmortizationStatsCardsProps {
  principal: number;
  totalPayments: number;
  totalInterest: number;
  totalPeriods: number;
}

const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

const AmortizationStatsCards: React.FC<AmortizationStatsCardsProps> = ({
  principal,
  totalPayments,
  totalInterest,
  totalPeriods,
}) => {
  const cards = [
    {
      title: "Principal",
      value: principal,
      icon: DollarSign,
      color: "bg-blue-500",
      format: formatCurrency,
    },
    {
      title: "Total Payments",
      value: totalPayments,
      icon: TrendingUp,
      color: "bg-green-500",
      format: formatCurrency,
    },
    {
      title: "Total Interest",
      value: totalInterest,
      icon: TrendingDown,
      color: "bg-yellow-500",
      format: formatCurrency,
    },
    {
      title: "Number of Payments",
      value: totalPeriods,
      icon: CalendarIcon,
      color: "bg-purple-500",
      format: (v: number) => v.toLocaleString(),
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
                {card.format(card.value)}
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

export default AmortizationStatsCards;