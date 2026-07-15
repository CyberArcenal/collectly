// src/main/ipc/core/reminder/get/stats.ipc.js
//@ts-check
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData, transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { startDate, endDate } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/notifications/notification-logs/stats/
    const query = {};
    if (startDate) query.start_date = startDate;
    if (endDate) query.end_date = endDate;

    const response = await onlineClient.get('/api/v1/notifications/notification-logs/stats/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    const stats = transformKeysToCamelCase(serverResult);
    console.log("Retrieved statistics from server:", stats);
    return {
      status: true,
      message: stats.message || "Statistics retrieved from server",
      data: stats.data,
    };
  } else {
    const stats = await reminderLogService.getReminderStats({ startDate, endDate });
    return {
      status: true,
      message: "Stats retrieved locally",
      data: stats,
    };
  }
};