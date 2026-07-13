// src/renderer/pages/reports/debtor-stmt/components/StatementSummaryCards.tsx
import React from "react";
import { DollarSign, TrendingUp, AlertCircle, Wallet } from "lucide-react";

interface StatementSummaryCardsProps {
  totalBorrowed: number;
  totalPaid: number;
  totalPenalties: number;
  outstanding: number;
}

// ✅ Safe currency formatter that handles numbers, strings, undefined, null
const safeFormatCurrency = (value: any): string => {
  if (value === undefined || value === null) return "₱0.00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return "₱0.00";
  return `₱${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const StatementSummaryCards: React.FC<StatementSummaryCardsProps> = ({
  totalBorrowed = 0,
  totalPaid = 0,
  totalPenalties = 0,
  outstanding = 0,
}) => {
  const cards = [
    {
      title: "Total Borrowed",
      value: totalBorrowed,
      icon: DollarSign,
      color: "bg-blue-500",
      format: safeFormatCurrency,
    },
    {
      title: "Total Paid",
      value: totalPaid,
      icon: TrendingUp,
      color: "bg-green-500",
      format: safeFormatCurrency,
    },
    {
      title: "Total Penalties",
      value: totalPenalties,
      icon: AlertCircle,
      color: "bg-red-500",
      format: safeFormatCurrency,
    },
    {
      title: "Outstanding Balance",
      value: outstanding,
      icon: Wallet,
      color: "bg-purple-500",
      format: safeFormatCurrency,
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

export default StatementSummaryCards;