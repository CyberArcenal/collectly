// src/renderer/pages/sync/hooks/useSync.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useSyncContext } from "../../../contexts/SyncContext";
import syncAPI, {
  type SyncStatus,
  type SyncSummary,
  type SyncProgress,
  type Conflict,
  type QueueItem,
  type TaskProgress,
} from "../../../api/utils/sync";
import { showSuccess, showError } from "../../../utils/notification";

interface UseSyncReturn {
  status: SyncStatus | null;
  summary: SyncSummary | null;
  conflicts: Conflict[];
  queueItems: QueueItem[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  progress: SyncProgress | null;
  activeTasks: TaskProgress[];
  isOnline: boolean;
  fetchData: () => Promise<void>;
  fullSync: (user?: string) => Promise<void>;
  incrementalSync: (user?: string, limit?: number) => Promise<void>;
  syncEntity: (entityName: string, records?: any[], user?: string) => Promise<string>;
  syncEntityByName: (entityName: string, user?: string) => Promise<void>;
  getTaskStatus: (taskId: string) => Promise<TaskProgress>;
  pollTask: (taskId: string, onProgress?: (progress: TaskProgress) => void) => Promise<TaskProgress>;
  resolveConflict: (conflictId: number, resolution: string, user?: string) => Promise<void>;
  autoResolveConflicts: (entity?: string, entityId?: number) => Promise<void>;
  cleanup: (days?: number) => Promise<void>;
  resetSync: (entity?: string, user?: string) => Promise<void>;
  checkAvailability: () => Promise<{ available: boolean; message?: string }>;
}

const useSync = (): UseSyncReturn => {
  const context = useSyncContext();

  // For backward compatibility, also expose these from context
  return {
    status: context.status,
    summary: context.summary,
    conflicts: context.conflicts,
    queueItems: context.queueItems,
    loading: context.loading,
    error: context.error,
    syncing: context.syncing,
    progress: context.progress,
    activeTasks: context.activeTasks || [],
    isOnline: context.isOnline,
    fetchData: context.fetchData,
    fullSync: context.fullSync,
    incrementalSync: context.incrementalSync,
    syncEntity: context.syncEntity,
    syncEntityByName: context.syncEntityByName,
    getTaskStatus: context.getTaskStatus,
    pollTask: context.pollTask,
    resolveConflict: context.resolveConflict,
    autoResolveConflicts: context.autoResolveConflicts,
    cleanup: context.cleanup,
    resetSync: context.resetSync,
    checkAvailability: context.checkAvailability,
  };
};

export default useSync;