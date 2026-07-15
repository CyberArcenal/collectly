// src/renderer/pages/sync/components/SyncSummaryCards.tsx
import React from "react";
import { Database, Clock, HardDrive, AlertTriangle } from "lucide-react";
import type { SyncSummary } from "../../../api/utils/sync";

interface SyncSummaryCardsProps {
  summary: SyncSummary | null;
  isSyncing: boolean;
}

const SyncSummaryCards: React.FC<SyncSummaryCardsProps> = ({ summary, isSyncing }) => {
  const cards = [
    {
      label: "Entities",
      value: summary?.totalEntities || 0,
      sub: `${summary?.completed || 0} synced`,
      icon: Database,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Pending Sync",
      value: summary?.queuePending || 0,
      sub: `${summary?.failed || 0} failed`,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      label: "Total Synced",
      value: summary?.totalSynced?.toLocaleString() || 0,
      sub: "records",
      icon: HardDrive,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Conflicts",
      value: summary?.conflictPending || 0,
      sub: `${summary?.conflictPending || 0} pending`,
      icon: AlertTriangle,
      color: "bg-red-500/10 text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.label}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                {card.value}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {card.sub}
              </p>
            </div>
            <div className={`p-2 rounded-full ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          {isSyncing && card.label === "Pending Sync" && (
            <div className="mt-2 h-1 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full animate-pulse w-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SyncSummaryCards;