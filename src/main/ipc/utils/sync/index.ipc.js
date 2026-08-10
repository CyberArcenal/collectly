// src/main/ipc/utils/sync/index.ipc.js
//@ts-check
const { ipcMain, BrowserWindow } = require("electron");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const syncService = require("../../../../services/SyncService");
const { logger } = require("../../../../utils/logger");

/**
 * SyncHandler - Simplified IPC Router
 * 
 * Handles only the essential sync operations:
 * - fullSync: Start a full sync
 * - getSyncStatus: Get merged sync status
 * - getTaskStatus: Get task progress
 * - getTaskList: List tasks
 * - pollTask: Poll task until completion
 * - isSyncAvailable: Check availability
 * - cancelSync: Cancel ongoing sync
 * - getPendingChanges: Get entities with local changes
 */
class SyncHandler {
  constructor() {
    this.initializeHandlers();
    this.setupProgressForwarding();
  }

  initializeHandlers() {
    // Import handlers (only the ones we keep)
    this.fullSync = this.importHandler("./full_sync.ipc");
    this.getSyncStatus = this.importHandler("./get/status.ipc");
    this.getTaskStatus = this.importHandler("./get/task_status.ipc");
    this.getTaskList = this.importHandler("./get/task_list.ipc");
    this.pollTask = this.importHandler("./poll_task.ipc");
    this.isSyncAvailable = this.importHandler("./get/available.ipc");
    
    // New: Get pending changes
    this.getPendingChanges = this.importHandler("./get/pending_changes.ipc");
  }

  /**
   * Import a handler module
   * @param {string} path - Relative path to handler
   * @returns {Function} Handler function
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
   * @param {Electron.IpcMainEvent} event - IPC event
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>}
   */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      const user = params.user || "system";

      logger?.info(`SyncHandler: ${method}`, { params, user });

      // Pass mode to handlers via params
      const handlerParams = { ...params, user };

      switch (method) {
        // 🔄 SYNC OPERATIONS
        case "fullSync":
          return await this.fullSync(handlerParams);
        case "cancelSync":
          return await this.cancelSync(handlerParams);
        
        // 📊 STATUS OPERATIONS
        case "getSyncStatus":
          return await this.getSyncStatus(handlerParams);
        case "getSyncSummary":
          // Use getSyncStatus and extract summary
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

        // 📋 TASK OPERATIONS
        case "getTaskStatus":
          return await this.getTaskStatus(handlerParams);
        case "getTaskList":
          return await this.getTaskList(handlerParams);
        case "pollTask":
          return await this.pollTask(handlerParams);

        // 🔍 AVAILABILITY
        case "isSyncAvailable":
          return await this.isSyncAvailable(handlerParams);

        // 🆕 PENDING CHANGES
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
   * Cancel sync
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