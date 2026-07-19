// src/renderer/api/utils/controls.ts

export interface TaskTriggerResponse {
  taskId: string;
  status: "queued";
}

export interface TaskStatusResponse {
  enabled: boolean;
  lastRun: {
    date?: string;
    timestamp?: string;
    processed?: number;
    errors?: number;
    // etc.
  } | null;
  isRunning: boolean;
  schedule: string | null;
}

export interface HealthCheckResponse {
  issuesFound: number;
  issues: Array<{
    type: string;
    debtId?: number;
    debtName?: string;
    message: string;
    [key: string]: any;
  }>;
}

// Response wrapper from server
interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

class ControlsAPI {
  private async request<T>(method: string, params?: any): Promise<T> {
    if (!window.backendAPI?.controls) {
      throw new Error("Controls API not available");
    }
    const response = await window.backendAPI.controls({
      method,
      params: params || {},
    });
    if (!response.status) {
      throw new Error(response.message || "Controls request failed");
    }
    return response.data as T;
  }

  // ─── Interest Accrual ───

  triggerInterestAccrual = async (): Promise<TaskTriggerResponse> => {
    return this.request<TaskTriggerResponse>("triggerInterestAccrual");
  };

  getInterestAccrualStatus = async (): Promise<TaskStatusResponse> => {
    return this.request<TaskStatusResponse>("getInterestAccrualStatus");
  };

  // ─── Overdue Corrector ───

  triggerOverdueCorrector = async (): Promise<TaskTriggerResponse> => {
    return this.request<TaskTriggerResponse>("triggerOverdueCorrector");
  };

  getOverdueCorrectorStatus = async (): Promise<TaskStatusResponse> => {
    return this.request<TaskStatusResponse>("getOverdueCorrectorStatus");
  };

  // ─── Overdue Updater ───

  triggerOverdueUpdater = async (): Promise<TaskTriggerResponse> => {
    return this.request<TaskTriggerResponse>("triggerOverdueUpdater");
  };

  getOverdueUpdaterStatus = async (): Promise<TaskStatusResponse> => {
    return this.request<TaskStatusResponse>("getOverdueUpdaterStatus");
  };

  // ─── Zero Balance Fixer ───

  triggerZeroBalanceFixer = async (): Promise<TaskTriggerResponse> => {
    return this.request<TaskTriggerResponse>("triggerZeroBalanceFixer");
  };

  getZeroBalanceFixerStatus = async (): Promise<TaskStatusResponse> => {
    return this.request<TaskStatusResponse>("getZeroBalanceFixerStatus");
  };

  // ─── Penalty Scheduler ───

  triggerPenaltyScheduler = async (): Promise<TaskTriggerResponse> => {
    return this.request<TaskTriggerResponse>("triggerPenaltyScheduler");
  };

  getPenaltySchedulerStatus = async (): Promise<TaskStatusResponse> => {
    return this.request<TaskStatusResponse>("getPenaltySchedulerStatus");
  };

  // ─── Health Checks ───

  getOverdueStatusHealth = async (): Promise<HealthCheckResponse> => {
    return this.request<HealthCheckResponse>("overdueStatusHealth");
  };

  getZeroBalanceHealth = async (): Promise<HealthCheckResponse> => {
    return this.request<HealthCheckResponse>("zeroBalanceHealth");
  };

  getPenaltyHealth = async (): Promise<HealthCheckResponse> => {
    return this.request<HealthCheckResponse>("penaltyHealth");
  };
}

const controlsAPI = new ControlsAPI();
export default controlsAPI;