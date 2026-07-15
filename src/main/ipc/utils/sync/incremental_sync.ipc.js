// src/main/ipc/utils/sync/incremental_sync.ipc.js
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
      message: "Incremental sync completed on server",
      data,
    };
  }

  // Offline mode
  try {
    const result = await syncService.incrementalSync(user, limit);
    return {
      status: true,
      message: "Incremental sync completed locally",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Incremental sync failed",
      data: null,
    };
  }
};