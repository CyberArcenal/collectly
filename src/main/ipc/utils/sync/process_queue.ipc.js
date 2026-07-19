// src/main/ipc/utils/sync/process_queue.ipc.js
const syncQueueService = require("../../../../services/SyncQueueService");
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { user = "system", limit = 50} = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post("/api/v1/sync/queue/process/", {
      user,
      limit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: "Queue processed on server",
      data,
    };
  }

  // Offline mode
  try {
    const results = await syncQueueService.processQueue(
      async (item) => {
        return await syncService._processQueueItem(item, user);
      },
      limit
    );
    return {
      status: true,
      message: "Queue processed locally",
      data: results,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to process queue",
      data: null,
    };
  }
};