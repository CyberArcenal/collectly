// src/renderer/pages/audit/components/SummaryCards.tsx
import React from "react";
import { 
  Calendar, 
  Users, 
  Activity,
  FileText,
  Clock
} from "lucide-react";

interface Stats {
  total: number;
  avgPerDay: number;
  mostActiveDay: { day: string; count: number } | null;
  uniqueUsers: number;
  totalToday: number;
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  byUser: Array<{ user: string; count: number }>;
}

interface SummaryCardsProps {
  stats: Stats;
  summary: {
    totalToday: number;
    byAction: Record<string, number>;
    mostActiveUser: { user: string; count: number } | null;
    mostAffectedEntity: { entity: string; count: number } | null;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, summary }) => {
  // Use stats.totalToday (from API) if available, otherwise fallback to summary.totalToday
  const totalToday = stats.totalToday || summary.totalToday || 0;

  const cards = [
    {
      title: "Total Logs",
      value: stats.total?.toLocaleString() || "0",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Today's Actions",
      value: totalToday.toLocaleString(),
      icon: Activity,
      color: "bg-green-500",
    },
    {
      title: "Unique Users",
      value: stats.uniqueUsers?.toLocaleString() || "0",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Avg / Day",
      value: stats.avgPerDay?.toFixed(1) || "0.0",
      icon: Calendar,
      color: "bg-orange-500",
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
                {card.value}
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