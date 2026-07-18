/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSettings } from "../../contexts/SettingsContext";
import {
  SYNC_ENTITIES,
  type SyncEntityKey,
  type SyncTaskInfo,
  type PendingRecord,
  type PersistedSyncState,
  createTaskInfo,
  getPendingRecords as fetchPendingRecords,
  loadSyncState,
  saveSyncState,
  updateLastSyncTimestamp,
  updatePendingCount,
  updateTaskInfo,
} from "./SyncStateStore";

export interface SyncProgress {
  current: number;
  total: number;
  message: string;
}

export interface SyncContextValue {
  loading: boolean;
  syncing: boolean;
  error: string | null;
  currentTask?: SyncTaskInfo;
  progress: SyncProgress | null;
  pendingCounts: Record<SyncEntityKey, number>;
  lastSyncTimestamps: Record<SyncEntityKey, string>;
  activeTasks: Record<SyncEntityKey, SyncTaskInfo>;
  syncEntity: (entityKey: SyncEntityKey) => Promise<void>;
  syncEntityByName: (entityKey: SyncEntityKey) => Promise<void>;
  cancelSync: (entityKey: SyncEntityKey) => Promise<void>;
  getPendingRecords: (entityKey: SyncEntityKey) => PendingRecord[];
  refreshPendingCounts: () => void;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export const SyncProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isStrictOnlineMode } = useSettings();
  const initialSyncState = loadSyncState();
  const [syncState, setSyncState] = useState<PersistedSyncState>(initialSyncState);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskKey, setCurrentTaskKey] = useState<SyncEntityKey | null>(() => {
    const activeRunningTask = Object.values(initialSyncState.activeTasks).find(
      (task) => task.status === "running",
    );
    return activeRunningTask?.entityKey ?? null;
  });
  const pollingTimers = useRef<Partial<Record<SyncEntityKey, number>>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const timers = pollingTimers.current;
    return () => {
      mountedRef.current = false;
      Object.values(timers).forEach((timerId) => {
        if (timerId) {
          window.clearTimeout(timerId);
        }
      });
    };
  }, []);

  const persistState = useCallback((updater: (prev: PersistedSyncState) => PersistedSyncState) => {
    setSyncState((previous) => {
      const nextState = updater(previous);
      saveSyncState(nextState);
      return nextState;
    });
  }, []);

  const getCurrentTask = useMemo(() => {
    if (!currentTaskKey) return undefined;
    return syncState.activeTasks[currentTaskKey];
  }, [currentTaskKey, syncState.activeTasks]);

  const syncing = useMemo(() => getCurrentTask?.status === "running", [getCurrentTask]);

  const progress = useMemo<SyncProgress | null>(() => {
    const task = getCurrentTask;
    if (!task) return null;
    return {
      current: task.current,
      total: task.total,
      message:
        task.status === "running"
          ? `Syncing ${
              SYNC_ENTITIES.find((entity) => entity.key === task.entityKey)?.label ?? task.entityKey
            }`
          : task.status === "completed"
          ? `Finished syncing ${
              SYNC_ENTITIES.find((entity) => entity.key === task.entityKey)?.label ?? task.entityKey
            }`
          : task.status === "canceled"
          ? `Canceled sync for ${
              SYNC_ENTITIES.find((entity) => entity.key === task.entityKey)?.label ?? task.entityKey
            }`
          : `Sync failed for ${
              SYNC_ENTITIES.find((entity) => entity.key === task.entityKey)?.label ?? task.entityKey
            }`,
    };
  }, [getCurrentTask]);

  const setTask = useCallback(
    (task: SyncTaskInfo) => {
      persistState((previous) => updateTaskInfo(previous, task));
    },
    [persistState],
  );

  const clearTimer = useCallback((entityKey: SyncEntityKey) => {
    const timerId = pollingTimers.current[entityKey];
    if (timerId) {
      window.clearTimeout(timerId);
      pollingTimers.current[entityKey] = undefined;
    }
  }, []);

  const finishTask = useCallback(
    (entityKey: SyncEntityKey, task: SyncTaskInfo) => {
      persistState((previous) => {
        const completedTask: SyncTaskInfo = {
          ...task,
          status: "completed",
          updatedAt: Date.now(),
        };
        const syncedState = updateTaskInfo(previous, completedTask);
        return updateLastSyncTimestamp(
          updatePendingCount(
            syncedState,
            entityKey,
            Math.max(0, previous.pendingRecords[entityKey] - task.total),
          ),
          entityKey,
          new Date().toLocaleString(),
        );
      });
      if (mountedRef.current) {
        setCurrentTaskKey(null);
      }
      clearTimer(entityKey);
    },
    [clearTimer, persistState],
  );

  const scheduleSyncStep = useCallback(
    function scheduleSyncStep(entityKey: SyncEntityKey) {
      clearTimer(entityKey);
      const timerId = window.setTimeout(() => {
        setSyncState((previous) => {
          const task = previous.activeTasks[entityKey];
          if (!task || task.status !== "running") {
            return previous;
          }

          const nextCurrent = Math.min(task.current + 1, task.total);
          const nextTask: SyncTaskInfo = {
            ...task,
            current: nextCurrent,
            updatedAt: Date.now(),
          };

          const nextState = updateTaskInfo(previous, nextTask);
          saveSyncState(nextState);

          if (nextCurrent >= task.total) {
            finishTask(entityKey, nextTask);
          } else {
            scheduleSyncStep(entityKey);
          }

          return nextState;
        });
      }, 800);

      pollingTimers.current[entityKey] = timerId;
    },
    [clearTimer, finishTask],
  );

  useEffect(() => {
    if (
      currentTaskKey &&
      syncState.activeTasks[currentTaskKey] &&
      syncState.activeTasks[currentTaskKey].status === "running" &&
      !pollingTimers.current[currentTaskKey]
    ) {
      scheduleSyncStep(currentTaskKey);
    }
  }, [currentTaskKey, scheduleSyncStep, syncState.activeTasks]);

  const syncEntityImpl = useCallback(
    async (entityKey: SyncEntityKey) => {
      if (!isStrictOnlineMode()) {
        throw new Error("Sync is only available when Online Mode is active.");
      }

      if (syncing) {
        return;
      }

      setError(null);
      setCurrentTaskKey(entityKey);

      try {
        const currentPending = syncState.pendingRecords[entityKey] ?? 0;
        const task = createTaskInfo(entityKey, Math.max(1, currentPending));
        setTask(task);
        scheduleSyncStep(entityKey);
      } catch (cause) {
        setError((cause as Error).message || "Sync failed unexpectedly.");
        if (mountedRef.current) {
          setCurrentTaskKey(null);
        }
        throw cause;
      }
    },
    [isStrictOnlineMode, scheduleSyncStep, setTask, syncing, syncState.pendingRecords],
  );

  const syncEntityByName = useCallback(async (entityKey: SyncEntityKey) => {
    return syncEntityImpl(entityKey);
  }, [syncEntityImpl]);

  const cancelSync = useCallback(async (entityKey: SyncEntityKey) => {
    clearTimer(entityKey);
    persistState((previous) => {
      const task = previous.activeTasks[entityKey];
      if (!task || task.status !== "running") {
        return previous;
      }

      const canceledTask: SyncTaskInfo = {
        ...task,
        status: "canceled",
        updatedAt: Date.now(),
        errorMessage: "Canceled by user.",
      };
      return updateTaskInfo(previous, canceledTask);
    });

    if (mountedRef.current) {
      setCurrentTaskKey(null);
      setError("Sync canceled.");
    }
  }, [clearTimer, persistState]);

  const getPendingRecords = useCallback((entityKey: SyncEntityKey) => {
    return fetchPendingRecords(entityKey);
  }, []);

  const refreshPendingCounts = useCallback(() => {
    setSyncState(loadSyncState());
  }, []);

  const contextValue = useMemo<SyncContextValue>(
    () => ({
      loading: syncing,
      syncing,
      error,
      currentTask: getCurrentTask,
      progress,
      pendingCounts: syncState.pendingRecords,
      lastSyncTimestamps: syncState.lastSyncTimestamps,
      activeTasks: syncState.activeTasks,
      syncEntity: syncEntityImpl,
      syncEntityByName,
      cancelSync,
      getPendingRecords,
      refreshPendingCounts,
    }),
    [cancelSync, error, getCurrentTask, getPendingRecords, progress, refreshPendingCounts, syncEntityImpl, syncEntityByName, syncing, syncState.activeTasks, syncState.lastSyncTimestamps, syncState.pendingRecords],
  );

  return <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>;
};

export const useSyncContext = () => {
  const context = React.useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider");
  }
  return context;
};

export default SyncContext;
