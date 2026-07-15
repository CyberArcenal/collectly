// src/main/ipc/utils/sync/reset_sync.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { entity = null, user = "system"} = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const body = {};
    if (entity) body.entity = entity;

    const response = await onlineClient.post("/api/v1/sync/reset/", body);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: entity ? `Reset sync state for ${entity} on server` : "Reset all sync states on server",
      data,
    };
  }

  // Offline mode
  try {
    const result = await syncService.resetSyncState(entity);
    return {
      status: true,
      message: entity ? `Reset sync state for ${entity} locally` : "Reset all sync states locally",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to reset sync state",
      data: null,
    };
  }
};