// src/main/ipc/core/reminder/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class ReminderLogHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS (using notification log names)
    this.getAllLogs = this.importHandler("./get/all.ipc");
    this.getLogById = this.importHandler("./get/by_id.ipc");
    this.getLogsByRecipient = this.importHandler("./get/by_recipient.ipc");
    this.searchLogs = this.importHandler("./search.ipc");
    this.getLogStats = this.importHandler("./get/stats.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createLog = this.importHandler("./create.ipc");
    this.updateLogStatus = this.importHandler("./update_status.ipc");
    this.deleteLog = this.importHandler("./delete.ipc");
    this.retryLog = this.importHandler("./retry.ipc");
    this.retryAllFailedLogs = this.importHandler("./retry_all.ipc");
    this.resendLog = this.importHandler("./resend.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[ReminderLogHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`ReminderLogHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllLogs":
        case "getAllReminders":
          return await this.getAllLogs(params);
        case "getLogById":
        case "getReminderById":
          return await this.getLogById(params);
        case "getLogsByRecipient":
        case "getRemindersByRecipient":
          return await this.getLogsByRecipient(params);
        case "searchLogs":
        case "searchReminders":
          return await this.searchLogs(params);
        case "getLogStats":
        case "getReminderStats":
          return await this.getLogStats(params);

        // ✏️ WRITE (with transaction)
        case "createLog":
        case "createReminder":
          return await this.handleWithTransaction(this.createLog, params);
        case "updateLogStatus":
        case "updateReminderStatus":
          return await this.handleWithTransaction(this.updateLogStatus, params);
        case "deleteLog":
        case "deleteReminder":
          return await this.handleWithTransaction(this.deleteLog, params);
        case "retryLog":
        case "retryReminder":
          return await this.handleWithTransaction(this.retryLog, params);
        case "retryAllFailedLogs":
        case "retryAllFailedReminders":
          return await this.handleWithTransaction(this.retryAllFailedLogs, params);
        case "resendLog":
        case "resendReminder":
          return await this.handleWithTransaction(this.resendLog, params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("ReminderLogHandler error:", error);
      logger?.error("ReminderLogHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);
      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

const reminderHandler = new ReminderLogHandler();
ipcMain.handle(
  "reminderLog",
  withErrorHandling(reminderHandler.handleRequest.bind(reminderHandler), "IPC:reminderLog")
);

module.exports = { ReminderLogHandler, reminderHandler };