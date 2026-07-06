// src/renderer/api/core/interest_rate_changeLog.ts
import type { PaginatedResult } from "./common";

export interface InterestRateChangeLog {
  id: number;
  setting_key: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  reason: string | null;
  loan_id: number | null;
  changed_at: string;
}

export interface CreateInterestRateLogData {
  settingKey: string;
  oldValue: number | string;
  newValue: number | string;
  loanId?: number | null;
  reason?: string | null;
}

class InterestRateChangeLogAPI {
  async getAll(
    filters?: {
      settingKey?: string;
      loanId?: number;
      changedBy?: string;
      fromDate?: string;
      toDate?: string;
    },
    page = 1,
    limit = 50
  ): Promise<PaginatedResult<InterestRateChangeLog>> {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "getAllLogs",
      params: { filters, page, limit },
    });
    if (!response.status) throw new Error(response.message);
    return response.data;
  }

  async getById(id: number): Promise<InterestRateChangeLog> {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "getLogById",
      params: { id },
    });
    if (!response.status) throw new Error(response.message);
    return response.data;
  }

  async getForLoan(
    loanId: number,
    page = 1,
    limit = 50
  ): Promise<PaginatedResult<InterestRateChangeLog>> {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "getLogsForLoan",
      params: { loanId, page, limit },
    });
    if (!response.status) throw new Error(response.message);
    return response.data;
  }

  async create(data: CreateInterestRateLogData): Promise<InterestRateChangeLog> {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "createLog",
      params: data,
    });
    if (!response.status) throw new Error(response.message);
    return response.data;
  }

  async delete(id: number): Promise<boolean> {
    const response = await window.backendAPI.interestRateChangeLog({
      method: "deleteLog",
      params: { id },
    });
    if (!response.status) throw new Error(response.message);
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.interestRateChangeLog;
  }
}

export default new InterestRateChangeLogAPI();