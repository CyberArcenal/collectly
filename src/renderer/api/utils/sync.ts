// src/renderer/api/utils/sync.ts

export interface SyncProgress {
  status: "idle" | "syncing" | "completed" | "failed";
  total: number;
  completed: number;
  failed: number;
  currentEntity: string | null;
}

export interface SyncStatus {
  isSyncing: boolean;
  progress: SyncProgress;
  metadata: Array<{
    entity: string;
    status: string;
    lastSyncedAt: string | null;
    totalSynced: number;
    lastSyncCount: number;
    hasPending: boolean;
  }>;
  queue: {
    total: number;
    byStatus: Record<string, number>;
    pending: number;
  };
  conflicts: {
    total: number;
    byResolution: Record<string, number>;
    pendingByEntity: Array<{ entity: string; count: number }>;
  };
}

export interface SyncSummary {
  totalEntities: number;
  totalSynced: number;
  pending: number;
  failed: number;
  completed: number;
  idle: number;
  queuePending: number;
  conflictPending: number;
  isSyncing: boolean;
  lastSync: string | null;
}

// src/renderer/api/utils/sync.ts

// Add these interfaces at the top of the file (after existing imports)

export interface Conflict {
  id: number;
  entity: string;
  entityId: number;
  localData: any;
  serverData: any;
  resolution: string;
  localUpdatedAt: string;
  serverUpdatedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface QueueItem {
  id: number;
  entity: string;
  entityId: number;
  action: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  data: any;
}

class SyncAPI {
  /**
   * Register progress listener
   */
  onProgress(callback: (progress: SyncProgress) => void): () => void {
    if (!window.backendAPI?.sync) {
      console.warn("Sync API not available");
      return () => {};
    }

    const handler = (event: any, progress: SyncProgress) => {
      callback(progress);
    };

    // @ts-ignore
    window.backendAPI.on("sync:progress", handler);
    return () => {
      // @ts-ignore
      window.backendAPI.off("sync:progress", handler);
    };
  }

  /**
 * Cancel an ongoing sync operation
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

  /**
   * Check if sync is available
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

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "getSyncStatus",
      params: {},
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to get sync status");
  }

  /**
   * Get sync summary
   */
  async getSummary(): Promise<SyncSummary> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "getSyncSummary",
      params: {},
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to get sync summary");
  }

  /**
   * Perform full sync
   */
  async fullSync(user: string = "system"): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "fullSync",
      params: { user },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Full sync failed");
  }

  /**
   * Perform incremental sync (process queue)
   */
  async incrementalSync(user: string = "system", limit: number = 50): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "incrementalSync",
      params: { user, limit },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Incremental sync failed");
  }

  /**
   * Sync a specific entity
   */
  async syncEntity(entityName: string, force: boolean = false, user: string = "system"): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "syncEntity",
      params: { entityName, force, user },
    });
    if (response.status) return response.data;
    throw new Error(response.message || `Failed to sync ${entityName}`);
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "getQueueStatus",
      params: {},
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to get queue status");
  }

  /**
   * Process queue
   */
  async processQueue(user: string = "system", limit: number = 50): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "processQueue",
      params: { user, limit },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to process queue");
  }

  /**
   * Get conflicts
   */
  async getConflicts(entity?: string, entityId?: number, limit: number = 50): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "getConflicts",
      params: { entity, entityId, limit },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to get conflicts");
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(conflictId: number, resolution: "local" | "server" | "manual" | "merged", resolvedBy?: string, mergedData?: any): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "resolveConflict",
      params: { conflictId, resolution, resolvedBy, mergedData },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to resolve conflict");
  }

  /**
   * Auto-resolve conflicts
   */
  async autoResolveConflicts(entity?: string, entityId?: number): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "autoResolveConflicts",
      params: { entity, entityId },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to auto-resolve conflicts");
  }

  /**
   * Cleanup old sync data
   */
  async cleanup(days: number = 30): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "cleanup",
      params: { days },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to cleanup sync data");
  }

  /**
   * Reset sync state
   */
  async resetSync(entity?: string, user: string = "system"): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "resetSync",
      params: { entity, user },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Failed to reset sync state");
  }

  /**
   * Test sync (debug)
   */
  async testSync(entityName: string = "Borrower"): Promise<any> {
    if (!window.backendAPI?.sync) {
      throw new Error("Sync API not available");
    }
    const response = await window.backendAPI.sync({
      method: "testSync",
      params: { entityName },
    });
    if (response.status) return response.data;
    throw new Error(response.message || "Test failed");
  }
}

const syncAPI = new SyncAPI();
export default syncAPI;