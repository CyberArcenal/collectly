// src/main/ipc/utils/sync/index.ipc.js
//@ts-check
const { ipcMain, BrowserWindow } = require("electron");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const syncService = require("../../../../services/SyncService");
const { logger } = require("../../../../utils/logger");

/**
 * SyncHandler - IPC Router with WebSocket support
 * 
 * Handles sync operations:
 * - fullSync: Start a full sync (WebSocket-enabled)
 * - getSyncStatus: Get merged sync status
 * - getTaskStatus: Get task progress (HTTP fallback)
 * - getTaskList: List tasks
 * - isSyncAvailable: Check availability
 * - cancelSync: Cancel ongoing sync (via WebSocket)
 * - getPendingChanges: Get entities with local changes
 * 
 * ⚠️ DEPRECATED: pollTask – kept only for backward compatibility
 */
class SyncHandler {
  constructor() {
    this.initializeHandlers();
    this.setupProgressForwarding();
  }

  initializeHandlers() {
    this.fullSync = this.importHandler("./full_sync.ipc");
    this.getSyncStatus = this.importHandler("./get/status.ipc");
    this.getTaskStatus = this.importHandler("./get/task_status.ipc");
    this.getTaskList = this.importHandler("./get/task_list.ipc");
    
    // ⚠️ DEPRECATED: Kept only for backward compatibility
    // Use WebSocket for real‑time progress instead
    this.pollTask = this.importHandler("./poll_task.ipc");
    
    this.isSyncAvailable = this.importHandler("./get/available.ipc");
    this.pullFullSync = this.importHandler("./pull_full_sync.ipc");
    this.getPendingChanges = this.importHandler("./get/pending_changes.ipc");
  }

  /**
   * Import a handler module
   */
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[SyncHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  /**
   * Setup progress forwarding from sync service to renderer
   * ✅ This already works with WebSocket because SyncService emits progress events
   */
  setupProgressForwarding() {
    syncService.onProgress((progress) => {
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        if (!win.isDestroyed()) {
          win.webContents.send("sync:progress", progress);
        }
      }
    });
  }

  /**
   * Main request handler
   */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      const user = params.user || "system";

      logger?.info(`SyncHandler: ${method}`, { params, user });

      const handlerParams = { ...params, user };

      switch (method) {
        // ─── Sync Operations ───
        case "fullSync":
          return await this.fullSync(handlerParams);
        case "cancelSync":
          return await this.cancelSync(handlerParams);
        
        // ─── Status Operations ───
        case "getSyncStatus":
          return await this.getSyncStatus(handlerParams);
        case "getSyncSummary": {
          const statusResult = await this.getSyncStatus(handlerParams);
          if (statusResult.status && statusResult.data) {
            const data = statusResult.data;
            return {
              status: true,
              message: "Sync summary retrieved",
              data: {
                totalEntities: data.totalEntities || 0,
                totalSynced: data.totalRecordsSynced || 0,
                pending: data.pendingSyncs || 0,
                failed: data.entities?.filter(e => e.status === 'failed').length || 0,
                completed: data.entities?.filter(e => e.status === 'completed').length || 0,
                idle: data.entities?.filter(e => e.status === 'idle').length || 0,
                pendingChanges: data.pendingChangesCount || 0,
                isSyncing: data.isSyncing || false,
                lastSync: data.lastSync || null,
              },
            };
          }
          return statusResult;
        }

        // ─── Task Operations ───
        case "getTaskStatus":
          return await this.getTaskStatus(handlerParams);
        case "getTaskList":
          return await this.getTaskList(handlerParams);
        
        // ⚠️ DEPRECATED: Use WebSocket instead
        case "pollTask":
          logger.warn("[SyncHandler] pollTask is deprecated. Use WebSocket for progress.");
          return await this.pollTask(handlerParams);

        // ─── Availability ───
        case "isSyncAvailable":
          return await this.isSyncAvailable(handlerParams);
        case "pullFullSync":
          return await this.pullFullSync(handlerParams);

        // ─── Pending Changes ───
        case "getPendingChanges":
          return await this.getPendingChanges(handlerParams);

        default:
          return {
            status: false,
            message: `Unknown sync method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("SyncHandler error:", error);
      logger?.error("SyncHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Cancel sync – delegates to SyncService (which now uses WebSocket)
   */
  async cancelSync(params) {
    try {
      await syncService.cancelSync();
      return {
        status: true,
        message: "Sync cancelled",
        data: null,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message || "Failed to cancel sync",
        data: null,
      };
    }
  }

  /**
   * Get pending changes
   */
  async getPendingChanges(params) {
    try {
      const changes = await syncService.getPendingChanges();
      return {
        status: true,
        message: "Pending changes retrieved",
        data: changes,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message || "Failed to get pending changes",
        data: null,
      };
    }
  }
}

// ============================================================
// REGISTER IPC HANDLERS
// ============================================================

const syncHandler = new SyncHandler();

ipcMain.handle(
  "sync",
  withErrorHandling(syncHandler.handleRequest.bind(syncHandler), "IPC:sync"),
);

module.exports = { SyncHandler, syncHandler };