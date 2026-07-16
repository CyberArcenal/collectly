// src/main/ipc/utils/sync/sync_entity.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformSingle } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { entityName, user = "system", force = false, records = [] } = params;

  if (!entityName) {
    return {
      status: false,
      message: "entityName is required",
      data: null,
    };
  }

  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post(`/api/v1/sync/${entityName}/`, {
      data: records,
      user: user,
      force: force,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformSingle(serverResult);
  }

  // Offline mode
  try {
    const result = await syncService.syncEntityByName(entityName, user, force);
    return {
      status: true,
      message: `Synced ${entityName} locally`,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || `Failed to sync ${entityName}`,
      data: null,
    };
  }
};