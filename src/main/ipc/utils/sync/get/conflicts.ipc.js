// src/main/ipc/utils/sync/get/conflicts.ipc.js
const syncConflictService = require("../../../../../services/SyncConflictService");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");
module.exports = async (params) => {
  const { entity, entityId, limit = 50} = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = new URLSearchParams();
    if (entity) query.append("entity", entity);
    if (entityId) query.append("entity_id", entityId);
    if (limit) query.append("limit", limit);

    const response = await onlineClient.get(`/api/v1/sync/conflicts/?${query.toString()}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: "Conflicts retrieved from server",
      data,
    };
  }

  // Offline mode
  try {
    let conflicts;
    if (entity && entityId) {
      conflicts = await syncConflictService.getByEntity(entity, entityId);
    } else if (entity) {
      const all = await syncConflictService.getPending(limit);
      conflicts = all.filter((c) => c.entity === entity);
    } else {
      conflicts = await syncConflictService.getPending(limit);
    }

    const stats = await syncConflictService.getStats();

    return {
      status: true,
      message: "Conflicts retrieved locally",
      data: {
        conflicts,
        stats,
        total: conflicts.length,
      },
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get conflicts",
      data: null,
    };
  }
};