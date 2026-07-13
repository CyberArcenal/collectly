// src/renderer/pages/audit/components/SummaryCards.tsx
import React from "react";
import { 
  Calendar, 
  Users, 
  Database, 
  Activity,
  Clock,
  UserCheck,
  FileText
} from "lucide-react";

interface SummaryCardsProps {
  stats: {
    total: number;
    avgPerDay: number;
    mostActiveDay: { day: string; count: number } | null;
    uniqueUsers: number;
  };
  summary: {
    totalToday: number;
    byAction: Record<string, number>;
    mostActiveUser: { user: string; count: number } | null;
    mostAffectedEntity: { entity: string; count: number } | null;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, summary }) => {
  // Get top action
  const topAction = Object.entries(summary.byAction)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)[0];

  const cards = [
    {
      title: "Total Logs",
      value: stats?.total?.toLocaleString(),
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Today's Actions",
      value: summary.totalToday,
      icon: Activity,
      color: "bg-green-500",
    },
    {
      title: "Unique Users",
      value: stats.uniqueUsers,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Avg / Day",
      value: stats?.avgPerDay?.toFixed(1),
      icon: Calendar,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
                {card.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-full ${card.color} bg-opacity-10`}>
              <card.icon className={`w-5 h-5 ${card.color.replace("bg-", "text-")}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};