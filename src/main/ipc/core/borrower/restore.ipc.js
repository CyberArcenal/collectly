// src/main/ipc/borrower/restore.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/borrowers/{id}/restore/
    const response = await onlineClient.post(`/api/v1/borrowers/${id}/restore/`, { user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Borrower restored on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await borrowerService.restore(id, user, queryRunner);
    return {
      status: true,
      message: "Borrower restored locally",
      data: result,
    };
  }
};