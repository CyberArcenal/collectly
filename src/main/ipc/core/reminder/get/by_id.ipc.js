// src/main/ipc/core/reminder/get/by_id.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { id } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(`/api/v1/notifications/notification-logs/${id}/`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification log retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const reminder = await reminderLogService.getReminderById({ id });
    return {
      status: true,
      message: "Notification log retrieved locally",
      data: reminder,
    };
  }
};