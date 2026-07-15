// src/main/ipc/utils/sync/get/queue_status.ipc.js
const syncQueueService = require("../../../../../services/SyncQueueService");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");


module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get("/api/v1/sync/queue/");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: "Queue status retrieved from server",
      data,
    };
  }

  // Offline mode
  try {
    const stats = await syncQueueService.getStats();
    const pending = await syncQueueService.countPending();
    return {
      status: true,
      message: "Queue status retrieved locally",
      data: { ...stats, pending },
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get queue status",
      data: null,
    };
  }
};