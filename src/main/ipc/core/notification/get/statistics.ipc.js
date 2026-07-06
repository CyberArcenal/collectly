// src/main/ipc/core/notification/get/statistics.ipc.js
const notificationService = require("../../../../../services/Notification");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get('/api/v1/notifications/stats/');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Statistics retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const stats = await notificationService.getStatistics();
    return {
      status: true,
      message: "Statistics retrieved locally",
      data: stats,
    };
  }
};