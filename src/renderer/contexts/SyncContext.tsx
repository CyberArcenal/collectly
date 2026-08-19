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
  pullFullSync: (metadata?: { client_user?: string; device_id?: string; app_version?: string }) => Promise<string>;
  getSyncStatus: () => Promise<UserSyncSummary>;
  getTaskStatus: (taskId: string) => Promise<TaskProgress>;
  cancelSync: () => Promise<void>;
  checkAvailability: () => Promise<{ available: boolean; message?: string }>;
  refresh: () => Promise<void>;
  getPendingChanges: () => Promise<PendingChange[]>;
  resetSyncState: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const progressUnsubscribe = useRef<(() => void) | null>(null);
  const isMounted = useRef(true);

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
        totalSynced: entity.totalSynced ?? 0,
        lastSyncCount: entity.lastSyncCount ?? 0,
        hasPending: entity.status === "syncing" || entity.status === "failed",
        hasError: entity.hasError || false,
        errorMessage: entity.errorMessage || null,
        recordCount: (entity as any).recordCount ?? 0,
        localRecordCount: snapshot?.recordCount || 0,
        hasLocalChanges,
      };
    });
  }, [syncStatus]);

  // ─── Derive isSyncing from actual state ───
  useEffect(() => {
    const syncing =
      (currentTask && ["queued", "running"].includes(currentTask.status)) ||
      (syncStatus?.entities?.some(e => e.status === "syncing") ?? false);
    setIsSyncing(syncing);
  }, [currentTask, syncStatus]);

  // ─── Fetch Data (initial load + manual refresh) ───
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    setError(null);

    try {
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

      // Clear stale task if no entity is syncing
      const hasSyncing = status.entities?.some((e: any) => e.status === "syncing") ?? false;
      if (currentTask && !hasSyncing) {
        setCurrentTask(null);
        setProgress(null);
      } else if (currentTask && (currentTask.status === "completed" || currentTask.status === "failed")) {
        setCurrentTask(null);
      }

      setProgress((prev) => {
        if (prev?.status === "syncing" && !hasSyncing) {
          return { ...prev, status: "idle" };
        }
        return prev;
      });

    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err.message || "Failed to load sync data");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentTask]);

  // ─── WebSocket Progress Listener (via IPC) ───
  useEffect(() => {
    progressUnsubscribe.current = syncAPI.onProgress((progressData) => {
      if (!isMounted.current) return;
      console.log("[SyncContext] Progress update:", progressData);

      setProgress(progressData);

      if (progressData.status === "completed") {
        setCurrentTask(null);
        fetchData();
        showSuccess("Sync completed successfully!");
      } else if (progressData.status === "failed") {
        setCurrentTask(null);
        fetchData();
        showError(progressData.error || "Sync failed. Check the logs.");
      } else if (progressData.status === "syncing") {
        if (progressData.taskId) {
          setCurrentTask((prev) => {
            if (prev) {
              return { ...prev, status: "running" };
            }
            return prev;
          });
        }
      } else if (progressData.status === "idle" || progressData.status === "cancelled") {
        setCurrentTask(null);
        if (progressData.status === "cancelled") {
          showSuccess("Sync cancelled");
        }
        fetchData();
      }
    });

    return () => {
      if (progressUnsubscribe.current) {
        progressUnsubscribe.current();
      }
    };
  }, [fetchData]);

  // ─── Initial Load (no polling!) ───
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // ✅ Removed setInterval – progress comes from WebSocket events

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // ─── Optional: Refresh on window focus ───
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchData]);

  // ─── Actions ───

  const startFullSync = useCallback(
    async (metadata?: { client_user?: string; device_id?: string; app_version?: string }) => {
      setError(null);
      try {
        const result = await syncAPI.fullSync(metadata);
        if (result.taskId) {
          setCurrentTask({
            taskId: result.taskId,
            status: "queued",
            total: 0,
            processed: 0,
            failed: 0,
          });
          return result.taskId;
        }
        return result.taskId;
      } catch (err: any) {
        setError(err.message);
        showError(err.message);
        setCurrentTask(null);
        setProgress(null);
        fetchData();
        throw err;
      }
    },
    [fetchData]
  );

  const pullFullSync = useCallback(
    async (metadata?: { client_user?: string; device_id?: string; app_version?: string }) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await syncAPI.pullFullSync(metadata);
        showSuccess(`Downloaded ${result.totalRecords} records from server`);
        await fetchData();
        return result;
      } catch (err: any) {
        setError(err.message);
        showError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchData]
  );

  const cancelSync = useCallback(async () => {
    try {
      await syncAPI.cancelSync();
      setCurrentTask(null);
      setProgress(null);
      // The WebSocket will send a 'cancelled' event, which will also update UI
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    }
  }, [fetchData]);

  const getSyncStatus = useCallback(async () => {
    return await syncAPI.getSyncStatus();
  }, []);

  const getTaskStatus = useCallback(async (taskId: string) => {
    return await syncAPI.getTaskStatus(taskId);
  }, []);

  const checkAvailability = useCallback(async () => {
    return await syncAPI.isAvailable();
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getPendingChanges = useCallback(async () => {
    return await syncAPI.getPendingChanges();
  }, []);

  const resetSyncState = useCallback(() => {
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
    pullFullSync,
    startFullSync,
    getSyncStatus,
    getTaskStatus,
    cancelSync,
    checkAvailability,
    refresh,
    getPendingChanges,
    resetSyncState,
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