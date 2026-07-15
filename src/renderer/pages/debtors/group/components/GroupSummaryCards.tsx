// src/renderer/pages/debtors/group/components/GroupSummaryCards.tsx
import React from "react";
import {
  Layers,
  Users,
  UserX,
  DollarSign,
  TrendingUp,
  PieChart,
} from "lucide-react";

interface GroupStatistics {
  totalGroups: number;
  averageMembers: number;
  groupsWithZeroMembers: number;
  groups: Array<{
    id: number;
    name: string;
    memberCount: number;
    totalDebt: number;
  }>;
}

interface GroupSummaryCardsProps {
  stats: GroupStatistics | null;
  loading?: boolean;
}

const GroupSummaryCards: React.FC<GroupSummaryCardsProps> = ({
  stats,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-5 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || stats.totalGroups === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 text-center text-sm text-[var(--text-tertiary)] shadow-sm">
        <Layers className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-50" />
        No group statistics available. Create your first group to see data.
      </div>
    );
  }

  // Calculate total debt across all groups
  const totalDebt = stats.groups.reduce((sum, g) => sum + g.totalDebt, 0);

  const cards = [
    {
      title: "Total Groups",
      value: stats.totalGroups,
      icon: Layers,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Avg Members/Group",
      value: stats.averageMembers,
      icon: Users,
      color: "bg-purple-500",
      format: (v: number) => v.toFixed(1),
    },
    {
      title: "Empty Groups",
      value: stats.groupsWithZeroMembers,
      icon: UserX,
      color: "bg-orange-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Total Debt Across Groups",
      value: totalDebt,
      icon: DollarSign,
      color: "bg-green-500",
      format: (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

export default GroupSummaryCards;