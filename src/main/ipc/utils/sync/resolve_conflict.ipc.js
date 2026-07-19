// src/main/ipc/utils/sync/resolve_conflict.ipc.js
const syncConflictService = require("../../../../services/SyncConflictService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { conflictId, resolution, resolvedBy = "system", mergedData = null} = params;

  if (!conflictId || !resolution) {
    return {
      status: false,
      message: "conflictId and resolution are required",
      data: null,
    };
  }

   const mode = await syncMode();
 
   if (mode === "online") {
     const url = await serverUrl();
     if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post(`/api/v1/sync/conflicts/${conflictId}/resolve/`, {
      resolution,
      resolved_by: resolvedBy,
      merged_data: mergedData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: `Conflict resolved on server with ${resolution}`,
      data,
    };
  }

  // Offline mode
  try {
    const result = await syncConflictService.resolveConflict(
      conflictId,
      resolution,
      resolvedBy,
      mergedData
    );
    return {
      status: true,
      message: `Conflict resolved locally with ${resolution}`,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to resolve conflict",
      data: null,
    };
  }
};