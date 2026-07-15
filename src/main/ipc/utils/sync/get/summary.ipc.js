// src/main/ipc/utils/sync/get/summary.ipc.js
const syncService = require("../../../../../services/SyncService");
const onlineClient = require("../../../../../utils/onlineClient");
const {
  transformKeysToCamelCase,
} = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");
module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get("/api/v1/sync/status/");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: "Sync summary retrieved from server",
      data: data.summary || data,
    };
  }

  // Offline mode
  try {
    const summary = await syncService.getSyncSummary();
    return {
      status: true,
      message: "Sync summary retrieved locally",
      data: summary,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get sync summary",
      data: null,
    };
  }
};
