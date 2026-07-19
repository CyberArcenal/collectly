// src/main/ipc/utils/sync/test_sync.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const {
  transformKeysToCamelCase,
} = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
module.exports = async (params) => {
  const { entityName = "Borrower" } = params;

  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(
      `/api/v1/sync/test/?entity=${entityName}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: "Test completed on server",
      data,
    };
  }

  // Offline mode
  try {
    const result = await syncService.testSync(entityName);
    return {
      status: true,
      message: "Test completed locally",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Test failed",
      data: null,
    };
  }
};
