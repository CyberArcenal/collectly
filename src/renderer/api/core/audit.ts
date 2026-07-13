// src/renderer/api/audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  user: string | null;
  timestamp: string;        // ISO date string
  oldData: any | null;
  newData: any | null;
}

export interface PaginatedAuditLogs {
  data: any;
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogSummary {
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  byUser: Array<{ user: string; count: number }>;
}

export interface AuditLogStats {
  total: number;
  avgPerDay: number;
  mostActiveDay: { day: string; count: number } | null;
  uniqueUsers: number;
  dateRange?: { start: string; end: string } | null;
}

export interface AuditLogCounts {
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  byUser: Array<{ user: string; count: number }>;
}

export interface TopActivities {
  topActions: Array<{ action: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
  topUsers: Array<{ user: string; count: number }>;
}

export interface RecentActivityResult {
  items: AuditLogEntry[];
  limit: number;
}

export interface FileOperationResult {
  filePath: string;
  filename?: string;
}

export interface AuditReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface AuditLogsResponse {
  status: boolean;
  message: string;
  data: PaginatedAuditLogs;
}

export interface AuditLogResponse {
  status: boolean;
  message: string;
  data: AuditLogEntry;
}

export interface AuditLogSummaryResponse {
  status: boolean;
  message: string;
  data: AuditLogSummary;
}

export interface AuditLogStatsResponse {
  status: boolean;
  message: string;
  data: AuditLogStats;
}

export interface AuditLogCountsResponse {
  status: boolean;
  message: string;
  data: AuditLogCounts;
}

export interface TopActivitiesResponse {
  status: boolean;
  message: string;
  data: TopActivities;
}

export interface RecentActivityResponse {
  status: boolean;
  message: string;
  data: RecentActivityResult;
}

export interface ExportAuditLogsResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GenerateAuditReportResponse {
  status: boolean;
  message: string;
  data: AuditReportResult;
}

// ----------------------------------------------------------------------
// 🧠 AuditAPI Class
// ----------------------------------------------------------------------

class AuditAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all audit logs with pagination
   * @param params.page - Page number (1-based)
   * @param params.limit - Items per page (default 50, max 100)
   */
  async getAll(params?: { page?: number; limit?: number }): Promise<AuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAllAuditLogs",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit logs");
  }

  /**
   * Get a single audit log by ID
   * @param id - Audit log ID
   */
  async getById(id: number): Promise<AuditLogResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogById",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit log");
  }

  /**
   * Get audit logs filtered by entity
   * @param params.entity - Entity name (e.g., 'Borrower', 'Debt')
   * @param params.entityId - Optional specific entity ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByEntity(params: {
    entity: string;
    entityId?: number;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogsByEntity",
      params,
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit logs by entity");
  }

  /**
   * Get audit logs filtered by user
   * @param params.user - Username
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByUser(params: { user: string; page?: number; limit?: number }): Promise<AuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogsByUser",
      params,
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit logs by user");
  }

  /**
   * Get audit logs filtered by action
   * @param params.action - Action name (e.g., 'CREATE', 'UPDATE', 'DELETE')
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByAction(params: { action: string; page?: number; limit?: number }): Promise<AuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogsByAction",
      params,
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit logs by action");
  }

  /**
   * Get audit logs within a date range
   * @param params.startDate - ISO date string
   * @param params.endDate - ISO date string
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogsByDateRange",
      params,
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit logs by date range");
  }

  /**
   * Get summary statistics of audit logs (grouped counts)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getSummary(params?: { startDate?: string; endDate?: string }): Promise<AuditLogSummaryResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogSummary",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit summary");
  }

  /**
   * Get detailed statistics (total, avg per day, most active day, unique users)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getStats(params?: { startDate?: string; endDate?: string }): Promise<AuditLogStatsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogStats",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit stats");
  }

  /**
   * Flexible search across audit logs
   * @param params - Supports searchTerm, entity, user, action, date range, pagination
   */
  async search(params: {
    searchTerm?: string;
    entity?: string;
    user?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "searchAuditLogs",
      params,
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to search audit logs");
  }

  // --------------------------------------------------------------------
  // 📊 AGGREGATION METHODS
  // --------------------------------------------------------------------

  /**
   * Get aggregated counts grouped by action, entity, and user
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getCounts(params?: { startDate?: string; endDate?: string }): Promise<AuditLogCountsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getAuditLogCounts",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch audit counts");
  }

  /**
   * Get top activities (most frequent actions, entities, users)
   * @param params.limit - Number of top items to return (default 10, max 20)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getTopActivities(params?: { limit?: number; startDate?: string; endDate?: string }): Promise<TopActivitiesResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getTopActivities",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch top activities");
  }

  /**
   * Get recent activity (latest N audit logs)
   * @param limit - Number of entries (default 10, max 50)
   */
  async getRecentActivity(limit?: number): Promise<RecentActivityResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "getRecentActivity",
      params: { limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch recent activity");
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered audit logs to a CSV file
   * @param params - Same filters as search()
   * @param params.limit - Max rows to export (default 5000, max 10000)
   */
  async exportCSV(params?: {
    searchTerm?: string;
    entity?: string;
    user?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ExportAuditLogsResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "exportAuditLogs",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to export audit logs");
  }

  /**
   * Generate a comprehensive audit report (JSON or HTML)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.format - 'json' or 'html' (default 'json')
   */
  async generateReport(params?: { startDate?: string; endDate?: string; format?: "json" | "html" }): Promise<GenerateAuditReportResponse> {
    if (!window.backendAPI?.auditLog) {
      throw new Error("Electron API (auditLog) not available");
    }
    const response = await window.backendAPI.auditLog({
      method: "generateAuditReport",
      params: params || {},
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to generate audit report");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a specific entity has any audit logs
   * @param entity - Entity name
   * @param entityId - Optional entity ID
   */
  async hasLogs(entity: string, entityId?: number): Promise<boolean> {
    try {
      const response = await this.getByEntity({ entity, entityId, limit: 1 });
      return response.data.total > 0;
    } catch (error) {
      console.error("Error checking audit logs:", error);
      return false;
    }
  }

  /**
   * Get the latest audit log entry for an entity
   * @param entity - Entity name
   * @param entityId - Entity ID
   */
  async getLatestEntry(entity: string, entityId: number): Promise<AuditLogEntry | null> {
    try {
      const response = await this.getByEntity({ entity, entityId, limit: 1, page: 1 });
      return response.data.items[0] || null;
    } catch (error) {
      console.error("Error fetching latest audit entry:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.auditLog);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const auditAPI = new AuditAPI();
export default auditAPI;