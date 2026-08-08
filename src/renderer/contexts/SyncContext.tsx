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
  type TaskProgress,
  type UserSyncSummary,
  type EntitySyncStatus,
  type SyncProgress,
  type PendingChange,
} from "../api/utils/sync";
import { showSuccess, showError } from "../utils/notification";

// ============================================================
// TYPES
// ============================================================

interface SyncContextValue {
  // ─── State ───
  syncStatus: (UserSyncSummary & {
    localSnapshots?: any[];
    pendingChangesCount?: number;
    source?: string;
  }) | null;
  currentTask: TaskProgress | null;
  pendingChanges: PendingChange[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncAt: string | null;
  progress: SyncProgress | null;

  // ─── Entity List (computed) ───
  entityList: Array<{
    name: string;
    status: string;
    lastSyncedAt: string | null;
    totalSynced: number;
    lastSyncCount: number;
    hasPending: boolean;
    hasError: boolean;
    errorMessage: string | null;
    recordCount: number;
    localRecordCount: number;
    hasLocalChanges: boolean;
  }>;

  // ─── Actions ───
  startFullSync: (metadata?: { client_user?: string; device_id?: string; app_version?: string }) => Promise<string>;
  getSyncStatus: () => Promise<UserSyncSummary>;
  getTaskStatus: (taskId: string) => Promise<TaskProgress>;
  pollTask: (taskId: string, onProgress?: (progress: TaskProgress) => void) => Promise<TaskProgress>;
  cancelSync: () => Promise<void>;
  checkAvailability: () => Promise<{ available: boolean; message?: string }>;
  refresh: () => Promise<void>;
  getPendingChanges: () => Promise<PendingChange[]>;
  resetSyncState: () => void; // NEW: manual reset
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
  const [syncStatus, setSyncStatus] = useState<SyncContextValue["syncStatus"]>(null);
  const [currentTask, setCurrentTask] = useState<TaskProgress | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const progressUnsubscribe = useRef<(() => void) | null>(null);
  const isMounted = useRef(true);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const stuckTimer = useRef<NodeJS.Timeout | null>(null);

  // ─── Entity List ───
  const entityList = useMemo(() => {
    if (!syncStatus?.entities) return [];

    return syncStatus.entities.map((entity: EntitySyncStatus) => {
      const snapshot = syncStatus.localSnapshots?.find(
        (s: any) => s.entity === entity.entity
      );

      const hasLocalChanges = snapshot
        ? snapshot.recordCount !== (entity as any).recordCount
        : true;

      return {
        name: entity.entity,
        status: entity.status,
        lastSyncedAt: entity.lastSyncedAt,
        totalSynced: entity.totalSynced,
        lastSyncCount: entity.lastSyncCount,
        hasPending: entity.status === "syncing" || entity.status === "failed",
        hasError: entity.hasError || false,
        errorMessage: entity.errorMessage || null,
        recordCount: (entity as any).recordCount || 0,
        localRecordCount: snapshot?.recordCount || 0,
        hasLocalChanges,
      };
    });
  }, [syncStatus]);

  // ─── Fetch Data ───
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    setError(null);

    try {
      console.log("[SyncContext] Fetching sync data...");
      const status = await syncAPI.getSyncStatus();
      const changes = await syncAPI.getPendingChanges();

      if (!isMounted.current) return;

      setSyncStatus(status);
      setPendingChanges(changes);

      if (status.lastSync) {
        setLastSyncAt(status.lastSync);
      } else if (status.entities?.length > 0) {
        const recent = status.entities
          .filter((e: any) => e.lastSyncedAt)
          .sort((a: any, b: any) => 
            new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime()
          );
        if (recent.length > 0) {
          setLastSyncAt(recent[0].lastSyncedAt);
        }
      }

      // ─── Determine if any entity is still syncing ───
      const hasSyncing = status.entities?.some(
        (e: any) => e.status === "syncing"
      );
      const hasFailed = status.entities?.some(
        (e: any) => e.status === "failed"
      );

      // If all entities are either completed, idle, or failed, we are not syncing
      const isAnySyncing = hasSyncing || false;
      setIsSyncing(isAnySyncing);

      // If there's a currentTask and it's completed/failed, clear it
      if (currentTask && (currentTask.status === "completed" || currentTask.status === "failed")) {
        setCurrentTask(null);
      }

      setProgress((prev) => {
        if (prev?.status === "syncing" && !isAnySyncing) {
          return { ...prev, status: "idle" };
        }
        return prev;
      });

      // ─── Safety: if no syncing but we still have `isSyncing` true, force reset ───
      if (!isAnySyncing && isSyncing) {
        console.warn("[SyncContext] Force resetting isSyncing (no syncing entities)");
        setIsSyncing(false);
        setCurrentTask(null);
        setProgress(null);
      }

    } catch (err: any) {
      console.error("[SyncContext] Error fetching data:", err);
      if (!isMounted.current) return;
      setError(err.message || "Failed to load sync data");
      setIsSyncing(false);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentTask, isSyncing]);

  // ─── Progress Listener ───
  useEffect(() => {
    progressUnsubscribe.current = syncAPI.onProgress((progressData) => {
      if (!isMounted.current) return;
      console.log("[SyncContext] Progress update:", progressData);
      setProgress(progressData);

      if (progressData.status === "completed") {
        setIsSyncing(false);
        setCurrentTask(null);
        fetchData();
        showSuccess("Sync completed successfully!");
      } else if (progressData.status === "failed") {
        setIsSyncing(false);
        setCurrentTask(null);
        fetchData();
        showError("Sync failed. Check the logs.");
      } else if (progressData.status === "syncing") {
        setIsSyncing(true);
      } else if (progressData.status === "idle") {
        setIsSyncing(false);
        setCurrentTask(null);
      }
    });

    return () => {
      if (progressUnsubscribe.current) {
        progressUnsubscribe.current();
      }
    };
  }, [fetchData]);

  // ─── Safety timeout: if isSyncing stays true for > 20s, force reset ───
  useEffect(() => {
    if (stuckTimer.current) {
      clearTimeout(stuckTimer.current);
      stuckTimer.current = null;
    }

    if (isSyncing) {
      stuckTimer.current = setTimeout(() => {
        console.warn("[SyncContext] Sync stuck for 20s – forcing reset");
        setIsSyncing(false);
        setCurrentTask(null);
        setProgress(null);
        setError("Sync appeared to be stuck. Please try again.");
        fetchData();
      }, 20000);
    }

    return () => {
      if (stuckTimer.current) {
        clearTimeout(stuckTimer.current);
        stuckTimer.current = null;
      }
    };
  }, [isSyncing, fetchData]);

  // ─── Initial Load & Auto-Refresh ───
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    refreshInterval.current = setInterval(fetchData, 30000);

    return () => {
      isMounted.current = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (stuckTimer.current) {
        clearTimeout(stuckTimer.current);
      }
    };
  }, [fetchData]);

  // ─── Actions ───

  const startFullSync = useCallback(
    async (metadata?: { client_user?: string; device_id?: string; app_version?: string }) => {
      console.log("[SyncContext] Starting full sync...");
      setIsSyncing(true);
      setError(null);

      try {
        const result = await syncAPI.fullSync({}, metadata);
        
        if (result.taskId) {
          // Use pollTaskStatus with proper error handling
          const finalResult = await syncAPI.pollTaskStatus(
            result.taskId,
            (progress) => {
              setCurrentTask(progress);
              setProgress({
                status: progress.status === "running" ? "syncing" : progress.status as any,
                total: progress.total || 0,
                completed: progress.processed || 0,
                failed: progress.failed || 0,
                currentEntity: progress.currentEntity || progress.entity,
              });
            }
          );

          // Task completed successfully
          setCurrentTask(finalResult);
          fetchData();
          if (finalResult.status === "completed") {
            showSuccess("Sync completed successfully!");
          }
          return result.taskId;
        }
        return result.taskId;
      } catch (err: any) {
        console.error("[SyncContext] Sync error:", err);
        setError(err.message);
        showError(err.message);
        setIsSyncing(false);
        setCurrentTask(null);
        setProgress(null);
        fetchData();
        throw err;
      }
    },
    [fetchData]
  );

  const getSyncStatus = useCallback(async (): Promise<UserSyncSummary> => {
    return await syncAPI.getSyncStatus();
  }, []);

  const getTaskStatus = useCallback(async (taskId: string): Promise<TaskProgress> => {
    return await syncAPI.getTaskStatus(taskId);
  }, []);

  const pollTask = useCallback(
    async (taskId: string, onProgress?: (progress: TaskProgress) => void): Promise<TaskProgress> => {
      return await syncAPI.pollTaskStatus(taskId, (progress) => {
        setCurrentTask(progress);
        setProgress({
          status: progress.status === "running" ? "syncing" : progress.status as any,
          total: progress.total || 0,
          completed: progress.processed || 0,
          failed: progress.failed || 0,
          currentEntity: progress.currentEntity || progress.entity,
        });
        if (onProgress) onProgress(progress);
      });
    },
    []
  );

  const cancelSync = useCallback(async () => {
    console.log("[SyncContext] Cancelling sync...");
    try {
      await syncAPI.cancelSync();
      setIsSyncing(false);
      setCurrentTask(null);
      setProgress(null);
      showSuccess("Sync cancelled");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    }
  }, [fetchData]);

  const checkAvailability = useCallback(async () => {
    return await syncAPI.isAvailable();
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getPendingChanges = useCallback(async (): Promise<PendingChange[]> => {
    return await syncAPI.getPendingChanges();
  }, []);

  // ─── NEW: Manual reset ───
  const resetSyncState = useCallback(() => {
    console.log("[SyncContext] Manual reset triggered");
    setIsSyncing(false);
    setCurrentTask(null);
    setProgress(null);
    setError(null);
    fetchData();
  }, [fetchData]);

  // ─── Context Value ───
  const value: SyncContextValue = {
    syncStatus,
    currentTask,
    pendingChanges,
    isLoading,
    isSyncing,
    error,
    lastSyncAt,
    progress,
    entityList,
    startFullSync,
    getSyncStatus,
    getTaskStatus,
    pollTask,
    cancelSync,
    checkAvailability,
    refresh,
    getPendingChanges,
    resetSyncState, // NEW
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

// ============================================================
// HOOK
// ============================================================

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
};

export default SyncContext;