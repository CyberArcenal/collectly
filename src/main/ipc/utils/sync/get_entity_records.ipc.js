// src/main/ipc/utils/sync/get_entity_records.ipc.js
const syncService = require("../../../../services/SyncService");

module.exports = async (params) => {
  const { entityName } = params;

  if (!entityName) {
    return {
      status: false,
      message: "entityName is required",
      data: null,
    };
  }

  try {
    const result = await syncService.getEntityRecords(entityName);
    return {
      status: true,
      message: `Records retrieved for ${entityName}`,
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get entity records",
      data: null,
    };
  }
};