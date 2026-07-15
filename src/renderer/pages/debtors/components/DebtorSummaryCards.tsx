// src/renderer/pages/debtors/components/DebtorSummaryCards.tsx
import React from "react";
import { Users, UserCheck, UserX, Mail, Phone } from "lucide-react";

interface DebtorSummaryCardsProps {
  total: number;
  active: number;
  deleted: number;
  withEmail: number;
  withContact: number;
}

const DebtorSummaryCards: React.FC<DebtorSummaryCardsProps> = ({
  total,
  active,
  deleted,
  withEmail,
  withContact,
}) => {
  const cards = [
    {
      title: "Total Debtors",
      value: total,
      icon: Users,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Active",
      value: active,
      icon: UserCheck,
      color: "bg-green-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Deleted",
      value: deleted,
      icon: UserX,
      color: "bg-red-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "With Email",
      value: withEmail,
      icon: Mail,
      color: "bg-purple-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "With Contact",
      value: withContact,
      icon: Phone,
      color: "bg-orange-500",
      format: (v: number) => v.toLocaleString(),
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

export default DebtorSummaryCards;