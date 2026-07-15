// src/renderer/pages/sync/hooks/useSync.ts
import { useState, useEffect, useCallback, useRef } from "react";
import syncAPI, {
  type SyncStatus,
  type SyncSummary,
  type SyncProgress,
  type Conflict,
  type QueueItem,
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
  fetchData: () => Promise<void>;
  fullSync: (user?: string) => Promise<void>;
  incrementalSync: (user?: string, limit?: number) => Promise<void>;
  syncEntity: (entityName: string, user?: string) => Promise<void>;
  resolveConflict: (conflictId: number, resolution: string, user?: string) => Promise<void>;
  autoResolveConflicts: (entity?: string, entityId?: number) => Promise<void>;
  cleanup: (days?: number) => Promise<void>;
  resetSync: (entity?: string, user?: string) => Promise<void>;
}

const useSync = (): UseSyncReturn => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const progressUnsubscribe = useRef<(() => void) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, summaryRes, conflictsRes, queueRes] = await Promise.all([
        syncAPI.getStatus(),
        syncAPI.getSummary(),
        syncAPI.getConflicts(),
        syncAPI.getQueueStatus(),
      ]);
      setStatus(statusRes);
      setSummary(summaryRes);
      setConflicts(conflictsRes.conflicts || []);
      setQueueItems(queueRes.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load sync data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Progress listener
  useEffect(() => {
    progressUnsubscribe.current = syncAPI.onProgress((progressData) => {
      setProgress(progressData);
      if (progressData.status === "completed" || progressData.status === "failed") {
        setSyncing(false);
        fetchData();
        if (progressData.status === "completed") {
          showSuccess("Sync completed successfully!");
        } else {
          showError("Sync completed with errors. Check the logs.");
        }
      }
    });

    return () => {
      if (progressUnsubscribe.current) {
        progressUnsubscribe.current();
      }
    };
  }, [fetchData]);

  // Initial load
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  const fullSync = async (user: string = "system") => {
    setSyncing(true);
    try {
      await syncAPI.fullSync(user);
      // Progress will update via listener
    } catch (err: any) {
      setSyncing(false);
      showError(err.message);
    }
  };

  const incrementalSync = async (user: string = "system", limit: number = 50) => {
    setSyncing(true);
    try {
      await syncAPI.incrementalSync(user, limit);
    } catch (err: any) {
      setSyncing(false);
      showError(err.message);
    }
  };

  const syncEntity = async (entityName: string, user: string = "system") => {
    try {
      await syncAPI.syncEntity(entityName, false, user);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const resolveConflict = async (conflictId: number, resolution: string, user: string = "system") => {
    try {
      await syncAPI.resolveConflict(conflictId, resolution as any, user);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const autoResolveConflicts = async (entity?: string, entityId?: number) => {
    try {
      await syncAPI.autoResolveConflicts(entity, entityId);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const cleanup = async (days: number = 30) => {
    try {
      await syncAPI.cleanup(days);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const resetSync = async (entity?: string, user: string = "system") => {
    try {
      await syncAPI.resetSync(entity, user);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  return {
    status,
    summary,
    conflicts,
    queueItems,
    loading,
    error,
    syncing,
    progress,
    fetchData,
    fullSync,
    incrementalSync,
    syncEntity,
    resolveConflict,
    autoResolveConflicts,
    cleanup,
    resetSync,
  };
};

export default useSync;