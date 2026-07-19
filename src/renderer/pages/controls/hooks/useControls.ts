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
  getOverdueStatusHealth: () => Promise<HealthCheckResponse>;
  getZeroBalanceHealth: () => Promise<HealthCheckResponse>;
  getPenaltyHealth: () => Promise<HealthCheckResponse>;
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
      await Promise.all([
        controlsAPI.getInterestAccrualStatus(),
        controlsAPI.getOverdueCorrectorStatus(),
        controlsAPI.getOverdueUpdaterStatus(),
        controlsAPI.getZeroBalanceFixerStatus(),
        controlsAPI.getPenaltySchedulerStatus(),
      ]);
    });
  }, [withLoading]);

  return {
    loading,
    error,
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
    getOverdueStatusHealth: () => getStatus(controlsAPI.getOverdueStatusHealth),
    getZeroBalanceHealth: () => getStatus(controlsAPI.getZeroBalanceHealth),
    getPenaltyHealth: () => getStatus(controlsAPI.getPenaltyHealth),
    refreshAll,
  };
};