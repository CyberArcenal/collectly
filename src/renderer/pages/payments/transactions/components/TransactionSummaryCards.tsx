// src/renderer/pages/payments/transactions/components/TransactionSummaryCards.tsx
import React from 'react';
import { Receipt, DollarSign, TrendingUp, Users } from 'lucide-react';

interface TransactionSummaryCardsProps {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  uniqueDebtors: number;
}

const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({
  totalTransactions,
  totalAmount,
  averageAmount,
  uniqueDebtors,
}) => {
  const cards = [
    {
      title: "Total Transactions",
      value: totalTransactions,
      icon: Receipt,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Total Amount",
      value: totalAmount,
      icon: DollarSign,
      color: "bg-green-500",
      format: formatCurrency,
    },
    {
      title: "Average Amount",
      value: averageAmount,
      icon: TrendingUp,
      color: "bg-purple-500",
      format: formatCurrency,
    },
    {
      title: "Unique Debtors",
      value: uniqueDebtors,
      icon: Users,
      color: "bg-orange-500",
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

export default TransactionSummaryCards;