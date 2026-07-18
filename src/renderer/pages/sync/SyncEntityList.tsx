import React from "react";
import { ArrowRight, Layers, Zap } from "lucide-react";
import {
  SyncEntityDefinition,
  SyncEntityKey,
  SyncTaskInfo,
} from "./SyncStateStore";

interface SyncEntityListProps {
  entities: SyncEntityDefinition[];
  pendingCounts: Record<SyncEntityKey, number>;
  lastSyncTimestamps: Record<SyncEntityKey, string>;
  activeTasks: Record<SyncEntityKey, SyncTaskInfo>;
  syncing: boolean;
  currentTask?: SyncTaskInfo;
  progressMessage: string | null;
  onSync: (entityKey: SyncEntityKey) => void;
  onCancel: (entityKey: SyncEntityKey) => void;
  onViewPending: (entityKey: SyncEntityKey) => void;
}

const SyncEntityList: React.FC<SyncEntityListProps> = ({
  entities,
  pendingCounts,
  lastSyncTimestamps,
  activeTasks,
  syncing,
  currentTask,
  progressMessage,
  onSync,
  onCancel,
  onViewPending,
}) => {
  return (
    <div>
      <div className="mb-4 rounded-md border p-4 bg-[var(--card-secondary-bg)] border-[var(--border-color)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sync queue</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              Review pending entities and trigger manual sync operations.
            </p>
          </div>
          {currentTask ? (
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-sm">
              <div className="font-semibold">Current task</div>
              <div>{progressMessage}</div>
              <div className="text-[var(--text-tertiary)]">
                Progress: {currentTask.current}/{currentTask.total}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-sm text-[var(--text-secondary)]">
              No active sync tasks.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {entities.map((entity) => {
          const pendingCount = pendingCounts[entity.key] ?? 0;
          const task = activeTasks[entity.key];
          const isRunning = task?.status === "running";
          const isCanceled = task?.status === "canceled";
          const isFailed = task?.status === "failed";
          const entityStatus = isRunning
            ? "In progress"
            : isCanceled
            ? "Canceled"
            : isFailed
            ? "Failed"
            : "Idle";

          return (
            <div
              key={entity.key}
              className="rounded-md border p-4 bg-[var(--card-bg)] border-[var(--border-color)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Layers className="w-4 h-4 text-[var(--text-primary)]" />
                    {entity.label}
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)]">{entity.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-[var(--text-primary)]">
                    {entityStatus}
                  </span>
                  <span className="rounded-full bg-blue-500/15 px-2 py-1 text-blue-600">
                    {pendingCount} pending
                  </span>
                  {lastSyncTimestamps[entity.key] && (
                    <span className="rounded-full bg-green-500/10 px-2 py-1 text-green-700">
                      Last sync: {lastSyncTimestamps[entity.key]}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="windows-button windows-button-primary flex items-center gap-2"
                  onClick={() => onSync(entity.key)}
                  disabled={syncing}
                >
                  <Zap className="w-4 h-4" />
                  Sync now
                </button>
                {isRunning && (
                  <button
                    type="button"
                    className="windows-button windows-button-danger flex items-center gap-2"
                    onClick={() => onCancel(entity.key)}
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className="windows-button windows-button-secondary flex items-center gap-2"
                  onClick={() => onViewPending(entity.key)}
                >
                  View pending
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyncEntityList;
