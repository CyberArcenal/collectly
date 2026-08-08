// src/main/services/SyncService.js (SIMPLIFIED)
//@ts-check
const { logger } = require("../utils/logger");
const syncSnapshotService = require("./SyncSnapshotService");
const onlineClient = require("../utils/onlineClient");
const { serverUrl, syncMode } = require("../utils/system");
const { AppDataSource } = require("../main/db/data-source");

/**
 * SyncService - Simplified
 * 
 * Core sync service that handles communication with the server.
 * All sync operations are now full sync only.
 * Local state is managed via SyncSnapshotService.
 */
class SyncService {
  constructor() {
    this.isSyncing = false;
    this.currentProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      currentEntity: null,
      status: "idle", // idle | syncing | completed | failed
    };
    this.progressCallbacks = [];
    this.activeTasks = {};
    
    // Entity list (for full sync)
    this.entities = [
      "PaymentMethod",
      "Borrower",
      "Debt",
      "LoanAgreement",
      "LoanApplication",
      "PaymentTransaction",
      "PenaltyTransaction",
    ];
  }

  // ============================================================
  // 📋 PROGRESS TRACKING
  // ============================================================

  /**
   * Register a progress callback
   * @param {Function} callback - Called with progress updates
   * @returns {Function} Unsubscribe function
   */
  onProgress(callback) {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Update progress and notify callbacks
   * @param {Object} update - Partial progress update
   */
  _updateProgress(update) {
    this.currentProgress = { ...this.currentProgress, ...update };
    for (const callback of this.progressCallbacks) {
      try {
        callback(this.currentProgress);
      } catch (err) {
        console.error("Progress callback error:", err);
      }
    }
  }

  // ============================================================
  // 🔍 CHECK SYNC AVAILABILITY
  // ============================================================

  /**
   * Check if sync is available (online mode and server reachable)
   * @returns {Promise<{available: boolean, message?: string}>}
   */
  async isSyncAvailable() {
    try {
      const mode = await syncMode();
      if (mode === "offline") {
        return { available: false, message: "App is in offline mode" };
      }

      const url = await serverUrl();
      if (!url) {
        return { available: false, message: "Server URL not configured" };
      }

      onlineClient.setBaseUrl(url);
      const response = await onlineClient.get("/health/");
      if (!response.ok) {
        return { available: false, message: "Server not reachable" };
      }

      return { available: true };
    } catch (error) {
      return { available: false, message: error.message };
    }
  }

  // ============================================================
  // 🔄 FULL SYNC
  // ============================================================

  /**
   * Perform a full sync of all entities
   * @param {string} user - User performing the sync
   * @param {Object} metadata - Additional metadata (device_id, app_version, etc.)
   * @returns {Promise<{taskId: string, status: string, entities: string[], totalRecords: number}>}
   */
  async fullSync(user = "system", metadata = {}) {
    // Check availability
    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // ─── 1. Load all data from local database ───
    const entitiesData = {};
    let totalRecords = 0;

    for (const entityName of this.entities) {
      try {
        const repo = AppDataSource.getRepository(entityName);
        const records = await repo.find();
        
        // Mark as syncing in snapshot
        await syncSnapshotService.markSyncing(entityName);
        
        // Convert records to plain objects
        entitiesData[entityName] = {
          records: records.map((r) => {
            const obj = {};
            for (const key of Object.keys(r)) {
              if (r[key] instanceof Date) {
                obj[key] = r[key].toISOString();
              } else {
                obj[key] = r[key];
              }
            }
            return obj;
          }),
        };
        
        totalRecords += records.length;
      } catch (error) {
        console.error(`[SyncService] Failed to load ${entityName}:`, error);
        throw new Error(`Failed to load ${entityName}: ${error.message}`);
      }
    }

    // ─── 2. Update progress ───
    this.isSyncing = true;
    this._updateProgress({
      status: "syncing",
      total: this.entities.length,
      completed: 0,
      currentEntity: null,
    });

    // ─── 3. Send to server ───
    try {
      const response = await onlineClient.post("/api/v1/sync/full/", {
        entities: entitiesData,
        metadata: {
          client_user: user,
          device_id: metadata.deviceId,
          app_version: metadata.appVersion,
          ...metadata,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Mark all as failed
        for (const entityName of this.entities) {
          await syncSnapshotService.markFailed(entityName);
        }
        
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const data = result.data || result;

      // ─── 4. Return task info ───
      this.isSyncing = false;
      this._updateProgress({
        status: "syncing", // still syncing, but task is queued
        currentEntity: null,
      });

      // Store task for tracking
      if (data.taskId) {
        this.activeTasks[data.taskId] = {
          taskId: data.taskId,
          status: data.status || "queued",
          entities: data.entities || this.entities,
          totalRecords: data.totalRecords || totalRecords,
          startedAt: new Date(),
        };
      }

      return {
        taskId: data.taskId,
        status: data.status || "queued",
        entities: data.entities || this.entities,
        totalRecords: data.totalRecords || totalRecords,
      };

    } catch (error) {
      this.isSyncing = false;
      this._updateProgress({
        status: "failed",
        currentEntity: null,
      });
      throw error;
    }
  }

  // ============================================================
  // 📊 SYNC STATUS
  // ============================================================

  /**
   * Get sync status (merged from server + local snapshots)
   * @returns {Promise<Object>}
   */
  async getSyncStatus() {
    try {
      // Try to get server status
      const serverStatus = await this._getServerSyncStatus();
      const snapshots = await syncSnapshotService.getAllSnapshots();
      
      // Merge server data with local snapshots
      const mergedEntities = serverStatus.entities.map((entity) => {
        const snapshot = snapshots.find((s) => s.entity === entity.entity);
        return {
          ...entity,
          localRecordCount: snapshot?.recordCount || 0,
          localStatus: snapshot?.syncStatus || "idle",
          lastSyncTaskId: snapshot?.lastSyncTaskId || null,
          // Combine server status with local status
          combinedStatus: entity.status === "completed" && snapshot?.syncStatus === "syncing"
            ? "syncing"
            : entity.status,
        };
      });

      return {
        ...serverStatus,
        entities: mergedEntities,
        localSnapshots: snapshots,
      };
    } catch (error) {
      console.error("[SyncService] Failed to get sync status from server:", error);
      
      // Fallback: return local snapshots only
      const snapshots = await syncSnapshotService.getAllSnapshots();
      return {
        user: "system",
        totalEntities: snapshots.length,
        syncedEntities: snapshots.filter((s) => s.syncStatus === "completed").length,
        pendingSyncs: snapshots.filter((s) => s.syncStatus === "syncing" || s.syncStatus === "failed").length,
        totalRecordsSynced: snapshots.reduce((sum, s) => sum + s.recordCount, 0),
        lastSync: snapshots.length > 0 
          ? Math.max(...snapshots.filter(s => s.lastSyncedAt).map(s => s.lastSyncedAt.getTime()))
          : null,
        entities: snapshots.map((s) => ({
          entity: s.entity,
          status: s.syncStatus,
          lastSyncedAt: s.lastSyncedAt,
          recordCount: s.recordCount,
          totalSynced: s.recordCount,
          hasPending: s.syncStatus === "syncing" || s.syncStatus === "failed",
        })),
        source: "local",
      };
    }
  }

  /**
   * Get pending changes (entities with local changes)
   * @returns {Promise<Array>}
   */
  async getPendingChanges() {
    const results = [];

    for (const entityName of this.entities) {
      try {
        const repo = AppDataSource.getRepository(entityName);
        const records = await repo.find();
        const changeStatus = await syncSnapshotService.hasEntityChanged(entityName, records);
        if (changeStatus.changed) {
          results.push({
            entity: entityName,
            reason: changeStatus.reason,
            currentCount: changeStatus.currentCount,
            previousCount: changeStatus.previousCount,
            hasSnapshot: changeStatus.hasSnapshot,
          });
        }
      } catch (error) {
        console.error(`[SyncService] Failed to check changes for ${entityName}:`, error);
        results.push({
          entity: entityName,
          reason: "Error checking changes",
          currentCount: 0,
          previousCount: 0,
          hasSnapshot: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  // ============================================================
  // 📋 TASK STATUS
  // ============================================================

  /**
   * Get task status from server
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>}
   */
  async getTaskStatus(taskId) {
    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(`/api/v1/sync/task/${taskId}/`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Task not found");
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const data = result.data || result;

    // Update local task tracking
    if (this.activeTasks[taskId]) {
      this.activeTasks[taskId] = {
        ...this.activeTasks[taskId],
        status: data.status,
        processed: data.processed || 0,
        total: data.total || this.activeTasks[taskId].totalRecords,
        result: data.result,
        error: data.error,
      };
    }

    // Update progress if task is running
    if (data.status === "running" || data.status === "queued") {
      this._updateProgress({
        status: "syncing",
        currentEntity: data.currentEntity || data.entity,
        total: data.total || this.activeTasks[taskId]?.totalRecords || 0,
        completed: data.processed || 0,
      });
    }

    // Check if task is complete
    if (data.status === "completed") {
      // Update snapshots on completion
      for (const entityName of this.entities) {
        try {
          const repo = AppDataSource.getRepository(entityName);
          const count = await repo.count();
          await syncSnapshotService.updateSnapshot(
            entityName,
            count,
            null,
            taskId
          );
        } catch (err) {
          console.error(`[SyncService] Failed to update snapshot for ${entityName}:`, err);
        }
      }
      
      this._updateProgress({
        status: "completed",
        currentEntity: null,
        completed: data.total || this.activeTasks[taskId]?.totalRecords || 0,
      });
      delete this.activeTasks[taskId];
    }

    if (data.status === "failed") {
      // Mark all as failed
      for (const entityName of this.entities) {
        await syncSnapshotService.markFailed(entityName);
      }
      
      this._updateProgress({
        status: "failed",
        currentEntity: null,
      });
      delete this.activeTasks[taskId];
    }

    return data;
  }

  /**
   * Poll task status until completion
   * @param {string} taskId - Task ID
   * @param {Function} onProgress - Callback for progress updates
   * @param {number} interval - Polling interval in ms
   * @param {number} timeout - Max time to poll in ms
   * @returns {Promise<Object>}
   */
  async pollTaskStatus(taskId, onProgress, interval = 1000, timeout = 300000) {
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error("Task polling timed out");
      }

      try {
        const status = await this.getTaskStatus(taskId);
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === "completed") {
          return status;
        }

        if (status.status === "failed") {
          throw new Error(status.error || "Task failed");
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        if (error.message === "Task not found") {
          return {
            status: "completed",
            message: "Task completed (no longer tracked)",
          };
        }
        throw error;
      }
    }
  }

  /**
   * Get list of sync tasks
   * @param {string} entity - Filter by entity
   * @param {string} status - Filter by status
   * @param {number} limit - Max items
   * @returns {Promise<{items: Array, count: number}>}
   */
  async getTaskList(entity, status, limit = 50) {
    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      return { items: [], count: 0 };
    }

    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = new URLSearchParams();
    if (entity) query.append("entity", entity);
    if (status) query.append("status", status);
    if (limit) query.append("limit", limit);

    const response = await onlineClient.get(
      `/api/v1/sync/tasks/?${query.toString()}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get active tasks
   * @returns {Object}
   */
  getActiveTasks() {
    return this.activeTasks;
  }

  /**
   * Clear active tasks (for cleanup)
   */
  clearActiveTasks() {
    this.activeTasks = {};
  }

  // ============================================================
  // 🛑 CANCEL SYNC
  // ============================================================

  /**
   * Cancel an ongoing sync
   * @returns {Promise<boolean>}
   */
  async cancelSync() {
    // Clear active tasks
    this.activeTasks = {};
    this.isSyncing = false;
    this._updateProgress({
      status: "idle",
      currentEntity: null,
    });
    return true;
  }

  // ============================================================
  // 🔧 HELPER METHODS
  // ============================================================

  /**
   * Get server sync status (internal)
   * @returns {Promise<Object>}
   */
  async _getServerSyncStatus() {
    const url = await serverUrl();
    if (!url) {
      throw new Error("Server URL not configured");
    }
    
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/sync/status/");
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get sync summary (quick overview)
   * @returns {Promise<Object>}
   */
  async getSyncSummary() {
    try {
      const status = await this.getSyncStatus();
      const pendingChanges = await this.getPendingChanges();
      
      return {
        totalEntities: status.totalEntities || 0,
        totalSynced: status.totalRecordsSynced || 0,
        pending: status.pendingSyncs || 0,
        failed: status.entities?.filter(e => e.status === 'failed').length || 0,
        completed: status.entities?.filter(e => e.status === 'completed').length || 0,
        idle: status.entities?.filter(e => e.status === 'idle').length || 0,
        pendingChanges: pendingChanges.length,
        isSyncing: this.isSyncing,
        lastSync: status.lastSync || null,
      };
    } catch (error) {
      console.error("[SyncService] Failed to get sync summary:", error);
      return {
        totalEntities: 0,
        totalSynced: 0,
        pending: 0,
        failed: 0,
        completed: 0,
        idle: 0,
        pendingChanges: 0,
        isSyncing: false,
        lastSync: null,
      };
    }
  }

  /**
   * Check if sync is currently in progress
   * @returns {boolean}
   */
  isSyncingNow() {
    return this.isSyncing;
  }

  /**
   * Get current sync progress
   * @returns {Object}
   */
  getCurrentProgress() {
    return this.currentProgress;
  }
}

// Export singleton instance
const syncService = new SyncService();
module.exports = syncService;