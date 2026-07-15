// src/renderer/pages/debtors/credit-check/components/CreditCheckSummaryCards.tsx
import React from "react";
import { 
  ClipboardCheck, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3
} from "lucide-react";

interface CreditCheckStats {
  totalChecks: number;
  averageScore: number;
  riskLevelDistribution: {
    Low: number;
    Medium: number;
    High: number;
  };
  lastCheckDate: string | null;
}

interface CreditCheckSummaryCardsProps {
  stats: CreditCheckStats | null;
  loading?: boolean;
}

const CreditCheckSummaryCards: React.FC<CreditCheckSummaryCardsProps> = ({
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

  if (!stats) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 text-center text-sm text-[var(--text-tertiary)] shadow-sm">
        <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-50" />
        No credit check data available. Run a credit check to see statistics.
      </div>
    );
  }

  const cards = [
    {
      title: "Total Checks",
      value: stats.totalChecks,
      icon: ClipboardCheck,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Average Score",
      value: stats.averageScore,
      icon: BarChart3,
      color: "bg-purple-500",
      format: (v: number) => v.toFixed(1),
    },
    {
      title: "Latest Check",
      value: stats.lastCheckDate ? new Date(stats.lastCheckDate).toLocaleDateString() : "N/A",
      icon: Clock,
      color: "bg-teal-500",
      format: (v: string) => v,
    },
    // Risk distribution card - shows Low/Medium/High as inline
    {
      title: "Risk Distribution",
      value: "",
      icon: AlertTriangle,
      color: "bg-orange-500",
      custom: true,
      render: () => (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
            {stats.riskLevelDistribution.Low} Low
          </span>
          <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
            {stats.riskLevelDistribution.Medium} Med
          </span>
          <span className="text-xs font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
            {stats.riskLevelDistribution.High} High
          </span>
        </div>
      ),
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
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.title}
              </p>
              {card.custom ? (
                card.render?.()
              ) : (
                <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5 truncate">
                  {card.format(card.value)}
                </p>
              )}
            </div>
            <div className={`p-2 rounded-full ${card.color} bg-opacity-10 flex-shrink-0 ml-2`}>
              <card.icon className={`w-4 h-4 ${card.color.replace("bg-", "text-")}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CreditCheckSummaryCards;