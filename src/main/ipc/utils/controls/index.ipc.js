// src/main/ipc/utils/controls/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase, transformSingle } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { logger } = require("../../../../utils/logger");

class ControlsHandler {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
    // Map method names to endpoint paths
    this.handlers = {
      // Interest accrual
      triggerInterestAccrual: { path: "interest-accrual/trigger/", method: "POST" },
      getInterestAccrualStatus: { path: "interest-accrual/status/", method: "GET" },

      // Overdue corrector
      triggerOverdueCorrector: { path: "overdue-corrector/trigger/", method: "POST" },
      getOverdueCorrectorStatus: { path: "overdue-corrector/status/", method: "GET" },

      // Overdue updater
      triggerOverdueUpdater: { path: "overdue-updater/trigger/", method: "POST" },
      getOverdueUpdaterStatus: { path: "overdue-updater/status/", method: "GET" },

      // Zero balance fixer
      triggerZeroBalanceFixer: { path: "zero-balance-fixer/trigger/", method: "POST" },
      getZeroBalanceFixerStatus: { path: "zero-balance-fixer/status/", method: "GET" },

      // Penalty scheduler
      triggerPenaltyScheduler: { path: "penalty-scheduler/trigger/", method: "POST" },
      getPenaltySchedulerStatus: { path: "penalty-scheduler/status/", method: "GET" },

      // Health checks
      overdueStatusHealth: { path: "health/overdue-status/", method: "GET" },
      zeroBalanceHealth: { path: "health/zero-balance/", method: "GET" },
      penaltyHealth: { path: "health/penalty/", method: "GET" },
    };
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      if (!this.handlers[method]) {
        return {
          status: false,
          message: `Unknown controls method: ${method}`,
          data: null,
        };
      }

      const { path, method: httpMethod } = this.handlers[method];

      // Determine if we are online or offline
      const mode = await syncMode();

      if (mode === "online") {
        const url = await serverUrl();
        if (!url) throw new Error("Server URL not configured");
        onlineClient.setBaseUrl(url);

        const endpoint = `/api/v1/controls/${path}`;
        let response;
        switch (httpMethod) {
          case "POST":
            response = await onlineClient.post(endpoint, params);
            break;
          case "GET":
            response = await onlineClient.get(endpoint);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${httpMethod}`);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const serverResult = await response.json();
        // Transform keys to camelCase and wrap in standard format
        const transformed = transformSingle(serverResult);
        if (transformed.data && typeof transformed.data === "object") {
          transformed.data = transformKeysToCamelCase(transformed.data);
        }

        return transformed;
      } else {
        // Offline mode – not supported for controls (they require Celery/Redis)
        return {
          status: false,
          message: "Controls are only available in online mode.",
          data: null,
        };
      }
    } catch (error) {
      logger?.error("ControlsHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }
}

const controlsHandler = new ControlsHandler();

ipcMain.handle(
  "controls",
  withErrorHandling(controlsHandler.handleRequest.bind(controlsHandler), "IPC:controls")
);

module.exports = { ControlsHandler, controlsHandler };