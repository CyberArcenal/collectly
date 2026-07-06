// src/main/ipc/core/reminder/retry.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/notifications/notification-logs/{id}/retry/
    const response = await onlineClient.post(`/api/v1/notifications/notification-logs/${id}/retry/`, { confirm: true });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification log retried on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await reminderLogService.retryReminder({ id }, user, queryRunner);
    return {
      status: true,
      message: "Notification log retried locally",
      data: result,
    };
  }
};