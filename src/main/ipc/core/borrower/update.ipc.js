// src/main/ipc/borrower/update.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: PATCH /api/v1/borrowers/{id}/ (partial update)
    const response = await onlineClient.patch(`/api/v1/borrowers/${id}/`, data);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Borrower updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await borrowerService.update(id, data, user, queryRunner);
    return {
      status: true,
      message: "Borrower updated locally",
      data: result,
    };
  }
};