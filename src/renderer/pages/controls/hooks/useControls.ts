// src/renderer/pages/controls/hooks/useControls.ts
import { useState, useCallback } from "react";
import controlsAPI, {
  type TaskTriggerResponse,
  type TaskStatusResponse,
  type HealthCheckResponse,
} from "../../../api/utils/controls";
import { showSuccess, showError } from "../../../utils/notification";

interface UseControlsReturn {
  loading: boolean;
  error: string | null;
  // ─── Debt & Collections ───
  triggerInterestAccrual: () => Promise<TaskTriggerResponse>;
  getInterestAccrualStatus: () => Promise<TaskStatusResponse>;
  triggerOverdueCorrector: () => Promise<TaskTriggerResponse>;
  getOverdueCorrectorStatus: () => Promise<TaskStatusResponse>;
  triggerOverdueUpdater: () => Promise<TaskTriggerResponse>;
  getOverdueUpdaterStatus: () => Promise<TaskStatusResponse>;
  triggerZeroBalanceFixer: () => Promise<TaskTriggerResponse>;
  getZeroBalanceFixerStatus: () => Promise<TaskStatusResponse>;
  triggerPenaltyScheduler: () => Promise<TaskTriggerResponse>;
  getPenaltySchedulerStatus: () => Promise<TaskStatusResponse>;

  // ─── Health Checks ───
  getOverdueStatusHealth: () => Promise<HealthCheckResponse>;
  getZeroBalanceHealth: () => Promise<HealthCheckResponse>;
  getPenaltyHealth: () => Promise<HealthCheckResponse>;

  // ─── Audit & Notifications ───
  triggerAuditCleanup: () => Promise<TaskTriggerResponse>;
  getAuditCleanupStatus: () => Promise<any>;
  triggerOverdueReminders: () => Promise<TaskTriggerResponse>;
  getOverdueRemindersStatus: () => Promise<TaskStatusResponse>;
  triggerNotificationRetry: () => Promise<TaskTriggerResponse>;
  getNotificationRetryStatus: () => Promise<any>;

  // ─── Borrowers ───
  triggerCreditScoreRecalc: (borrowerIds?: number[]) => Promise<TaskTriggerResponse>;
  triggerBorrowerMerge: () => Promise<TaskTriggerResponse>;
  triggerBorrowerCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerBorrowerStatusUpdate: () => Promise<TaskTriggerResponse>;

  // ─── Groups ───
  triggerBulkAssign: (groupId: number, debtorIds: number[]) => Promise<TaskTriggerResponse>;
  triggerAutoAssign: () => Promise<TaskTriggerResponse>;
  triggerGroupCleanup: () => Promise<TaskTriggerResponse>;
  triggerGroupStatsUpdate: () => Promise<TaskTriggerResponse>;

  // ─── Loan Agreements ───
  triggerAgreementCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerOverdueAgreementNotify: () => Promise<TaskTriggerResponse>;
  triggerAutoAssignAgreements: () => Promise<TaskTriggerResponse>;
  triggerSyncAgreementStatus: () => Promise<TaskTriggerResponse>;

  // ─── Loan Applications ───
  triggerAutoApprove: () => Promise<TaskTriggerResponse>;
  triggerStaleCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerPendingReminders: () => Promise<TaskTriggerResponse>;
  triggerBulkImportApplications: () => Promise<TaskTriggerResponse>;

  // ─── Payment Methods ───
  triggerPaymentMethodStatsRecalc: (methodIds?: number[]) => Promise<TaskTriggerResponse>;
  triggerPaymentMethodCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerPaymentMethodReport: () => Promise<TaskTriggerResponse>;
  triggerEnsureDefaultMethod: () => Promise<TaskTriggerResponse>;

  // ─── Sync ───
  triggerSyncHealthCheck: () => Promise<TaskTriggerResponse>;
  triggerSyncQueueRetry: (entity?: string, limit?: number) => Promise<TaskTriggerResponse>;
  triggerSyncCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerSyncReport: (days?: number) => Promise<TaskTriggerResponse>;

  // ─── System Settings ───
  triggerSettingsCacheRefresh: (settingType?: string) => Promise<TaskTriggerResponse>;
  triggerSettingsValidate: (settingType?: string) => Promise<TaskTriggerResponse>;
  triggerSettingsBackup: () => Promise<TaskTriggerResponse>;
  triggerSettingsDiff: () => Promise<any>;

  // ─── Security ───
  triggerSecurityCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerSecurityMonitor: () => Promise<TaskTriggerResponse>;
  triggerAutoSuspend: (days?: number) => Promise<TaskTriggerResponse>;
  triggerOrphanCleanup: (days?: number) => Promise<TaskTriggerResponse>;
  triggerSecurityReport: () => Promise<TaskTriggerResponse>;

  refreshAll: () => Promise<void>;
}

export const useControls = (): UseControlsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn();
        return result;
      } catch (err: any) {
        const msg = err.message || "An error occurred";
        setError(msg);
        showError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const triggerWithNotification = useCallback(
    async (fn: () => Promise<TaskTriggerResponse>, name: string) => {
      const result = await withLoading(fn);
      showSuccess(`${name} task triggered (ID: ${result.taskId})`);
      return result;
    },
    [withLoading]
  );

  const getStatus = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      return await withLoading(fn);
    },
    [withLoading]
  );

  const refreshAll = useCallback(async () => {
    await withLoading(async () => {
      await Promise.allSettled([
        controlsAPI.getInterestAccrualStatus(),
        controlsAPI.getOverdueCorrectorStatus(),
        controlsAPI.getOverdueUpdaterStatus(),
        controlsAPI.getZeroBalanceFixerStatus(),
        controlsAPI.getPenaltySchedulerStatus(),
        controlsAPI.getAuditCleanupStatus(),
        controlsAPI.getOverdueRemindersStatus(),
        controlsAPI.getNotificationRetryStatus(),
      ]);
    });
  }, [withLoading]);

  return {
    loading,
    error,
    // Debt & Collections
    triggerInterestAccrual: () =>
      triggerWithNotification(controlsAPI.triggerInterestAccrual, "Interest accrual"),
    getInterestAccrualStatus: () => getStatus(controlsAPI.getInterestAccrualStatus),
    triggerOverdueCorrector: () =>
      triggerWithNotification(controlsAPI.triggerOverdueCorrector, "Overdue corrector"),
    getOverdueCorrectorStatus: () => getStatus(controlsAPI.getOverdueCorrectorStatus),
    triggerOverdueUpdater: () =>
      triggerWithNotification(controlsAPI.triggerOverdueUpdater, "Overdue updater"),
    getOverdueUpdaterStatus: () => getStatus(controlsAPI.getOverdueUpdaterStatus),
    triggerZeroBalanceFixer: () =>
      triggerWithNotification(controlsAPI.triggerZeroBalanceFixer, "Zero balance fixer"),
    getZeroBalanceFixerStatus: () => getStatus(controlsAPI.getZeroBalanceFixerStatus),
    triggerPenaltyScheduler: () =>
      triggerWithNotification(controlsAPI.triggerPenaltyScheduler, "Penalty scheduler"),
    getPenaltySchedulerStatus: () => getStatus(controlsAPI.getPenaltySchedulerStatus),

    // Health Checks
    getOverdueStatusHealth: () => getStatus(controlsAPI.getOverdueStatusHealth),
    getZeroBalanceHealth: () => getStatus(controlsAPI.getZeroBalanceHealth),
    getPenaltyHealth: () => getStatus(controlsAPI.getPenaltyHealth),

    // Audit & Notifications
    triggerAuditCleanup: () =>
      triggerWithNotification(controlsAPI.triggerAuditCleanup, "Audit cleanup"),
    getAuditCleanupStatus: () => getStatus(controlsAPI.getAuditCleanupStatus),
    triggerOverdueReminders: () =>
      triggerWithNotification(controlsAPI.triggerOverdueReminders, "Overdue reminders"),
    getOverdueRemindersStatus: () => getStatus(controlsAPI.getOverdueRemindersStatus),
    triggerNotificationRetry: () =>
      triggerWithNotification(controlsAPI.triggerNotificationRetry, "Notification retry"),
    getNotificationRetryStatus: () => getStatus(controlsAPI.getNotificationRetryStatus),

    // Borrowers
    triggerCreditScoreRecalc: (borrowerIds?: number[]) =>
      triggerWithNotification(
        () => controlsAPI.triggerCreditScoreRecalc(borrowerIds),
        "Credit score recalculation"
      ),
    triggerBorrowerMerge: () =>
      triggerWithNotification(controlsAPI.triggerBorrowerMerge, "Borrower merge"),
    triggerBorrowerCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerBorrowerCleanup(days),
        "Borrower cleanup"
      ),
    triggerBorrowerStatusUpdate: () =>
      triggerWithNotification(controlsAPI.triggerBorrowerStatusUpdate, "Borrower status update"),

    // Groups
    triggerBulkAssign: (groupId: number, debtorIds: number[]) =>
      triggerWithNotification(
        () => controlsAPI.triggerBulkAssign(groupId, debtorIds),
        "Bulk assign"
      ),
    triggerAutoAssign: () =>
      triggerWithNotification(controlsAPI.triggerAutoAssign, "Auto assign"),
    triggerGroupCleanup: () =>
      triggerWithNotification(controlsAPI.triggerGroupCleanup, "Group cleanup"),
    triggerGroupStatsUpdate: () =>
      triggerWithNotification(controlsAPI.triggerGroupStatsUpdate, "Group stats update"),

    // Loan Agreements
    triggerAgreementCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerAgreementCleanup(days),
        "Agreement cleanup"
      ),
    triggerOverdueAgreementNotify: () =>
      triggerWithNotification(controlsAPI.triggerOverdueAgreementNotify, "Overdue agreement notify"),
    triggerAutoAssignAgreements: () =>
      triggerWithNotification(controlsAPI.triggerAutoAssignAgreements, "Auto assign agreements"),
    triggerSyncAgreementStatus: () =>
      triggerWithNotification(controlsAPI.triggerSyncAgreementStatus, "Sync agreement status"),

    // Loan Applications
    triggerAutoApprove: () =>
      triggerWithNotification(controlsAPI.triggerAutoApprove, "Auto approve"),
    triggerStaleCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerStaleCleanup(days),
        "Stale cleanup"
      ),
    triggerPendingReminders: () =>
      triggerWithNotification(controlsAPI.triggerPendingReminders, "Pending reminders"),
    triggerBulkImportApplications: () =>
      triggerWithNotification(controlsAPI.triggerBulkImportApplications, "Bulk import applications"),

    // Payment Methods
    triggerPaymentMethodStatsRecalc: (methodIds?: number[]) =>
      triggerWithNotification(
        () => controlsAPI.triggerPaymentMethodStatsRecalc(methodIds),
        "Payment method stats recalc"
      ),
    triggerPaymentMethodCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerPaymentMethodCleanup(days),
        "Payment method cleanup"
      ),
    triggerPaymentMethodReport: () =>
      triggerWithNotification(controlsAPI.triggerPaymentMethodReport, "Payment method report"),
    triggerEnsureDefaultMethod: () =>
      triggerWithNotification(controlsAPI.triggerEnsureDefaultMethod, "Ensure default method"),

    // Sync
    triggerSyncHealthCheck: () =>
      triggerWithNotification(controlsAPI.triggerSyncHealthCheck, "Sync health check"),
    triggerSyncQueueRetry: (entity?: string, limit?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerSyncQueueRetry(entity, limit),
        "Sync queue retry"
      ),
    triggerSyncCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerSyncCleanup(days),
        "Sync cleanup"
      ),
    triggerSyncReport: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerSyncReport(days),
        "Sync report"
      ),

    // System Settings
    triggerSettingsCacheRefresh: (settingType?: string) =>
      triggerWithNotification(
        () => controlsAPI.triggerSettingsCacheRefresh(settingType),
        "Settings cache refresh"
      ),
    triggerSettingsValidate: (settingType?: string) =>
      triggerWithNotification(
        () => controlsAPI.triggerSettingsValidate(settingType),
        "Settings validate"
      ),
    triggerSettingsBackup: () =>
      triggerWithNotification(controlsAPI.triggerSettingsBackup, "Settings backup"),
    triggerSettingsDiff: () =>
      withLoading(() => controlsAPI.triggerSettingsDiff()),

    // Security
    triggerSecurityCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerSecurityCleanup(days),
        "Security cleanup"
      ),
    triggerSecurityMonitor: () =>
      triggerWithNotification(controlsAPI.triggerSecurityMonitor, "Security monitor"),
    triggerAutoSuspend: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerAutoSuspend(days),
        "Auto suspend"
      ),
    triggerOrphanCleanup: (days?: number) =>
      triggerWithNotification(
        () => controlsAPI.triggerOrphanCleanup(days),
        "Orphan cleanup"
      ),
    triggerSecurityReport: () =>
      triggerWithNotification(controlsAPI.triggerSecurityReport, "Security report"),

    refreshAll,
  };
};