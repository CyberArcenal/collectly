// src/main/ipc/utils/sync/enqueue.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { entityName, entityId, action, data = null} = params;

  if (!entityName || !entityId || !action) {
    return {
      status: false,
      message: "entityName, entityId, and action are required",
      data: null,
    };
  }

   const mode = await syncMode();
 
   if (mode === "online") {
     const url = await serverUrl();
     if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post("/api/v1/sync/queue/enqueue/", {
      entity: entityName,
      entity_id: entityId,
      action,
      data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const result = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: `Enqueued ${action} for ${entityName}#${entityId} on server`,
      data: result,
    };
  }

  // Offline mode
  try {
    const result = await syncService.enqueueForSync(entityName, entityId, action, data);
    return {
      status: true,
      message: `Enqueued ${action} for ${entityName}#${entityId} locally`,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to enqueue item",
      data: null,
    };
  }
};