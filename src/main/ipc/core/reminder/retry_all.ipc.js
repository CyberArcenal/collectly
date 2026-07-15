// src/main/ipc/core/reminder/retry_all.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { filters, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/notifications/notification-logs/retry-all/
    const payload = { confirm: true };
    if (filters) payload.filters = filters;

    const response = await onlineClient.post('/api/v1/notifications/notification-logs/retry-all/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Retry all completed on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await reminderLogService.retryAllFailedReminders({ filters }, user, queryRunner);
    return {
      status: true,
      message: "Retry all completed locally",
      data: result,
    };
  }
};