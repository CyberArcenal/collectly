// src/renderer/pages/sync/components/SyncProgressBar.tsx
import React from "react";
import { Loader2 } from "lucide-react";
import type { TaskProgress } from "../../../api/utils/sync";

interface SyncProgressBarProps {
  currentTask: TaskProgress | null;
  isVisible: boolean;
}

const SyncProgressBar: React.FC<SyncProgressBarProps> = ({ currentTask, isVisible }) => {
  if (!isVisible || !currentTask) return null;

  const percentage = currentTask.total > 0 ? Math.round((currentTask.processed / currentTask.total) * 100) : 0;
  const isRunning = currentTask.status === "running";
  const isCompleted = currentTask.status === "completed";
  const isFailed = currentTask.status === "failed";

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm relative overflow-hidden">
      {/* Animated background shimmer (optional) */}
      {isRunning && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary-color)]/5 to-transparent animate-pulse" />}
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {isRunning && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
          {isCompleted && <span className="text-green-500 text-sm font-medium">✅ Sync Completed</span>}
          {isFailed && <span className="text-red-500 text-sm font-medium">❌ Sync Failed</span>}
          {isRunning && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Syncing <span className="text-[var(--text-secondary)] font-normal">({currentTask.currentEntity || 'processing...'})</span>
            </span>
          )}
          {!isRunning && !isCompleted && !isFailed && (
            <span className="text-sm font-medium text-yellow-500">Queued...</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-[var(--text-primary)]">
            {currentTask.processed} / {currentTask.total}
          </span>
          {currentTask.failed > 0 && (
            <span className="text-red-500 text-xs">({currentTask.failed} failed)</span>
          )}
          <span className="text-xs text-[var(--text-tertiary)]">{percentage}%</span>
        </div>
      </div>
      
      <div className="relative z-10 mt-2.5 h-1.5 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isFailed ? "bg-red-500" : isCompleted ? "bg-green-500" : "bg-gradient-to-r from-yellow-400 to-green-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SyncProgressBar;