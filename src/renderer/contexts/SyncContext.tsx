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
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

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
    console.log("[SyncContext] isSyncing derived:", {
      currentTaskStatus: currentTask?.status,
      hasSyncingEntity: syncStatus?.entities?.some(e => e.status === "syncing"),
      result: syncing,
    });
    setIsSyncing(syncing);
  }, [currentTask, syncStatus]);

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

      console.log("[SyncContext] Received syncStatus:", status);
      console.log("[SyncContext] Received pendingChanges:", changes);

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

      // ─── FIX: Clear currentTask if no entity is syncing ───
      const hasSyncing = status.entities?.some((e: any) => e.status === "syncing") ?? false;
      console.log("[SyncContext] hasSyncing entity:", hasSyncing);
      console.log("[SyncContext] currentTask before clear check:", currentTask);

      if (currentTask && !hasSyncing) {
        // If task is queued/running but no entity is syncing, it's stale – clear it.
        console.warn("[SyncContext] Clearing stale currentTask because no entity is syncing");
        setCurrentTask(null);
        setProgress(null);
      } else if (currentTask && (currentTask.status === "completed" || currentTask.status === "failed")) {
        console.log("[SyncContext] Clearing currentTask because it's completed/failed");
        setCurrentTask(null);
      }

      // Update progress status to idle if no syncing
      setProgress((prev) => {
        if (prev?.status === "syncing" && !hasSyncing) {
          console.log("[SyncContext] Setting progress to idle");
          return { ...prev, status: "idle" };
        }
        return prev;
      });

    } catch (err: any) {
      console.error("[SyncContext] Error fetching data:", err);
      if (!isMounted.current) return;
      setError(err.message || "Failed to load sync data");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentTask]);

  // ─── Progress Listener ───
  useEffect(() => {
    progressUnsubscribe.current = syncAPI.onProgress((progressData) => {
      if (!isMounted.current) return;
      console.log("[SyncContext] Progress update:", progressData);
      setProgress(progressData);

      if (progressData.status === "completed") {
        console.log("[SyncContext] Progress: completed");
        setCurrentTask(null);
        fetchData();
        showSuccess("Sync completed successfully!");
      } else if (progressData.status === "failed") {
        console.log("[SyncContext] Progress: failed");
        setCurrentTask(null);
        fetchData();
        showError("Sync failed. Check the logs.");
      } else if (progressData.status === "syncing") {
        console.log("[SyncContext] Progress: syncing");
        if (progressData.taskId) {
          setCurrentTask(prev => {
            if (prev) {
              console.log("[SyncContext] Updating currentTask to running");
              return { ...prev, status: "running" };
            }
            return prev;
          });
        }
      } else if (progressData.status === "idle") {
        console.log("[SyncContext] Progress: idle");
        setCurrentTask(null);
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

    refreshInterval.current = setInterval(fetchData, 30000);

    return () => {
      isMounted.current = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [fetchData]);

  // ─── Actions ───

  const startFullSync = useCallback(
    async (metadata?: { client_user?: string; device_id?: string; app_version?: string }) => {
      console.log("[SyncContext] Starting full sync...");
      setError(null);

      try {
        const result = await syncAPI.fullSync(metadata);
        console.log("[SyncContext] Full sync result:", result);

        if (result.taskId) {
          console.log("[SyncContext] Task created with ID:", result.taskId);
          // Set a placeholder task so isSyncing becomes true
          setCurrentTask({
            taskId: result.taskId,
            status: "queued",
            total: 0,
            processed: 0,
            failed: 0,
          });
          // We do NOT poll here – progress events will update the UI
          return result.taskId;
        }
        console.warn("[SyncContext] No taskId returned, sync might not have started");
        return result.taskId;
      } catch (err: any) {
        console.error("[SyncContext] Sync error:", err);
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

  const getSyncStatus = useCallback(async (): Promise<UserSyncSummary> => {
    console.log("[SyncContext] getSyncStatus called");
    return await syncAPI.getSyncStatus();
  }, []);

  const getTaskStatus = useCallback(async (taskId: string): Promise<TaskProgress> => {
    console.log("[SyncContext] getTaskStatus called for", taskId);
    return await syncAPI.getTaskStatus(taskId);
  }, []);

  const pollTask = useCallback(
    async (taskId: string, onProgress?: (progress: TaskProgress) => void): Promise<TaskProgress> => {
      console.log("[SyncContext] pollTask called for", taskId);
      return await syncAPI.pollTaskStatus(taskId, (progress) => {
        console.log("[SyncContext] pollTask progress:", progress);
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
    console.log("[SyncContext] checkAvailability called");
    return await syncAPI.isAvailable();
  }, []);

  const refresh = useCallback(async () => {
    console.log("[SyncContext] refresh called");
    await fetchData();
  }, [fetchData]);

  const getPendingChanges = useCallback(async (): Promise<PendingChange[]> => {
    console.log("[SyncContext] getPendingChanges called");
    return await syncAPI.getPendingChanges();
  }, []);

  const resetSyncState = useCallback(() => {
    console.log("[SyncContext] Manual reset triggered");
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