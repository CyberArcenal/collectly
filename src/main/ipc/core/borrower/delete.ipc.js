// src/main/ipc/borrower/delete.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: DELETE /api/v1/borrowers/{id}/
    const response = await onlineClient.delete(`/api/v1/borrowers/${id}/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    // Server returns 204 No Content (no body)
    return {
      status: true,
      message: "Borrower deleted on server",
      data: null,
    };
  } else {
    const result = await borrowerService.delete(id, user, queryRunner);
    return {
      status: true,
      message: "Borrower soft deleted locally",
      data: result,
    };
  }
};