// ============================================================
// DEPRECATED TYPES (removed)
// - SyncSummary (replaced by UserSyncSummary)
// - Conflict
// - QueueItem
// - SyncEntityResponse (replaced by FullSyncResponse)
// ============================================================

import type {
  EntitySyncStatus,
  FullSyncRequest,
  FullSyncResponse,
  PendingChange,
  SyncProgress,
  SyncSnapshot,
  TaskProgress,
  UserSyncSummary,
} from "../types/sync";

// ============================================================
// SYNC API CLASS
// ============================================================

class SyncAPI {
  // ============================================================
  // PROGRESS LISTENING (WebSocket)
  // ============================================================

  /**
   * Register a progress listener for sync events.
   * Updates are pushed from the main process via WebSocket.
   *
   * @param callback - Called with progress updates from main process
   * @returns Unsubscribe function
   *
   * @example
   * ```ts
   * const unsubscribe = syncAPI.onProgress((progress) => {
   *   console.log(`Sync ${progress.status}: ${progress.completed}/${progress.total}`);
   * });
   * // later: unsubscribe();
   * ```
   */
  onProgress(callback: (progress: SyncProgress) => void): () => void {
    if (!window.backendAPI?.sync) {
      console.warn("[SyncAPI] Sync API not available");
      return () => {};
    }

    const handler = (event: any, progress: SyncProgress) => {
      callback(progress);
    };

    // Use the generic 'on' method exposed in preload
    // @ts-ignore - backendAPI is defined in preload
    window.backendAPI.on("sync:progress", handler);
    return () => {
      // @ts-ignore
      window.backendAPI.off("sync:progress", handler);
    };
  }

  // ============================================================
  // AVAILABILITY
  // ============================================================

  /**
   * Check if sync is available (online mode + server reachable)
   * @returns { available: boolean; message?: string }
   */
  async isAvailable(): Promise<{ available: boolean; message?: string }> {
    if (!window.backendAPI?.sync) {
      return { available: false, message: "Sync API not available" };
    }
    const response = await window.backendAPI.sync({
      method: "isSyncAvailable",
      params: {},
    });
    if (response.status) return response.data;
    return { available: false, message: response.message };
  }

  // ============================================================
  // 🔄 FULL SYNC (Upload to server)
  // ============================================================

  /**
   * Start a full sync of all local data to the server.
   * Progress is delivered via `onProgress` events (WebSocket).
   *
   * @param metadata - Optional metadata (client_user, device_id, app_version)
   * @returns { taskId, status, entities, totalRecords }
   */
  async fullSync(metadata?: {
    client_user?: string;
    device_id?: string;
    app_version?: string;
  }): Promise<FullSyncResponse> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }

    const response = await window.backendAPI.sync({
      method: "fullSync",
      params: {
        user: metadata?.client_user || "system",
        metadata: {
          deviceId: metadata?.device_id,
          appVersion: metadata?.app_version,
          ...metadata,
        },
      },
    });

    if (!response.status) {
      throw new Error(response.message || "Full sync failed");
    }

    return response.data;
  }

  /**
   * Pull all data from the server (download and replace local data).
   * This is a one‑time destructive operation.
   *
   * @param metadata - Optional metadata (client_user, device_id, app_version)
   * @returns { totalRecords: number; entities: string[] }
   */
  async pullFullSync(metadata?: {
    client_user?: string;
    device_id?: string;
    app_version?: string;
  }): Promise<{ totalRecords: number; entities: string[] }> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "pullFullSync",
      params: {
        user: metadata?.client_user || "system",
        metadata: {
          deviceId: metadata?.device_id,
          appVersion: metadata?.app_version,
          ...metadata,
        },
      },
    });
    if (!response.status) {
      throw new Error(response.message || "Pull sync failed");
    }
    return response.data;
  }

  /**
   * Cancel an ongoing sync.
   * Sends a cancellation command via WebSocket.
   */
  async cancelSync(): Promise<boolean> {
    if (!window.backendAPI?.sync) {
      return false;
    }
    const response = await window.backendAPI.sync({
      method: "cancelSync",
      params: {},
    });
    return response.status;
  }

  // ============================================================
  // 📊 SYNC STATUS
  // ============================================================

  /**
   * Get sync status (merged from server + local snapshots)
   * @returns UserSyncSummary with local additions
   */
  async getSyncStatus(): Promise<
    UserSyncSummary & {
      localSnapshots?: any[];
      pendingChangesCount?: number;
      source?: string;
    }
  > {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }

    const response = await window.backendAPI.sync({
      method: "getSyncStatus",
      params: {},
    });

    if (!response.status) {
      throw new Error(response.message || "Failed to get sync status");
    }

    return response.data;
  }

  /**
   * Get a quick sync summary (overview)
   */
  async getSyncSummary(): Promise<{
    totalEntities: number;
    totalSynced: number;
    pending: number;
    failed: number;
    completed: number;
    idle: number;
    pendingChanges: number;
    isSyncing: boolean;
    lastSync: string | null;
  }> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }

    const response = await window.backendAPI.sync({
      method: "getSyncSummary",
      params: {},
    });

    if (!response.status) {
      throw new Error(response.message || "Failed to get sync summary");
    }

    return response.data;
  }

  // ============================================================
  // 📋 TASK OPERATIONS (HTTP fallback)
  // ============================================================

  /**
   * Get task status by ID (HTTP fallback).
   * Prefer using WebSocket progress events (`onProgress`) for real‑time updates.
   *
   * @param taskId - Task ID from fullSync response
   * @returns TaskProgress from server
   */
  async getTaskStatus(taskId: string): Promise<TaskProgress> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }

    const response = await window.backendAPI.sync({
      method: "getTaskStatus",
      params: { taskId },
    });

    if (!response.status) {
      throw new Error(response.message || "Failed to get task status");
    }

    return response.data;
  }

  /**
   * Get list of sync tasks (HTTP)
   * @param entity - Optional filter by entity
   * @param status - Optional filter by status
   * @param limit - Max items to return (default: 50)
   * @returns { items: TaskProgress[]; count: number }
   */
  async getTaskList(
    entity?: string,
    status?: string,
    limit: number = 50,
  ): Promise<{ items: TaskProgress[]; count: number }> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }

    const response = await window.backendAPI.sync({
      method: "getTaskList",
      params: { entity, status, limit },
    });

    if (!response.status) {
      throw new Error(response.message || "Failed to get task list");
    }

    return response.data;
  }

  // ============================================================
  // 🔍 PENDING CHANGES (Local)
  // ============================================================

  /**
   * Get entities with local changes (from snapshots)
   * @returns Array of PendingChange
   */
  async getPendingChanges(): Promise<PendingChange[]> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }

    const response = await window.backendAPI.sync({
      method: "getPendingChanges",
      params: {},
    });

    if (!response.status) {
      throw new Error(response.message || "Failed to get pending changes");
    }

    return response.data || [];
  }
}

// ============================================================
// EXPORT
// ============================================================

const syncAPI = new SyncAPI();
export default syncAPI;

// ============================================================
// DEPRECATED / REMOVED METHODS
// ============================================================
// The following methods have been removed:
//
// - pollTaskStatus()          → Use WebSocket `onProgress` instead
// - syncEntityLegacy()        → Use fullSync() instead
// - incrementalSync()         → Use fullSync() instead
// - getConflicts()            → No longer supported
// - resolveConflict()         → No longer supported
// - autoResolveConflicts()    → No longer supported
// - cleanup()                 → No longer supported
// - resetSync()               → No longer supported
// - testSync()                → No longer supported
// - getEntityRecords()        → No longer needed
// - getPendingRecords()       → No longer needed
// - getQueueStatus()          → No longer supported
// - processQueue()            → No longer supported
// - syncEntity()              → Use fullSync() instead
// - syncEntityByName()        → Use fullSync() instead
// ============================================================

export type {
  TaskProgress,
  UserSyncSummary,
  EntitySyncStatus,
  FullSyncRequest,
  FullSyncResponse,
  PendingChange,
  SyncProgress,
  SyncSnapshot,
};