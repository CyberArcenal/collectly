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
      // ─── Interest Accrual ───
      triggerInterestAccrual: { path: "interest-accrual/trigger/", method: "POST" },
      getInterestAccrualStatus: { path: "interest-accrual/status/", method: "GET" },

      // ─── Overdue Corrector ───
      triggerOverdueCorrector: { path: "overdue-corrector/trigger/", method: "POST" },
      getOverdueCorrectorStatus: { path: "overdue-corrector/status/", method: "GET" },

      // ─── Overdue Updater ───
      triggerOverdueUpdater: { path: "overdue-updater/trigger/", method: "POST" },
      getOverdueUpdaterStatus: { path: "overdue-updater/status/", method: "GET" },

      // ─── Zero Balance Fixer ───
      triggerZeroBalanceFixer: { path: "zero-balance-fixer/trigger/", method: "POST" },
      getZeroBalanceFixerStatus: { path: "zero-balance-fixer/status/", method: "GET" },

      // ─── Penalty Scheduler ───
      triggerPenaltyScheduler: { path: "penalty-scheduler/trigger/", method: "POST" },
      getPenaltySchedulerStatus: { path: "penalty-scheduler/status/", method: "GET" },

      // ─── Health Checks ───
      overdueStatusHealth: { path: "health/overdue-status/", method: "GET" },
      zeroBalanceHealth: { path: "health/zero-balance/", method: "GET" },
      penaltyHealth: { path: "health/penalty/", method: "GET" },

      // ─── Audit Cleanup ───
      triggerAuditCleanup: { path: "audit-cleanup/trigger/", method: "POST" },
      getAuditCleanupStatus: { path: "audit-cleanup/status/", method: "GET" },

      // ─── Overdue Reminders ───
      triggerOverdueReminders: { path: "overdue-reminders/trigger/", method: "POST" },
      getOverdueRemindersStatus: { path: "overdue-reminders/status/", method: "GET" },

      // ─── Notification Retry ───
      triggerNotificationRetry: { path: "notification-retry/trigger/", method: "POST" },
      getNotificationRetryStatus: { path: "notification-retry/status/", method: "GET" },

      // ─── Borrower Tasks ───
      triggerCreditScoreRecalc: { path: "borrower/credit-score-recalc/trigger/", method: "POST" },
      triggerBorrowerMerge: { path: "borrower/merge/trigger/", method: "POST" },
      triggerBorrowerCleanup: { path: "borrower/cleanup/trigger/", method: "POST" },
      triggerBorrowerStatusUpdate: { path: "borrower/status-update/trigger/", method: "POST" },

      // ─── Group Tasks ───
      triggerBulkAssign: { path: "group/bulk-assign/trigger/", method: "POST" },
      triggerAutoAssign: { path: "group/auto-assign/trigger/", method: "POST" },
      triggerGroupCleanup: { path: "group/cleanup/trigger/", method: "POST" },
      triggerGroupStatsUpdate: { path: "group/stats-update/trigger/", method: "POST" },

      // ─── Loan Agreement Tasks ───
      triggerAgreementCleanup: { path: "loan-agreement/cleanup/trigger/", method: "POST" },
      triggerOverdueAgreementNotify: { path: "loan-agreement/overdue-notify/trigger/", method: "POST" },
      triggerAutoAssignAgreements: { path: "loan-agreement/auto-assign/trigger/", method: "POST" },
      triggerSyncAgreementStatus: { path: "loan-agreement/sync-status/trigger/", method: "POST" },

      // ─── Loan Application Tasks ───
      triggerAutoApprove: { path: "loan-application/auto-approve/trigger/", method: "POST" },
      triggerStaleCleanup: { path: "loan-application/stale-cleanup/trigger/", method: "POST" },
      triggerPendingReminders: { path: "loan-application/pending-reminders/trigger/", method: "POST" },
      triggerBulkImportApplications: { path: "loan-application/bulk-import/trigger/", method: "POST" },

      // ─── Payment Method Tasks ───
      triggerPaymentMethodStatsRecalc: { path: "payment-method/stats-recalc/trigger/", method: "POST" },
      triggerPaymentMethodCleanup: { path: "payment-method/cleanup/trigger/", method: "POST" },
      triggerPaymentMethodReport: { path: "payment-method/report/trigger/", method: "POST" },
      triggerEnsureDefaultMethod: { path: "payment-method/ensure-default/trigger/", method: "POST" },

      // ─── Sync Maintenance Tasks ───
      triggerSyncHealthCheck: { path: "sync/health-check/trigger/", method: "POST" },
      triggerSyncQueueRetry: { path: "sync/queue-retry/trigger/", method: "POST" },
      triggerSyncCleanup: { path: "sync/cleanup/trigger/", method: "POST" },
      triggerSyncReport: { path: "sync/report/trigger/", method: "POST" },

      // ─── System Settings Tasks ───
      triggerSettingsCacheRefresh: { path: "settings/cache-refresh/trigger/", method: "POST" },
      triggerSettingsValidate: { path: "settings/validate/trigger/", method: "POST" },
      triggerSettingsBackup: { path: "settings/backup/trigger/", method: "POST" },
      triggerSettingsDiff: { path: "settings/diff/trigger/", method: "POST" },

      // ─── User / Security Tasks ───
      triggerSecurityCleanup: { path: "user/security-cleanup/trigger/", method: "POST" },
      triggerSecurityMonitor: { path: "user/security-monitor/trigger/", method: "POST" },
      triggerAutoSuspend: { path: "user/auto-suspend/trigger/", method: "POST" },
      triggerOrphanCleanup: { path: "user/orphan-cleanup/trigger/", method: "POST" },
      triggerSecurityReport: { path: "user/security-report/trigger/", method: "POST" },
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