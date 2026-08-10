// src/renderer/pages/sync/components/SyncSummaryCards.tsx
import React from "react";
import { Database, Clock, HardDrive, GitBranch, Loader2 } from "lucide-react";
import type { SyncProgress } from "../../../api/utils/sync";

interface SyncSummaryCardsProps {
  syncStatus: { totalEntities?: number; syncedEntities?: number; pendingSyncs?: number; totalRecordsSynced?: number } | null;
  pendingChanges: any[];
  isSyncing: boolean;
  progress: SyncProgress | null;
  isLoading?: boolean;
}

const SyncSummaryCards: React.FC<SyncSummaryCardsProps> = ({
  syncStatus,
  pendingChanges,
  isSyncing,
  progress,
  isLoading = false,
}) => {
  const totalEntities = syncStatus?.totalEntities ?? 0;
  const syncedEntities = syncStatus?.syncedEntities ?? 0;
  const pendingSyncs = syncStatus?.pendingSyncs ?? 0;
  const totalRecordsSynced = syncStatus?.totalRecordsSynced ?? 0;
  const pendingChangesCount = pendingChanges.length;

  const cards = [
    {
      label: "Entities",
      value: totalEntities,
      sub: `${syncedEntities} synced`,
      icon: Database,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Pending Syncs",
      value: pendingSyncs,
      sub: isSyncing ? "In progress..." : "Waiting",
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-500",
      pulse: isSyncing,
    },
    {
      label: "Total Synced",
      value: totalRecordsSynced.toLocaleString(),
      sub: "records synced",
      icon: HardDrive,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Local Changes",
      value: pendingChangesCount,
      sub: `${pendingChangesCount} entities changed`,
      icon: GitBranch,
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[var(--primary-color)]/30"
        >
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-20 bg-[var(--card-secondary-bg)] rounded" />
              <div className="h-7 w-16 bg-[var(--card-secondary-bg)] rounded" />
              <div className="h-3 w-24 bg-[var(--card-secondary-bg)] rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 leading-none">
                    {card.value}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">{card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.color} backdrop-blur-sm`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              {card.pulse && (
                <div className="mt-3 h-1 w-full bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-yellow-500 rounded-full animate-pulse" />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SyncSummaryCards;