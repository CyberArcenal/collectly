// src/renderer/pages/sync/components/SyncSummaryCards.tsx

import React from "react";
import { Database, Clock, HardDrive, GitBranch, AlertTriangle } from "lucide-react";
import type { SyncProgress } from "../../../api/utils/sync";

interface SyncSummaryCardsProps {
  syncStatus: {
    totalEntities?: number;
    syncedEntities?: number;
    pendingSyncs?: number;
    totalRecordsSynced?: number;
    entities?: any[];
  } | null;
  pendingChanges: any[];
  isSyncing: boolean;
  progress: SyncProgress | null;
}

const SyncSummaryCards: React.FC<SyncSummaryCardsProps> = ({
  syncStatus,
  pendingChanges,
  isSyncing,
  progress,
}) => {
  // Compute values from syncStatus
  const totalEntities = syncStatus?.totalEntities || 0;
  const syncedEntities = syncStatus?.syncedEntities || 0;
  const pendingSyncs = syncStatus?.pendingSyncs || 0;
  const totalRecordsSynced = syncStatus?.totalRecordsSynced || 0;
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
    },
    {
      label: "Total Synced",
      value: totalRecordsSynced.toLocaleString(),
      sub: "records synced to server",
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
          {isSyncing && card.label === "Pending Syncs" && (
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