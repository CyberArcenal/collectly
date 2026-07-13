// src/renderer/pages/loans/overdue/components/OverdueSummaryCards.tsx
import React from "react";
import { AlertTriangle, DollarSign, Clock, AlertCircle } from "lucide-react";

interface OverdueSummaryCardsProps {
  total?: number;
  totalAmount?: number;
  averageDaysOverdue?: number;
  totalPenalties?: number;
}

const formatCurrency = (amount: number | undefined | null): string => {
  if (amount == null || isNaN(amount)) return "₱0";
  return `₱${amount.toLocaleString()}`;
};

const OverdueSummaryCards: React.FC<OverdueSummaryCardsProps> = ({
  total = 0,
  totalAmount = 0,
  averageDaysOverdue = 0,
  totalPenalties = 0,
}) => {
  const cards = [
    {
      title: "Total Overdue",
      value: total,
      icon: AlertTriangle,
      color: "bg-red-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Total Amount",
      value: totalAmount,
      icon: DollarSign,
      color: "bg-orange-500",
      format: formatCurrency,
    },
    {
      title: "Avg Days Overdue",
      value: averageDaysOverdue,
      icon: Clock,
      color: "bg-yellow-500",
      format: (v: number) => `${v} days`,
    },
    {
      title: "Total Penalties",
      value: totalPenalties,
      icon: AlertCircle,
      color: "bg-purple-500",
      format: formatCurrency,
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

export default OverdueSummaryCards;