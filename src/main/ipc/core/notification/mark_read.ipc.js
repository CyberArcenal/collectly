// src/main/ipc/core/notification/mark_read.ipc.js
const notificationService = require("../../../../services/Notification");
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

    // Use the mark-read endpoint with PATCH and body { is_read: true }
    const response = await onlineClient.patch(`/api/v1/notifications/${id}/mark-read/`, { is_read: true });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification marked as read on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await notificationService.markAsRead(id, user, queryRunner);
    return {
      status: true,
      message: "Notification marked as read locally",
      data: result,
    };
  }
};