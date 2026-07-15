// src/main/ipc/utils/sync/sync_entity.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { entityName, user = "system", force = false} = params;

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

    // Use the trigger endpoint
    const response = await onlineClient.post(`/api/v1/sync/${entityName}/trigger/`, {
      user,
      force,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: `Synced ${entityName} on server`,
      data,
    };
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