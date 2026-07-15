// src/main/ipc/utils/sync/cleanup.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { days = 30} = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post("/api/v1/sync/cleanup/", { days });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: `Cleanup completed on server (${days} days)`,
      data,
    };
  }

  // Offline mode
  try {
    const result = await syncService.cleanup(days);
    return {
      status: true,
      message: `Cleanup completed locally (${days} days)`,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to cleanup sync data",
      data: null,
    };
  }
};