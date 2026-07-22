// src/renderer/api/reminder_log.ts

import type { PaginatedResult } from "./common";

export interface NotificationLogEntry {
  recipient: string;
  id: number;
  recipient_email: string;
  channel: "sms" | "email";
  subject: string | null;
  payload: string | null;
  status: "queued" | "sent" | "failed" | "resend";
  error_message: string | null;
  retry_count: number;
  resend_count: number;
  sent_at: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  by_status: any;
  avg_retry_failed: number;
  last_24h: number;
  total: number;
  byStatus: Record<string, number>;
  avgRetryFailed: number;
  last24h: number;
}

// Response interfaces using the standard PaginatedResult pattern
export interface NotificationsResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<NotificationLogEntry>;
}

export interface NotificationResponse {
  status: boolean;
  message: string;
  data: NotificationLogEntry;
}

export interface NotificationStatsResponse {
  status: boolean;
  message: string;
  data: NotificationStats;
}

export interface NotificationActionResponse {
  status: boolean;
  message: string;
  data?: any;
}

class ReminderLogAPI {
  private async callRaw<T>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.reminderLog) {
      throw new Error("Electron API (reminderLog) not available");
    }
    const response = await window.backendAPI.reminderLog({ method, params });
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from backend");
    }
    return response as T;
  }

  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS (returning the raw IPC response – already transformed)
  // --------------------------------------------------------------------

  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    recipient_email?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<NotificationsResponse> {
    // The IPC handler already returns { status, message, data: { data, pagination } }
    const raw = await this.callRaw<NotificationsResponse>("getAllLogs", params || {});
    // raw already matches NotificationsResponse; no extra transformation needed
    return raw;
  }

  async getById(id: number): Promise<NotificationResponse> {
    const raw = await this.callRaw<NotificationResponse>("getLogById", { id });
    return raw;
  }

  async getByRecipient(params: {
    recipient_email: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<NotificationsResponse>("getLogsByRecipient", params);
    return raw;
  }

  async search(params: {
    keyword: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<NotificationsResponse>("searchLogs", params);
    return raw;
  }

  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<NotificationStatsResponse> {
    const raw = await this.callRaw<NotificationStatsResponse>("getLogStats", params || {});
    return raw;
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async create(data: { 
    to: string; 
    subject?: string; 
    html?: string; 
    text?: string; 
    status?: "queued" | "sent" | "failed" | "resend";
  }, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<NotificationActionResponse>("createLog", { data, user });
    return raw;
  }

  async updateStatus(params: {
    id: number;
    status: string;
    errorMessage?: string | null;
    user?: string;
  }): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<NotificationActionResponse>("updateLogStatus", params);
    return raw;
  }

  async delete(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<NotificationActionResponse>("deleteLog", { id, user });
    return raw;
  }

  async retry(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<NotificationActionResponse>("retryLog", { id, user });
    return raw;
  }

  async retryAllFailed(filters?: { 
    recipient_email?: string; 
    createdBefore?: string 
  }, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<NotificationActionResponse>("retryAllFailedLogs", { filters, user });
    return raw;
  }

  async resend(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<NotificationActionResponse>("resendLog", { id, user });
    return raw;
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS (backward compatibility – keep but adapt)
  // --------------------------------------------------------------------

  // These methods now simply call the primary methods; they are kept for legacy.
  async getAllReminders(params?: any): Promise<NotificationsResponse> {
    return this.getAll(params);
  }
  async getReminderById(id: number): Promise<NotificationResponse> {
    return this.getById(id);
  }
  async getRemindersByRecipient(params: any): Promise<NotificationsResponse> {
    return this.getByRecipient(params);
  }
  async searchReminders(params: any): Promise<NotificationsResponse> {
    return this.search(params);
  }
  async getReminderStats(params?: any): Promise<NotificationStatsResponse> {
    return this.getStats(params);
  }
  async createReminder(data: any, user?: string): Promise<NotificationActionResponse> {
    return this.create(data, user);
  }
  async updateReminderStatus(params: any): Promise<NotificationActionResponse> {
    return this.updateStatus(params);
  }
  async deleteReminder(id: number, user?: string): Promise<NotificationActionResponse> {
    return this.delete(id, user);
  }
  async retryReminder(id: number, user?: string): Promise<NotificationActionResponse> {
    return this.retry(id, user);
  }
  async retryAllFailedReminders(params?: any, user?: string): Promise<NotificationActionResponse> {
    return this.retryAllFailed(params?.filters, user);
  }
  async resendReminder(id: number, user?: string): Promise<NotificationActionResponse> {
    return this.resend(id, user);
  }

  isAvailable(): boolean {
    return !!window.backendAPI?.reminderLog;
  }
}

const reminderLogAPI = new ReminderLogAPI();
export default reminderLogAPI;