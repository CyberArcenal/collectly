// src/renderer/pages/sync/components/SyncProgressBar.tsx
import React from "react";
import { Loader2 } from "lucide-react";
import type { SyncProgress } from "../../../api/utils/sync";

interface SyncProgressBarProps {
  progress: SyncProgress | null;
  isVisible: boolean;
}

const SyncProgressBar: React.FC<SyncProgressBarProps> = ({ progress, isVisible }) => {
  if (!isVisible || !progress) return null;

  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Syncing...
          </span>
          {progress.currentEntity && (
            <span className="text-xs text-[var(--text-secondary)]">
              {progress.currentEntity}
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {progress.completed} / {progress.total}
          {progress.failed > 0 && (
            <span className="text-red-500 ml-1">({progress.failed} failed)</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[var(--text-tertiary)]">
          {percentage}% complete
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {progress.status === "completed" ? "✅ Done" : "⏳ Processing..."}
        </span>
      </div>
    </div>
  );
};

export default SyncProgressBar;