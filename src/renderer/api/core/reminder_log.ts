// src/renderer/api/reminder_log.ts
export interface NotificationLogEntry {
  id: number;
  recipient_email: string;
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

export interface PaginatedNotifications {
  items: NotificationLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  byStatus: Record<string, number>;
  avgRetryFailed: number;
  last24h: number;
}

export interface NotificationsResponse {
  status: boolean;
  message: string;
  data: PaginatedNotifications;
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

  private normalizeResponse<T extends { status: boolean; message?: string }>(
    response: T
  ): T & { message: string } {
    return { ...response, message: response.message ?? "" };
  }

  private toPaginatedResponse(raw: any): PaginatedNotifications {
    if (raw && raw.items && raw.total !== undefined) {
      return raw;
    }
    const items = Array.isArray(raw.data) ? raw.data : [];
    const pagination = raw.pagination || {};
    return {
      items,
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      total: pagination.total || 0,
      totalPages: pagination.pages || 0,
    };
  }

  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
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
    const raw = await this.callRaw<any>("getAllLogs", params || {});
    const normalized = this.normalizeResponse(raw);
    const paginatedData = this.toPaginatedResponse(normalized);
    return { ...normalized, data: paginatedData };
  }

  async getById(id: number): Promise<NotificationResponse> {
    const raw = await this.callRaw<any>("getLogById", { id });
    return this.normalizeResponse(raw);
  }

  async getByRecipient(params: {
    recipient_email: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<any>("getLogsByRecipient", params);
    const normalized = this.normalizeResponse(raw);
    const paginatedData = this.toPaginatedResponse(normalized);
    return { ...normalized, data: paginatedData };
  }

  async search(params: {
    keyword: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<any>("searchLogs", params);
    const normalized = this.normalizeResponse(raw);
    const paginatedData = this.toPaginatedResponse(normalized);
    return { ...normalized, data: paginatedData };
  }

  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<NotificationStatsResponse> {
    const raw = await this.callRaw<any>("getLogStats", params || {});
    return this.normalizeResponse(raw);
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
    const raw = await this.callRaw<any>("createLog", { data, user });
    return this.normalizeResponse(raw);
  }

  async updateStatus(params: {
    id: number;
    status: string;
    errorMessage?: string | null;
    user?: string;
  }): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("updateLogStatus", params);
    return this.normalizeResponse(raw);
  }

  async delete(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("deleteLog", { id, user });
    return this.normalizeResponse(raw);
  }

  async retry(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("retryLog", { id, user });
    return this.normalizeResponse(raw);
  }

  async retryAllFailed(filters?: { 
    recipient_email?: string; 
    createdBefore?: string 
  }, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("retryAllFailedLogs", { filters, user });
    return this.normalizeResponse(raw);
  }

  async resend(id: number, user = "system"): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<any>("resendLog", { id, user });
    return this.normalizeResponse(raw);
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS (backward compatibility)
  // --------------------------------------------------------------------

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