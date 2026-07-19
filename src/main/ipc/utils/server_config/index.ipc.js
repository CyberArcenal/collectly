// src/main/ipc/utils/server_config/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../utils/system");
const {
  transformPaginatedResult,
  transformKeysToCamelCase,
  extractData,
} = require("../../../../utils/responseTransformer");

class OnlineSystemConfigHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // READ-ONLY HANDLERS
    this.getGroupedConfig = this.importHandler("./get_grouped.ipc");
    this.getSystemInfo = this.importHandler("./get_info.ipc");
    this.getAllSettings = this.importHandler("./get_all.ipc");
    this.getPublicSettings = this.importHandler("./get_public.ipc");
    this.getSettingByKey = this.importHandler("./get_by_key.ipc");
    this.getByType = this.importHandler("./get_by_type.ipc");
    this.getValueByKey = this.importHandler("./get_value.ipc");
    this.getSettingsStats = this.importHandler("./get_stats.ipc");
    this.getSystemInfoForFrontend = this.importHandler("./get_frontend_info.ipc");
    this.testSmtpConnection = this.importHandler("./test_smtp.ipc");
    this.testSmsConnection = this.importHandler("./test_sms.ipc");

    // WRITE OPERATION HANDLERS
    this.updateGroupedConfig = this.importHandler("./update_grouped.ipc");
    this.createSetting = this.importHandler("./create.ipc");
    this.updateSetting = this.importHandler("./update.ipc");
    this.deleteSetting = this.importHandler("./delete.ipc");
    this.setValueByKey = this.importHandler("./set_value.ipc");
    this.bulkUpdate = this.importHandler("./bulk_update.ipc");
    this.bulkDelete = this.importHandler("./bulk_delete.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[OnlineSystemConfigHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  async handleRequest(event, payload) {
    try {
      // Check if online mode
      const mode = await syncMode();
      if (mode !== "online") {
        return {
          status: false,
          message: "Online system config is only available in online mode",
          data: null,
        };
      }

      const method = payload.method;
      const params = payload.params || {};
      const userId = payload.userId || 1;

      logger?.info(`OnlineSystemConfigHandler: ${method}`, params);

      switch (method) {
        // READ-ONLY
        case "getGroupedConfig":
          return await this.getGroupedConfig(params);
        case "getSystemInfo":
          return await this.getSystemInfo(params);
        case "getAllSettings":
          return await this.getAllSettings(params);
        case "getPublicSettings":
          return await this.getPublicSettings(params);
        case "getSettingByKey":
          return await this.getSettingByKey(params);
        case "getByType":
          return await this.getByType(params);
        case "getValueByKey":
          return await this.getValueByKey(params);
        case "getSettingsStats":
          return await this.getSettingsStats(params);
        case "getSystemInfoForFrontend":
          return await this.getSystemInfoForFrontend(params);
        case "testSmtpConnection":
          return await this.testSmtpConnection(params);
        case "testSmsConnection":
          return await this.testSmsConnection(params);

        // WRITE OPERATIONS
        case "updateGroupedConfig":
          return await this.updateGroupedConfig({ ...params, userId });
        case "createSetting":
          return await this.createSetting({ ...params, userId });
        case "updateSetting":
          return await this.updateSetting({ ...params, userId });
        case "deleteSetting":
          return await this.deleteSetting({ ...params, userId });
        case "setValueByKey":
          return await this.setValueByKey({ ...params, userId });
        case "bulkUpdate":
          return await this.bulkUpdate({ ...params, userId });
        case "bulkDelete":
          return await this.bulkDelete({ ...params, userId });

        default:
          return { status: false, message: `Unknown method: ${method}`, data: null };
      }
    } catch (error) {
      logger?.error("OnlineSystemConfigHandler error:", error);
      return { status: false, message: error.message, data: null };
    }
  }
}

const onlineSystemConfigHandler = new OnlineSystemConfigHandler();
ipcMain.handle(
  "onlineSystemConfig",
  withErrorHandling(onlineSystemConfigHandler.handleRequest.bind(onlineSystemConfigHandler), "IPC:onlineSystemConfig"),
);

module.exports = { OnlineSystemConfigHandler, onlineSystemConfigHandler };