// src/main/services/SyncService.js
//@ts-check
const { logger } = require("../utils/logger");
const syncSnapshotService = require("./SyncSnapshotService");
const onlineClient = require("../utils/onlineClient");
const { serverUrl, syncMode } = require("../utils/system");
const { AppDataSource } = require("../main/db/data-source");
const WebSocketClient = require("../utils/websocketClient");

/**
 * SyncService - WebSocket‑enabled
 *
 * Core sync service that handles communication with the server.
 * Uses WebSocket for real‑time progress and cancellation.
 * Local state is managed via SyncSnapshotService.
 */
class SyncService {
  constructor() {
    // ─── WebSocket Client ───
    this.wsClient = new WebSocketClient({
      maxReconnectAttempts: 5,
      reconnectDelay: 2000,
    });
    this.wsClient.on("progress", this._handleProgress.bind(this));
    this.wsClient.on("task_completed", this._handleTaskCompleted.bind(this));
    this.wsClient.on("task_failed", this._handleTaskFailed.bind(this));
    this.wsClient.on("task_cancelled", this._handleTaskCancelled.bind(this)); // 🆕

    // ─── Sync State ───
    this.isSyncing = false;
    this.currentProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      currentEntity: null,
      status: "idle", // idle | syncing | completed | failed | cancelled
    };
    this.progressCallbacks = [];
    this.activeTasks = {};

    // ─── Entity List ───
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

  onProgress(callback) {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

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
  // 🔧 HELPER: WebSocket URL
  // ============================================================

  /** 🆕 Get WebSocket URL from server URL */
  async _getWsUrl() {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    // Convert http(s) to ws(s)
    let wsUrl = url.replace(/^http/, "ws") + "/ws/sync/";

    // ✅ Append token as query parameter
    const token = onlineClient.getToken();
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    } else {
      logger.warn("[SyncService] No token available for WebSocket connection");
    }

    return wsUrl;
  }

  /** 🆕 Ensure WebSocket is connected */
  async _ensureWsConnected() {
    if (!this.wsClient.connected) {
      const wsUrl = await this._getWsUrl();
      const token = onlineClient.getToken();
      await this.wsClient.connect(wsUrl, token);
    }
  }

  // ============================================================
  // 🔄 FULL SYNC
  // ============================================================

  async fullSync(user = "system", metadata = {}) {
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

    // ─── 1. Load all data ───
    const entitiesData = {};
    let totalRecords = 0;

    for (const entityName of this.entities) {
      try {
        const repo = AppDataSource.getRepository(entityName);
        const records = await repo.find();

        await syncSnapshotService.markSyncing(entityName);

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
        for (const entityName of this.entities) {
          await syncSnapshotService.markFailed(entityName);
        }
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const data = result.data || result;

      // ─── 4. Subscribe to WebSocket for progress ─── 🆕
      if (data.taskId) {
        await this._ensureWsConnected();
        this.wsClient.send({
          type: "subscribe",
          taskId: data.taskId,
        });

        this.activeTasks[data.taskId] = {
          taskId: data.taskId,
          status: data.status || "queued",
          entities: data.entities || this.entities,
          totalRecords: data.totalRecords || totalRecords,
          startedAt: new Date(),
        };
      }

      this.isSyncing = false;
      this._updateProgress({
        status: "syncing", // still syncing, but task is queued
        currentEntity: null,
      });

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

  async getSyncStatus() {
    try {
      const serverStatus = await this._getServerSyncStatus();
      const snapshots = await syncSnapshotService.getAllSnapshots();

      const mergedEntities = serverStatus.entities.map((entity) => {
        const snapshot = snapshots.find((s) => s.entity === entity.entity);
        return {
          ...entity,
          localRecordCount: snapshot?.recordCount || 0,
          localStatus: snapshot?.syncStatus || "idle",
          lastSyncTaskId: snapshot?.lastSyncTaskId || null,
          combinedStatus:
            entity.status === "completed" && snapshot?.syncStatus === "syncing"
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
      console.error(
        "[SyncService] Failed to get sync status from server:",
        error,
      );
      const snapshots = await syncSnapshotService.getAllSnapshots();
      return {
        user: "system",
        totalEntities: snapshots.length,
        syncedEntities: snapshots.filter((s) => s.syncStatus === "completed")
          .length,
        pendingSyncs: snapshots.filter(
          (s) => s.syncStatus === "syncing" || s.syncStatus === "failed",
        ).length,
        totalRecordsSynced: snapshots.reduce(
          (sum, s) => sum + s.recordCount,
          0,
        ),
        lastSync:
          snapshots.length > 0
            ? Math.max(
                ...snapshots
                  .filter((s) => s.lastSyncedAt)
                  .map((s) => s.lastSyncedAt.getTime()),
              )
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

  async getPendingChanges() {
    const results = [];
    for (const entityName of this.entities) {
      try {
        const repo = AppDataSource.getRepository(entityName);
        const records = await repo.find();
        const changeStatus = await syncSnapshotService.hasEntityChanged(
          entityName,
          records,
        );
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
        console.error(
          `[SyncService] Failed to check changes for ${entityName}:`,
          error,
        );
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
  // 📋 TASK STATUS (HTTP fallback – retained for compatibility)
  // ============================================================

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

    if (data.status === "running" || data.status === "queued") {
      this._updateProgress({
        status: "syncing",
        currentEntity: data.currentEntity || data.entity,
        total: data.total || this.activeTasks[taskId]?.totalRecords || 0,
        completed: data.processed || 0,
      });
    }

    if (data.status === "completed") {
      for (const entityName of this.entities) {
        try {
          const repo = AppDataSource.getRepository(entityName);
          const count = await repo.count();
          await syncSnapshotService.updateSnapshot(
            entityName,
            count,
            null,
            taskId,
          );
        } catch (err) {
          console.error(
            `[SyncService] Failed to update snapshot for ${entityName}:`,
            err,
          );
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

  // ============================================================
  // 🛑 CANCEL SYNC (via WebSocket) – UPDATED
  // ============================================================

  async cancelSync() {
    // Send cancel via WebSocket if connected and there is an active task
    const activeTaskIds = Object.keys(this.activeTasks);
    if (this.wsClient.connected && activeTaskIds.length > 0) {
      const taskId = activeTaskIds[0];
      this.wsClient.send({
        type: "cancel",
        taskId: taskId,
      });
      // The task will be removed when we receive 'task_cancelled' event
      // or we can optimistically clear after a timeout
    }

    // Clear local state immediately (UI will update via progress events)
    this.activeTasks = {};
    this.isSyncing = false;
    this._updateProgress({
      status: "idle",
      currentEntity: null,
    });
    return true;
  }

  // ============================================================
  // 🆕 WEBSOCKET EVENT HANDLERS
  // ============================================================

  _handleProgress(data) {
    const { taskId, entity, processed, total, status } = data;
    if (this.activeTasks[taskId]) {
      this.activeTasks[taskId].status = status || "running";
      this.activeTasks[taskId].processed = processed;
      this.activeTasks[taskId].total =
        total || this.activeTasks[taskId].totalRecords;
    }
    this._updateProgress({
      status: status === "running" ? "syncing" : status,
      currentEntity: entity || null,
      total: total || this.currentProgress.total,
      completed: processed || 0,
    });
  }

  async _handleTaskCompleted(data) {
    const { taskId, total, processed } = data;
    // Update snapshots for all entities
    for (const entityName of this.entities) {
      try {
        const repo = AppDataSource.getRepository(entityName);
        const count = await repo.count();
        await syncSnapshotService.updateSnapshot(
          entityName,
          count,
          null,
          taskId,
        );
      } catch (err) {
        console.error(
          `[SyncService] Failed to update snapshot for ${entityName}:`,
          err,
        );
      }
    }
    delete this.activeTasks[taskId];
    this.isSyncing = false;
    this._updateProgress({
      status: "completed",
      currentEntity: null,
      completed: processed || total || 0,
    });
  }

  async _handleTaskFailed(data) {
    const { taskId, error } = data;
    // Mark all entities as failed
    for (const entityName of this.entities) {
      try {
        await syncSnapshotService.markFailed(entityName);
      } catch (err) {
        console.error(
          `[SyncService] Failed to mark ${entityName} as failed:`,
          err,
        );
      }
    }
    delete this.activeTasks[taskId];
    this.isSyncing = false;
    this._updateProgress({
      status: "failed",
      currentEntity: null,
    });
    // Optionally log or throw
    logger.error(`[SyncService] Task ${taskId} failed: ${error}`);
  }

  async _handleTaskCancelled(data) {
    const { taskId } = data;
    // Mark all entities as idle (or keep previous state)
    for (const entityName of this.entities) {
      try {
        await syncSnapshotService.resetSnapshot(entityName);
      } catch (err) {
        console.error(`[SyncService] Failed to reset ${entityName}:`, err);
      }
    }
    delete this.activeTasks[taskId];
    this.isSyncing = false;
    this._updateProgress({
      status: "idle",
      currentEntity: null,
    });
    logger.info(`[SyncService] Task ${taskId} cancelled`);
  }

  // ============================================================
  // 🔧 OTHER HELPER METHODS (unchanged)
  // ============================================================

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

  async getSyncSummary() {
    try {
      const status = await this.getSyncStatus();
      const pendingChanges = await this.getPendingChanges();
      return {
        totalEntities: status.totalEntities || 0,
        totalSynced: status.totalRecordsSynced || 0,
        pending: status.pendingSyncs || 0,
        failed:
          status.entities?.filter((e) => e.status === "failed").length || 0,
        completed:
          status.entities?.filter((e) => e.status === "completed").length || 0,
        idle: status.entities?.filter((e) => e.status === "idle").length || 0,
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

  isSyncingNow() {
    return this.isSyncing;
  }

  getCurrentProgress() {
    return this.currentProgress;
  }

  // ============================================================
  // 📋 TASK LIST (unchanged)
  // ============================================================

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
      `/api/v1/sync/tasks/?${query.toString()}`,
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return result.data || result;
  }

  getActiveTasks() {
    return this.activeTasks;
  }

  clearActiveTasks() {
    this.activeTasks = {};
  }

  // Legacy polling method – kept for backward compatibility but no longer used
  async pollTaskStatus(taskId, onProgress, interval = 1000, timeout = 300000) {
    const startTime = Date.now();
    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error("Task polling timed out");
      }
      try {
        const status = await this.getTaskStatus(taskId);
        if (onProgress) onProgress(status);
        if (status.status === "completed") return status;
        if (status.status === "failed")
          throw new Error(status.error || "Task failed");
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
}

// Export singleton instance
const syncService = new SyncService();
module.exports = syncService;
