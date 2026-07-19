// src/main/ipc/utils/sync/get/summary.ipc.js
const syncService = require("../../../../../services/SyncService");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformSingle } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get("/api/v1/sync/status/");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    // ✅ transformSingle extracts the entire data object, which contains { summary, queue, conflicts, ... }
    // The frontend expects the summary object directly.
    const transformed = transformSingle(serverResult);
    // If the server returns data.summary, extract it:
    if (transformed.data && transformed.data.summary) {
      transformed.data = transformed.data.summary;
    }
    return transformed;
  }

  // Offline mode
  try {
    const summary = await syncService.getSyncSummary();
    return {
      status: true,
      message: "Sync summary retrieved locally",
      data: summary,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Failed to get sync summary",
      data: null,
    };
  }
};