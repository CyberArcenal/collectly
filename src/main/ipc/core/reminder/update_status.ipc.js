// src/main/ipc/core/reminder/update_status.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, status, errorMessage, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = { status };
    if (errorMessage !== undefined) payload.error_message = errorMessage;

    const response = await onlineClient.patch(`/api/v1/notifications/notification-logs/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification log status updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await reminderLogService.updateReminderStatus({ id, status, errorMessage }, user, queryRunner);
    return {
      status: true,
      message: "Notification log status updated locally",
      data: result,
    };
  }
};