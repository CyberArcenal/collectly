// src/main/ipc/core/reminder/delete.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Note: DELETE endpoint for individual logs is NOT in the spec.
    // The spec only has DELETE for /api/v1/audit/logs/ and other modules.
    // This might need to be removed or handled differently.
    const response = await onlineClient.delete(`/api/v1/notifications/notification-logs/${id}/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Notification log deleted on server",
      data: null,
    };
  } else {
    await reminderLogService.deleteReminder({ id }, user, queryRunner);
    return {
      status: true,
      message: "Notification log deleted locally",
      data: null,
    };
  }
};