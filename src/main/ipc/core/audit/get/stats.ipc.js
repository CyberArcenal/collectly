// src/main/ipc/core/audit/get/stats.ipc.js
const auditLogService = require("../../../../../services/AuditLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = {};
    if (params.days) query.days = params.days;

    const response = await onlineClient.get("/api/v1/audit/stats/", { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const serverStats = serverResult.data || serverResult;

    // Custom mapping to match frontend expectations (same as offline service)
    const stats = {
      total: serverStats.total || 0,
      totalToday: serverStats.total_today || serverStats.totalToday || 0,
      uniqueUsers: serverStats.unique_users || serverStats.uniqueUsers || 0,
      avgPerDay: serverStats.avg_per_day || serverStats.avgPerDay || 0,
      mostActiveDay: serverStats.most_active_day || serverStats.mostActiveDay || null,
      dateRange: serverStats.date_range || serverStats.dateRange || null,
      
      // Map snake_case to frontend keys
      byAction: (serverStats.by_action || serverStats.byAction || []).map(item => ({
        action: item.action_type || item.action,
        count: item.count,
      })),
      byEntity: (serverStats.by_entity || serverStats.byEntity || []).map(item => ({
        entity: item.model_name || item.entity,
        count: item.count,
      })),
      byUser: (serverStats.by_user || serverStats.byUser || []).map(item => ({
        user: item.user__username || item.user,
        count: item.count,
      })),
    };

    return {
      status: true,
      message: "Audit statistics retrieved from server",
      data: stats,
    };
  } else {
    // Offline mode
    const days = params.days || 7;
    const stats = await auditLogService.getEnhancedStats(days);
    return {
      status: true,
      message: "Statistics retrieved locally",
      data: stats,
    };
  }
};