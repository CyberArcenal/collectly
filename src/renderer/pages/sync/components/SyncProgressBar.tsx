// src/renderer/pages/sync/components/SyncProgressBar.tsx

import React from "react";
import { Loader2 } from "lucide-react";
import type { TaskProgress } from "../../../api/utils/sync";

interface SyncProgressBarProps {
  currentTask: TaskProgress | null;
  isVisible: boolean;
}

const SyncProgressBar: React.FC<SyncProgressBarProps> = ({
  currentTask,
  isVisible,
}) => {
  if (!isVisible || !currentTask) return null;

  const percentage = currentTask.total > 0
    ? Math.round((currentTask.processed / currentTask.total) * 100)
    : 0;

  const isRunning = currentTask.status === "running";
  const isCompleted = currentTask.status === "completed";
  const isFailed = currentTask.status === "failed";

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
          {isCompleted && <span className="text-green-500 text-sm">✅</span>}
          {isFailed && <span className="text-red-500 text-sm">❌</span>}
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {isRunning ? "Syncing..." : isCompleted ? "Completed" : isFailed ? "Failed" : "Queued"}
          </span>
          {currentTask.currentEntity && (
            <span className="text-xs text-[var(--text-secondary)]">
              {currentTask.currentEntity}
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {currentTask.processed} / {currentTask.total}
          {currentTask.failed > 0 && (
            <span className="text-red-500 ml-1">({currentTask.failed} failed)</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isFailed ? "bg-red-500" :
            isCompleted ? "bg-green-500" :
            "bg-gradient-to-r from-yellow-500 to-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[var(--text-tertiary)]">
          {percentage}% complete
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {isRunning ? "⏳ Processing..." : isCompleted ? "✅ Done" : isFailed ? "❌ Failed" : "⏳ Queued"}
        </span>
      </div>
    </div>
  );
};

export default SyncProgressBar;