// src/renderer/pages/notification/components/reminderStats.tsx
import React from "react";
import { Mail, AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { NotificationStats as NotificationStatsData } from "../../../api/core/reminder_log";

interface NotificationStatsProps {
  stats: NotificationStatsData | null;
  loading?: boolean;
}

export const NotificationStats: React.FC<NotificationStatsProps> = ({
  stats,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Emails",
      value: stats.total,
      icon: Mail,
      color: "bg-blue-500",
      format: (v: number) => v?.toLocaleString(),
    },
    {
      title: "Last 24 Hours",
      value: stats.last24h,
      icon: Clock,
      color: "bg-purple-500",
      format: (v: number) => v?.toLocaleString(),
    },
    {
      title: "Avg Retries (Failed)",
      value: stats.avgRetryFailed || 0,
      icon: AlertCircle,
      color: "bg-orange-500",
      format: (v: number) => v?.toFixed(2),
    },
    {
      title: "Successfully Sent",
      value: stats.byStatus?.sent || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      format: (v: number) => v?.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards?.map((card) => (
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