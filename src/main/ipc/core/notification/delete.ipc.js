// src/main/ipc/core/notification/delete.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.delete(`/api/v1/notifications/${id}/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Notification soft deleted on server",
      data: null,
    };
  } else {
    const result = await notificationService.delete(id, user, queryRunner);
    return {
      status: true,
      message: "Notification soft deleted locally",
      data: result,
    };
  }
};