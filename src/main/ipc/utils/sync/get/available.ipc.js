// src/main/ipc/utils/sync/get/available.ipc.js
// (Already works - no changes needed)
//@ts-check
const syncService = require("../../../../../services/SyncService");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    try {
      const url = await serverUrl();
      if (!url) {
        return {
          status: true,
          message: "Sync not available (no server URL)",
          data: { available: false, message: "Server URL not configured" },
        };
      }
      onlineClient.setBaseUrl(url);
      const response = await onlineClient.get("/health/");
      if (response.ok) {
        return {
          status: true,
          message: "Sync available (online)",
          data: { available: true, mode: "online" },
        };
      }
      return {
        status: true,
        message: "Sync not available (server unreachable)",
        data: { available: false, message: "Server not reachable" },
      };
    } catch (error) {
      return {
        status: true,
        message: "Sync not available",
        data: { available: false, message: error.message },
      };
    }
  }

  return {
    status: true,
    message: "Sync available (offline mode)",
    data: { available: true, mode: "offline" },
  };
};