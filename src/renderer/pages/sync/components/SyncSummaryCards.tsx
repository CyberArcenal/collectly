// src/renderer/pages/sync/components/SyncSummaryCards.tsx

import React from "react";
import { Database, Clock, HardDrive, AlertTriangle } from "lucide-react";
import type { SyncSummary, SyncStatus } from "../../../api/utils/sync";

interface SyncSummaryCardsProps {
  summary: SyncSummary | null;
  isSyncing: boolean;
  status?: SyncStatus | null;        // <-- new prop
}

const SyncSummaryCards: React.FC<SyncSummaryCardsProps> = ({
  summary,
  isSyncing,
  status,
}) => {
  // Compute total active records from metadata
  const totalRecords =
    status?.metadata?.reduce((sum, item) => sum + (item.recordCount || 0), 0) || 0;

  // Helper: get value from summary (handles both camelCase and snake_case)
  const get = (camelKey: string, snakeKey: string, fallback: any = 0) => {
    return (summary as any)?.[camelKey] ?? (summary as any)?.[snakeKey] ?? fallback;
  };

  const totalEntities = get("totalEntities", "total_entities");
  const completed = get("completed", "completed");
  const queuePending = get("queuePending", "queue_pending");
  const failed = get("failed", "failed");
  const conflictPending = get("conflictPending", "conflict_pending");

  const cards = [
    {
      label: "Entities",
      value: totalEntities,
      sub: `${completed} synced`,
      icon: Database,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Pending Sync",
      value: queuePending,
      sub: `${failed} failed`,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      label: "Total Records",          // <-- renamed
      value: totalRecords.toLocaleString(),
      sub: "active records",
      icon: HardDrive,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Conflicts",
      value: conflictPending,
      sub: `${conflictPending} pending`,
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