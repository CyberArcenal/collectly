// src/main/ipc/utils/sync/get/status.ipc.js
const syncService = require("../../../../../services/SyncService");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformSingle } = require("../../../../../utils/responseTransformer");
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
    // ✅ transformSingle extracts serverResult.data and transforms keys
    return transformSingle(serverResult);
  }

  // Offline mode
  try {
    const status = await syncService.getSyncStatus();
    return {
      status: true,
      message: "Sync status retrieved locally",
      data: status,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get sync status",
      data: null,
    };
  }
};