// src/main/ipc/utils/sync/sync_entity.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformSingle, transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
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
    // Wrap in { status, message, data }
    const transformed = transformSingle(serverResult);
    
    // ✅ Transform data keys from snake_case to camelCase
    if (transformed.data && typeof transformed.data === 'object') {
      transformed.data = transformKeysToCamelCase(transformed.data);
    }

    // ✅ Now check for taskId (camelCase)
    if (transformed.data && transformed.data.taskId) {
      return transformed;
    } else {
      // Fallback: if task_id exists but transformation failed, use it
      if (serverResult.data && serverResult.data.task_id) {
        // Create a response with camelCase taskId manually
        return {
          status: true,
          message: transformed.message || "Sync started",
          data: {
            taskId: serverResult.data.task_id,
            status: serverResult.data.status || "queued",
            entity: serverResult.data.entity || entityName,
            total: serverResult.data.total || records.length,
          },
        };
      }
      // If still no task ID, throw an error
      throw new Error("Server did not return a task ID");
    }
  }

  // Offline mode
  try {
    // Note: syncService.syncEntityByName must exist (implement it if missing)
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