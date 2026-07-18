// src/main/ipc/utils/sync/get_pending_records.ipc.js
const syncService = require("../../../../services/SyncService");

module.exports = async (params) => {
  const { entityName } = params;
  if (!entityName) {
    return { status: false, message: "entityName is required", data: null };
  }
  try {
    const result = await syncService.getPendingRecords(entityName);
    return { status: true, message: "Pending records retrieved", data: result };
  } catch (error) {
    return { status: false, message: error.message, data: null };
  }
};