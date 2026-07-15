// src/main/ipc/utils/sync/auto_resolve.ipc.js
const syncConflictService = require("../../../../services/SyncConflictService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { entity, entityId} = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const body = {};
    if (entity) body.entity = entity;
    if (entityId) body.entity_id = entityId;

    const response = await onlineClient.post("/api/v1/sync/conflicts/auto-resolve/", body);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: "Conflicts auto-resolved on server",
      data,
    };
  }

  // Offline mode
  try {
    let result;
    if (entity && entityId) {
      result = await syncConflictService.autoResolveForEntity(entity, entityId);
    } else {
      result = await syncConflictService.autoResolveAll();
    }
    return {
      status: true,
      message: "Conflicts auto-resolved locally",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to auto-resolve conflicts",
      data: null,
    };
  }
};