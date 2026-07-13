// src/renderer/pages/loans/closed/components/ClosedLoanSummaryCards.tsx
import React from "react";
import { CheckCircle, DollarSign } from "lucide-react";

interface ClosedLoanSummaryCardsProps {
  total: number;
  totalAmountPaid: number;
}

const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

const ClosedLoanSummaryCards: React.FC<ClosedLoanSummaryCardsProps> = ({
  total,
  totalAmountPaid,
}) => {
  const cards = [
    {
      title: "Total Closed Loans",
      value: total,
      icon: CheckCircle,
      color: "bg-green-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Total Amount Paid",
      value: totalAmountPaid,
      icon: DollarSign,
      color: "bg-blue-500",
      format: formatCurrency,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
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

export default ClosedLoanSummaryCards;