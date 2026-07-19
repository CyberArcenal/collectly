// src/main/ipc/utils/sync/index.ipc.js
//@ts-check
const { ipcMain, BrowserWindow } = require("electron");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const syncService = require("../../../../services/SyncService");
const { logger } = require("../../../../utils/logger");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");

class SyncHandler {
  constructor() {
    this.initializeHandlers();
    this.setupProgressForwarding();
  }

  initializeHandlers() {
    // 📋 READ OPERATIONS
    this.getSyncStatus = this.importHandler("./get/status.ipc");
    this.getSyncSummary = this.importHandler("./get/summary.ipc");
    this.isSyncAvailable = this.importHandler("./get/available.ipc");
    this.getEntityRecords = this.importHandler("./get_entity_records.ipc");
    this.getPendingRecords = this.importHandler("./get_pending_records.ipc");

    // 🆕 TASK OPERATIONS
    this.getTaskStatus = this.importHandler("./get/task_status.ipc");
    this.getTaskList = this.importHandler("./get/task_list.ipc");
    this.pollTask = this.importHandler("./poll_task.ipc");

    // 🔄 SYNC OPERATIONS
    this.fullSync = this.importHandler("./full_sync.ipc");
    this.incrementalSync = this.importHandler("./incremental_sync.ipc");
    this.syncEntity = this.importHandler("./sync_entity.ipc");

    // 📦 QUEUE OPERATIONS
    this.enqueue = this.importHandler("./enqueue.ipc");
    this.getQueueStatus = this.importHandler("./get/queue_status.ipc");
    this.processQueue = this.importHandler("./process_queue.ipc");

    // ⚔️ CONFLICT OPERATIONS
    this.getConflicts = this.importHandler("./get/conflicts.ipc");
    this.resolveConflict = this.importHandler("./resolve_conflict.ipc");
    this.autoResolveConflicts = this.importHandler("./auto_resolve.ipc");

    // 🧹 MAINTENANCE
    this.cleanup = this.importHandler("./cleanup.ipc");
    this.resetSync = this.importHandler("./reset_sync.ipc");
    this.testSync = this.importHandler("./test_sync.ipc");
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
      console.warn(
        `[SyncHandler] Failed to load handler: ${path}`,
        error.message,
      );
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
        // 📋 READ OPERATIONS
        case "getSyncStatus":
          return await this.getSyncStatus(handlerParams);
        case "getSyncSummary":
          return await this.getSyncSummary(handlerParams);
        case "isSyncAvailable":
          return await this.isSyncAvailable(handlerParams);
        case "getEntityRecords":
          return await this.getEntityRecords(handlerParams);
        case "getPendingRecords":
          return await this.getPendingRecords(handlerParams);

        // 🆕 TASK OPERATIONS
        case "getTaskStatus":
          return await this.getTaskStatus(handlerParams);
        case "getTaskList":
          return await this.getTaskList(handlerParams);
        case "pollTask":
          return await this.pollTask(handlerParams);

        // 🔄 SYNC OPERATIONS
        case "fullSync":
          return await this.fullSync(handlerParams);
        case "incrementalSync":
          return await this.incrementalSync(handlerParams);
        case "syncEntity":
          return await this.syncEntity(handlerParams);

        // 📦 QUEUE OPERATIONS
        case "enqueue":
          return await this.enqueue(handlerParams);
        case "getQueueStatus":
          return await this.getQueueStatus(handlerParams);
        case "processQueue":
          return await this.processQueue(handlerParams);

        // ⚔️ CONFLICT OPERATIONS
        case "getConflicts":
          return await this.getConflicts(handlerParams);
        case "resolveConflict":
          return await this.resolveConflict(handlerParams);
        case "autoResolveConflicts":
          return await this.autoResolveConflicts(handlerParams);

        // 🧹 MAINTENANCE
        case "cleanup":
          return await this.cleanup(handlerParams);
        case "resetSync":
          return await this.resetSync(handlerParams);
        case "testSync":
          return await this.testSync(handlerParams);

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
