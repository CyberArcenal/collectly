// src/main/ipc/utils/sync/get/pending_changes.ipc.js
//@ts-check
const syncService = require("../../../../../services/SyncService");

module.exports = async (params) => {
  try {
    const changes = await syncService.getPendingChanges();
    return {
      status: true,
      message: "Pending changes retrieved",
      data: changes,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get pending changes",
      data: null,
    };
  }
};