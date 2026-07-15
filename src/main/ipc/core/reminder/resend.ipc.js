// src/main/ipc/core/reminder/resend.ipc.js
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

    // Endpoint: POST /api/v1/notifications/notification-logs/{id}/resend/
    const response = await onlineClient.post(`/api/v1/notifications/notification-logs/${id}/resend/`, { confirm: true });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification log resent on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await reminderLogService.resendReminder({ id }, user, queryRunner);
    return {
      status: true,
      message: "Notification log resent locally",
      data: result,
    };
  }
};