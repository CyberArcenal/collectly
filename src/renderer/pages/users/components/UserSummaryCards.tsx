// src/renderer/pages/users/components/UserSummaryCards.tsx
import React from "react";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

interface UserSummaryCardsProps {
  total: number;
  active: number;
  suspended: number;
  admin: number;
}

const UserSummaryCards: React.FC<UserSummaryCardsProps> = ({
  total,
  active,
  suspended,
  admin,
}) => {
  const cards = [
    {
      title: "Total Users",
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
      title: "Suspended",
      value: suspended,
      icon: UserX,
      color: "bg-red-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Admins",
      value: admin,
      icon: Shield,
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

export default UserSummaryCards;