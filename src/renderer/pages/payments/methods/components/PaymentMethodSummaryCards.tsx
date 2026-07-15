// src/renderer/pages/payments/methods/components/PaymentMethodSummaryCards.tsx
import React from 'react';
import { CreditCard, Star, TrendingUp } from 'lucide-react';

interface PaymentMethodSummaryCardsProps {
  totalMethods: number;
  defaultMethodName: string | null;
  totalTransactions: number;
}

const PaymentMethodSummaryCards: React.FC<PaymentMethodSummaryCardsProps> = ({
  totalMethods,
  defaultMethodName,
  totalTransactions,
}) => {
  const cards = [
    {
      title: "Total Methods",
      value: totalMethods,
      icon: CreditCard,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Default Method",
      value: defaultMethodName || "None",
      icon: Star,
      color: "bg-yellow-500",
      format: (v: string) => v,
    },
    {
      title: "Total Transactions",
      value: totalTransactions,
      icon: TrendingUp,
      color: "bg-green-500",
      format: (v: number) => v.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

export default PaymentMethodSummaryCards;