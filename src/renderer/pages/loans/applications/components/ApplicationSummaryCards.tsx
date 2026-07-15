// src/renderer/pages/loans/applications/components/ApplicationSummaryCards.tsx
import React from "react";
import { FileText, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

interface ApplicationSummaryCardsProps {
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  totalAmount?: number;
}

const formatCurrency = (amount: number | undefined | null): string => {
  // ✅ Safe fallback for undefined/null
  if (amount == null || isNaN(amount)) return "₱0";
  return `₱${amount.toLocaleString()}`;
};

const formatNumber = (value: number | undefined | null): string => {
  if (value == null || isNaN(value)) return "0";
  return value.toLocaleString();
};

const ApplicationSummaryCards: React.FC<ApplicationSummaryCardsProps> = ({
  total = 0,
  pending = 0,
  approved = 0,
  rejected = 0,
  totalAmount = 0,
}) => {
  const cards = [
    {
      title: "Total Applications",
      value: total,
      icon: FileText,
      color: "bg-blue-500",
      format: formatNumber,
    },
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "bg-yellow-500",
      format: formatNumber,
    },
    {
      title: "Approved",
      value: approved,
      icon: CheckCircle,
      color: "bg-green-500",
      format: formatNumber,
    },
    {
      title: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "bg-red-500",
      format: formatNumber,
    },
    {
      title: "Total Requested",
      value: totalAmount,
      icon: DollarSign,
      color: "bg-purple-500",
      format: formatCurrency,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

export default ApplicationSummaryCards;