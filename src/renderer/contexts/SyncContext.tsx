// src/renderer/contexts/SyncContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import syncAPI, {
  type SyncStatus,
  type SyncSummary,
  type SyncProgress,
  type Conflict,
  type QueueItem,
  type TaskProgress,
} from "../api/utils/sync";
import { showSuccess, showError } from "../utils/notification";

// ============================================================
// TYPES
// ============================================================

interface SyncContextValue {
  // State
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
  entityList: Array<{
    name: string;
    status: string;
    lastSyncedAt: string | null;
    totalSynced: number;
    lastSyncCount: number;
    hasPending: boolean;
    pendingCount: number;
    recordCount: number;
  }>;

  // Actions
  fetchData: () => Promise<void>;
  fullSync: (user?: string) => Promise<void>;
  incrementalSync: (user?: string, limit?: number) => Promise<void>;
  syncEntity: (entityName: string, records?: any[], user?: string) => Promise<string>;
  syncEntityByName: (entityName: string, user?: string) => Promise<string | undefined>;
  getPendingRecords: (entityName: string) => Promise<{ entity: string; records: any[]; lastSync: string | null }>;
  getTaskStatus: (taskId: string) => Promise<TaskProgress>;
  pollTask: (taskId: string, onProgress?: (progress: TaskProgress) => void) => Promise<TaskProgress>;
  resolveConflict: (conflictId: number, resolution: string, user?: string) => Promise<void>;
  autoResolveConflicts: (entity?: string, entityId?: number) => Promise<void>;
  cleanup: (days?: number) => Promise<void>;
  resetSync: (entity?: string, user?: string) => Promise<void>;
  checkAvailability: () => Promise<{ available: boolean; message?: string }>;
}

// ============================================================
// CONTEXT
// ============================================================

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider");
  }
  return context;
};

// ============================================================
// PROVIDER
// ============================================================

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  // ─── State ───
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const progressUnsubscribe = useRef<(() => void) | null>(null);
  const isMounted = useRef(true);

  // ─── Helper: Get pending count for an entity ───
  const fetchPendingCount = useCallback(
    async (entityName: string): Promise<number> => {
      try {
        const { records } = await syncAPI.getPendingRecords(entityName);
        console.log(`[SyncContext] Pending count for ${entityName}: ${records.length}`);
        return records.length;
      } catch (err) {
        console.error(`[SyncContext] Error fetching pending count for ${entityName}:`, err);
        return 0;
      }
    },
    [],
  );

  // ─── Compute entityList reactively ───
  const entityList = useMemo(() => {
    if (!status?.metadata) return [];
    return status.metadata.map((item) => ({
      name: item.entity,
      status: item.status,
      lastSyncedAt: item.lastSyncedAt || item.last_synced_at || null,
      totalSynced: item.totalSynced || item.total_synced || 0,
      lastSyncCount: item.lastSyncCount || item.last_sync_count || 0,
      hasPending: item.hasPending || item.has_pending || false,
      pendingCount: (item as any).pendingCount ?? 0,
      recordCount: (item as any).recordCount ?? 0,
    }));
  }, [status]);

  // ─── Fetch Data ───
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);

    try {
      console.log("[SyncContext] Fetching sync data...");
      const [statusRes, summaryRes, conflictsRes, queueRes] = await Promise.all([
        syncAPI.getStatus(),
        syncAPI.getSummary(),
        syncAPI.getConflicts(),
        syncAPI.getQueueStatus(),
      ]);

      console.log("[SyncContext] Status response:", statusRes);

      // Augment metadata with pending counts (client-side)
      if (statusRes && statusRes.metadata) {
        const metadataWithPending = await Promise.all(
          statusRes.metadata.map(async (item) => {
            const pendingCount = await fetchPendingCount(item.entity);
            return { ...item, pendingCount };
          }),
        );
        statusRes.metadata = metadataWithPending;
      }

      if (!isMounted.current) return;

      setStatus(statusRes);
      setSummary(summaryRes);
      setConflicts(conflictsRes.conflicts || []);
      setQueueItems(queueRes.items || []);

      if (statusRes.isSyncing) {
        setSyncing(true);
      }

      const availability = await syncAPI.isAvailable();
      setIsOnline(availability.available);
    } catch (err: any) {
      console.error("[SyncContext] Error fetching data:", err);
      if (!isMounted.current) return;
      setError(err.message || "Failed to load sync data");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchPendingCount]);

  // ─── Progress Listener ───
  useEffect(() => {
    progressUnsubscribe.current = syncAPI.onProgress((progressData) => {
      if (!isMounted.current) return;
      console.log("[SyncContext] Progress update:", progressData);
      setProgress(progressData);

      if (progressData.status === "completed") {
        setSyncing(false);
        fetchData();
        showSuccess("Sync completed successfully!");
      } else if (progressData.status === "failed") {
        setSyncing(false);
        fetchData();
        showError("Sync completed with errors. Check the logs.");
      }
    });

    return () => {
      if (progressUnsubscribe.current) {
        progressUnsubscribe.current();
      }
    };
  }, [fetchData]);

  // ─── Initial Load & Auto-Refresh ───
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    const interval = setInterval(fetchData, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // ─── Check Availability ───
  const checkAvailability = useCallback(async () => {
    return await syncAPI.isAvailable();
  }, []);

  // ─── Full Sync ───
  const fullSync = useCallback(async (user: string = "system") => {
    console.log("[SyncContext] Starting full sync...");
    setSyncing(true);
    setError(null);
    try {
      await syncAPI.fullSync(user);
    } catch (err: any) {
      setSyncing(false);
      setError(err.message);
      showError(err.message);
      throw err;
    }
  }, []);

  // ─── Incremental Sync ───
  const incrementalSync = useCallback(
    async (user: string = "system", limit: number = 50) => {
      console.log("[SyncContext] Starting incremental sync...");
      setSyncing(true);
      setError(null);
      try {
        await syncAPI.incrementalSync(user, limit);
      } catch (err: any) {
        setSyncing(false);
        setError(err.message);
        showError(err.message);
        throw err;
      }
    },
    [],
  );

  // ─── Sync Entity (with records) ───
  const syncEntity = useCallback(
    async (
      entityName: string,
      records: any[] = [],
      user: string = "system",
    ): Promise<string> => {
      console.log(`[SyncContext] Syncing entity ${entityName} with ${records.length} records`);
      setError(null);
      try {
        const result = await syncAPI.syncEntity(entityName, records, user);
        console.log(`[SyncContext] Sync entity response for ${entityName}:`, result);
        if (!result || !result.taskId) {
          throw new Error("Server did not return a task ID");
        }

        const taskId = result.taskId;
        setSyncing(true);

        // Start polling for this task
        const finalResult = await syncAPI.pollTaskStatus(taskId, (progress) => {
          console.log(`[SyncContext] Task ${taskId} progress:`, progress);
          setActiveTasks((prev) =>
            prev.map((t) => (t.taskId === taskId ? { ...t, ...progress } : t)),
          );
          setProgress({
            status:
              progress.status === "running"
                ? "syncing"
                : (progress.status as any),
            total: progress.total || 0,
            completed: progress.processed || 0,
            failed: progress.failed || 0,
            currentEntity: progress.entity || entityName,
          });
        });

        // Process duplicates from the task result
        if (
          finalResult.status === "completed" &&
          finalResult.result?.duplicates
        ) {
          console.log(`[SyncContext] Found ${finalResult.result.duplicates.length} duplicates for ${entityName}:`, finalResult.result.duplicates);
          for (const dup of finalResult.result.duplicates) {
            console.log(`[SyncContext] Updating local record for duplicate: ${dup.entity}#${dup.record_id}`);
            await window.backendAPI.sync({
              method: "updateLocalRecord",
              params: {
                entity: dup.entity,
                recordId: dup.record_id,
                data: dup.server_data,
              },
            });
          }
          showSuccess(
            `Sync completed with ${finalResult.result.duplicates.length} duplicate(s) resolved`,
          );
        }

        setSyncing(false);
        fetchData();
        return taskId;
      } catch (err: any) {
        console.error(`[SyncContext] Error syncing ${entityName}:`, err);
        setError(err.message);
        showError(err.message);
        setSyncing(false);
        throw err;
      }
    },
    [fetchData],
  );

  // ─── Sync Entity By Name (using pending records) ───
  const syncEntityByName = useCallback(
    async (entityName: string, user: string = "system") => {
      console.log(`[SyncContext] Syncing entity by name: ${entityName}`);
      try {
        const pendingData = await syncAPI.getPendingRecords(entityName);
        console.log(`[SyncContext] Pending records for ${entityName}:`, pendingData);
        if (!pendingData.records || pendingData.records.length === 0) {
          showSuccess(`No pending records for ${entityName}`);
          return;
        }
        const taskId = await syncEntity(entityName, pendingData.records, user);
        return taskId;
      } catch (err: any) {
        setError(err.message);
        showError(err.message);
        throw err;
      }
    },
    [syncEntity],
  );

  // ─── Get Pending Records ───
  const getPendingRecords = useCallback(async (entityName: string) => {
    console.log(`[SyncContext] Getting pending records for ${entityName}`);
    return await syncAPI.getPendingRecords(entityName);
  }, []);

  // ─── Get Task Status ───
  const getTaskStatus = useCallback(
    async (taskId: string): Promise<TaskProgress> => {
      console.log(`[SyncContext] Getting task status for ${taskId}`);
      try {
        const progress = await syncAPI.getTaskStatus(taskId);
        setActiveTasks((prev) =>
          prev.map((t) => (t.taskId === taskId ? { ...t, ...progress } : t)),
        );
        return progress;
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    },
    [],
  );

  // ─── Poll Task ───
  const pollTask = useCallback(
    async (
      taskId: string,
      onProgress?: (progress: TaskProgress) => void,
    ): Promise<TaskProgress> => {
      console.log(`[SyncContext] Polling task ${taskId}`);
      try {
        const result = await syncAPI.pollTaskStatus(taskId, (progress) => {
          setActiveTasks((prev) =>
            prev.map((t) => (t.taskId === taskId ? { ...t, ...progress } : t)),
          );
          if (onProgress) onProgress(progress);
        });
        return result;
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    },
    [],
  );

  // ─── Resolve Conflict ───
  const resolveConflict = useCallback(
    async (conflictId: number, resolution: string, user: string = "system") => {
      console.log(`[SyncContext] Resolving conflict ${conflictId} with ${resolution}`);
      try {
        await syncAPI.resolveConflict(conflictId, resolution as any, user);
        await fetchData();
        showSuccess(`Conflict resolved with ${resolution}`);
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    },
    [fetchData],
  );

  // ─── Auto-Resolve Conflicts ───
  const autoResolveConflicts = useCallback(
    async (entity?: string, entityId?: number) => {
      console.log("[SyncContext] Auto-resolving conflicts");
      try {
        await syncAPI.autoResolveConflicts(entity, entityId);
        await fetchData();
        showSuccess("Conflicts auto-resolved");
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    },
    [fetchData],
  );

  // ─── Cleanup ───
  const cleanup = useCallback(
    async (days: number = 30) => {
      console.log(`[SyncContext] Cleaning up sync data older than ${days} days`);
      try {
        await syncAPI.cleanup(days);
        await fetchData();
        showSuccess(`Cleanup completed (${days} days)`);
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    },
    [fetchData],
  );

  // ─── Reset Sync ───
  const resetSync = useCallback(
    async (entity?: string, user: string = "system") => {
      console.log(`[SyncContext] Resetting sync state${entity ? ` for ${entity}` : ' (all)'}`);
      try {
        await syncAPI.resetSync(entity, user);
        await fetchData();
        showSuccess(`Sync reset ${entity ? `for ${entity}` : "all"}`);
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    },
    [fetchData],
  );

  // ─── Context Value ───
  const value: SyncContextValue = {
    status,
    summary,
    conflicts,
    queueItems,
    loading,
    error,
    syncing,
    progress,
    activeTasks,
    isOnline,
    entityList,
    fetchData,
    fullSync,
    incrementalSync,
    syncEntity,
    syncEntityByName,
    getPendingRecords,
    getTaskStatus,
    pollTask,
    resolveConflict,
    autoResolveConflicts,
    cleanup,
    resetSync,
    checkAvailability,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};