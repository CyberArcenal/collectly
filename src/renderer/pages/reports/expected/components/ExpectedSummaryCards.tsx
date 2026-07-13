// src/renderer/pages/reports/expected/components/ExpectedSummaryCards.tsx
import React from "react";
import { DollarSign, Users, FileText, Calendar as CalendarIcon } from "lucide-react";

interface ExpectedSummaryCardsProps {
  totalExpected: number;
  totalDebtors: number;
  totalDebts: number;
  periodCount: number;
}

const safeFormatCurrency = (value: any): string => {
  if (value === undefined || value === null) return "₱0.00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return "₱0.00";
  return `₱${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const ExpectedSummaryCards: React.FC<ExpectedSummaryCardsProps> = ({
  totalExpected = 0,
  totalDebtors = 0,
  totalDebts = 0,
  periodCount = 0,
}) => {
  const cards = [
    {
      title: "Total Expected",
      value: totalExpected,
      icon: DollarSign,
      color: "bg-blue-500",
      format: safeFormatCurrency,
    },
    {
      title: "Debtors",
      value: totalDebtors,
      icon: Users,
      color: "bg-green-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Active Debts",
      value: totalDebts,
      icon: FileText,
      color: "bg-purple-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Periods",
      value: periodCount,
      icon: CalendarIcon,
      color: "bg-yellow-500",
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

export default ExpectedSummaryCards;