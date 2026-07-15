// src/renderer/pages/loans/active/components/LoanSummaryCards.tsx
import React from "react";
import { HandCoins, Wallet, AlertTriangle, TrendingUp } from "lucide-react";

interface LoanSummaryCardsProps {
  total: number;
  totalAmount: number;
  overdue: number;
  totalRemaining: number;
}

const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

const LoanSummaryCards: React.FC<LoanSummaryCardsProps> = ({
  total,
  totalAmount,
  overdue,
  totalRemaining,
}) => {
  const cards = [
    {
      title: "Active Loans",
      value: total,
      icon: HandCoins,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Total Amount",
      value: totalAmount,
      icon: Wallet,
      color: "bg-green-500",
      format: formatCurrency,
    },
    {
      title: "Total Remaining",
      value: totalRemaining,
      icon: TrendingUp,
      color: "bg-purple-500",
      format: formatCurrency,
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertTriangle,
      color: "bg-red-500",
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

export default LoanSummaryCards;